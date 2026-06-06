from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookmarkViewSet, FolderViewSet


router = DefaultRouter()

router.register(
    r'bookmarks',
    BookmarkViewSet,
    basename='bookmark'
)

router.register(
    r'folders',
    FolderViewSet,
    basename='folder'
)

urlpatterns = router.urls
