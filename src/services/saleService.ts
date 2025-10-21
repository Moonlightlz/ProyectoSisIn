import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Sale, SaleFormData, SaleProduct } from '../types/sales';

class SaleService {
  private collectionName = 'sales';

  // Generar número de venta único
  private generateSaleNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `VZ-${year}${month}${random}`;
  }

  // Crear venta
  async createSale(saleData: SaleFormData, userId: string): Promise<string> {
    try {
      console.log('🆕 Creando venta:', saleData);
      
      // Calcular totales
      const totalQuantity = saleData.products.reduce((sum, p) => sum + p.quantity, 0);
      const totalDozens = saleData.products.reduce((sum, p) => sum + p.dozens, 0);
      const totalAmount = saleData.products.reduce((sum, p) => sum + p.subtotal, 0);
      
      const saleNumber = this.generateSaleNumber();
      
      const docRef = await addDoc(collection(db, this.collectionName), {
        saleNumber,
        date: Timestamp.now(),
        status: saleData.status,
        distributor: saleData.distributor,
        client: saleData.client,
        products: saleData.products,
        totalQuantity,
        totalDozens,
        totalAmount,
        notes: saleData.notes || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId
      });

      console.log('✅ Venta creada con ID:', docRef.id, 'Número:', saleNumber);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando venta:', error);
      throw error;
    }
  }

  // Obtener todas las ventas
  async getAllSales(): Promise<Sale[]> {
    try {
      console.log('💰 Obteniendo todas las ventas...');
      
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sales: Sale[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          saleNumber: data.saleNumber,
          date: data.date?.toDate() || new Date(),
          status: data.status,
          distributor: data.distributor,
          client: data.client,
          products: data.products,
          totalQuantity: data.totalQuantity,
          totalDozens: data.totalDozens,
          totalAmount: data.totalAmount,
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy
        });
      });

      console.log('💰 Ventas obtenidas:', sales.length);
      return sales;
    } catch (error) {
      console.error('❌ Error obteniendo ventas:', error);
      throw error;
    }
  }

  // Obtener ventas recientes (últimas 10)
  async getRecentSales(): Promise<Sale[]> {
    try {
      console.log('📈 Obteniendo ventas recientes...');
      
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const sales: Sale[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          saleNumber: data.saleNumber,
          date: data.date?.toDate() || new Date(),
          status: data.status,
          distributor: data.distributor,
          client: data.client,
          products: data.products,
          totalQuantity: data.totalQuantity,
          totalDozens: data.totalDozens,
          totalAmount: data.totalAmount,
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy
        });
      });

      console.log('📈 Ventas recientes obtenidas:', sales.length);
      return sales;
    } catch (error) {
      console.error('❌ Error obteniendo ventas recientes:', error);
      throw error;
    }
  }

  // Obtener ventas por período
  async getSalesByPeriod(startDate: Date, endDate: Date): Promise<Sale[]> {
    try {
      console.log('📅 Obteniendo ventas por período:', startDate, endDate);
      
      const q = query(
        collection(db, this.collectionName),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sales: Sale[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          saleNumber: data.saleNumber,
          date: data.date?.toDate() || new Date(),
          status: data.status,
          distributor: data.distributor,
          client: data.client,
          products: data.products,
          totalQuantity: data.totalQuantity,
          totalDozens: data.totalDozens,
          totalAmount: data.totalAmount,
          notes: data.notes,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy
        });
      });

      console.log('📅 Ventas por período obtenidas:', sales.length);
      return sales;
    } catch (error) {
      console.error('❌ Error obteniendo ventas por período:', error);
      throw error;
    }
  }

  // Actualizar estado de venta
  async updateSaleStatus(saleId: string, status: Sale['status']): Promise<void> {
    try {
      console.log('📝 Actualizando estado de venta:', saleId, status);
      
      const saleRef = doc(db, this.collectionName, saleId);
      await updateDoc(saleRef, {
        status,
        updatedAt: Timestamp.now()
      });

      console.log('✅ Estado de venta actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error actualizando estado de venta:', error);
      throw error;
    }
  }

  // Crear datos de prueba para el último mes
  async createTestSalesData(userId: string): Promise<void> {
    const testSales: (Omit<SaleFormData, 'products'> & { products: Omit<SaleProduct, 'subtotal'>[] })[] = [
      {
        distributor: { name: 'Carlos Mendoza', id: 'DIST-001' },
        client: { name: 'Zapatería El Gran Paso', id: 'CLI-001', address: 'Av. Principal 123', phone: '987654321' },
        products: [
          { productId: 'prod1', productName: 'Botas de Cuero Clásicas', productType: 'Caballero', quantity: 36, dozens: 3, pricePerDozen: 540, sizes: '40, 41, 42' },
          { productId: 'prod2', productName: 'Zapatos de Tacón Elegantes', productType: 'Dama', quantity: 24, dozens: 2, pricePerDozen: 480, sizes: '37, 38, 39' }
        ],
        status: 'Entregado',
        notes: 'Pedido especial para temporada navideña'
      },
      {
        distributor: { name: 'Ana García', id: 'DIST-002' },
        client: { name: 'Tiendas La Elegancia', id: 'CLI-002', address: 'Centro Comercial Plaza', phone: '976543210' },
        products: [
          { productId: 'prod3', productName: 'Zapatillas Escolares', productType: 'Niño', quantity: 60, dozens: 5, pricePerDozen: 300, sizes: '28, 29, 30, 31' },
          { productId: 'prod4', productName: 'Sandalias de Verano', productType: 'Niña', quantity: 48, dozens: 4, pricePerDozen: 240, sizes: '25, 26, 27' }
        ],
        status: 'Pendiente',
        notes: 'Entrega programada para fin de mes'
      },
      {
        distributor: { name: 'Luis Torres', id: 'DIST-003' },
        client: { name: 'Calzados Rápidos S.A.', id: 'CLI-003', address: 'Zona Industrial Norte', phone: '965432109' },
        products: [
          { productId: 'prod5', productName: 'Zapatillas Deportivas', productType: 'Deportivo', quantity: 72, dozens: 6, pricePerDozen: 660, sizes: '38, 39, 40, 41, 42' }
        ],
        status: 'En_Proceso',
        notes: 'Pedido para cadena de tiendas deportivas'
      }
    ];

    try {
      console.log('🧪 Creando datos de prueba para ventas...');
      
      for (const sale of testSales) {
        // Calcular subtotales
        const saleWithSubtotals: SaleFormData = {
          ...sale,
          products: sale.products.map(product => ({
            ...product,
            subtotal: product.dozens * product.pricePerDozen
          }))
        };
        
        await this.createSale(saleWithSubtotals, userId);
      }
      
      console.log('✅ Datos de prueba para ventas creados exitosamente');
    } catch (error) {
      console.error('❌ Error creando datos de prueba para ventas:', error);
      throw error;
    }
  }
}

export const saleService = new SaleService();