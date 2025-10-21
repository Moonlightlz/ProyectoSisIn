#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sistema_pagos.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Cliente, Producto

# Crear usuario cliente
if not User.objects.filter(username='cliente1').exists():
    user_cliente = User.objects.create_user(
        username='cliente1', 
        password='123456',
        email='cliente1@example.com',
        first_name='Juan',
        last_name='Perez'
    )
    print('Usuario cliente creado: cliente1 / 123456')
    
    # Crear cliente asociado
    Cliente.objects.create(
        usuario=user_cliente,
        nombre_completo='Juan Perez Garcia',
        empresa='Empresa ABC',
        estado_pago='Puntual'
    )
    print('Cliente creado')
else:
    print('Usuario cliente ya existe')

# Crear productos
productos = [
    ('Desarrollo Web', 'Desarrollo completo de sitio web', 2500.00),
    ('Consultoria IT', 'Consultoria en tecnologias', 1500.00),
    ('Sistema de Gestion', 'Sistema personalizado', 4500.00)
]

for nombre, desc, precio in productos:
    if not Producto.objects.filter(nombre=nombre).exists():
        Producto.objects.create(nombre=nombre, descripcion=desc, precio=precio)
        print(f'Producto creado: {nombre}')

print('Datos de prueba listos!')