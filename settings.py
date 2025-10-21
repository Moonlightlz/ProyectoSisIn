# sistema_pagos/settings.py

INSTALLED_APPS = [
    # ... otras apps
    'rest_framework',
    'rest_framework_simplejwt', # <-- Añadir esta
    'corsheaders',
    'api',
]

# Añade esta configuración de REST Framework al final del archivo
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

# ... resto de la configuración