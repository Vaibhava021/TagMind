from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import UserProfile


class RegistrationValidationTests(TestCase):
    def setUp(self):
        self.user_model = get_user_model()
        self.client = APIClient()
        self.existing = self.user_model.objects.create_user(
            username="already-taken",
            email="existing@example.com",
            password="existing-password-123",
        )
        UserProfile.objects.create(user=self.existing, provider="email")

    def registration_payload(self, **overrides):
        payload = {
            "username": "new-account",
            "email": "new@example.com",
            "password": "Cobalt!River927",
        }
        payload.update(overrides)
        return payload

    def test_duplicate_username_returns_clean_validation_error(self):
        response = self.client.post(
            "/api/accounts/register/",
            self.registration_payload(username="already-taken"),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data)
        self.assertEqual(self.user_model.objects.count(), 1)

    def test_case_variant_duplicate_username_returns_clean_validation_error(self):
        response = self.client.post(
            "/api/accounts/register/",
            self.registration_payload(username="Already-Taken"),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data)
        self.assertEqual(self.user_model.objects.count(), 1)

    def test_email_duplicate_is_case_insensitive(self):
        response = self.client.post(
            "/api/accounts/register/",
            self.registration_payload(email="EXISTING@EXAMPLE.COM"),
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        self.assertEqual(self.user_model.objects.count(), 1)

    def test_new_registration_stores_normalized_lowercase_email(self):
        response = self.client.post(
            "/api/accounts/register/",
            self.registration_payload(email="New.Account@Example.COM"),
            format="json",
        )

        self.assertEqual(response.status_code, 201, response.data)
        user = self.user_model.objects.get(username="new-account")
        self.assertEqual(user.email, "new.account@example.com")


@override_settings(GOOGLE_OAUTH_CLIENT_ID="test-google-client-id")
class GoogleLoginPolicyTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def post_google_identity(self, email):
        with patch(
            "accounts.api.views.id_token.verify_oauth2_token",
            return_value={"email": email, "email_verified": True},
        ):
            return self.client.post(
                "/api/accounts/google-login/",
                {"token": "verified-google-token"},
                format="json",
            )

    def test_google_email_matching_is_case_insensitive_for_google_profiles(self):
        user = get_user_model().objects.create_user(
            username="google-account",
            email="Google.User@Example.com",
            password=None,
        )
        UserProfile.objects.create(user=user, provider="google")

        response = self.post_google_identity("google.user@example.COM")

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["user_id"], user.pk)
        self.assertEqual(get_user_model().objects.count(), 1)

    def test_google_login_does_not_link_to_existing_email_password_account(self):
        user = get_user_model().objects.create_user(
            username="email-account",
            email="person@example.com",
            password="existing-password-123",
        )
        UserProfile.objects.create(user=user, provider="email")

        response = self.post_google_identity("PERSON@example.com")

        self.assertEqual(response.status_code, 409)
        self.assertEqual(get_user_model().objects.count(), 1)
        self.assertEqual(user.profile.provider, "email")

    def test_new_google_account_is_created_with_normalized_email(self):
        response = self.post_google_identity("New.Google@Example.com")

        self.assertEqual(response.status_code, 200, response.data)
        user = get_user_model().objects.get(pk=response.data["user_id"])
        self.assertEqual(user.email, "new.google@example.com")
        self.assertEqual(user.profile.provider, "google")

    def test_google_login_is_throttled(self):
        for _ in range(5):
            response = self.client.post(
                "/api/accounts/google-login/",
                {},
                format="json",
            )
            self.assertEqual(response.status_code, 400)

        response = self.client.post(
            "/api/accounts/google-login/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 429)
