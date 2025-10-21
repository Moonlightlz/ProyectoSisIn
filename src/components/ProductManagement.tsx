import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { productService } from '../services/productService';
import { Product, ProductFormData, SHOE_TYPES } from '../types/sales';
import { FaPlus, FaEdit, FaTrash, FaDollarSign, FaArrowLeft } from 'react-icons/fa';
import './ProductManagement.css';

interface ProductManagementProps {
  onBack?: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<ProductFormData>({
    name: '',
    type: 'Caballero',
    pricePerDozen: 0
  });

  // Cargar productos
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

  // Crear producto
  const handleCreateProduct = async () => {
    if (!currentUser) return;
    
    if (!newProduct.name.trim() || newProduct.pricePerDozen <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      setLoading(true);
      await productService.createProduct(newProduct, currentUser.uid);
      
      // Resetear formulario
      setNewProduct({
        name: '',
        type: 'Caballero',
        pricePerDozen: 0
      });
      setShowCreateForm(false);
      
      // Recargar productos
      await loadProducts();
      alert('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creando producto:', error);
      alert('Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  // Editar producto
  const handleEditProduct = async () => {
    if (!editingProduct || !currentUser) return;
    
    if (!newProduct.name.trim() || newProduct.pricePerDozen <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      setLoading(true);
      await productService.updateProduct(editingProduct.id, newProduct);
      
      setEditingProduct(null);
      setNewProduct({
        name: '',
        type: 'Caballero',
        pricePerDozen: 0
      });
      
      await loadProducts();
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando producto:', error);
      alert('Error al actualizar producto');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición
  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      type: product.type,
      pricePerDozen: product.pricePerDozen
    });
    setShowCreateForm(true);
  };

  // Desactivar producto
  const handleDeactivateProduct = async (product: Product) => {
    if (!window.confirm(`¿Estás seguro de que deseas desactivar "${product.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await productService.deactivateProduct(product.id);
      await loadProducts();
      alert('Producto desactivado exitosamente');
    } catch (error) {
      console.error('Error desactivando producto:', error);
      alert('Error al desactivar producto');
    } finally {
      setLoading(false);
    }
  };

  // Crear productos por defecto
  const handleCreateDefaultProducts = async () => {
    if (!currentUser) return;
    
    if (!window.confirm('¿Crear productos por defecto? (6 tipos de calzado)')) {
      return;
    }

    try {
      setLoading(true);
      await productService.createDefaultProducts(currentUser.uid);
      await loadProducts();
      alert('Productos por defecto creados exitosamente');
    } catch (error) {
      console.error('Error creando productos por defecto:', error);
      alert('Error al crear productos por defecto');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar formulario
  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      type: 'Caballero',
      pricePerDozen: 0
    });
  };

  return (
    <div className="product-management">
      <div className="product-header">
        <div className="header-title">
          {onBack && (
            <button 
              className="btn btn-back"
              onClick={onBack}
              disabled={loading}
            >
              <FaArrowLeft /> Volver al Dashboard
            </button>
          )}
          <h2><FaDollarSign /> Gestión de Productos</h2>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
            disabled={loading}
          >
            <FaPlus /> Nuevo Producto
          </button>
          {products.length === 0 && (
            <button 
              className="btn btn-secondary"
              onClick={handleCreateDefaultProducts}
              disabled={loading}
            >
              🏗️ Crear Productos por Defecto
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      )}

      {/* Formulario crear/editar producto */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
              </h3>
              <button onClick={cancelForm}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Botas de Cuero Premium"
                />
              </div>
              <div className="form-group">
                <label>Tipo de Calzado</label>
                <select
                  value={newProduct.type}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  {SHOE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Precio por Docena (S/)</label>
                <input
                  type="number"
                  value={newProduct.pricePerDozen}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, pricePerDozen: Number(e.target.value) }))}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={cancelForm}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={editingProduct ? handleEditProduct : handleCreateProduct}
                disabled={loading}
              >
                {editingProduct ? 'Actualizar' : 'Crear'} Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-header">
              <h4>{product.name}</h4>
              <span className={`product-type type-${product.type.toLowerCase()}`}>
                {product.type}
              </span>
            </div>
            <div className="product-price">
              <strong>S/ {product.pricePerDozen.toFixed(2)}</strong>
              <span>por docena</span>
            </div>
            <div className="product-actions">
              <button 
                className="btn btn-sm btn-secondary"
                onClick={() => startEdit(product)}
                disabled={loading}
              >
                <FaEdit /> Editar
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleDeactivateProduct(product)}
                disabled={loading}
              >
                <FaTrash /> Desactivar
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="empty-state">
          <FaDollarSign size={48} />
          <h3>No hay productos registrados</h3>
          <p>Crea productos para poder realizar ventas</p>
          <button 
            className="btn btn-primary"
            onClick={handleCreateDefaultProducts}
          >
            🏗️ Crear Productos por Defecto
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;