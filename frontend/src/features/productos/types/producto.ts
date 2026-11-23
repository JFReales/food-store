import type { Categoria } from '../../categorias/types/categoria';

// ProductoRead del backend.
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  stock: number;
  disponible: boolean;
  categoria_id: number;
  activo: boolean;
  categoria: Categoria;
}

// ProductosPaginados
export interface ProductosPaginados {
  total: number;
  items: Producto[];
}

// ProductoCreate / ProductoUpdate
export interface ProductoInput {
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  stock: number;
  disponible: boolean;
  categoria_id: number;
}

// ProductoStockUpdate
export interface StockInput {
  stock: number;
  disponible: boolean;
}

// Parámetros de GET /productos
export interface FiltrosProductos {
  skip: number;
  limit: number;
  search?: string;
  categoria_id?: number;
  disponible?: boolean;
}
