import threading
from django.contrib.auth import get_user_model
from django.db import close_old_connections
from django.test import TransactionTestCase
from bookmarks.models import SyncOutBox
from bookmarks.sync_processing import claim_sync_event
import uuid
import traceback

class SyncMultiWorkerTest(TransactionTestCase):

    def test_two_workers_claim_same_event_simultaneously(self):

        User = get_user_model()

        user = User.objects.create_user(
            username="multiworker_test_user",
            password="temporary-test-password",
        )

        event = SyncOutBox.objects.create(
            user=user,
            entity_uuid="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            entity_type="bookmark",
            operation="update",
            payload={"title": "Multiworker test"},
            status="pending",
        )

        barrier = threading.Barrier(2)

        results = []
        errors = []

        def worker():
            close_old_connections()

            try:
                barrier.wait(timeout=10)

                claimed = claim_sync_event(event.id)

                results.append(
                    claimed is not None
                )

            # except Exception as exc:
            #     errors.append(
            #         f"{type(exc).__name__}: {exc}"
            #     )
            except Exception as exc:
                root = exc.__cause__ or exc

                errors.append(
                    f"Django error: {type(exc).__name__}: {exc}\n"
                    f"Underlying error: {type(root).__name__}: {root}\n"
                    f"SQLite error code: {getattr(root, 'sqlite_errorcode', None)}\n"
                    f"SQLite error name: {getattr(root, 'sqlite_errorname', None)}"
                )

            finally:
                close_old_connections()

        workers = [
            threading.Thread(target=worker),
            threading.Thread(target=worker),
        ]

        for thread in workers:
            thread.start()

        for thread in workers:
            thread.join(timeout=15)

        self.assertFalse(
            any(thread.is_alive() for thread in workers),
            "A worker did not finish within 15 seconds.",
        )

        self.assertEqual(
            len(results) + len(errors),
            2,
        )

        self.assertEqual(
            errors,
            [],
            f"Database concurrency errors: {errors}",
        )

        self.assertEqual(
            results.count(True),
            1,
            "Exactly one worker must claim the event.",
        )

        self.assertEqual(
            results.count(False),
            1,
            "The second worker must be rejected.",
        )

        event.refresh_from_db()

        self.assertEqual(event.status, "processing")
        self.assertEqual(event.retry_count, 1)


    def test_repeated_simultaneous_claims(self):
        User = get_user_model()

        user = User.objects.create_user(
            username="multiworker_stress_user",
            password="temporary-test-password",
        )

        total_rounds = 10
        total_successful_claims = 0
        total_rejected_claims = 0
        all_errors = []

        for round_number in range(total_rounds):

            event = SyncOutBox.objects.create(
                user=user,
                entity_uuid=uuid.uuid4(),
                entity_type="bookmark",
                operation="update",
                payload={"round": round_number},
                status="pending",
            )

            barrier = threading.Barrier(2)
            results = []
            errors = []

            def worker():
                close_old_connections()

                try:
                    barrier.wait(timeout=10)

                    claimed = claim_sync_event(event.id)
                    results.append(claimed is not None)

                # except Exception as exc:
                #     errors.append(
                #         f"{type(exc).__name__}: {exc}"
                #     )

                except Exception as exc:
                    root = exc.__cause__ or exc

                    errors.append(
                        f"Django error: {type(exc).__name__}: {exc}\n"
                        f"Underlying error: {type(root).__name__}: {root}\n"
                        f"SQLite error code: {getattr(root, 'sqlite_errorcode', None)}\n"
                        f"SQLite error name: {getattr(root, 'sqlite_errorname', None)}"
                    )

                finally:
                    close_old_connections()

            workers = [
                threading.Thread(target=worker),
                threading.Thread(target=worker),
            ]

            for thread in workers:
                thread.start()

            for thread in workers:
                thread.join(timeout=15)

            self.assertFalse(
                any(thread.is_alive() for thread in workers),
                f"Worker timeout in round {round_number + 1}",
            )

            self.assertEqual(
                len(results) + len(errors),
                2,
                f"Incomplete worker results in round {round_number + 1}",
            )

            self.assertEqual(
                errors,
                [],
                f"Concurrency error in round {round_number + 1}: {errors}",
            )

            self.assertEqual(
                results.count(True),
                1,
                f"Expected one successful claim in round {round_number + 1}",
            )

            self.assertEqual(
                results.count(False),
                1,
                f"Expected one rejected claim in round {round_number + 1}",
            )

            event.refresh_from_db()

            self.assertEqual(event.status, "processing")
            self.assertEqual(event.retry_count, 1)

            total_successful_claims += results.count(True)
            total_rejected_claims += results.count(False)
            all_errors.extend(errors)

        self.assertEqual(total_successful_claims, 10)
        self.assertEqual(total_rejected_claims, 10)
        self.assertEqual(all_errors, [])

    
