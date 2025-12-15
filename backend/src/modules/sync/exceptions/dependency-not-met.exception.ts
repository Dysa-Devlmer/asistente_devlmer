/**
 * Excepción lanzada cuando un evento tiene dependencias (FK) que no existen todavía
 *
 * NO es un error fatal - el evento será marcado como DEPENDENCIA_PENDIENTE
 * y se reprocesará cuando lleguen las dependencias faltantes
 */
export class DependencyNotMetException extends Error {
  constructor(
    public readonly missingDependencies: string[],
    message?: string,
  ) {
    super(message || `Dependencias faltantes: ${missingDependencies.join(', ')}`);
    this.name = 'DependencyNotMetException';
  }
}
