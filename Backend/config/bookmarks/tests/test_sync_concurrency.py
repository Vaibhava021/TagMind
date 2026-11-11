
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from bookmarks.models import SyncOutBox
from bookmarks.sync_processing import (
    claim_sync_event,
    heartbeat_sync_event,
    recover_stale_sync_events,
)


class SyncHeartbeatRecoveryTest(TestCase):

    def create_event(self):
        return SyncOutBox.objects.create(
            user_id=1,  # Replace if user ID 1 does not exist.
            entity_uuid="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            entity_type="bookmark",
            operation="update",
            payload={"title": "Concurrency test"},
            status="pending",
        )

    def test_heartbeat_wins_before_recovery(self):
        event = self.create_event()

        claimed = claim_sync_event(event.id)
        self.assertIsNotNone(claimed)

        # Simulate an old lease.
        SyncOutBox.objects.filter(id=event.id).update(
            processing_started_at=timezone.now() - timedelta(minutes=10)
        )

        # Worker renews its lease first.
        self.assertTrue(
            heartbeat_sync_event(event.id, claimed.claim_token)
        )

        # Recovery must not reclaim the renewed event.
        recovered = recover_stale_sync_events()
        self.assertEqual(recovered, 0)

        event.refresh_from_db()
        self.assertEqual(event.status, "processing")
        self.assertEqual(event.claim_token, claimed.claim_token)

        event.delete()

    def test_recovery_wins_before_heartbeat(self):
        event = self.create_event()

        claimed = claim_sync_event(event.id)
        self.assertIsNotNone(claimed)

        # Simulate an expired lease.
        SyncOutBox.objects.filter(id=event.id).update(
            processing_started_at=timezone.now() - timedelta(minutes=10)
        )

        # Recovery happens first.
        recovered = recover_stale_sync_events()
        self.assertEqual(recovered, 1)

        # The old worker must no longer be able to renew its lease.
        self.assertFalse(
            heartbeat_sync_event(event.id, claimed.claim_token)
        )

        event.refresh_from_db()
        self.assertEqual(event.status, "pending")
        self.assertIsNone(event.claim_token)
        self.assertIsNone(event.processing_started_at)

        event.delete()
