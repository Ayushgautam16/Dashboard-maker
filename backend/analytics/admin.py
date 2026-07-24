from django.contrib import admin

from .models import Dataset, DatasetRecord


@admin.register(Dataset)
class DatasetAdmin(admin.ModelAdmin):
    list_display = ('name', 'source_name', 'row_count', 'column_count', 'created_at')
    search_fields = ('name', 'source_name')
    readonly_fields = ('summary', 'chart_config', 'created_at', 'updated_at')


@admin.register(DatasetRecord)
class DatasetRecordAdmin(admin.ModelAdmin):
    list_display = ('dataset', 'row_number')
    search_fields = ('dataset__name',)
