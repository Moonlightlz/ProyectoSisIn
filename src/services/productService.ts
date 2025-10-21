import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, ProductFormData } from '../types/sales';

class ProductService {
  private collectionName = 'products';

  // Crear producto
  async createProduct(productData: ProductFormData, userId: string): Promise<string> {
    try {
      console.log('🆕 Creando producto:', productData);
      
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...productData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
        isActive: true
      });

      console.log('✅ Producto creado con ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando producto:', error);
      throw error;
    }
  }

  // Obtener todos los productos activos
  async getAllProducts(): Promise<Product[]> {
    try {
      console.log('📦 Obteniendo todos los productos...');
      
      // Obtener todos los productos sin filtros complejos para evitar índices
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const products: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filtrar en JavaScript para productos activos
        if (data.isActive === true) {
          products.push({
            id: doc.id,
            name: data.name,
            type: data.type,
            pricePerDozen: data.pricePerDozen,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            createdBy: data.createdBy,
            isActive: data.isActive
          });
        }
      });

      // Ordenar por nombre en JavaScript
      products.sort((a, b) => a.name.localeCompare(b.name));

      console.log('📦 Productos obtenidos:', products.length);
      return products;
    } catch (error) {
      console.error('❌ Error obteniendo productos:', error);
      throw error;
    }
  }

  // Obtener productos por tipo
  async getProductsByType(type: string): Promise<Product[]> {
    try {
      console.log('🔍 Obteniendo productos por tipo:', type);
      
      // Obtener todos los productos y filtrar en JavaScript
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const products: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filtrar por tipo y estado activo en JavaScript
        if (data.type === type && data.isActive === true) {
          products.push({
            id: doc.id,
            name: data.name,
            type: data.type,
            pricePerDozen: data.pricePerDozen,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            createdBy: data.createdBy,
            isActive: data.isActive
          });
        }
      });

      // Ordenar por nombre en JavaScript
      products.sort((a, b) => a.name.localeCompare(b.name));

      console.log('🔍 Productos encontrados:', products.length);
      return products;
    } catch (error) {
      console.error('❌ Error obteniendo productos por tipo:', error);
      throw error;
    }
  }

  // Actualizar producto
  async updateProduct(productId: string, updates: Partial<ProductFormData>): Promise<void> {
    try {
      console.log('📝 Actualizando producto:', productId, updates);
      
      const productRef = doc(db, this.collectionName, productId);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Producto actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando producto:', error);
      throw error;
    }
  }

  // Desactivar producto (soft delete)
  async deactivateProduct(productId: string): Promise<void> {
    try {
      console.log('🗑️ Desactivando producto:', productId);
      
      const productRef = doc(db, this.collectionName, productId);
      await updateDoc(productRef, {
        isActive: false,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Producto desactivado exitosamente');
    } catch (error) {
      console.error('❌ Error desactivando producto:', error);
      throw error;
    }
  }

  // Crear productos por defecto
  async createDefaultProducts(userId: string): Promise<void> {
    const defaultProducts: ProductFormData[] = [
      { name: 'Botas de Cuero Clásicas', type: 'Caballero', pricePerDozen: 540.00 },
      { name: 'Zapatos de Tacón Elegantes', type: 'Dama', pricePerDozen: 480.00 },
      { name: 'Zapatillas Escolares', type: 'Niño', pricePerDozen: 300.00 },
      { name: 'Sandalias de Verano', type: 'Niña', pricePerDozen: 240.00 },
      { name: 'Zapatillas Deportivas', type: 'Deportivo', pricePerDozen: 660.00 },
      { name: 'Mocasines Casuales', type: 'Unisex', pricePerDozen: 420.00 }
    ];

    try {
      console.log('🏗️ Creando productos por defecto...');
      
      for (const product of defaultProducts) {
        await this.createProduct(product, userId);
      }
      
      console.log('✅ Productos por defecto creados exitosamente');
    } catch (error) {
      console.error('❌ Error creando productos por defecto:', error);
      throw error;
    }
  }
}

export const productService = new ProductService();