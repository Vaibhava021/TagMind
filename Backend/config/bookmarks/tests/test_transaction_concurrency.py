import threading

from django.contrib.auth import get_user_model
from django.db import close_old_connections
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from accounts.models import UserProfile
from bookmarks.models import Bookmark, SyncOutBox, Tag


class BookmarkWriteConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def test_simultaneous_bookmark_creates_share_one_tag_and_record_events(self):
        user = get_user_model().objects.create_user(
            username="concurrent-tag-user",
            password="temporary-test-password",
        )
        profile = UserProfile.objects.create(user=user)
        start = threading.Barrier(2)
        responses = []
        errors = []

        def create_bookmark(index):
            close_old_connections()
            try:
                client = APIClient()
                client.force_authenticate(user=user)
                start.wait(timeout=10)
                response = client.post(
                    "/api/bookmarks/bookmarks/",
                    {
                        "title": f"Concurrent bookmark {index}",
                        "url": f"https://example{index}.com",
                        "domain": f"example{index}.com",
                        "tags": ["Shared Tag"],
                    },
                    format="json",
                )
                responses.append(response.status_code)
            except Exception as error:
                errors.append(f"{type(error).__name__}: {error}")
            finally:
                close_old_connections()

        workers = [
            threading.Thread(target=create_bookmark, args=(index,))
            for index in range(2)
        ]
        for worker in workers:
            worker.start()
        for worker in workers:
            worker.join(timeout=15)

        self.assertFalse(any(worker.is_alive() for worker in workers))
        self.assertEqual(errors, [])
        self.assertCountEqual(responses, [201, 201])
        self.assertEqual(Bookmark.objects.filter(user=user).count(), 2)
        self.assertEqual(Tag.objects.filter(user=user, name="shared tag").count(), 1)
        self.assertEqual(
            Bookmark.objects.filter(user=user, tags__name="shared tag").distinct().count(),
            2,
        )
        self.assertEqual(
            SyncOutBox.objects.filter(
                user=user,
                entity_type="tag",
                operation="create",
            ).count(),
            1,
        )
        self.assertEqual(
            SyncOutBox.objects.filter(
                user=user,
                entity_type="bookmark",
                operation="create",
            ).count(),
            2,
        )
