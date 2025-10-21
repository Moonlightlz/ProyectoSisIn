# api/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Cliente, Pago, Producto, Pedido
from .serializers import (
    ClienteSerializer, PagoSerializer, ProductoSerializer, PedidoSerializer
)

class ClienteViewSet(viewsets.ModelViewSet):
    """
    API endpoint para Clientes.
    SOLO los administradores (is_staff=True) pueden ver y editar esto.
    """
    queryset = Cliente.objects.all().order_by('nombre_completo')
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminUser] # <-- ¡Solo admins!

class PagoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para los pagos.
    """
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Pago.objects.all()
        # Los usuarios normales solo ven sus propios pagos
        try:
            return Pago.objects.filter(cliente__usuario=user)
        except Cliente.DoesNotExist:
            return Pago.objects.none()

class ProductoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para Productos.
    Cualquier usuario autenticado puede ver los productos.
    """
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated] # <-- Cualquier usuario logueado

class PedidoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para Pedidos.
    - Admins: Ven todos los pedidos.
    - Usuarios normales: Solo ven y pueden crear sus propios pedidos.
    """
    queryset = Pedido.objects.all()  # Queryset base requerido
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Pedido.objects.all() # El admin ve todo
        # El usuario normal solo ve sus pedidos
        try:
            return Pedido.objects.filter(cliente__usuario=user)
        except Cliente.DoesNotExist:
            return Pedido.objects.none()

    def perform_create(self, serializer):
        # Asigna automáticamente el cliente al crear un pedido
        try:
            cliente = Cliente.objects.get(usuario=self.request.user)
            serializer.save(cliente=cliente)
        except Cliente.DoesNotExist:
            # Si no existe cliente para este usuario, crearlo automáticamente
            cliente = Cliente.objects.create(
                usuario=self.request.user,
                nombre_completo=f"{self.request.user.first_name} {self.request.user.last_name}",
                empresa="Sin especificar",
                estado_pago="Puntual"
            )
            serializer.save(cliente=cliente)