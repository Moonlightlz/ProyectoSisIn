#!/usr/bin/env python
"""
Script de configuración rápida para el Sistema de Gestión de Pagos
Ejecuta este script para configurar automáticamente el proyecto con datos de prueba.
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_django():
    """Configura Django para poder usar los modelos"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sistema_pagos.settings')
    django.setup()

def create_sample_data():
    """Crea datos de prueba para el sistema"""
    from django.contrib.auth.models import User
    from api.models import Cliente, Producto, Pago, Pedido
    from datetime import date, timedelta
    
    print("🔧 Creando datos de prueba...")
    
    # Crear usuario cliente de prueba
    if not User.objects.filter(username='cliente1').exists():
        user_cliente = User.objects.create_user(
            username='cliente1', 
            password='123456',
            email='cliente1@example.com',
            first_name='Juan',
            last_name='Pérez'
        )
        print("✅ Usuario cliente creado: cliente1 / 123456")
    else:
        user_cliente = User.objects.get(username='cliente1')
        print("ℹ️  Usuario cliente ya existe: cliente1")
    
    # Crear cliente
    if not Cliente.objects.filter(usuario=user_cliente).exists():
        cliente = Cliente.objects.create(
            usuario=user_cliente,
            nombre_completo='Juan Pérez García',
            empresa='Empresa ABC S.A.C.',
            estado_pago='Puntual'
        )
        print("✅ Cliente creado: Juan Pérez García")
    else:
        cliente = Cliente.objects.get(usuario=user_cliente)
        print("ℹ️  Cliente ya existe: Juan Pérez García")
    
    # Crear productos de muestra
    productos_data = [
        {
            'nombre': 'Desarrollo Web Corporativo',
            'descripcion': 'Desarrollo completo de sitio web corporativo con diseño responsivo',
            'precio': 2500.00
        },
        {
            'nombre': 'Consultoría IT',
            'descripcion': 'Consultoría especializada en tecnologías de información',
            'precio': 1500.00
        },
        {
            'nombre': 'Sistema de Gestión',
            'descripcion': 'Desarrollo de sistema de gestión empresarial personalizado',
            'precio': 4500.00
        },
        {
            'nombre': 'Mantenimiento Web',
            'descripcion': 'Servicio mensual de mantenimiento y actualización web',
            'precio': 350.00
        },
        {
            'nombre': 'Hosting Premium',
            'descripcion': 'Servicio de hosting premium con SSL y backup diario',
            'precio': 150.00
        }
    ]
    
    for producto_data in productos_data:
        if not Producto.objects.filter(nombre=producto_data['nombre']).exists():
            Producto.objects.create(**producto_data)
            print(f"✅ Producto creado: {producto_data['nombre']}")
    
    # Crear algunos pedidos de muestra
    productos = Producto.objects.all()
    if productos.exists() and not Pedido.objects.filter(cliente=cliente).exists():
        # Crear 2-3 pedidos de muestra
        pedido1 = Pedido.objects.create(
            cliente=cliente,
            producto=productos[0],  # Desarrollo Web
            cantidad=1
        )
        
        pedido2 = Pedido.objects.create(
            cliente=cliente,
            producto=productos[1],  # Consultoría IT
            cantidad=2
        )
        
        print("✅ Pedidos de muestra creados")
    
    # Crear algunos pagos de muestra
    if not Pago.objects.filter(cliente=cliente).exists():
        Pago.objects.create(
            cliente=cliente,
            monto=2500.00,
            fecha_vencimiento=date.today() + timedelta(days=30),
            estado='Pendiente'
        )
        
        Pago.objects.create(
            cliente=cliente,
            monto=1500.00,
            fecha_vencimiento=date.today() + timedelta(days=15),
            estado='Pagado'
        )
        
        print("✅ Pagos de muestra creados")
    
    print("\n🎉 ¡Datos de prueba creados exitosamente!")
    print("\n📋 Credenciales de prueba:")
    print("   👑 Admin: usa el superusuario que creaste")
    print("   👤 Cliente: cliente1 / 123456")

def main():
    """Función principal del script"""
    print("🚀 Configuración rápida del Sistema de Gestión de Pagos")
    print("=" * 60)
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists('manage.py'):
        print("❌ Error: No se encontró manage.py")
        print("   Asegúrate de ejecutar este script desde el directorio raíz del proyecto")
        sys.exit(1)
    
    # Configurar Django
    setup_django()
    
    # Realizar migraciones
    print("\n🔧 Ejecutando migraciones...")
    try:
        execute_from_command_line(['manage.py', 'makemigrations'])
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Migraciones completadas")
    except Exception as e:
        print(f"❌ Error en migraciones: {e}")
        return
    
    # Crear datos de prueba
    try:
        create_sample_data()
    except Exception as e:
        print(f"❌ Error creando datos de prueba: {e}")
        return
    
    print("\n" + "=" * 60)
    print("🎊 ¡Configuración completada!")
    print("\n📌 Próximos pasos:")
    print("   1. Crear un superusuario: python manage.py createsuperuser")
    print("   2. Iniciar el servidor: python manage.py runserver")
    print("   3. Abrir front/index.html en tu navegador")
    print("\n🌐 URLs importantes:")
    print("   • API: http://127.0.0.1:8000/api/")
    print("   • Admin: http://127.0.0.1:8000/admin/")
    print("   • Frontend: front/index.html")

if __name__ == '__main__':
    main()