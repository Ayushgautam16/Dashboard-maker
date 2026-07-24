from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Dataset
from .serializers import DatasetSerializer
from .services import (
    create_dataset_from_uploaded_file,
    create_demo_dataset_from_csv,
    dataframe_from_dataset,
    build_dataset_summary,
    query_dataset,
)


@api_view(['GET'])
def health(request):
    return Response({'status': 'ok'})



@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def dataset_collection(request):
    if request.method == 'GET':
        datasets = Dataset.objects.all()
        serializer = DatasetSerializer(datasets, many=True)
        return Response({'datasets': serializer.data})

    uploaded_file = request.FILES.get('file')
    if uploaded_file is None:
        return Response({'detail': 'Upload a CSV or Excel file in the file field.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        dataset = create_dataset_from_uploaded_file(uploaded_file)
    except ValueError as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return Response({'detail': f"Database/Backend error: {str(exc)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'dataset': DatasetSerializer(dataset).data}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def dataset_detail(request, dataset_id):
    dataset = get_object_or_404(Dataset, id=dataset_id)
    data_frame = dataframe_from_dataset(dataset)
    summary = dataset.summary or build_dataset_summary(data_frame, dataset.name, dataset.source_name, 0)
    payload = DatasetSerializer(dataset).data
    payload['summary'] = summary
    payload['sampleRows'] = summary.get('sampleRows', [])
    payload['chart_config'] = dataset.chart_config
    return Response({'dataset': payload})


@api_view(['GET'])
def latest_dataset(request):
    dataset = Dataset.objects.first()
    if dataset is None:
        return Response({'dataset': None, 'detail': 'No dataset has been loaded yet.'}, status=status.HTTP_404_NOT_FOUND)
    return dataset_detail(request, dataset.id)


@api_view(['POST'])
def load_demo_dataset(request):
    dataset = create_demo_dataset_from_csv()
    return Response({'dataset': DatasetSerializer(dataset).data}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def dashboard(request):
    dataset = Dataset.objects.first()
    if dataset is None:
        return Response(
            {
                'dataset': None,
                'datasets': [],
                'detail': 'Upload a CSV or Excel file, or load the bike buyers demo dataset.',
            },
            status=status.HTTP_200_OK,
        )

    data_frame = dataframe_from_dataset(dataset)
    summary = dataset.summary or build_dataset_summary(data_frame, dataset.name, dataset.source_name, 0)
    serialized = DatasetSerializer(dataset).data
    serialized['summary'] = summary
    serialized['sampleRows'] = summary.get('sampleRows', [])
    serialized['chart_config'] = dataset.chart_config
    return Response(
        {
            'dataset': serialized,
            'datasets': DatasetSerializer(Dataset.objects.all(), many=True).data,
        }
    )


@api_view(['GET'])
def dataset_records(request, dataset_id):
    dataset = get_object_or_404(Dataset, id=dataset_id)
    records = dataset.records.all().values_list('data', flat=True)
    return Response({'records': list(records)})


@api_view(['POST'])
def dataset_query(request, dataset_id):
    dataset = get_object_or_404(Dataset, id=dataset_id)
    x_axis = request.data.get('x_axis')
    y_axis = request.data.get('y_axis')
    aggregation = request.data.get('aggregation', 'sum')
    filters = request.data.get('filters', {})
    group_by = request.data.get('group_by')

    if not x_axis:
        return Response({'detail': 'x_axis is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        results = query_dataset(dataset, x_axis, y_axis, aggregation, filters, group_by)
        return Response({'results': results})
    except Exception as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

