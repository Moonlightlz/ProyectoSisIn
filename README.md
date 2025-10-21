# Sistema Inteligente de Gestión de Pagos

Un sistema web completo para la gestión de pagos, clientes, productos y pedidos con autenticación JWT y diferentes niveles de usuario (Admin/Cliente).

## 🚀 Características

- **Autenticación JWT**: Sistema seguro de login con tokens
- **Roles de Usuario**: Administrador y Cliente con diferentes permisos
- **Dashboard Diferenciado**: 
  - Admin: Gestión completa de clientes, pedidos y estadísticas
  - Cliente: Catálogo de productos y gestión de pedidos
- **API REST**: Backend completo con Django REST Framework
- **Frontend Responsivo**: Interfaz moderna con React (standalone)

## 🛠️ Tecnologías

### Backend
- Django 4.2
- Django REST Framework
- JWT Authentication
- SQLite (base de datos)

### Frontend
- React 18 (via CDN)
- Axios para peticiones HTTP
- CSS3 con diseño responsive
- Chart.js para gráficos (preparado)

## 📋 Requisitos Previos

- Python 3.8+
- pip (gestor de paquetes de Python)

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd ProyectoSisIn
```

### 2. Crear entorno virtual (recomendado)
```bash
python -m venv venv
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar la base de datos
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Crear superusuario (Admin)
```bash
python manage.py createsuperuser
```
**Importante**: Anota las credenciales, las necesitarás para hacer login como administrador.

### 6. Crear datos de prueba (Opcional)
Ejecutar en el shell de Django:
```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from api.models import Cliente, Producto, Pago, Pedido
from datetime import date, timedelta

# Crear usuarios de prueba
user_cliente = User.objects.create_user(username='cliente1', password='123456')

# Crear clientes
cliente = Cliente.objects.create(
    usuario=user_cliente,
    nombre_completo='Juan Pérez',
    empresa='Empresa ABC',
    estado_pago='Puntual'
)

# Crear productos
producto1 = Producto.objects.create(
    nombre='Servicio Web',
    descripcion='Desarrollo de sitio web corporativo',
    precio=2500.00
)

producto2 = Producto.objects.create(
    nombre='Consultoría IT',
    descripcion='Consultoría en tecnologías de información',
    precio=1500.00
)

# Crear un pedido
pedido = Pedido.objects.create(
    cliente=cliente,
    producto=producto1,
    cantidad=1
)

print("Datos de prueba creados exitosamente!")
```

## 🚀 Ejecutar el Proyecto

### 1. Iniciar el servidor Django
```bash
python manage.py runserver
```
El API estará disponible en: `http://127.0.0.1:8000/`

### 2. Acceder al Frontend
Abrir el archivo `front/index.html` en un navegador web, o usar un servidor web local:

**Opción A**: Abrir directamente
- Navegar a la carpeta `front/`
- Hacer doble clic en `index.html`

**Opción B**: Servidor web simple (recomendado)
```bash
# En la carpeta front/
python -m http.server 8080
```
Luego acceder a: `http://127.0.0.1:8080/`

## 👥 Usuarios de Prueba

### Administrador
- **Usuario**: El superusuario que creaste con `createsuperuser`
- **Funciones**: Ver todos los clientes, pedidos, estadísticas completas

### Cliente
- **Usuario**: `cliente1`
- **Contraseña**: `123456`
- **Funciones**: Ver catálogo de productos, realizar pedidos

## 🔍 Endpoints de la API

### Autenticación
- `POST /api/token/` - Obtener token JWT
- `POST /api/token/refresh/` - Refrescar token

### Recursos (requieren autenticación)
- `GET /api/clientes/` - Listar clientes (solo admin)
- `GET /api/productos/` - Listar productos
- `GET /api/pedidos/` - Listar pedidos (filtrados por usuario)
- `POST /api/pedidos/` - Crear nuevo pedido
- `GET /api/pagos/` - Listar pagos

## 🎨 Estructura del Proyecto

```
ProyectoSisIn/
├── manage.py                 # Comando principal de Django
├── requirements.txt          # Dependencias de Python
├── sistema_pagos/           # Configuración del proyecto Django
│   ├── __init__.py
│   ├── settings.py          # Configuración principal
│   ├── urls.py              # URLs principales
│   └── wsgi.py              # Configuración WSGI
├── api/                     # Aplicación API
│   ├── __init__.py
│   ├── models.py            # Modelos de datos
│   ├── serializers.py       # Serializadores DRF
│   ├── views.py             # Vistas de la API
│   └── urls.py              # URLs de la API
├── front/                   # Frontend
│   ├── index.html           # Página principal
│   ├── app.css              # Estilos CSS
│   ├── app.js               # Lógica principal (legacy)
│   ├── login.js             # Componente login (legacy)
│   ├── admindashboard.js    # Dashboard admin (legacy)
│   └── userdashboard.js     # Dashboard usuario (legacy)
└── back/                    # Archivos de prueba backend
    ├── testback.html        # Pruebas del backend
    └── ...
```

## 🐛 Solución de Problemas

### Error de CORS
Si hay problemas de CORS, verificar que en `settings.py` esté configurado:
```python
CORS_ALLOW_ALL_ORIGINS = True
```

### Error de JWT
Verificar que el token se esté enviando correctamente en el header:
```javascript
headers: {
    'Authorization': `Bearer ${token.access}`
}
```

### Base de datos
Si hay problemas con la base de datos:
```bash
python manage.py makemigrations --empty api
python manage.py migrate
```

## 📱 Funcionalidades por Rol

### 👑 Administrador
- ✅ Ver dashboard con estadísticas
- ✅ Gestionar clientes
- ✅ Ver todos los pedidos
- ✅ Gestionar productos
- ✅ Ver reportes de pagos

### 👤 Cliente
- ✅ Ver catálogo de productos
- ✅ Realizar pedidos
- ✅ Ver historial de pedidos propios
- ✅ Interfaz simplificada y intuitiva

## 🔮 Próximas Mejoras

- [ ] Gráficos y estadísticas avanzadas
- [ ] Sistema de notificaciones
- [ ] Integración con pasarela de pagos
- [ ] Exportación de reportes
- [ ] Panel de configuración

## 📞 Soporte

Para reportar problemas o sugerencias, crear un issue en el repositorio.

---

**¡Listo para probar! 🎉**