export type ValidationStatus = 'VALIDADA' | 'INVALIDADA' | 'PENDIENTE_AUDITORIA';

export type AppealStatus = 'SIN_APELAR' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';

export interface TaskRecord {
  id: string;
  importBatchId?: string;
  importDate: string; // ISO date string
  fechaTarea: string; // e.g. "2025-02-20"
  vendedor: string;
  codigoVendedor?: string;
  supervisor: string;
  ruta: string;
  codigoPDV: string;
  nombrePDV: string;
  direccionPDV?: string;
  categoriaTarea: string; // e.g. "Material POP", "Facing / Gondola", "Heladera OCD", "Relevamiento de Precios", "Stock"
  nombreTarea: string;
  estadoValidacion: ValidationStatus;
  motivoInvalidacion?: string;
  detalleInvalidacion?: string;
  urlFotoOriginal?: string;
  puntajeBase: number;
  puntajeObtenido: number;
  
  // Apelación por parte del vendedor
  estadoApelacion: AppealStatus;
  fechaApelacion?: string;
  motivoApelacion?: string;
  evidenciaApelacionUrl?: string;
  evidenciaApelacionBase64?: string;
  comentariosVendedor?: string;
  
  // Resolución por parte del supervisor/auditor
  fechaResolucion?: string;
  supervisorResolutor?: string;
  dictamenResolucion?: 'APROBADA' | 'RECHAZADA';
  comentarioResolucion?: string;
  puntajeAjustado?: number;
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

export interface UserRole {
  role: 'SUPERVISOR' | 'VENDEDOR' | 'AUDITOR';
  selectedVendedor?: string;
  name: string;
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
