# main.py
# Django specific settings
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "django_settings")
django.setup()

from data.models import User


#Add user
user = User(name="someone", email="someone@example.com")
user.save()

# Application logic
first_user = User.objects.all()[0]

print(first_user.name)
print(first_user.email)
