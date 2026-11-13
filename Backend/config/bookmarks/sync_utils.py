
import logging

from django.db import DatabaseError

from .models import SyncOutBox


logger = logging.getLogger("bookmarks.sync")


def record_sync_change(
        user,
        entity_type,
        entity_uuid,
        operation,
        payload=None,
    ):


    # Anonymous/userless records cannot be assigned to an account.
    # They are not eligible for account-based synchronization.
    if user is None:
        return None

    if entity_uuid is None:
        raise ValueError(
            f"Missing sync UUID for {entity_type}"
        )

    try:
        return SyncOutBox.objects.create(
            user=user,
            entity_type=entity_type,
            entity_uuid=entity_uuid,
            operation=operation,
            payload=payload or {},
        )
    except DatabaseError as exc:
        # Do not log the payload: bookmark metadata may be private or vaulted.
        logger.error(
            "Sync event persistence failed. user_id=%s entity_type=%s "
            "operation=%s error_type=%s",
            user.pk,
            entity_type,
            operation,
            type(exc).__name__,
        )
        raise


def bookmark_payload(bookmark):

    return {
        "uuid": str(bookmark.sync_uuid),
        "title": bookmark.title,
        "url": bookmark.url,
        "domain": bookmark.domain,
        "description": bookmark.description,
        "device_type": bookmark.device_type,
        "is_vault": bookmark.is_vault,
        "folder_uuid": (
            str(bookmark.folder.sync_uuid)
            if bookmark.folder_id
            else None
        ),
        "tag_uuids": [
            str(tag.sync_uuid)
            for tag in bookmark.tags.all()
        ],
        "created_at": bookmark.created_at.isoformat(),
        "updated_at": bookmark.updated_at.isoformat(),
    }


def folder_payload(folder):
    return {
        "uuid": str(folder.sync_uuid),
        "name": folder.name,
        "is_vault": folder.is_vault,
        "accent_color": folder.accent_color,
    }


def tag_payload(tag):
    return {
        "uuid": str(tag.sync_uuid),
        "name": tag.name,
    }
