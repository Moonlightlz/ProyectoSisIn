# api/serializers.py
from rest_framework import serializers
from .models import Cliente, Pago, Producto, Pedido

class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    pagos = PagoSerializer(many=True, read_only=True)
    class Meta:
        model = Cliente
        fields = ['id', 'nombre_completo', 'empresa', 'estado_pago', 'pagos']
class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'

class PedidoSerializer(serializers.ModelSerializer):
    # Para mostrar el nombre del producto y cliente en lugar de solo el ID
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre_completo', read_only=True)

    class Meta:
        model = Pedido
        fields = ['id', 'cliente', 'producto', 'fecha_pedido', 'cantidad', 'producto_nombre', 'cliente_nombre']
