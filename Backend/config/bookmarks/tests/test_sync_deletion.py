import uuid
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from bookmarks.models import Bookmark, Folder, SyncOutBox
from accounts.models import UserProfile
from unittest.mock import patch
from datetime import timedelta
from django.utils import timezone

from bookmarks.sync_processing import (
    claim_sync_event,
    record_sync_failure,
    recover_stale_sync_events,
)

class BookmarkDeletionSyncTest(TestCase):

    def test_bookmark_delete_event_survives_deletion(self):
        User = get_user_model()

        user = User.objects.create_user(
            username=f"sync_test_{uuid.uuid4().hex[:8]}",
            password="temporary-test-password",
        )
        profile = UserProfile.objects.create(user=user)

        folder = Folder.objects.create(
            user=user,
            name="Temporary Sync Test Folder",
        )

        bookmark = Bookmark.objects.create(
            user=user,
            title="Temporary Sync Test Bookmark",
            url="https://example.com",
            domain="example.com",
            folder=folder,
        )

        bookmark_uuid = bookmark.sync_uuid

        client = APIClient()
        client.force_authenticate(user=user)

        response = client.delete(
            f"/api/bookmarks/bookmarks/{bookmark.id}/"
            f"?profile={profile.id}&vault=false"
        )

        self.assertEqual(response.status_code, 204)

        self.assertFalse(
            Bookmark.objects.filter(sync_uuid=bookmark_uuid).exists()
        )

        event = SyncOutBox.objects.filter(
            user=user,
            entity_type="bookmark",
            entity_uuid=bookmark_uuid,
            operation="delete",
        ).first()

        self.assertIsNotNone(event)
        self.assertEqual(event.status, "pending")

        self.assertEqual(
            event.payload["uuid"],
            str(bookmark_uuid),
        )



    def test_folder_delete_preserves_child_bookmark_events(self):
        User = get_user_model()

        user = User.objects.create_user(
            username=f"folder_test_{uuid.uuid4().hex[:8]}",
            password="temporary-test-password",
        )
        profile = UserProfile.objects.create(user=user)

        folder = Folder.objects.create(
            user=user,
            name="Temporary Folder Deletion Test",
        )

        bookmarks = []

        for i in range(2):
            bookmark = Bookmark.objects.create(
                user=user,
                title=f"Temporary Bookmark {i}",
                url=f"https://example{i}.com",
                domain=f"example{i}.com",
                folder=folder,
            )
            bookmarks.append(bookmark)

        folder_uuid = folder.sync_uuid
        bookmark_uuids = [b.sync_uuid for b in bookmarks]

        client = APIClient()
        client.force_authenticate(user=user)

        response = client.delete(
            f"/api/bookmarks/folders/{folder.id}/"
            f"?profile={profile.id}&vault=false"
        )

        self.assertEqual(response.status_code, 204)

        # Folder must be deleted.
        self.assertFalse(
            Folder.objects.filter(sync_uuid=folder_uuid).exists()
        )

        # Child bookmarks must be deleted.
        for bookmark_uuid in bookmark_uuids:
            self.assertFalse(
                Bookmark.objects.filter(sync_uuid=bookmark_uuid).exists()
            )

        # Both bookmark deletion events must survive.
        bookmark_events = SyncOutBox.objects.filter(
            user=user,
            entity_type="bookmark",
            operation="delete",
            entity_uuid__in=bookmark_uuids,
        )

        self.assertEqual(bookmark_events.count(), 2)

        # Folder deletion event must also survive.
        folder_event = SyncOutBox.objects.filter(
            user=user,
            entity_type="folder",
            entity_uuid=folder_uuid,
            operation="delete",
        ).first()

        self.assertIsNotNone(folder_event)

        # All three events must be pending.
        self.assertEqual(
            SyncOutBox.objects.filter(
                user=user,
                status="pending",
            ).count(),
            3,
        )

        # Verify child bookmark payloads are preserved.
        for event in bookmark_events:
            self.assertEqual(
                event.payload["uuid"],
                str(event.entity_uuid),
            )

        
    def test_folder_delete_failure_rolls_back_all_events(self):
        User = get_user_model()

        user = User.objects.create_user(
            username=f"rollback_test_{uuid.uuid4().hex[:8]}",
            password="temporary-test-password",
        )
        profile = UserProfile.objects.create(user=user)

        folder = Folder.objects.create(
            user=user,
            name="Temporary Rollback Test Folder",
        )

        bookmarks = []

        for i in range(2):
            bookmark = Bookmark.objects.create(
                user=user,
                title=f"Rollback Bookmark {i}",
                url=f"https://rollback{i}.example.com",
                domain=f"rollback{i}.example.com",
                folder=folder,
            )
            bookmarks.append(bookmark)

        folder_uuid = folder.sync_uuid
        bookmark_uuids = [b.sync_uuid for b in bookmarks]

        client = APIClient()
        client.force_authenticate(user=user)

        # Simulate a failure after deletion events are recorded,
        # but before the folder and its children are deleted.
        with patch.object(
            Folder,
            "delete",
            side_effect=RuntimeError("Simulated deletion failure"),
        ):
            with self.assertRaises(RuntimeError):
                client.delete(
                    f"/api/bookmarks/folders/{folder.id}/"
                    f"?profile={profile.id}&vault=false"
                )

        # Folder must still exist.
        self.assertTrue(
            Folder.objects.filter(sync_uuid=folder_uuid).exists()
        )

        # Child bookmarks must still exist.
        for bookmark_uuid in bookmark_uuids:
            self.assertTrue(
                Bookmark.objects.filter(sync_uuid=bookmark_uuid).exists()
            )

        # No deletion events should survive the rollback.
        deletion_events = SyncOutBox.objects.filter(
            user=user,
            operation="delete",
            entity_uuid__in=[folder_uuid, *bookmark_uuids],
        )

        self.assertEqual(deletion_events.count(), 0)
    def test_deletion_event_survives_processing_failure(self):
        User = get_user_model()

        user = User.objects.create_user(
            username=f"retention_test_{uuid.uuid4().hex[:8]}",
            password="temporary-test-password",
        )

        event = SyncOutBox.objects.create(
            user=user,
            entity_type="bookmark",
            entity_uuid=uuid.uuid4(),
            operation="delete",
            payload={"uuid": str(uuid.uuid4())},
            status="pending",
        )

        original_payload = event.payload
        original_event_uuid = event.event_uuid

        claimed = claim_sync_event(event.id)
        self.assertIsNotNone(claimed)

        result = record_sync_failure(
            event.id,
            claimed.claim_token,
            error_code="network_timeout",
            safe_message="The sync server did not respond.",
            retryable=True,
        )

        self.assertTrue(result)

        event.refresh_from_db()

        self.assertEqual(event.status, "pending")
        self.assertEqual(event.payload, original_payload)
        self.assertEqual(event.event_uuid, original_event_uuid)
        self.assertIsNone(event.claim_token)

        # The original deletion event must still exist.
        self.assertTrue(
            SyncOutBox.objects.filter(id=event.id).exists()
        )

    def test_deletion_event_survives_stale_lease_recovery(self):
        User = get_user_model()

        user = User.objects.create_user(
            username=f"lease_test_{uuid.uuid4().hex[:8]}",
            password="temporary-test-password",
        )

        event = SyncOutBox.objects.create(
            user=user,
            entity_type="bookmark",
            entity_uuid=uuid.uuid4(),
            operation="delete",
            payload={"uuid": str(uuid.uuid4())},
            status="pending",
        )

        original_payload = event.payload
        original_event_uuid = event.event_uuid

        claimed = claim_sync_event(event.id)
        self.assertIsNotNone(claimed)

        # Simulate a worker that stopped processing.
        SyncOutBox.objects.filter(id=event.id).update(
            processing_started_at=timezone.now() - timedelta(minutes=10)
        )

        recovered = recover_stale_sync_events()
        self.assertEqual(recovered, 1)

        event.refresh_from_db()

        self.assertEqual(event.status, "pending")
        self.assertEqual(event.payload, original_payload)
        self.assertEqual(event.event_uuid, original_event_uuid)
        self.assertIsNone(event.claim_token)

        # Recovery must not delete the original event.
        self.assertTrue(
            SyncOutBox.objects.filter(id=event.id).exists()
        )
