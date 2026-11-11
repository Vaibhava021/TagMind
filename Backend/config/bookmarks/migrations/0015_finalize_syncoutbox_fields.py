
import django.utils.timezone
import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookmarks", "0014_syncchange_syncstate_alter_syncoutbox_options_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="syncoutbox",
            name="event_uuid",
            field=models.UUIDField(
                default=uuid.uuid4,
                unique=True,
                editable=False,
            ),
        ),
        migrations.AlterField(
            model_name="syncoutbox",
            name="entity_type",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("bookmark", "Bookmark"),
                    ("folder", "Folder"),
                    ("tag", "Tag"),
                ],
            ),
        ),
        migrations.AlterField(
            model_name="syncoutbox",
            name="entity_uuid",
            field=models.UUIDField(),
        ),
        migrations.AlterField(
            model_name="syncoutbox",
            name="operation",
            field=models.CharField(
                max_length=10,
                choices=[
                    ("create", "Create"),
                    ("update", "Update"),
                    ("delete", "Delete"),
                ],
            ),
        ),
        migrations.AlterField(
            model_name="syncoutbox",
            name="modified_at",
            field=models.DateTimeField(
                default=django.utils.timezone.now,
                editable=False,
            ),
        ),
    ]
