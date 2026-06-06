from django.contrib import admin
from django.db import models
from .models import Bookmark, Folder


# Register your models here.
admin.site.register(Bookmark)
admin.site.register(Folder)

