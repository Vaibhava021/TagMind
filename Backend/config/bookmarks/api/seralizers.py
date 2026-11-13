import re
from rest_framework.serializers import ModelSerializer, ListField, CharField, SerializerMethodField, PrimaryKeyRelatedField
from ..models import Bookmark, Folder, Tag
from ..sync_utils import record_sync_change, bookmark_payload, tag_payload, folder_payload
from django.db import transaction
from rest_framework import serializers
from accounts.vault_tokens import require_vault_token


MAX_TAGS_PER_BOOKMARK = 50


class TagNameField(CharField):
    """Accept tag names as non-empty strings only, with the model's limit."""

    def __init__(self, **kwargs):
        kwargs.setdefault("max_length", 50)
        kwargs.setdefault("allow_blank", False)
        kwargs.setdefault("trim_whitespace", True)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if not isinstance(data, str):
            self.fail("invalid")
        return super().to_internal_value(data)


def normalize_tag_name(tag_name):
    return re.sub(r"\s+", " ", tag_name).strip().lower()


def lock_owned_folder(folder, user):
    if folder is None:
        return None
    try:
        return Folder.objects.select_for_update().get(pk=folder.pk, user=user)
    except Folder.DoesNotExist:
        raise serializers.ValidationError({
            "folder": "The selected folder is no longer available.",
        })


