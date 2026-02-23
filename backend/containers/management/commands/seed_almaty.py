import random
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from containers.models import Container, WasteType

class Command(BaseCommand):
    help = 'Seeds the database with waste containers in Almaty, Kazakhstan'

    def handle(self, *args, **options):
        # Almaty coordinates (longitude, latitude)
        locations = [
            (76.95, 43.24, "Abay Ave / Dostyk Ave"),
            (76.94, 43.23, "Republic Square"),
            (76.95, 43.25, "Panfilov Park"),
            (76.94, 43.26, "Arbat Street"),
            (76.88, 43.20, "Al-Farabi / Navoi"),
            (76.91, 43.25, "Baitursynov Street"),
            (76.92, 43.22, "Satpayev Street"),
            (76.89, 43.23, "Auezov District"),
            (76.97, 43.26, "Central Park"),
            (76.90, 43.26, "Tole Bi Street"),
        ]

        self.stdout.write(self.style.SUCCESS('Seeding Almaty containers...'))

        for lon, lat, name in locations:
            # Create a point with a small random jitter to make it look natural
            jitter_lon = lon + (random.random() - 0.5) * 0.01
            jitter_lat = lat + (random.random() - 0.5) * 0.01
            
            location = Point(jitter_lon, jitter_lat)
            fill_level = random.uniform(10, 95)
            waste_type = random.choice(list(WasteType))

            container = Container.objects.create(
                location=location,
                fill_level=fill_level,
                waste_type=waste_type,
                is_active=True
            )
            self.stdout.write(f'Created container at {name}: {container}')

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(locations)} containers in Almaty.'))
