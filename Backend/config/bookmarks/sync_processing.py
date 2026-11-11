import uuid
import random
import logging

from datetime import timedelta

from django.db import transaction
from django.db.models import Q, F
from django.utils import timezone

from .models import SyncOutBox


logger = logging.getLogger("bookmarks.sync")


MAX_SYNC_ATTEMPTS = 8
RETRY_BASE_SECONDS = 5
RETRY_MAX_SECONDS = 3600

PROCESSING_TIMEOUT_MINUTES = 5


def record_sync_failure(
    event_id,
    claim_token,
    *,
    error_code,
    safe_message,
    retryable=True,
):
    """
    Record a sanitized failure only if this worker still owns the claim.
    """

    event = SyncOutBox.objects.filter(
        id=event_id,
        status="processing",
        claim_token=claim_token,
    ).only("id", "retry_count").first()

    if event is None:
        logger.warning(
            "Sync failure could not be recorded: claim ownership lost. "
            "event_id=%s",
            event_id,
        )
        return False

    safe_code = "".join(
        ch for ch in str(error_code)
        if ch.isalnum() or ch in "_-"
    )[:64] or "sync_error"

    message = " ".join(str(safe_message).split())[:500]
    diagnostic = f"{safe_code}: {message}"[:600]

    if not retryable or event.retry_count >= MAX_SYNC_ATTEMPTS:

        updated = SyncOutBox.objects.filter(
            id=event_id,
            status="processing",
            claim_token=claim_token,
        ).update(
            status="failed",
            error_message=diagnostic,
            processing_started_at=None,
            claim_token=None,
            next_retry_at=None,
        )

        if updated == 1:
            logger.error(
                "Sync event permanently failed. "
                "event_id=%s error_code=%s attempts=%s",
                event_id,
                safe_code,
                event.retry_count,
            )
            return True

        logger.warning(
            "Permanent failure update rejected: claim ownership lost. "
            "event_id=%s",
            event_id,
        )
        return False

    delay = min(
        RETRY_BASE_SECONDS * (
            2 ** max(event.retry_count - 1, 0)
        ),
        RETRY_MAX_SECONDS,
    )

    jitter = random.uniform(0, min(delay * 0.2, 30))

    retry_at = timezone.now() + timedelta(
        seconds=min(RETRY_MAX_SECONDS, delay + jitter)
    )

    updated = SyncOutBox.objects.filter(
        id=event_id,
        status="processing",
        claim_token=claim_token,
    ).update(
        status="pending",
        error_message=diagnostic,
        processing_started_at=None,
        claim_token=None,
        next_retry_at=retry_at,
    )

    if updated == 1:
        logger.warning(
            "Sync event retry scheduled. "
            "event_id=%s error_code=%s attempt=%s retry_at=%s",
            event_id,
            safe_code,
            event.retry_count,
            retry_at.isoformat(),
        )
        return True

    logger.warning(
        "Retry update rejected: claim ownership lost. event_id=%s",
        event_id,
    )
    return False


def claim_sync_event(event_id):
    """
    Claim one pending event atomically.
    retry_count counts processing attempts, including the first.
    """

    token = uuid.uuid4()
    now = timezone.now()

    with transaction.atomic():

        updated = SyncOutBox.objects.filter(
            id=event_id,
            status="pending",
            next_retry_at__isnull=True,
        ).update(
            status="processing",
            processing_started_at=now,
            claim_token=token,
            retry_count=F("retry_count") + 1,
            error_message="",
        )

        if updated != 1:

            updated = SyncOutBox.objects.filter(
                id=event_id,
                status="pending",
                next_retry_at__lte=now,
            ).update(
                status="processing",
                processing_started_at=now,
                claim_token=token,
                retry_count=F("retry_count") + 1,
                error_message="",
            )

        if updated != 1:
            return None

        event = SyncOutBox.objects.get(
            id=event_id,
            status="processing",
            claim_token=token,
        )

    logger.info(
        "Sync event claimed. event_id=%s attempt=%s",
        event.id,
        event.retry_count,
    )

    return event


def heartbeat_sync_event(event_id, claim_token):
    """
    Renew the processing lease only if this worker still owns the event.
    """

    updated = SyncOutBox.objects.filter(
        id=event_id,
        status="processing",
        claim_token=claim_token,
    ).update(
        processing_started_at=timezone.now(),
    )

    if updated != 1:
        logger.warning(
            "Sync heartbeat rejected: claim ownership lost. "
            "event_id=%s",
            event_id,
        )

    return updated == 1


def mark_sync_event_synced(event_id, claim_token):
    """
    Mark an event synced only when the current worker still owns its claim.

    The caller must validate the cloud acknowledgement before calling this.
    """

    updated = SyncOutBox.objects.filter(
        id=event_id,
        status="processing",
        claim_token=claim_token,
    ).update(
        status="synced",
        processing_started_at=None,
        claim_token=None,
        next_retry_at=None,
        error_message="",
    )

    if updated == 1:
        logger.info(
            "Sync event marked synced. event_id=%s",
            event_id,
        )
        return True

    logger.warning(
        "Sync acknowledgement update rejected: "
        "claim ownership lost or event not processing. event_id=%s",
        event_id,
    )

    return False


def get_pending_sync_events(batch_size=20):
    """
    Return eligible pending events in deterministic order.
    This selects candidates; it does not claim them.
    """

    if batch_size < 1:
        raise ValueError("batch_size must be at least 1")

    now = timezone.now()

    events = list(
        SyncOutBox.objects.filter(
            status="pending",
        ).filter(
            Q(next_retry_at__isnull=True)
            | Q(next_retry_at__lte=now)
        ).order_by(
            "modified_at",
            "id",
        )[:batch_size]
    )

    logger.info(
        "Pending sync events selected. selected_count=%s batch_size=%s",
        len(events),
        batch_size,
    )

    return events


def recover_stale_sync_events():
    """
    Return events whose processing lease has expired to pending status.
    """

    cutoff = timezone.now() - timedelta(
        minutes=PROCESSING_TIMEOUT_MINUTES
    )

    recovered_count = SyncOutBox.objects.filter(
        status="processing",
        processing_started_at__isnull=False,
        processing_started_at__lte=cutoff,
    ).update(
        status="pending",
        processing_started_at=None,
        claim_token=None,
        next_retry_at=timezone.now(),
        error_message="Processing lease expired; event recovered.",
    )

    if recovered_count:
        logger.warning(
            "Stale sync events recovered. recovered_count=%s",
            recovered_count,
        )

    return recovered_count


def retry_failed_sync_event(event_id):
    """
    Manually retry a permanently failed event.

    Preserves event_uuid, entity_uuid and payload.
    Resets the attempt counter for a fresh retry cycle.
    """

    updated = SyncOutBox.objects.filter(
        id=event_id,
        status="failed",
    ).update(
        status="pending",
        retry_count=0,
        next_retry_at=None,
        processing_started_at=None,
        claim_token=None,
        error_message="",
    )

    if updated == 1:
        logger.info(
            "Failed sync event manually queued for retry. event_id=%s",
            event_id,
        )
        return True

    logger.warning(
        "Manual sync retry rejected: event not found or not failed. "
        "event_id=%s",
        event_id,
    )

    return False