class BookmarkSerializer(ModelSerializer):
    user = PrimaryKeyRelatedField(read_only=True)
    folder = PrimaryKeyRelatedField(queryset=Folder.objects.none(), allow_null=True, required=False)
    tags = ListField(
        child=TagNameField(),
        max_length=MAX_TAGS_PER_BOOKMARK,
        required=False,
        write_only=True
    )
    tag_names = SerializerMethodField()
    

    def get_tag_names(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            fields["folder"].queryset = Folder.objects.filter(user=request.user)
        return fields

    def validate(self, attrs):
        request = self.context.get("request")
        current_vault_state = getattr(self.instance, "is_vault", False)
        is_vault = attrs.get("is_vault", current_vault_state)
        folder = attrs.get("folder", getattr(self.instance, "folder", None))

        if folder and folder.is_vault != is_vault:
            raise serializers.ValidationError({
                "folder": "Bookmark and folder must belong to the same vault state."
            })

        if is_vault:
            profile = request.user.profile
            require_vault_token(request, profile)

        return attrs


    def create(self, validated_data):
        tag_names = validated_data.pop("tags", [])

        with transaction.atomic():
            is_vault = validated_data.get("is_vault", False)
            folder = lock_owned_folder(
                validated_data.get("folder"),
                validated_data["user"],
            )
            if folder and folder.is_vault != is_vault:
                raise serializers.ValidationError({
                    "folder": "Bookmark and folder must belong to the same vault state."
                })
            if folder:
                validated_data["folder"] = folder

            bookmark = Bookmark.objects.create(**validated_data)

            for tag_name in tag_names:
                normalized_name = normalize_tag_name(tag_name)

                tag, created = Tag.objects.get_or_create(
                    name=normalized_name,
                    user=bookmark.user,
                )

                if created:
                    record_sync_change(
                        user=tag.user,
                        entity_type="tag",
                        entity_uuid=tag.sync_uuid,
                        operation="create",
                        payload=tag_payload(tag),
                    )

                bookmark.tags.add(tag)

            # Record exactly one bookmark event after all tags are attached.
            record_sync_change(
                user=bookmark.user,
                entity_type="bookmark",
                entity_uuid=bookmark.sync_uuid,
                operation="create",
                payload=bookmark_payload(bookmark),
            )

        return bookmark

    
    
    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tags", None)

        with transaction.atomic():
            instance = Bookmark.objects.select_for_update().get(pk=instance.pk)
            desired_is_vault = validated_data.get("is_vault", instance.is_vault)
            desired_folder = validated_data.get("folder", instance.folder)
            folder = lock_owned_folder(desired_folder, instance.user)
            if folder and folder.is_vault != desired_is_vault:
                raise serializers.ValidationError({
                    "folder": "Bookmark and folder must belong to the same vault state."
                })
            if "folder" in validated_data or folder:
                validated_data["folder"] = folder

            # Remember the tags before changing relationships.
            old_tags = list(instance.tags.all())

            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            instance.save()

            if tag_names is not None:
                new_tags = []

                for tag_name in tag_names:
                    normalized_name = normalize_tag_name(tag_name)

                    tag, created = Tag.objects.get_or_create(
                        name=normalized_name,
                        user=instance.user,
                    )

                    if created:
                        record_sync_change(
                            user=tag.user,
                            entity_type="tag",
                            entity_uuid=tag.sync_uuid,
                            operation="create",
                            payload=tag_payload(tag),
                        )

                    if tag not in new_tags:
                        new_tags.append(tag)

                # Update the bookmark's tag relationships first.
                instance.tags.set(new_tags)

                new_tag_ids = {tag.pk for tag in new_tags}

                # Delete only old tags that are now unused globally.
                for old_tag in old_tags:
                    if old_tag.pk in new_tag_ids:
                        continue

                    still_used = Bookmark.objects.filter(
                        tags=old_tag
                    ).exists()

                    if not still_used:
                        # Capture the payload before deleting the tag.
                        record_sync_change(
                            user=old_tag.user,
                            entity_type="tag",
                            entity_uuid=old_tag.sync_uuid,
                            operation="delete",
                            payload=tag_payload(old_tag),
                        )

                        old_tag.delete()

            # Record the bookmark after its final state is established.
            record_sync_change(
                user=instance.user,
                entity_type="bookmark",
                entity_uuid=instance.sync_uuid,
                operation="update",
                payload=bookmark_payload(instance),
            )

        return instance

    
    class Meta:
        model = Bookmark
        fields = [
                    'id',
                    'user',
                    'title',
                    'url',
                    'domain',
                    'folder',
                    'description',
                    'created_at',
                    'device_type',
                    'tag_names',
                    'tags',
                    'is_vault'
                ]


class FolderSerializer(ModelSerializer):
    user = PrimaryKeyRelatedField(read_only=True)

    def validate(self, attrs):
        is_vault = attrs.get("is_vault", getattr(self.instance, "is_vault", False))

        if self.instance and is_vault != self.instance.is_vault:
            has_mismatched_bookmarks = self.instance.bookmarks.exclude(
                is_vault=is_vault
            ).exists()
            if has_mismatched_bookmarks:
                raise serializers.ValidationError({
                    "is_vault": (
                        "Cannot change a folder's vault state while it contains "
                        "bookmarks with a different vault state."
                    )
                })

        if is_vault:
            request = self.context.get("request")
            require_vault_token(request, request.user.profile)
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            folder = Folder.objects.create(**validated_data)

            record_sync_change(
                user=folder.user,
                entity_type="folder",
                entity_uuid=folder.sync_uuid,
                operation="create",
                payload=folder_payload(folder),
            )

        return folder

    def update(self, instance, validated_data):
        with transaction.atomic():
            instance = Folder.objects.select_for_update().get(pk=instance.pk)
            is_vault = validated_data.get("is_vault", instance.is_vault)
            if is_vault != instance.is_vault and instance.bookmarks.exclude(
                is_vault=is_vault
            ).exists():
                raise serializers.ValidationError({
                    "is_vault": (
                        "Cannot change a folder's vault state while it contains "
                        "bookmarks with a different vault state."
                    )
                })

            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            instance.save()

            record_sync_change(
                user=instance.user,
                entity_type="folder",
                entity_uuid=instance.sync_uuid,
                operation="update",
                payload=folder_payload(instance),
            )

        return instance

    class Meta:
        model = Folder
        fields = [
            "id",
            "user",
            "name",
            "accent_color",
            "is_vault",
        ]
