// Servicio de caché en memoria para datos de trabajadores
// Evita consultas repetidas a Firestore almacenando los datos localmente con TTL configurable

import { Worker } from '../types/payroll';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  isValid: boolean;
  itemCount: number;
  lastFetched: Date | null;
  expiresAt: Date | null;
  ttlSeconds: number;
  source: 'cache' | 'firebase' | 'none';
}

// TTL por defecto: 5 minutos (en milisegundos)
const DEFAULT_TTL_MS = 5 * 60 * 1000;

class WorkerCacheService {
  private cache: CacheEntry<Worker[]> | null = null;
  private ttlMs: number;
  private lastSource: 'cache' | 'firebase' | 'none' = 'none';

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  /**
   * Verifica si el caché es válido (existe y no ha expirado)
   */
  isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() < this.cache.expiresAt;
  }

  /**
   * Obtiene los trabajadores del caché si están vigentes.
   * Si el caché ha expirado o no existe, llama a fetchFn para obtener datos frescos.
   * 
   * @param fetchFn - Función que consulta Firestore (workerService.getAllWorkers original)
   * @returns Lista de trabajadores (del caché o de Firebase)
   */
  async getCachedWorkers(fetchFn: () => Promise<Worker[]>): Promise<Worker[]> {
    // Si el caché es válido, retornar directamente
    if (this.isCacheValid() && this.cache) {
      console.log(`[WorkerCache] ✅ Datos servidos desde CACHÉ (${this.cache.data.length} trabajadores, expira en ${Math.round((this.cache.expiresAt - Date.now()) / 1000)}s)`);
      this.lastSource = 'cache';
      return this.cache.data;
    }

    // Si no hay caché válido, consultar Firebase
    console.log('[WorkerCache] 🔄 Caché expirado o vacío, consultando Firebase...');
    const workers = await fetchFn();
    
    // Guardar en caché
    this.cache = {
      data: workers,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.ttlMs,
    };
    
    this.lastSource = 'firebase';
    console.log(`[WorkerCache] 💾 Caché actualizado con ${workers.length} trabajadores (TTL: ${this.ttlMs / 1000}s)`);
    
    return workers;
  }

  /**
   * Invalida el caché manualmente.
   * Útil cuando se crea, edita o elimina un trabajador.
   */
  invalidateCache(): void {
    const hadCache = this.cache !== null;
    this.cache = null;
    this.lastSource = 'none';
    if (hadCache) {
      console.log('[WorkerCache] 🗑️ Caché invalidado manualmente');
    }
  }

  /**
   * Obtiene estadísticas del caché para debugging.
   */
  getCacheStats(): CacheStats {
    return {
      isValid: this.isCacheValid(),
      itemCount: this.cache?.data.length || 0,
      lastFetched: this.cache ? new Date(this.cache.timestamp) : null,
      expiresAt: this.cache ? new Date(this.cache.expiresAt) : null,
      ttlSeconds: this.ttlMs / 1000,
      source: this.lastSource,
    };
  }

  /**
   * Actualiza el TTL del caché (en segundos).
   * El cambio aplica solo a futuros datos guardados.
   */
  setTTL(ttlSeconds: number): void {
    this.ttlMs = ttlSeconds * 1000;
    console.log(`[WorkerCache] ⏱️ TTL actualizado a ${ttlSeconds} segundos`);
  }
}

// Exportar instancia singleton para usar en toda la app
export const workerCacheService = new WorkerCacheService();

// Exportar la clase por si se necesitan múltiples instancias (testing, etc.)
export { WorkerCacheService };
