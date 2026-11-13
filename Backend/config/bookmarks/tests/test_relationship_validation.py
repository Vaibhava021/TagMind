from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import UserProfile
from accounts.vault_tokens import issue_vault_token
from bookmarks.models import Bookmark, Folder, SyncOutBox


class BookmarkFolderRelationshipValidationTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="folder-validation-user",
            password="test-password-123",
        )
        self.profile = UserProfile.objects.create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.profile_query = f"profile={self.profile.pk}"

    def test_folder_vault_state_cannot_change_with_inconsistent_children(self):
        folder = Folder.objects.create(
            user=self.user,
            name="Normal folder",
            is_vault=False,
        )
        bookmark = Bookmark.objects.create(
            user=self.user,
            folder=folder,
            title="Normal bookmark",
            url="https://example.com",
            domain="example.com",
            is_vault=False,
        )
        self.profile.vault_password_hash = make_password("vault-password")
        self.profile.save(update_fields=["vault_password_hash"])
        vault_token = issue_vault_token(self.profile)
        initial_event_count = SyncOutBox.objects.count()

        response = self.client.patch(
            f"/api/bookmarks/folders/{folder.pk}/?{self.profile_query}&vault=false",
            {"is_vault": True},
            format="json",
            HTTP_X_VAULT_TOKEN=vault_token,
        )

        self.assertEqual(response.status_code, 400, response.data)
        folder.refresh_from_db()
        bookmark.refresh_from_db()
        self.assertFalse(folder.is_vault)
        self.assertFalse(bookmark.is_vault)
        self.assertEqual(SyncOutBox.objects.count(), initial_event_count)

    def test_folder_vault_state_can_change_when_empty_with_unlock_token(self):
        folder = Folder.objects.create(
            user=self.user,
            name="Empty folder",
            is_vault=False,
        )
        self.profile.vault_password_hash = make_password("vault-password")
        self.profile.save(update_fields=["vault_password_hash"])
        vault_token = issue_vault_token(self.profile)

        response = self.client.patch(
            f"/api/bookmarks/folders/{folder.pk}/?{self.profile_query}&vault=false",
            {"is_vault": True},
            format="json",
            HTTP_X_VAULT_TOKEN=vault_token,
        )

        self.assertEqual(response.status_code, 200, response.data)
        folder.refresh_from_db()
        self.assertTrue(folder.is_vault)

    def test_bookmark_cannot_be_created_with_mismatched_folder_state(self):
        vault_folder = Folder.objects.create(
            user=self.user,
            name="Vault folder",
            is_vault=True,
        )

        response = self.client.post(
            "/api/bookmarks/bookmarks/",
            {
                "title": "Mismatched bookmark",
                "url": "https://example.com",
                "domain": "example.com",
                "folder": vault_folder.pk,
                "is_vault": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(Bookmark.objects.count(), 0)

    def test_bookmark_cannot_be_moved_to_folder_with_mismatched_state(self):
        normal_folder = Folder.objects.create(
            user=self.user,
            name="Normal folder",
            is_vault=False,
        )
        vault_folder = Folder.objects.create(
            user=self.user,
            name="Vault folder",
            is_vault=True,
        )
        bookmark = Bookmark.objects.create(
            user=self.user,
            folder=normal_folder,
            title="Normal bookmark",
            url="https://example.com",
            domain="example.com",
            is_vault=False,
        )

        response = self.client.patch(
            f"/api/bookmarks/bookmarks/{bookmark.pk}/",
            {"folder": vault_folder.pk},
            format="json",
        )

        self.assertEqual(response.status_code, 400, response.data)
        bookmark.refresh_from_db()
        self.assertEqual(bookmark.folder_id, normal_folder.pk)
        self.assertFalse(bookmark.is_vault)

    def test_invalid_vault_query_values_are_rejected_by_both_viewsets(self):
        for endpoint in ("bookmarks", "folders"):
            with self.subTest(endpoint=endpoint):
                response = self.client.get(
                    f"/api/bookmarks/{endpoint}/?{self.profile_query}&vault=maybe"
                )
                self.assertEqual(response.status_code, 400, response.data)
                self.assertIn("vault", response.data)
