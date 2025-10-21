# api/models.py
from django.db import models
from django.contrib.auth.models import User

# --- ASEGÚRATE DE QUE ESTA CLASE ESTÉ EXACTAMENTE ASÍ ---
class Cliente(models.Model):
    ESTADO_CHOICES = [
        ('Puntual', 'Pagador Puntual'),
        ('Moderado', 'Riesgo Moderado'),
        ('Riesgoso', 'Riesgo Alto'),
    ]
    # Comprueba que el usuario pueda ser nulo temporalmente si lo creas desde el admin
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True) 
    nombre_completo = models.CharField(max_length=100)
    empresa = models.CharField(max_length=100)
    estado_pago = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Puntual')

    def __str__(self):
        return self.nombre_completo

class Pago(models.Model):
    ESTADO_PAGO_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Pagado', 'Pagado'),
        ('Vencido', 'Vencido'),
    ]
    cliente = models.ForeignKey(Cliente, related_name='pagos', on_delete=models.CASCADE)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_emision = models.DateField(auto_now_add=True)
    fecha_vencimiento = models.DateField()
    estado = models.CharField(max_length=20, choices=ESTADO_PAGO_CHOICES, default='Pendiente')

    def __str__(self):
        return f"Pago de {self.cliente.nombre_completo} - S/{self.monto}"

class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.nombre

class Pedido(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    fecha_pedido = models.DateTimeField(auto_now_add=True)
    cantidad = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f'Pedido de {self.producto.nombre} por {self.cliente.nombre_completo}'