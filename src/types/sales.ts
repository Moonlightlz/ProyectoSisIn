// Tipos para el sistema de ventas
export interface Product {
  id: string;
  name: string;
  type: 'Caballero' | 'Dama' | 'Niño' | 'Niña' | 'Unisex' | 'Deportivo';
  pricePerDozen: number; // Precio por docena
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface SaleProduct {
  productId: string;
  productName: string;
  productType: string;
  quantity: number; // Cantidad en pares
  dozens: number; // Cantidad en docenas (calculado)
  pricePerDozen: number;
  subtotal: number;
  sizes: string; // Tallas incluidas
}

export interface Sale {
  id: string;
  saleNumber: string; // VZ-XXXX
  date: Date;
  status: 'Pendiente' | 'Entregado' | 'Cancelado' | 'En_Proceso';
  distributor: {
    name: string;
    id: string;
  };
  client: {
    name: string;
    id: string;
    address?: string;
    phone?: string;
  };
  products: SaleProduct[];
  totalQuantity: number; // Total en pares
  totalDozens: number; // Total en docenas
  totalAmount: number; // Monto total
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface SaleFormData {
  distributor: {
    name: string;
    id: string;
  };
  client: {
    name: string;
    id: string;
    address?: string;
    phone?: string;
  };
  products: SaleProduct[];
  notes?: string;
  status: 'Pendiente' | 'Entregado' | 'Cancelado' | 'En_Proceso';
}

export interface ProductFormData {
  name: string;
  type: 'Caballero' | 'Dama' | 'Niño' | 'Niña' | 'Unisex' | 'Deportivo';
  pricePerDozen: number;
}

// Tipos de calzado predefinidos
export const SHOE_TYPES = [
  'Caballero',
  'Dama', 
  'Niño',
  'Niña',
  'Unisex',
  'Deportivo'
] as const;

export const SALE_STATUSES = [
  'Pendiente',
  'En_Proceso', 
  'Entregado',
  'Cancelado'
] as const;