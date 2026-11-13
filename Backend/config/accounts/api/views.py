import logging

from rest_framework import viewsets
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import UserProfile
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.db import DatabaseError, connection
from django.utils.crypto import get_random_string
from .serializers import (
    UserProfileSerializer,
    RegisterSerializer,
    LoginSerializer,
    VaultPasswordSerializer,
    VaultUnlockSerializer,
    VaultChangeSerializer,
)
from django.contrib.auth.hashers import make_password, check_password 
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.http import JsonResponse
from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle
from accounts.vault_tokens import issue_vault_token


health_logger = logging.getLogger("accounts.health")


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = (UserProfileSerializer)

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)


class RegisterView(generics.CreateAPIView):
    serializer_class = (RegisterSerializer)
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        matching_users = User.objects.filter(email__iexact=email)
        if matching_users.count() != 1:
            return Response(
                {
                    "success": False,
                    "message": "Invalid email or password"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        user_obj = matching_users.first()
        user = authenticate(
            username=user_obj.username,
            password=password
        )

        if not user:
            return Response(
                {
                    "success": False,
                    "message": "Invalid email or password"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'provider': 'email'},
        )
        refresh = RefreshToken.for_user(user)

        return Response({
            "success": True,
            "access":
                str(refresh.access_token),
            "refresh":
                str(refresh),
            "user_id":
                user.id,
            "username":
                user.username,
            "email":
                user.email,
            "provider": profile.provider,
            "accent_color": profile.accent_color
        })


class GoogleLoginView(APIView):

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "google_login"

    def post(self, request):
        token = request.data.get('token')

        if not token:
            return Response(
                {
                    'success': False,
                    'message': 'Token missing'
                },
                status=400
            )

        try:
            if not settings.GOOGLE_OAUTH_CLIENT_ID:
                return Response(
                    {'success': False, 'message': 'Google login is not configured'},
                    status=503,
                )

            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                audience=settings.GOOGLE_OAUTH_CLIENT_ID,
            )

            if not idinfo.get('email_verified'):
                return Response(
                    {'success': False, 'message': 'Google email is not verified'},
                    status=400,
                )

            email = idinfo.get('email')
            if not isinstance(email, str) or not email.strip():
                return Response(
                    {'success': False, 'message': 'Google token has no valid email'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            email = email.strip()
        except Exception:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid Google Token'
                },
                status=400
            )

        matching_users = User.objects.filter(email__iexact=email)
        match_count = matching_users.count()
        if match_count > 1:
            return Response(
                {
                    'success': False,
                    'message': 'Multiple accounts use this email with different casing. Contact support.',
                },
                status=status.HTTP_409_CONFLICT,
            )

        if match_count == 1:
            user = matching_users.first()
            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                profile = None

            # A verified Google address is not permission to silently attach
            # Google sign-in to an existing email/password account.
            if profile is None or profile.provider != 'google':
                return Response(
                    {
                        'success': False,
                        'message': (
                            'An email/password account already uses this address. '
                            'Sign in with that account; Google account linking is not supported.'
                        ),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
        else:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=get_random_string(12),
                    email=email.lower(),
                    password=None,
                )
                profile = UserProfile.objects.create(user=user, provider='google')

        refresh = RefreshToken.for_user(
            user
        )

        return Response({
            'success': True,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': user.id,
            'profile_id': profile.id,
            'username': user.username,
            'email': user.email,
            'provider': profile.provider,
            'accent_color': profile.accent_color
        })
    

class SetVaultPasswordView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "vault"

    def post(self, request):
        serializer = (VaultPasswordSerializer(data=request.data))
        serializer.is_valid(raise_exception=True)

        profile_id = (
            serializer.validated_data['profile_id']
        )

        password = (
            serializer.validated_data['password']
        )

        profile = self._get_owned_profile(request, profile_id)

        if profile.vault_password_hash:
            return Response(
                {
                    'success': False,
                    'message':
                    'Vault already exists'
                },
                status=400
            )

        new_hash = make_password(password)
        updated = UserProfile.objects.filter(
            pk=profile.pk,
            vault_password_hash="",
        ).update(vault_password_hash=new_hash)
        if updated != 1:
            return Response(
                {'success': False, 'message': 'Vault was set by another request'},
                status=status.HTTP_409_CONFLICT,
            )

        profile.vault_password_hash = new_hash
        return Response({
            'success': True,
            'vault_token': issue_vault_token(profile),
        })

    @staticmethod
    def _get_owned_profile(request, profile_id):
        try:
            profile = UserProfile.objects.get(id=profile_id)
        except UserProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Profile not found')
        if profile.user_id != request.user.id:
            raise PermissionDenied('Profile does not belong to the authenticated user')
        return profile
    

class UnlockVaultView(
    APIView
):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "vault"

    def post(self, request):

        serializer = (
            VaultUnlockSerializer(data=request.data)
        )

        serializer.is_valid(
            raise_exception=True
        )

        profile_id = (
            serializer.validated_data['profile_id']
        )

        password = (
            serializer.validated_data['password']
                    )

        profile = SetVaultPasswordView._get_owned_profile(request, profile_id)

        valid = check_password(
            password,
            profile.vault_password_hash
        )

        return Response({
            'success': valid,
            'vault_token': issue_vault_token(profile) if valid else None,
        })
    

class ChangeVaultPasswordView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "vault"

    def post(self, request):

        serializer = (
            VaultChangeSerializer(data=request.data)
        )

        serializer.is_valid(
            raise_exception=True
        )

        profile_id = (
            serializer.validated_data['profile_id']
        )

        old_password = (
            serializer.validated_data['old_password']
        )

        new_password = (
            serializer.validated_data['new_password']
        )

        profile = SetVaultPasswordView._get_owned_profile(request, profile_id)

        current_hash = profile.vault_password_hash
        valid = check_password(old_password, current_hash)

        if not valid:
            return Response(
                {
                    'success': False,
                    'message':
                    'Wrong password'
                },
                status=400
            )

        new_hash = make_password(new_password)
        updated = UserProfile.objects.filter(
            pk=profile.pk,
            vault_password_hash=current_hash,
        ).update(vault_password_hash=new_hash)
        if updated != 1:
            return Response(
                {
                    'success': False,
                    'message': 'Vault password changed in another request; retry with the current password.',
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response({'success': True})
    

def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except DatabaseError:
        health_logger.exception("Database health check failed")
        return JsonResponse(
            {
                "status": "error",
                "version": settings.APP_VERSION,
                "checks": {"database": "unavailable"},
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return JsonResponse({
        "status": "ok",
        "version": settings.APP_VERSION,
        "checks": {"database": "ok"},
    })
