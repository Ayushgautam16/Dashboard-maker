# Generated manually for the dashboard scaffold.

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Dataset',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('source_name', models.CharField(blank=True, max_length=255)),
                ('file_type', models.CharField(blank=True, max_length=32)),
                ('row_count', models.PositiveIntegerField(default=0)),
                ('column_count', models.PositiveIntegerField(default=0)),
                ('summary', models.JSONField(default=dict)),
                ('chart_config', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='DatasetRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('row_number', models.PositiveIntegerField()),
                ('data', models.JSONField(default=dict)),
                ('dataset', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='records', to='analytics.dataset')),
            ],
            options={
                'ordering': ['row_number'],
                'unique_together': {('dataset', 'row_number')},
            },
        ),
    ]
