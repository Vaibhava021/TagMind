from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from django.urls import path, include
from .views import UserProfileViewSet, RegisterView, LoginView, GoogleLoginView, SetVaultPasswordView, UnlockVaultView, ChangeVaultPasswordView, health


router = DefaultRouter()

router.register(r'profiles', UserProfileViewSet,basename='profiles')

urlpatterns = [
    path('',include(router.urls)),
    path('register/',RegisterView.as_view()),
    path('login/',LoginView.as_view()),
    path('token/refresh/',TokenRefreshView.as_view()),
    path('google-login/',GoogleLoginView.as_view()),
    path('set-vault-password/',SetVaultPasswordView.as_view()),
    path('unlock-vault/',UnlockVaultView.as_view()),
    path('change-vault-password/',ChangeVaultPasswordView.as_view()),
    path('health/',health, name='health')
]

# urlpatterns = router.urls

