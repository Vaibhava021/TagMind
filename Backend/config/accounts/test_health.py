from unittest.mock import patch

from django.db import OperationalError
from django.test import TestCase


class HealthEndpointTests(TestCase):
    def test_health_reports_database_ready(self):
        response = self.client.get("/api/accounts/health/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        self.assertEqual(response.json()["checks"]["database"], "ok")

    @patch(
        "accounts.api.views.connection.cursor",
        side_effect=OperationalError("database unavailable"),
    )
    def test_health_reports_unavailable_database(self, _mock_cursor):
        with self.assertLogs("accounts.health", level="ERROR"):
            response = self.client.get("/api/accounts/health/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "error")
        self.assertEqual(
            response.json()["checks"]["database"],
            "unavailable",
        )
        self.assertNotIn("database unavailable", response.content.decode())
