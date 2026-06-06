from rest_framework.serializers import ModelSerializer, ListField, CharField, SerializerMethodField
from ..models import Bookmark, Folder, Tag

class BookmarkSerializer(ModelSerializer):
    tags = ListField(
        child=CharField(),
        required=False,
        write_only=True
    )
    tag_names = SerializerMethodField()
    def get_tag_names(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def create(self,validated_data):
        tag_names = validated_data.pop('tags',[])

        bookmark = Bookmark.objects.create(
            **validated_data
        )

        for tag_name in tag_names:
            tag,_ = Tag.objects.get_or_create(
                name=tag_name.strip().lower().replace('  ', ' '),
                user=bookmark.user
            )

            bookmark.tags.add(tag)
        return bookmark
    
    def update(self, instance, validated_data):
        tag_names = validated_data.pop(
            'tags',
            None
            )
        for attr,value in validated_data.items():
            setattr(
                instance,
                attr,
                value
            )
        instance.save()
        if tag_names is not None:
            new_tags = []
            for tag_name in tag_names:
                tag,_ = Tag.objects.get_or_create(
                    name=tag_name.strip().lower(),
                    user=instance.user
                )
                new_tags.append(tag)
            instance.tags.set(new_tags)
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

    class Meta:
        model = Folder

        fields = [
            'id',
            'user',
            'name',
            'accent_color',
            'is_vault'
        ]