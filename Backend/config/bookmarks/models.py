from django.db import models
import random
import colorsys
from django.conf import settings
from django.contrib.auth.models import User

# Helper functions
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

    # Full hue wheel
    hue = random.randint(0, 359)

    # High saturation → vivid colors
    saturation = random.randint(70, 95)

    # Avoid darkness / washed colors
    lightness = random.randint(50, 65)

    return hsl_to_hex(hue, saturation, lightness)


# Create your models here.

class Tag(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    name = models.CharField(
        max_length=50
    )
    

    def __str__(self):
        return self.name

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user','name'],
                name='unique_user_tag'
            )
        ]


class Folder(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.CASCADE,
        blank=True
    )
    name = models.CharField(max_length=50)
    is_vault = models.BooleanField(default=False)

    # For Hex color code length is kep at 7 
    accent_color = models.CharField(
        max_length=7,
        default=generate_accent_color,
        editable=False
    )
    
    def __str__(self):
        return self.name


class Bookmark(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    is_vault = models.BooleanField(default=False)

    DEVICE_CHOICES = [
        ('pc', 'PC'),
        ('mobile', 'Mobile'),
        ('all','All'),
    ]
    title = models.CharField(max_length=200)
    url = models.URLField(max_length=500)
    domain = models.CharField(max_length=120)
    
    folder = models.ForeignKey(
        Folder,
        on_delete=models.CASCADE,
        related_name='bookmarks',
        null=True,
        blank=True
    )

    device_type = models.TextField(
        blank=True,
        choices=DEVICE_CHOICES,
        default='all',
    )

    description = models.TextField(
        blank=True,
        max_length=1000,
    )

    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='bookmarks'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['-created_at']
           
    def __str__(self):
        return self.title
    


