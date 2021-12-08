# models.py
import os

from django.db import models
import django


try:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_settings")
    django.setup()
    print("Setting up django models..")
except RuntimeError:
    pass


class LootHistory(models.Model):
    id = models.AutoField(primary_key=True)
    chest_id = models.CharField(max_length=100)
    loot_time = models.DateTimeField()
    reset_time = models.DateTimeField()


class PlayerData(models.Model):
    player_name = models.CharField(primary_key=True, max_length=100)
    chests_looted = models.IntegerField(default=0)
    nearby = models.TextField(null=True, blank=True)  # json field
    current_location = models.CharField(null=True, blank=True, max_length=100)
    last_location = models.CharField(null=True, blank=True, max_length=100)
