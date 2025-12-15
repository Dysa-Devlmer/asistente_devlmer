/**
 * Catálogo Service - Bootstrap API v2.0
 *
 * Especificación: docs/ITERACION2-BOOTSTRAP-CATALOGO.md
 *
 * Responsabilidades:
 * - Validar sucursal_id
 * - Validar paginación (page >= 1, limit <= 100)
 * - Delegar a repository
 * - Envolver respuesta con bootstrap_version y generated_at
 */

import { CatalogoRepository } from '../repositories/catalogo.repository';
import { CatalogoResponseDataDto } from '../dto/catalogo.dto';
import { BootstrapResponseWrapper } from '../dto/bootstrap-response.dto';
import { PAGINATION_CONSTANTS } from '../dto/pagination.dto';

export class CatalogoService {
  private catalogoRepository: CatalogoRepository;

  constructor(db: any) {
    this.catalogoRepository = new CatalogoRepository(db);
  }

  /**
   * Obtener catálogo con paginación
   *
   * @param sucursalId - UUID de sucursal
   * @param page - Número de página (default: 1, min: 1)
   * @param limit - Registros por página (default: 50, max: 100)
   * @returns Response wrapper con catálogo paginado
   * @throws Error si sucursal no existe
   * @throws Error si validaciones de paginación fallan
   */
  async getCatalogo(
    sucursalId: string,
    page: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
    limit: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT
  ): Promise<BootstrapResponseWrapper<CatalogoResponseDataDto>> {
    // 1. Validar paginación
    this.validatePagination(page, limit);

    // 2. Verificar que sucursal existe
    const sucursalExists = await this.catalogoRepository.sucursalExists(sucursalId);
    if (!sucursalExists) {
      throw new Error(`Sucursal con ID ${sucursalId} no encontrada o inactiva`);
    }

    // 3. Obtener catálogo desde repository
    const catalogoData = await this.catalogoRepository.getCatalogo(sucursalId, page, limit);

    // 4. Construir response data
    const responseData: CatalogoResponseDataDto = {
      sucursal_id: sucursalId,
      pagination: catalogoData.pagination,
      catalogo: {
        productos: catalogoData.productos,
        categorias: catalogoData.categorias,
        impuestos: catalogoData.impuestos,
        formas_pago: catalogoData.formas_pago,
      },
    };

    // 5. Envolver con wrapper estándar
    return new BootstrapResponseWrapper(responseData);
  }

  /**
   * Validar parámetros de paginación según especificación
   *
   * Reglas:
   * - page >= 1
   * - limit >= 1
   * - limit <= 100
   */
  private validatePagination(page: number, limit: number): void {
    if (page < 1) {
      throw new Error('page debe ser >= 1');
    }

    if (limit < 1) {
      throw new Error('limit debe ser >= 1');
    }

    if (limit > PAGINATION_CONSTANTS.MAX_LIMIT) {
      throw new Error('limit max es 100');
    }
  }
}
