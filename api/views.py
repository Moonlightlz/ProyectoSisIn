# api/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Cliente, Pago, Producto, Pedido
from .serializers import (
    ClienteSerializer, PagoSerializer, ProductoSerializer, PedidoSerializer
)

class ClienteViewSet(viewsets.ModelViewSet):
    """
    API endpoint que permite ver o editar clientes. (Vista para Admin)
    """
    queryset = Cliente.objects.all().order_by('nombre_completo')
    serializer_class = ClienteSerializer

class PagoViewSet(viewsets.ModelViewSet):
    """
    API endpoint para los pagos. (Vista para Cliente)
    """
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer
    
    # Filtra para que cada cliente solo vea sus propios pagos
    def get_queryset(self):
        # En un sistema real, filtrarías por el usuario autenticado
        # Por simplicidad, aquí mostramos todos, pero se puede filtrar por cliente_id
        cliente_id = self.request.query_params.get('cliente_id')
        if cliente_id:
            return Pago.objects.filter(cliente_id=cliente_id)
        return Pago.objects.all()
    
class ClienteViewSet(viewsets.ModelViewSet):
    """
    API endpoint para Clientes.
    SOLO los administradores (is_staff=True) pueden ver y editar esto.
    """
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [IsAdminUser] # <-- ¡Solo admins!

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
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Pedido.objects.all() # El admin ve todo
        # El usuario normal solo ve sus pedidos
        return Pedido.objects.filter(cliente__usuario=user)

    def perform_create(self, serializer):
        # Asigna automáticamente el cliente al crear un pedido
        cliente = Cliente.objects.get(usuario=self.request.user)
        serializer.save(cliente=cliente)