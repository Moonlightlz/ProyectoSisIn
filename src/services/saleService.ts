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

  // Crear venta en una fecha específica (para seeding / backfill)
  async createSaleAtDate(saleData: SaleFormData, userId: string, date: Date): Promise<string> {
    try {
      console.log('🆕 Creando venta en fecha específica:', date.toISOString());

      const totalQuantity = saleData.products.reduce((sum, p) => sum + p.quantity, 0);
      const totalDozens = saleData.products.reduce((sum, p) => sum + p.dozens, 0);
      const totalAmount = saleData.products.reduce((sum, p) => sum + p.subtotal, 0);

      const saleNumber = this.generateSaleNumber();

      const when = Timestamp.fromDate(date);

      const docRef = await addDoc(collection(db, this.collectionName), {
        saleNumber,
        date: when,
        status: saleData.status,
        distributor: saleData.distributor,
        client: saleData.client,
        products: saleData.products,
        totalQuantity,
        totalDozens,
        totalAmount,
        notes: saleData.notes || '',
        createdAt: when,
        updatedAt: when,
        createdBy: userId
      });

      console.log('✅ Venta creada (fecha específica) con ID:', docRef.id, 'Número:', saleNumber);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando venta (fecha específica):', error);
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

  // Generar ventas de prueba entre dos fechas, 1 a 5 ventas por día
  async seedSalesBetweenDates(startDate: Date, endDate: Date, userId: string): Promise<number> {
    // Catálogo simple para generar productos coherentes
    const productCatalog = [
      { id: 'prod1', name: 'Botas de Cuero Clásicas', type: 'Caballero', pricePerDozen: 540, sizes: '40,41,42' },
      { id: 'prod2', name: 'Zapatos de Tacón Elegantes', type: 'Dama', pricePerDozen: 480, sizes: '37,38,39' },
      { id: 'prod3', name: 'Zapatillas Escolares', type: 'Niño', pricePerDozen: 300, sizes: '28,29,30,31' },
      { id: 'prod4', name: 'Sandalias de Verano', type: 'Niña', pricePerDozen: 240, sizes: '25,26,27' },
      { id: 'prod5', name: 'Zapatillas Deportivas', type: 'Deportivo', pricePerDozen: 660, sizes: '38,39,40,41,42' },
      { id: 'prod6', name: 'Mocasines Urbanos', type: 'Unisex', pricePerDozen: 420, sizes: '39,40,41' },
    ];
    const distributors = [
      { name: 'Carlos Mendoza', id: 'DIST-001' },
      { name: 'Ana García', id: 'DIST-002' },
      { name: 'Luis Torres', id: 'DIST-003' },
      { name: 'María Rojas', id: 'DIST-004' },
    ];
    const clients = [
      { name: 'Zapatería El Gran Paso', id: 'CLI-001', address: 'Av. Principal 123', phone: '987654321' },
      { name: 'Tiendas La Elegancia', id: 'CLI-002', address: 'Centro Comercial Plaza', phone: '976543210' },
      { name: 'Calzados Rápidos S.A.', id: 'CLI-003', address: 'Zona Industrial Norte', phone: '965432109' },
      { name: 'Deportes Max', id: 'CLI-004', address: 'Av. Los Héroes 456', phone: '954123789' },
    ];
    const statuses: Sale['status'][] = ['Pendiente', 'En_Proceso', 'Entregado'];

    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const choice = <T,>(arr: T[]) => arr[randInt(0, arr.length - 1)];

    let created = 0;
    const day = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (day <= end) {
      const salesToday = randInt(1, 5);

      for (let i = 0; i < salesToday; i++) {
        // Entre 1 y 3 productos por venta
        const productCount = randInt(1, 3);
        const chosen = [...productCatalog].sort(() => 0.5 - Math.random()).slice(0, productCount);
        const products = chosen.map(p => {
          const dozens = randInt(1, 6); // 1 a 6 docenas
          const quantity = dozens * 12; // pares
          return {
            productId: p.id,
            productName: p.name,
            productType: p.type,
            quantity,
            dozens,
            pricePerDozen: p.pricePerDozen,
            subtotal: dozens * p.pricePerDozen,
            sizes: p.sizes,
          } as SaleProduct;
        });

        const distributor = choice(distributors);
        const client = choice(clients);
        const status = choice(statuses);
        const notes = 'Venta generada automáticamente para pruebas';

        // Hora aleatoria del día (entre 9:00 y 18:00)
        const saleDate = new Date(day);
        saleDate.setHours(randInt(9, 18), randInt(0, 59), randInt(0, 59), 0);

        const formData: SaleFormData = {
          distributor,
          client,
          products,
          notes,
          status,
        };

        await this.createSaleAtDate(formData, userId, saleDate);
        created += 1;
      }

      // siguiente día
      day.setDate(day.getDate() + 1);
    }

    console.log(`✅ Ventas de prueba generadas: ${created} entre`, startDate, endDate);
    return created;
  }
}

export const saleService = new SaleService();