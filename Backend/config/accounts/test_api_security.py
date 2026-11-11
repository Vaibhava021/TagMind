from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import UserProfile
from bookmarks.models import Bookmark, Folder


class ApiOwnershipTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(
            username="owner", email="owner@example.com", password="strong-test-password-123"
        )
        self.other = user_model.objects.create_user(
            username="other", email="other@example.com", password="strong-test-password-123"
        )
        self.owner_profile = UserProfile.objects.create(user=self.owner)
        self.other_profile = UserProfile.objects.create(user=self.other)
        self.owner_client = APIClient()
        self.owner_client.force_authenticate(user=self.owner)

    def test_owned_apis_require_authentication(self):
        client = APIClient()
        for url in (
            "/api/bookmarks/bookmarks/",
            "/api/bookmarks/folders/",
            "/api/accounts/profiles/",
        ):
            with self.subTest(url=url):
                self.assertEqual(client.get(url).status_code, 401)

    def test_profile_list_only_contains_authenticated_users_profile(self):
        response = self.owner_client.get("/api/accounts/profiles/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.owner_profile.id])

    def test_bookmark_list_and_detail_are_owner_scoped(self):
        own = Bookmark.objects.create(
            user=self.owner, title="Mine", url="https://mine.example", domain="mine.example"
        )
        other = Bookmark.objects.create(
            user=self.other, title="Theirs", url="https://theirs.example", domain="theirs.example"
        )
        response = self.owner_client.get("/api/bookmarks/bookmarks/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [own.id])
        self.assertEqual(
            self.owner_client.get(f"/api/bookmarks/bookmarks/{other.id}/").status_code, 404
        )

    def test_bookmark_creation_uses_authenticated_owner(self):
        response = self.owner_client.post(
            "/api/bookmarks/bookmarks/",
            {
                "user": self.other.id,
                "title": "Owned by caller",
                "url": "https://safe.example",
                "domain": "safe.example",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Bookmark.objects.get(pk=response.data["id"]).user_id, self.owner.id)

    def test_foreign_folder_relationship_is_rejected(self):
        folder = Folder.objects.create(user=self.other, name="Other folder")
        response = self.owner_client.post(
            "/api/bookmarks/bookmarks/",
            {
                "title": "Invalid relation",
                "url": "https://invalid.example",
                "domain": "invalid.example",
                "folder": folder.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_other_users_profile_cannot_be_used_for_vault_operations(self):
        anonymous = APIClient().post(
            "/api/accounts/set-vault-password/",
            {"profile_id": self.owner_profile.id, "password": "test-password"},
            format="json",
        )
        self.assertEqual(anonymous.status_code, 401)

        response = self.owner_client.post(
            "/api/accounts/set-vault-password/",
            {"profile_id": self.other_profile.id, "password": "test-password"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_owner_can_set_and_unlock_their_vault(self):
        set_response = self.owner_client.post(
            "/api/accounts/set-vault-password/",
            {"profile_id": self.owner_profile.id, "password": "test-password"},
            format="json",
        )
        self.assertEqual(set_response.status_code, 200)
        unlock_response = self.owner_client.post(
            "/api/accounts/unlock-vault/",
            {"profile_id": self.owner_profile.id, "password": "test-password"},
            format="json",
        )
        self.assertEqual(unlock_response.status_code, 200)
        self.assertTrue(unlock_response.data["success"])
        self.assertTrue(unlock_response.data["vault_token"])

    def test_vault_data_requires_a_valid_unlock_token(self):
        bookmark = Bookmark.objects.create(
            user=self.owner,
            title="Vault item",
            url="https://vault.example",
            domain="vault.example",
            is_vault=True,
        )
        endpoint = f"/api/bookmarks/bookmarks/?profile={self.owner_profile.id}&vault=true"
        self.assertEqual(self.owner_client.get(endpoint).status_code, 403)

        self.owner_profile.vault_password_hash = ""
        self.owner_profile.save()
        self.owner_client.post(
            "/api/accounts/set-vault-password/",
            {"profile_id": self.owner_profile.id, "password": "test-password"},
            format="json",
        )
        unlock = self.owner_client.post(
            "/api/accounts/unlock-vault/",
            {"profile_id": self.owner_profile.id, "password": "test-password"},
            format="json",
        )
        self.assertTrue(unlock.data["success"])

        unlocked = self.owner_client.get(
            endpoint,
            HTTP_X_VAULT_TOKEN=unlock.data["vault_token"],
        )
        self.assertEqual(unlocked.status_code, 200)
        self.assertEqual([item["id"] for item in unlocked.data], [bookmark.id])

    def test_creating_vault_bookmark_requires_unlock_token(self):
        response = self.owner_client.post(
            "/api/bookmarks/bookmarks/",
            {
                "title": "Locked write",
                "url": "https://locked.example",
                "domain": "locked.example",
                "is_vault": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_email_login_returns_a_refresh_token_usable_without_authentication(self):
        response = APIClient().post(
            "/api/accounts/login/",
            {"email": self.owner.email.upper(), "password": "strong-test-password-123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        refresh = response.data["refresh"]
        refreshed = APIClient().post(
            "/api/accounts/token/refresh/",
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(refreshed.status_code, 200)
        self.assertIn("access", refreshed.data)

    def test_registration_uses_django_password_validators(self):
        response = APIClient().post(
            "/api/accounts/register/",
            {"username": "weak", "email": "weak@example.com", "password": "password"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_folder_delete_cannot_cascade_to_another_users_bookmarks(self):
        folder = Folder.objects.create(user=self.owner, name="Owner folder")
        foreign_bookmark = Bookmark.objects.create(
            user=self.other,
            folder=folder,
            title="Foreign bookmark",
            url="https://foreign.example",
            domain="foreign.example",
        )
        response = self.owner_client.delete(
            f"/api/bookmarks/folders/{folder.id}/?profile={self.owner_profile.id}"
        )
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Folder.objects.filter(pk=folder.id).exists())
        self.assertTrue(Bookmark.objects.filter(pk=foreign_bookmark.id).exists())
