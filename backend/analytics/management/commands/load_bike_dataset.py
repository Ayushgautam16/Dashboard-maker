from django.core.management.base import BaseCommand

from analytics.services import create_demo_dataset_from_csv


class Command(BaseCommand):
    help = 'Load the bundled bike buyers dataset into Postgres.'

    def handle(self, *args, **options):
        dataset = create_demo_dataset_from_csv()
        self.stdout.write(self.style.SUCCESS(f'Loaded dataset: {dataset.name} ({dataset.row_count} rows)'))
