from rest_framework import serializers

from .models import Dataset, DatasetRecord


class DatasetRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetRecord
        fields = ['row_number', 'data']


class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = [
            'id',
            'name',
            'source_name',
            'file_type',
            'row_count',
            'column_count',
            'summary',
            'chart_config',
            'created_at',
            'updated_at',
        ]
