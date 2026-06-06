from rest_framework import serializers
from django.contrib.auth.models import User
from accounts.models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):

    email = serializers.EmailField(
        source='user.email',
        read_only=True
    )

    username = serializers.CharField(
        source='user.username',
        read_only=True
    )

    has_vault = serializers.SerializerMethodField()

    def get_has_vault(self,obj):
        return bool(obj.vault_password_hash)
        
    class Meta:

        model = UserProfile

        fields = [
            'id',
            'username',
            'email',
            'provider',
            'accent_color',
            'has_vault',
        ]


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:

        model = User

        fields = [
            'username',
            'email',
            'password'
        ]

    def validate_email(self, value):

        if User.objects.filter(
            email=value
        ).exists():

            raise serializers.ValidationError(
                'Email already registered'
            )

        return value

    def create(self, validated_data):

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        UserProfile.objects.create(
            user=user,
            provider='email'
        )

        return user
    
class LoginSerializer(serializers.Serializer):

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True
    )

class VaultPasswordSerializer(serializers.Serializer):
    profile_id = serializers.IntegerField()
    password = serializers.CharField(write_only=True, 
                                     min_length=4)


class VaultUnlockSerializer(serializers.Serializer):
    profile_id = serializers.IntegerField()
    password = serializers.CharField(write_only=True, min_length=4)


class VaultChangeSerializer(serializers.Serializer):
    profile_id = serializers.IntegerField()
    old_password = serializers.CharField(write_only=True, min_length=4)
    new_password = serializers.CharField(write_only=True, min_length=4)