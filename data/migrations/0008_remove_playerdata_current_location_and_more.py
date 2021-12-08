# Generated by Django 4.0 on 2021-12-08 03:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('data', '0007_alter_loothistory_chest_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='playerdata',
            name='current_location',
        ),
        migrations.RemoveField(
            model_name='playerdata',
            name='last_location',
        ),
        migrations.RemoveField(
            model_name='playerdata',
            name='nearby',
        ),
        migrations.AddField(
            model_name='playerdata',
            name='location_x',
            field=models.DecimalField(decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='playerdata',
            name='location_y',
            field=models.DecimalField(decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='playerdata',
            name='old_location_x',
            field=models.DecimalField(decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AddField(
            model_name='playerdata',
            name='old_location_y',
            field=models.DecimalField(decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AlterField(
            model_name='marker',
            name='location_x',
            field=models.DecimalField(decimal_places=2, max_digits=10, null=True),
        ),
        migrations.AlterField(
            model_name='marker',
            name='location_y',
            field=models.DecimalField(decimal_places=2, max_digits=10, null=True),
        ),
    ]
