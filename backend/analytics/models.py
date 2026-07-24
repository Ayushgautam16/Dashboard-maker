import uuid

from django.db import models


class Dataset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    source_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=32, blank=True)
    row_count = models.PositiveIntegerField(default=0)
    column_count = models.PositiveIntegerField(default=0)
    summary = models.JSONField(default=dict)
    chart_config = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class DatasetRecord(models.Model):
    dataset = models.ForeignKey(Dataset, related_name='records', on_delete=models.CASCADE)
    row_number = models.PositiveIntegerField()
    data = models.JSONField(default=dict)

    class Meta:
        ordering = ['row_number']
        unique_together = ('dataset', 'row_number')

    def __str__(self):
        return f'{self.dataset.name} #{self.row_number}'
