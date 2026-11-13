import threading
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.db import close_old_connections
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from accounts.models import UserProfile


class VaultPasswordConcurrencyTests(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(
            username="vault-concurrency-user",
            password="temporary-test-password",
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            vault_password_hash=make_password("old-vault-password"),
        )

    def run_concurrent_requests(self, endpoint, request_bodies, patch_path, patch_side_effect):
        start = threading.Barrier(len(request_bodies))
        responses = []
        errors = []

        def worker(body):
            close_old_connections()
            try:
                client = APIClient()
                client.force_authenticate(user=self.user)
                start.wait(timeout=10)
                response = client.post(
                    endpoint,
                    body,
                    format="json",
                )
                responses.append(response.status_code)
            except Exception as error:
                errors.append(f"{type(error).__name__}: {error}")
            finally:
                close_old_connections()

        with patch(patch_path, side_effect=patch_side_effect):
            workers = [
                threading.Thread(target=worker, args=(body,))
                for body in request_bodies
            ]
            for worker_thread in workers:
                worker_thread.start()
            for worker_thread in workers:
                worker_thread.join(timeout=15)

        self.assertFalse(any(worker_thread.is_alive() for worker_thread in workers))
        self.assertEqual(errors, [])
        return responses

    def test_simultaneous_password_changes_allow_only_one_writer(self):
        barrier = threading.Barrier(2)
        original_check = check_password

        def synchronized_check(raw_password, encoded_password):
            valid = original_check(raw_password, encoded_password)
            barrier.wait(timeout=10)
            return valid

        responses = self.run_concurrent_requests(
            f"/api/accounts/change-vault-password/",
            [
                {
                    "profile_id": self.profile.pk,
                    "old_password": "old-vault-password",
                    "new_password": "first-new-password",
                },
                {
                    "profile_id": self.profile.pk,
                    "old_password": "old-vault-password",
                    "new_password": "second-new-password",
                },
            ],
            "accounts.api.views.check_password",
            synchronized_check,
        )

        self.assertCountEqual(responses, [200, 409])
        self.profile.refresh_from_db()
        self.assertTrue(
            check_password("first-new-password", self.profile.vault_password_hash)
            or check_password("second-new-password", self.profile.vault_password_hash)
        )

    def test_simultaneous_initial_vault_setup_allows_only_one_writer(self):
        self.profile.vault_password_hash = ""
        self.profile.save(update_fields=["vault_password_hash"])
        barrier = threading.Barrier(2)
        original_make = make_password

        def synchronized_make(raw_password, *args, **kwargs):
            encoded = original_make(raw_password, *args, **kwargs)
            barrier.wait(timeout=10)
            return encoded

        responses = self.run_concurrent_requests(
            "/api/accounts/set-vault-password/",
            [
                {"profile_id": self.profile.pk, "password": "first-vault-password"},
                {"profile_id": self.profile.pk, "password": "second-vault-password"},
            ],
            "accounts.api.views.make_password",
            synchronized_make,
        )

        self.assertCountEqual(responses, [200, 409])
        self.profile.refresh_from_db()
        self.assertTrue(
            check_password("first-vault-password", self.profile.vault_password_hash)
            or check_password("second-vault-password", self.profile.vault_password_hash)
        )
