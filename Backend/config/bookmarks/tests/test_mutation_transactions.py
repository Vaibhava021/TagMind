from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import UserProfile
from bookmarks.models import Bookmark, Folder, SyncOutBox, Tag


class BookmarkMutationTransactionTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="mutation-transaction-user",
            password="temporary-test-password",
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_bookmark_and_new_tags_roll_back_when_sync_event_fails(self):
        payload = {
            "title": "Atomic bookmark",
            "url": "https://atomic.example",
            "domain": "atomic.example",
            "tags": ["atomic"],
        }

        with patch(
            "bookmarks.api.seralizers.record_sync_change",
            side_effect=RuntimeError("outbox unavailable"),
        ):
            with self.assertRaises(RuntimeError):
                self.client.post(
                    "/api/bookmarks/bookmarks/",
                    payload,
                    format="json",
                )

        self.assertEqual(Bookmark.objects.count(), 0)
        self.assertEqual(Tag.objects.count(), 0)
        self.assertEqual(SyncOutBox.objects.count(), 0)

    def test_bookmark_update_rolls_back_when_sync_event_fails(self):
        bookmark = Bookmark.objects.create(
            user=self.user,
            title="Before update",
            url="https://atomic.example",
            domain="atomic.example",
        )

        with patch(
            "bookmarks.api.seralizers.record_sync_change",
            side_effect=RuntimeError("outbox unavailable"),
        ):
            with self.assertRaises(RuntimeError):
                self.client.patch(
                    f"/api/bookmarks/bookmarks/{bookmark.pk}/",
                    {"title": "After update"},
                    format="json",
                )

        bookmark.refresh_from_db()
        self.assertEqual(bookmark.title, "Before update")
        self.assertEqual(SyncOutBox.objects.count(), 0)

    def test_folder_create_and_update_roll_back_when_sync_event_fails(self):
        with patch(
            "bookmarks.api.seralizers.record_sync_change",
            side_effect=RuntimeError("outbox unavailable"),
        ):
            with self.assertRaises(RuntimeError):
                self.client.post(
                    "/api/bookmarks/folders/",
                    {"name": "Atomic folder"},
                    format="json",
                )

        self.assertEqual(Folder.objects.count(), 0)

        folder = Folder.objects.create(user=self.user, name="Before update")
        with patch(
            "bookmarks.api.seralizers.record_sync_change",
            side_effect=RuntimeError("outbox unavailable"),
        ):
            with self.assertRaises(RuntimeError):
                self.client.patch(
                    f"/api/bookmarks/folders/{folder.pk}/?profile={self.profile.pk}&vault=false",
                    {"name": "After update"},
                    format="json",
                )

        folder.refresh_from_db()
        self.assertEqual(folder.name, "Before update")
        self.assertEqual(SyncOutBox.objects.count(), 0)
