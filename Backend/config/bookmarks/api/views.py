from rest_framework.viewsets import ModelViewSet
from ..models import Bookmark, Folder
from .seralizers import BookmarkSerializer,FolderSerializer


class BookmarkViewSet(ModelViewSet):
    serializer_class = BookmarkSerializer

    def get_queryset(self):

        profile_id = self.request.query_params.get('profile')
        # print("PROFILE:",profile_id)
        vault = self.request.query_params.get('vault', 'false').lower()
        is_vault = (vault == 'true')

        if profile_id:
            return (
                Bookmark.objects
                .filter(
                    user_id=profile_id,
                    is_vault=is_vault
                )
            )

        return Bookmark.objects.none()
        print(
            "VAULT:",
            vault
        )

        print(
            "IS_VAULT:",
            is_vault
        )


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

        if profile_id:
            return (
                Folder.objects
                .filter(
                    user_id=profile_id,
                    is_vault=is_vault
                )
            )
        print(
            "VAULT:",
            vault
        )

        print(
            "IS_VAULT:",
            is_vault
        )
        return Folder.objects.none()