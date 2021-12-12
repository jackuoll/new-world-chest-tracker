from settings import SETTINGS

INSTALLED_APPS = ['data']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': SETTINGS.db_name,
        'USER': SETTINGS.db_user,
        'PASSWORD': SETTINGS.db_pass,
        'HOST': SETTINGS.db_host,
        'PORT': '3306',
    }
}


SECRET_KEY = 'REPLACE_ME'
