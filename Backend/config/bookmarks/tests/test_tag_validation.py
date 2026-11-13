from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import UserProfile
from bookmarks.models import Bookmark, Tag
from bookmarks.api.seralizers import MAX_TAGS_PER_BOOKMARK


class BookmarkTagValidationTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="tag-validation-user",
            password="test-password-123",
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def bookmark_payload(self, tags):
        return {
            "title": "Tag validation test",
            "url": "https://example.com",
            "domain": "example.com",
            "tags": tags,
        }

    def test_invalid_tag_payloads_are_rejected_before_database_writes(self):
        invalid_tag_sets = (
            ["   "],
            ["x" * 51],
            [f"tag-{index}" for index in range(MAX_TAGS_PER_BOOKMARK + 1)],
            [123],
            [None],
            "not-a-list",
        )

        for tags in invalid_tag_sets:
            with self.subTest(tags=tags):
                response = self.client.post(
                    "/api/bookmarks/bookmarks/",
                    self.bookmark_payload(tags),
                    format="json",
                )
                self.assertEqual(response.status_code, 400)
                self.assertEqual(Bookmark.objects.count(), 0)
                self.assertEqual(Tag.objects.count(), 0)

    def test_duplicate_tags_remain_deduplicated_on_create(self):
        response = self.client.post(
            "/api/bookmarks/bookmarks/",
            self.bookmark_payload([" Example ", "example", "EXAMPLE"]),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        bookmark = Bookmark.objects.get(pk=response.data["id"])
        self.assertEqual(bookmark.tags.count(), 1)
        self.assertEqual(bookmark.tags.get().name, "example")

    def test_duplicate_tags_remain_deduplicated_on_update(self):
        bookmark = Bookmark.objects.create(
            user=self.user,
            title="Existing bookmark",
            url="https://example.com",
            domain="example.com",
        )

        response = self.client.patch(
            f"/api/bookmarks/bookmarks/{bookmark.pk}/",
            {"tags": [" Topic ", "topic", "TOPIC"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        bookmark.refresh_from_db()
        self.assertEqual(bookmark.tags.count(), 1)
        self.assertEqual(bookmark.tags.get().name, "topic")
