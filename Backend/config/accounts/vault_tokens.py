from django.core import signing
from rest_framework.exceptions import PermissionDenied


VAULT_TOKEN_MAX_AGE_SECONDS = 15 * 60


def issue_vault_token(profile):
    if not profile.vault_password_hash:
        raise PermissionDenied("Vault has not been configured.")

    return signing.dumps(
        {"user_id": profile.user_id, "profile_id": profile.pk},
        salt=f"tagmind.vault.{profile.vault_password_hash}",
        compress=True,
    )


def require_vault_token(request, profile):
    token = request.headers.get("X-Vault-Token", "")
    if not token or not profile.vault_password_hash:
        raise PermissionDenied("Unlock the vault to access vault data.")

    try:
        payload = signing.loads(
            token,
            salt=f"tagmind.vault.{profile.vault_password_hash}",
            max_age=VAULT_TOKEN_MAX_AGE_SECONDS,
        )
    except signing.BadSignature:
        raise PermissionDenied("Vault unlock has expired. Unlock the vault again.")

    if payload != {"user_id": request.user.pk, "profile_id": profile.pk}:
        raise PermissionDenied("Vault unlock does not belong to this account.")
