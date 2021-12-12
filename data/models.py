from __future__ import annotations
# models.py
import os
from datetime import datetime, timedelta
from typing import List


from django.db import models
from django.db.models import F
import django

from models import Location

try:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_settings")
    django.setup()
    print("Setting up django models..")
except RuntimeError:
    pass


class Marker(models.Model):
    marker_id = models.CharField(primary_key=True, max_length=255)
    zone = models.CharField(max_length=255)
    type = models.CharField(max_length=255)
    unreachable = models.BooleanField(default=False)
    name = models.CharField(max_length=255)
    location_x = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    location_y = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    is_elite = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    def __str__(self) -> str:
        return f"<Marker: {self.type}, {self.name}>"

    @property
    def location(self) -> Location:
        return Location(x=self.location_x, y=self.location_y)


class LootHistory(models.Model):
    id = models.AutoField(primary_key=True)
    chest = models.ForeignKey(Marker, on_delete=models.CASCADE)
    loot_time = models.DateTimeField()
    reset_time = models.DateTimeField()

    @property
    def is_elite(self):
        return self.chest.is_elite

    @classmethod
    def mark_looted(cls, chest_id, respawn_time=60 * 60) -> LootHistory:
        chest = cls.objects.filter(chest_id=chest_id, reset_time__gte=datetime.now()).first()
        now = datetime.now()
        if chest:
            return chest
        delta = timedelta(seconds=respawn_time)
        chest = cls(
            chest_id=chest_id,
            loot_time=now,
            reset_time=now + delta
        )
        chest.save()
        return chest

    @property
    def resets(self) -> timedelta:
        return datetime.now() - self.reset_time

    @staticmethod
    def recent_loot() -> List:
        return LootHistory.objects.filter(reset_time__gte=datetime.now())

    @staticmethod
    def get_last_24h() -> List[dict]:
        one_day_prior = datetime.now() - timedelta(hours=24)
        return LootHistory.objects.filter(loot_time__gte=one_day_prior)



class PlayerData(models.Model):
    player_name = models.CharField(primary_key=True, max_length=100)
    chests_looted = models.IntegerField(default=0)
    old_location_x = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    old_location_y = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    location_x = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    location_y = models.DecimalField(max_digits=10, decimal_places=2, null=True)

    def update_location(self, location: Location) -> None:
        self.old_location_x = self.location_x
        self.old_location_y = self.location_y
        self.location_x = location.x
        self.location_y = location.y

    @property
    def old_location(self) -> Location:
        if self.old_location_x is None or self.old_location_y is None:
            return None
        return Location(x=self.old_location_x, y=self.old_location_y)

    @property
    def location(self) -> Location:
        if self.location_x is None or self.location_y is None:
            return None
        return Location(x=self.location_x, y=self.location_y)

    @property
    def nearby_markers(self) -> List[Marker]:
        return Marker.objects.filter(
            location_x__gt=self.location.x - 3,
            location_x__lt=self.location.x + 3,
            location_y__gt=self.location.y - 3,
            location_y__lt=self.location.y + 3,
            is_deleted=False
        )
