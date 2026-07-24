from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.health),
    path('dashboard/', views.dashboard),
    path('datasets/', views.dataset_collection),
    path('datasets/latest/', views.latest_dataset),
    path('datasets/<uuid:dataset_id>/', views.dataset_detail),
    path('datasets/<uuid:dataset_id>/records/', views.dataset_records),
    path('datasets/<uuid:dataset_id>/query/', views.dataset_query),
    path('datasets/demo/bike/', views.load_demo_dataset),
]
