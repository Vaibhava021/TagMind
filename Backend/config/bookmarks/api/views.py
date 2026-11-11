from rest_framework.viewsets import ModelViewSet
from ..models import Bookmark, Folder
from .seralizers import BookmarkSerializer,FolderSerializer
from django.db import transaction
from ..sync_utils import record_sync_change, bookmark_payload, folder_payload
from rest_framework.exceptions import PermissionDenied
from accounts.models import UserProfile
from accounts.vault_tokens import require_vault_token

class BookmarkViewSet(ModelViewSet):
    serializer_class = BookmarkSerializer

    def get_queryset(self):

        profile_id = self.request.query_params.get('profile')
        # print("PROFILE:",profile_id)
        vault = self.request.query_params.get('vault', 'false').lower()
        is_vault = (vault == 'true')

        profile = _validate_profile(self.request.user, profile_id)
        if is_vault:
            require_vault_token(self.request, profile)
        return Bookmark.objects.filter(user=self.request.user, is_vault=is_vault)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


    def perform_destroy(self, instance):
        with transaction.atomic():
            record_sync_change(
                user=instance.user,
                entity_type="bookmark",
                entity_uuid=instance.sync_uuid,
                operation="delete",
                payload=bookmark_payload(instance),
            )
            instance.delete()




class FolderViewSet(ModelViewSet):

    serializer_class = FolderSerializer

    def get_queryset(self):

        profile_id = (
            self.request
            .query_params
            .get('profile')
        )
        vault = self.request.query_params.get('vault', 'false').lower()
        is_vault = (vault == 'true')

        profile = _validate_profile(self.request.user, profile_id)
        if is_vault:
            require_vault_token(self.request, profile)
        return Folder.objects.filter(user=self.request.user, is_vault=is_vault)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


    def perform_destroy(self, instance):
        if instance.bookmarks.exclude(user=self.request.user).exists():
            raise PermissionDenied(
                "Folder contains bookmarks owned by another account."
            )

        with transaction.atomic():
            # Record delete events for bookmarks that will be
            # cascade-deleted with this folder.
            bookmarks = (
                instance.bookmarks
                .select_related("folder")
                .prefetch_related("tags")
                .all()
            )

            for bookmark in bookmarks:
                record_sync_change(
                    user=bookmark.user,
                    entity_type="bookmark",
                    entity_uuid=bookmark.sync_uuid,
                    operation="delete",
                    payload=bookmark_payload(bookmark),
                )

            # Record the folder deletion.
            record_sync_change(
                user=instance.user,
                entity_type="folder",
                entity_uuid=instance.sync_uuid,
                operation="delete",
                payload=folder_payload(instance),
            )

            # Delete the folder and its associated bookmarks.
            instance.delete()


def _validate_profile(user, profile_id):
    try:
        if profile_id is None:
            return UserProfile.objects.get(user=user)
        return UserProfile.objects.get(pk=profile_id, user=user)
    except (UserProfile.DoesNotExist, ValueError, TypeError):
        raise PermissionDenied("Profile does not belong to the authenticated user")
