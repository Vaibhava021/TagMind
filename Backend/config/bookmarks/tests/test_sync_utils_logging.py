import uuid
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import OperationalError
from django.test import TestCase

from bookmarks.sync_utils import record_sync_change


class SyncChangeLoggingTests(TestCase):
    def test_database_failure_is_logged_without_sync_payload(self):
        user = get_user_model().objects.create_user(
            username="sync-log-user",
            password="temporary-test-password",
        )

        with patch(
            "bookmarks.sync_utils.SyncOutBox.objects.create",
            side_effect=OperationalError("database unavailable"),
        ):
            with self.assertLogs("bookmarks.sync", level="ERROR") as logs:
                with self.assertRaises(OperationalError):
                    record_sync_change(
                        user=user,
                        entity_type="bookmark",
                        entity_uuid=uuid.uuid4(),
                        operation="create",
                        payload={"title": "private bookmark title"},
                    )

        self.assertIn("Sync event persistence failed", logs.output[0])
        self.assertIn("OperationalError", logs.output[0])
        self.assertNotIn("private bookmark title", "\n".join(logs.output))
