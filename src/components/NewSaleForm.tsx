import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import { Product, SaleFormData, SaleProduct, SALE_STATUSES } from '../types/sales';
import { FaPlus, FaTrash, FaShoppingCart, FaArrowLeft, FaCalculator } from 'react-icons/fa';
import './NewSaleForm.css';

interface NewSaleFormProps {
  onBack: () => void;
  onSaleCreated: () => void;
}

const NewSaleForm: React.FC<NewSaleFormProps> = ({ onBack, onSaleCreated }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Datos del formulario
  const [saleData, setSaleData] = useState<SaleFormData>({
    distributor: { name: '', id: '' },
    client: { name: '', id: '', address: '', phone: '' },
    products: [],
    notes: '',
    status: 'Pendiente'
  });

  // Producto temporal para agregar
  const [tempProduct, setTempProduct] = useState({
    productId: '',
    quantity: 12, // Mínimo una docena
    sizes: ''
  });

  // Cargar productos disponibles
  const loadProducts = async () => {
    try {
      setLoading(true);
      const productList = await productService.getAllProducts();
      setProducts(productList);
    } catch (error) {
      console.error('Error cargando productos:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Calcular docenas y subtotal
  const calculateProductData = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return { dozens: 0, subtotal: 0 };
    
    const dozens = Math.floor(quantity / 12);
    const subtotal = dozens * product.pricePerDozen;
    
    return { dozens, subtotal };
  };

  // Agregar producto a la venta
  const handleAddProduct = () => {
    if (!tempProduct.productId || tempProduct.quantity < 12 || !tempProduct.sizes.trim()) {
      alert('Por favor completa todos los campos del producto. La cantidad mínima es 12 pares (1 docena).');
      return;
    }

    const product = products.find(p => p.id === tempProduct.productId);
    if (!product) {
      alert('Producto no encontrado');
      return;
    }

    // Verificar si el producto ya está en la lista
    const existingProductIndex = saleData.products.findIndex(
      p => p.productId === tempProduct.productId && p.sizes === tempProduct.sizes.trim()
    );

    const { dozens, subtotal } = calculateProductData(tempProduct.productId, tempProduct.quantity);

    const newSaleProduct: SaleProduct = {
      productId: tempProduct.productId,
      productName: product.name,
      productType: product.type,
      quantity: tempProduct.quantity,
      dozens,
      pricePerDozen: product.pricePerDozen,
      subtotal,
      sizes: tempProduct.sizes.trim()
    };

    if (existingProductIndex >= 0) {
      // Actualizar producto existente
      const updatedProducts = [...saleData.products];
      const existingProduct = updatedProducts[existingProductIndex];
      updatedProducts[existingProductIndex] = {
        ...existingProduct,
        quantity: existingProduct.quantity + tempProduct.quantity,
        dozens: Math.floor((existingProduct.quantity + tempProduct.quantity) / 12),
        subtotal: Math.floor((existingProduct.quantity + tempProduct.quantity) / 12) * product.pricePerDozen
      };
      
      setSaleData(prev => ({ ...prev, products: updatedProducts }));
    } else {
      // Agregar nuevo producto
      setSaleData(prev => ({
        ...prev,
        products: [...prev.products, newSaleProduct]
      }));
    }

    // Limpiar formulario temporal
    setTempProduct({
      productId: '',
      quantity: 12,
      sizes: ''
    });
  };

  // Eliminar producto de la venta
  const handleRemoveProduct = (index: number) => {
    setSaleData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  // Calcular totales
  const calculateTotals = () => {
    const totalQuantity = saleData.products.reduce((sum, p) => sum + p.quantity, 0);
    const totalDozens = saleData.products.reduce((sum, p) => sum + p.dozens, 0);
    const totalAmount = saleData.products.reduce((sum, p) => sum + p.subtotal, 0);
    
    return { totalQuantity, totalDozens, totalAmount };
  };

  // Crear venta
  const handleCreateSale = async () => {
    if (!currentUser) return;

    // Validaciones
    if (!saleData.distributor.name.trim() || !saleData.distributor.id.trim()) {
      alert('Por favor completa los datos del distribuidor');
      return;
    }

    if (!saleData.client.name.trim() || !saleData.client.id.trim()) {
      alert('Por favor completa los datos del cliente');
      return;
    }

    if (saleData.products.length === 0) {
      alert('Agrega al menos un producto a la venta');
      return;
    }

    try {
      setLoading(true);
      await saleService.createSale(saleData, currentUser.uid);
      
      alert('Venta creada exitosamente');
      onSaleCreated();
    } catch (error) {
      console.error('Error creando venta:', error);
      alert('Error al crear la venta');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="new-sale-form">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Procesando...</p>
        </div>
      )}

      <div className="page-header">
        <div className="header-title">
          <button 
            className="btn btn-back"
            onClick={onBack}
            disabled={loading}
          >
            <FaArrowLeft /> Volver al Dashboard
          </button>
          <h2><FaShoppingCart /> Nueva Venta</h2>
        </div>
      </div>

      <div className="form-container">
        {/* Información del Distribuidor */}
        <div className="form-section">
          <h3>👤 Información del Distribuidor</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre del Distribuidor *</label>
              <input
                type="text"
                value={saleData.distributor.name}
                onChange={(e) => setSaleData(prev => ({
                  ...prev,
                  distributor: { ...prev.distributor, name: e.target.value }
                }))}
                placeholder="Ej: Carlos Mendoza"
                required
              />
            </div>
            <div className="form-group">
              <label>ID del Distribuidor *</label>
              <input
                type="text"
                value={saleData.distributor.id}
                onChange={(e) => setSaleData(prev => ({
                  ...prev,
                  distributor: { ...prev.distributor, id: e.target.value }
                }))}
                placeholder="Ej: DIST-001"
                required
              />
            </div>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="form-section">
          <h3>🏪 Información del Cliente</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre del Cliente *</label>
              <input
                type="text"
                value={saleData.client.name}
                onChange={(e) => setSaleData(prev => ({
                  ...prev,
                  client: { ...prev.client, name: e.target.value }
                }))}
                placeholder="Ej: Zapatería El Gran Paso"
                required
              />
            </div>
            <div className="form-group">
              <label>ID del Cliente *</label>
              <input
                type="text"
                value={saleData.client.id}
                onChange={(e) => setSaleData(prev => ({
                  ...prev,
                  client: { ...prev.client, id: e.target.value }
                }))}
                placeholder="Ej: CLI-001"
                required
              />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={saleData.client.address}
                onChange={(e) => setSaleData(prev => ({
                  ...prev,
                  client: { ...prev.client, address: e.target.value }
                }))}
                placeholder="Ej: Av. Principal 123"
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={saleData.client.phone}
                onChange={(e) => setSaleData(prev => ({
                  ...prev,
                  client: { ...prev.client, phone: e.target.value }
                }))}
                placeholder="Ej: 987654321"
              />
            </div>
          </div>
        </div>

        {/* Agregar Productos */}
        <div className="form-section">
          <h3>📦 Agregar Productos</h3>
          {products.length > 0 ? (
            <div className="add-product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Producto *</label>
                  <select
                    value={tempProduct.productId}
                    onChange={(e) => setTempProduct(prev => ({ ...prev, productId: e.target.value }))}
                    required
                  >
                    <option value="">Seleccionar producto...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.type} (S/ {product.pricePerDozen}/docena)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Cantidad (Pares) *</label>
                  <input
                    type="number"
                    value={tempProduct.quantity}
                    onChange={(e) => setTempProduct(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    min="12"
                    step="12"
                    placeholder="12"
                    required
                  />
                  <small>Mínimo 12 pares (1 docena)</small>
                </div>
                <div className="form-group">
                  <label>Tallas Incluidas *</label>
                  <input
                    type="text"
                    value={tempProduct.sizes}
                    onChange={(e) => setTempProduct(prev => ({ ...prev, sizes: e.target.value }))}
                    placeholder="Ej: 38, 39, 40, 41"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Docenas</label>
                  <div className="calculated-field">
                    <FaCalculator />
                    {tempProduct.productId && tempProduct.quantity >= 12 
                      ? Math.floor(tempProduct.quantity / 12)
                      : 0
                    } docenas
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleAddProduct}
                disabled={loading}
              >
                <FaPlus /> Agregar Producto
              </button>
            </div>
          ) : (
            <div className="no-products">
              <p>No hay productos disponibles. Primero crea productos en la gestión de productos.</p>
            </div>
          )}
        </div>

        {/* Lista de Productos Agregados */}
        {saleData.products.length > 0 && (
          <div className="form-section">
            <h3>🛍️ Productos en la Venta</h3>
            <div className="products-table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Tallas</th>
                    <th>Cantidad</th>
                    <th>Docenas</th>
                    <th>Precio/Docena</th>
                    <th>Subtotal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {saleData.products.map((product, index) => (
                    <tr key={index}>
                      <td>{product.productName}</td>
                      <td>
                        <span className={`product-type type-${product.productType.toLowerCase()}`}>
                          {product.productType}
                        </span>
                      </td>
                      <td>{product.sizes}</td>
                      <td>{product.quantity}</td>
                      <td>{product.dozens}</td>
                      <td>S/ {product.pricePerDozen.toFixed(2)}</td>
                      <td>S/ {product.subtotal.toFixed(2)}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveProduct(index)}
                          disabled={loading}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="sale-totals">
              <div className="totals-grid">
                <div className="total-item">
                  <span>Total Pares:</span>
                  <strong>{totals.totalQuantity}</strong>
                </div>
                <div className="total-item">
                  <span>Total Docenas:</span>
                  <strong>{totals.totalDozens}</strong>
                </div>
                <div className="total-item highlight">
                  <span>Monto Total:</span>
                  <strong>S/ {totals.totalAmount.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información Adicional */}
        <div className="form-section">
          <h3>📋 Información Adicional</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Estado de la Venta</label>
              <select
                value={saleData.status}
                onChange={(e) => setSaleData(prev => ({ ...prev, status: e.target.value as any }))}
              >
                {SALE_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Notas</label>
              <textarea
                value={saleData.notes}
                onChange={(e) => setSaleData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observaciones adicionales sobre la venta..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="form-actions">
          <button 
            className="btn btn-secondary"
            onClick={onBack}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary btn-large"
            onClick={handleCreateSale}
            disabled={loading || saleData.products.length === 0}
          >
            <FaShoppingCart /> Crear Venta
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSaleForm;