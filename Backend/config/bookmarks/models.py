from django.db import models
import random
import colorsys
from django.conf import settings
from django.contrib.auth.models import User
import uuid

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

    sync_uuid = models.UUIDField(
        default = uuid.uuid4,
        unique = True,
        editable=False,
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
        editable=True,
    )
    sync_uuid = models.UUIDField(
        default = uuid.uuid4,
        unique = True,
        editable=False,
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

    sync_uuid = models.UUIDField(
        default = uuid.uuid4,
        unique = True,
        editable=False,
    )

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
    


class SyncOutBox(models.Model):

    ENTITY_CHOICES = [
        ('bookmark', 'Bookmark'),
        ('folder', 'Folder'),
        ('tag', 'Tag')
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('failed', 'Failed'),
        ('synced', 'Synced')
    ]

    OPERATION_CHOICES=[
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete')
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sync_outbox'
    )


    # entity_uuid = models.UUIDField(
    #     default=uuid.uuid4,
    #     unique=True,
    #     editable=False,
    # )
                    
    entity_uuid = models.UUIDField()

    event_uuid = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    entity_type = models.CharField(
        max_length=20,
        choices=ENTITY_CHOICES,
    )

    operation = models.CharField(
        max_length=10,
        choices=OPERATION_CHOICES,
    )

    payload = models.JSONField(default=dict, blank=True)

    status = models.CharField(
        max_length=12,
        choices = STATUS_CHOICES,
        default = "pending",
    )

    modified_at = models.DateTimeField(auto_now_add=True)
    retry_count = models.PositiveBigIntegerField(default=0)
    error_message = models.TextField(blank=True)

    next_retry_at = models.DateTimeField(
                    null=True,
                    blank=True,
                    db_index=True,
                    )

    processing_started_at = models.DateTimeField(
                            null=True,
                            blank=True,
                            )

    claim_token = models.UUIDField(
                    null=True,
                    blank=True,
                    )

    class Meta:
        ordering = ['modified_at', 'id']
        indexes = [
            models.Index(
                fields=['user', 'status', 'id'],
                name='outbox_user_status_idx',
            ),
            models.Index(
                fields=['entity_type', 'entity_uuid'],
                name='outbox_user_entity_idx'
            )
        ]

class SyncChange(models.Model):
    """Cloud-side change log used to send changes to devices."""

    ENTITY_CHOICES = [
        ("bookmark", "Bookmark"),
        ("folder", "Folder"),
        ("tag", "Tag"),
    ]

    OPERATION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
    ]

    # The automatically generated integer primary key is the
    # cloud change sequence/cursor.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sync_changes",
    )

    entity_type = models.CharField(
        max_length=20,
        choices=ENTITY_CHOICES,
    )

    entity_uuid = models.UUIDField()

    operation = models.CharField(
        max_length=10,
        choices=OPERATION_CHOICES,
    )

    payload = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(
                fields=["user", "id"],
                name="syncchange_user_id_idx",
            ),
        ]


class SyncState(models.Model):
    """Synchronization progress for one account on one device."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sync_states",
    )

    device_uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
    )

    last_successful_sync_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    last_download_cursor = models.PositiveBigIntegerField(
        default=0,
    )

    last_sync_status = models.CharField(
        max_length=20,
        default="never_synced",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "device_uuid"],
                name="unique_user_device_sync",
            ),
        ]
