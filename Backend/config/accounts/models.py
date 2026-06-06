from django.db import models
from django.contrib.auth.models import User
import random
import colorsys


def hsl_to_hex(h, s, l):

    r, g, b = colorsys.hls_to_rgb(
        h / 360,
        l / 100,
        s / 100
    )

    return '#{:02X}{:02X}{:02X}'.format(
        int(r * 255),
        int(g * 255),
        int(b * 255)
    )


def generate_accent_color():

    hue = random.randint(0, 359)
    saturation = random.randint(70, 95)
    lightness = random.randint(50, 65)

    return hsl_to_hex(
        hue,
        saturation,
        lightness
    )


class UserProfile(models.Model):

    APP_PROVIDER_CHOICES = [
        ('google', 'Google'),
        ('email', 'Email'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    provider = models.CharField(
        max_length=20,
        choices=APP_PROVIDER_CHOICES,
        default='email'
    )

    accent_color = models.CharField(
        max_length=7,
        default=generate_accent_color,
        editable=False
    )

    # Future use
    vault_password_hash = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )

    def __str__(self):
        return self.user.email