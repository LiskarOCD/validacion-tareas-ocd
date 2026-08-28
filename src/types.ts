export type ValidationStatus =
  | 'VALIDADA'
  | 'INVALIDADA'
  | 'PENDIENTE_AUDITORIA';

export type AppealStatus =
  | 'SIN_APELAR'
  | 'EN_REVISION'
  | 'APROBADA'
  | 'RECHAZADA';

export type UserRole =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'VENDEDOR';

export interface TaskRecord {
  id: string;

  importBatchId?: string;
  importDate: string;

  fechaTarea: string;

  vendedor: string;
  codigoVendedor?: string;

  supervisor: string;

  ruta: string;

  codigoPDV: string;
  nombrePDV: string;
  direccionPDV?: string;

  categoriaTarea: string;
  nombreTarea: string;

  /*
   * Estado original informado por el Excel.
   */
  estadoValidacion: ValidationStatus;

  /*
   * Datos originales.
   */
  completada: boolean;
  justificada: boolean;
  visitaValida?: boolean;

  motivoInvalidacion?: string;
  detalleInvalidacion?: string;

  urlFotoOriginal?: string;

  puntajeBase: number;
  puntajeObtenido: number;

  /*
   * Apelación del vendedor.
   */
  estadoApelacion: AppealStatus;

  fechaApelacion?: string;

  motivoApelacion?: string;

  evidenciaApelacionUrl?: string;

  evidenciaApelacionBase64?: string;

  comentariosVendedor?: string;

  /*
   * Dictamen supervisor.
   */
  fechaResolucion?: string;

  supervisorResolutor?: string;

  dictamenResolucion?:
    | 'APROBADA'
    | 'RECHAZADA';

  comentarioResolucion?: string;

  puntajeAjustado?: number;

  /*
   * Auditoría.
   */
  updatedAt?: string;
}

export interface ImportBatch {
  id: string;

  fileName: string;

  importDate: string;

  totalRows: number;

  insertedRows: number;

  updatedRows: number;

  skippedRows: number;
}

export interface UserProfile {
  id: string;

  email: string;

  nombre: string;

  role: UserRole;

  vendedor?: string;

  supervisor?: string;

  activo: boolean;
}

export interface FilterState {
  searchTerm: string;

  vendedor: string;

  supervisor: string;

  ruta: string;

  categoria: string;

  estadoValidacion: string;

  estadoApelacion: string;

  fechaDesde: string;

  fechaHasta: string;
}
