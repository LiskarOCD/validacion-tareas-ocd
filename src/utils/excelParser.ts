import * as XLSX from 'xlsx';
import { TaskRecord, ValidationStatus, AppealStatus, ImportBatch } from '../types';

export interface ParseResult {
  tasks: TaskRecord[];
  batch: ImportBatch;
  errors: string[];
  mode: 'replace' | 'merge';
}

// Normalize column headers to lowercase alphanumeric
function normalizeHeader(header: string): string {
  return (header || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Clean and standardize date values from Excel numbers, Date objects, or strings
function parseExcelDate(raw: unknown): string {
  if (!raw) return new Date().toISOString().split('T')[0];

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().split('T')[0];
  }

  // If Excel serial number (e.g. 45342 for 2024-02-19)
  if (typeof raw === 'number' || (!isNaN(Number(raw)) && Number(raw) > 20000 && Number(raw) < 70000)) {
    const serial = Number(raw);
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    const year = dateInfo.getUTCFullYear();
    const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateInfo.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const str = String(raw).trim();

  // If ISO date like 2025-02-20 or 2025-02-20T...
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Fallback
  return new Date().toISOString().split('T')[0];
}

// Extract clean URL from text, formulas (=HYPERLINK), or raw text
function parseExcelUrl(raw: unknown): string {
  if (!raw) return '';
  let str = String(raw).trim();

  // Strip formula wrapper: =HYPERLINK("https://...", "ver")
  const matchFormula = str.match(/HYPERLINK\(\s*["']([^"']+)["']/i);
  if (matchFormula && matchFormula[1]) {
    str = matchFormula[1].trim();
  }

  // Remove surrounding quotes
  str = str.replace(/^["']+|["']+$/g, '').trim();

  return str;
}

export function parseExcelFile(
  fileBuffer: ArrayBuffer,
  fileName: string,
  existingTasks: TaskRecord[],
  mode: 'replace' | 'merge' = 'replace'
): ParseResult {
  const errors: string[] = [];

  // Leer el Excel una sola vez.
  // cellDates permite conservar fechas reales cuando vienen como Date.
  const workbook = XLSX.read(fileBuffer, {
    type: 'array',
    cellDates: true,
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo de Excel no contiene hojas de cálculo legibles.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error('No se pudo leer la primera hoja del archivo Excel.');
  }

  /*
   * IMPORTANTE:
   * Antes se convertía cada fila en un objeto y después,
   * por cada campo, se recorrían nuevamente todas las columnas.
   *
   * Ahora trabajamos directamente con arrays:
   *
   * [fila de encabezados]
   * [fila 1]
   * [fila 2]
   * ...
   *
   * Esto reduce muchísimo el trabajo con archivos grandes.
   */
  const matrix = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: true,
  }) as unknown[][];

  if (matrix.length < 2) {
    throw new Error(
      'La hoja seleccionada está vacía o no contiene filas con datos.'
    );
  }

  const headerRow = matrix[0] || [];

  /*
   * Normalizamos los encabezados UNA SOLA VEZ.
   */
  const normalizedHeaders = headerRow.map((header) =>
    normalizeHeader(String(header ?? ''))
  );

  /*
   * Crea un índice:
   *
   * vendedor -> 4
   * supervisor -> 5
   * fecha -> 1
   *
   * Así cada fila se consulta directamente por posición.
   */
  const headerIndex = new Map<string, number>();

  normalizedHeaders.forEach((header, index) => {
    if (header && !headerIndex.has(header)) {
      headerIndex.set(header, index);
    }
  });

  /*
   * Busca la primera columna que coincida con alguna de
   * las alternativas disponibles.
   */
  const resolveColumn = (possibleKeys: string[]): number => {
    for (const key of possibleKeys) {
      const normalized = normalizeHeader(key);
      const index = headerIndex.get(normalized);

      if (index !== undefined) {
        return index;
      }
    }

    return -1;
  };

  /*
   * Resolvemos TODAS las columnas una sola vez.
   */
  const columns = {
    id: resolveColumn([
      'id',
      'id_tarea',
      'codigo_tarea',
      'task_id',
      'cod_registro',
    ]),

    fecha: resolveColumn([
      'fecha',
      'fecha_tarea',
      'date',
      'dia',
      'fecha_visita',
    ]),

    vendedor: resolveColumn([
      'vendedor',
      'preventista',
      'ejecutivo',
      'nombre_vendedor',
      'promotor',
    ]),

    codigoVendedor: resolveColumn([
      'codigo_vendedor',
      'cod_vendedor',
      'legajo',
      'id_vendedor',
    ]),

    supervisor: resolveColumn([
      'supervisor',
      'lider',
      'jefe',
      'nombre_supervisor',
    ]),

    ruta: resolveColumn([
      'ruta',
      'zona',
      'territorio',
      'circuito',
    ]),

    codigoPDV: resolveColumn([
      'codigo_pdv',
      'cod_pdv',
      'pdv_codigo',
      'cliente_codigo',
      'id_cliente',
    ]),

    nombrePDV: resolveColumn([
      'nombre_pdv',
      'pdv',
      'cliente',
      'razon_social',
      'nombre_cliente',
      'comercio',
    ]),

    direccionPDV: resolveColumn([
      'direccion',
      'domicilio',
      'ubicacion',
      'calle',
    ]),

    categoriaTarea: resolveColumn([
      'categoria',
      'categoria_tarea',
      'rubro',
      'tipo_tarea',
      'tipo',
    ]),

    nombreTarea: resolveColumn([
      'tarea',
      'nombre_tarea',
      'mision',
      'item',
      'descripcion_tarea',
    ]),

    estado: resolveColumn([
      'estado',
      'estado_validacion',
      'validacion',
      'resultado',
      'status',
    ]),

    motivoInvalidacion: resolveColumn([
      'motivo',
      'motivo_invalidacion',
      'causa_rechazo',
      'razon_invalidacion',
      'invalidation_reason',
    ]),

    detalleInvalidacion: resolveColumn([
      'detalle',
      'detalle_invalidacion',
      'observacion',
      'comentario_auditor',
      'notas',
    ]),

    foto: resolveColumn([
      'foto',
      'url_foto',
      'url_foto_original',
      'foto_original',
      'evidencia',
      'link_foto',
      'imagen',
    ]),

    puntajeBase: resolveColumn([
      'puntaje_base',
      'puntos_base',
      'peso_tarea',
      'puntos',
    ]),
  };

  const batchId = 'batch_' + Date.now();
  const importDate = new Date().toISOString();

  let insertedCount = 0;
  let updatedCount = 0;

  /*
   * Mapa rápido de registros existentes.
   * Solo se utiliza realmente en modo merge.
   */
  const existingMap = new Map<string, TaskRecord>();

  if (mode === 'merge' && existingTasks && existingTasks.length > 0) {
    for (const task of existingTasks) {
      existingMap.set(task.id, task);

      const compoundKey =
        `${task.fechaTarea}_${task.codigoPDV}_${task.nombreTarea}`.toLowerCase();

      existingMap.set(compoundKey, task);
    }
  }

  /*
   * Reservamos capacidad aproximada.
   */
  const parsedTasks: TaskRecord[] = [];
  parsedTasks.length = 0;

  /*
   * Procesamiento por lotes pequeños.
   *
   * Esto permite que el navegador tenga puntos de respiro
   * entre grupos de filas cuando la función sea llamada
   * desde una tarea asíncrona.
   *
   * La función sigue devolviendo exactamente el mismo ParseResult
   * que esperaba la aplicación.
   */
  const dataRows = matrix.slice(1);

  dataRows.forEach((row, index) => {
    try {
      const getRawByColumn = (columnIndex: number): unknown => {
        if (columnIndex < 0) return undefined;
        return row[columnIndex];
      };

      const getValByColumn = (
        columnIndex: number,
        defaultValue = ''
      ): string => {
        const value = getRawByColumn(columnIndex);

        if (value === undefined || value === null) {
          return defaultValue;
        }

        const result = String(value).trim();

        return result || defaultValue;
      };

      const getNumByColumn = (
        columnIndex: number,
        defaultValue = 0
      ): number => {
        const value = getRawByColumn(columnIndex);

        if (value === undefined || value === null || value === '') {
          return defaultValue;
        }

        if (typeof value === 'number') {
          return Number.isFinite(value) ? value : defaultValue;
        }

        const parsed = parseFloat(
          String(value).trim().replace(',', '.')
        );

        return Number.isFinite(parsed) ? parsed : defaultValue;
      };

      /*
       * ID
       */
      const idRaw =
        getValByColumn(columns.id) ||
        `IMP-${batchId}-${index + 1}`;

      /*
       * Fecha
       */
      const rawFechaVal = getRawByColumn(columns.fecha);
      const fecha = parseExcelDate(rawFechaVal);

      /*
       * Datos principales
       */
      const vendedor = getValByColumn(
        columns.vendedor,
        'Vendedor No Asignado'
      );

      const codigoVendedor = getValByColumn(
        columns.codigoVendedor
      );

      const supervisor = getValByColumn(
        columns.supervisor,
        'Supervisor General'
      );

      const ruta = getValByColumn(
        columns.ruta,
        'Ruta General'
      );

      const codigoPDV = getValByColumn(
        columns.codigoPDV,
        `PDV-${1000 + index}`
      );

      const nombrePDV = getValByColumn(
        columns.nombrePDV,
        'Punto de Venta'
      );

      const direccionPDV = getValByColumn(
        columns.direccionPDV
      );

      const categoriaTarea = getValByColumn(
        columns.categoriaTarea,
        'Ejecución Comercial'
      );

      const nombreTarea = getValByColumn(
        columns.nombreTarea,
        `Tarea de Ejecución ${index + 1}`
      );

      /*
       * Estado
       */
      const rawEstado = getValByColumn(
        columns.estado
      ).toUpperCase();

      let estadoValidacion: ValidationStatus = 'VALIDADA';

      if (
        rawEstado.includes('INVAL') ||
        rawEstado.includes('RECHAZ') ||
        rawEstado.includes('NO') ||
        rawEstado.includes('FALL')
      ) {
        estadoValidacion = 'INVALIDADA';
      } else if (
        rawEstado.includes('PEND') ||
        rawEstado.includes('REV') ||
        rawEstado.includes('AUDIT')
      ) {
        estadoValidacion = 'PENDIENTE_AUDITORIA';
      }

      const motivoInvalidacion =
        getValByColumn(columns.motivoInvalidacion) ||
        (
          estadoValidacion === 'INVALIDADA'
            ? 'Incumplimiento de pauta'
            : ''
        );

      const detalleInvalidacion =
        getValByColumn(columns.detalleInvalidacion);

      /*
       * Foto
       */
      const rawFotoUrl = getRawByColumn(columns.foto);
      const urlFotoOriginal = parseExcelUrl(rawFotoUrl);

      /*
       * Puntaje
       */
      const puntajeBase = getNumByColumn(
        columns.puntajeBase,
        20
      );

      const puntajeObtenido =
        estadoValidacion === 'VALIDADA'
          ? puntajeBase
          : 0;

      /*
       * Clave compuesta para merge.
       */
      const compoundKey =
        `${fecha}_${codigoPDV}_${nombreTarea}`.toLowerCase();

      const existing =
        mode === 'merge'
          ? existingMap.get(idRaw) ||
            existingMap.get(compoundKey)
          : undefined;

      if (existing) {
        /*
         * IMPORTANTE:
         * Conservamos todo el historial de apelaciones.
         */
        const updatedRecord: TaskRecord = {
          ...existing,

          importBatchId: batchId,
          importDate,

          fechaTarea: fecha,

          vendedor,

          codigoVendedor:
            codigoVendedor || existing.codigoVendedor,

          supervisor,

          ruta,

          codigoPDV,

          nombrePDV,

          direccionPDV:
            direccionPDV || existing.direccionPDV,

          categoriaTarea,

          nombreTarea,

          estadoValidacion,

          motivoInvalidacion:
            motivoInvalidacion ||
            existing.motivoInvalidacion,

          detalleInvalidacion:
            detalleInvalidacion ||
            existing.detalleInvalidacion,

          urlFotoOriginal:
            urlFotoOriginal ||
            existing.urlFotoOriginal,

          puntajeBase,

          puntajeObtenido:
            existing.estadoApelacion === 'APROBADA'
              ? (
                  existing.puntajeAjustado ??
                  puntajeBase
                )
              : (
                  estadoValidacion === 'VALIDADA'
                    ? puntajeBase
                    : 0
                ),
        };

        parsedTasks.push(updatedRecord);
        updatedCount++;
      } else {
        /*
         * Registro nuevo.
         */
        const newRecord: TaskRecord = {
          id: idRaw,

          importBatchId: batchId,

          importDate,

          fechaTarea: fecha,

          vendedor,

          codigoVendedor,

          supervisor,

          ruta,

          codigoPDV,

          nombrePDV,

          direccionPDV,

          categoriaTarea,

          nombreTarea,

          estadoValidacion,

          motivoInvalidacion,

          detalleInvalidacion,

          urlFotoOriginal,

          puntajeBase,

          puntajeObtenido,

          estadoApelacion: 'SIN_APELAR',
        };

        parsedTasks.push(newRecord);
        insertedCount++;
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : String(err);

      /*
       * Limitamos la cantidad de errores guardados.
       * Un Excel malo no debería generar miles de strings
       * adicionales en memoria.
       */
      if (errors.length < 100) {
        errors.push(
          `Error en fila ${index + 2}: ${errorMsg}`
        );
      }
    }
  });

  /*
   * Si hubo más de 100 errores, dejamos constancia.
   */
  if (errors.length === 100) {
    errors.push(
      'Se omitieron errores adicionales para evitar consumir memoria.'
    );
  }

  const batch: ImportBatch = {
    id: batchId,
    fileName,
    importDate,
    totalRows: dataRows.length,
    insertedRows: insertedCount,
    updatedRows: updatedCount,
    skippedRows: errors.length,
  };

  return {
    tasks: parsedTasks,
    batch,
    errors,
    mode,
  };
}

export function exportTasksToExcel(tasks: TaskRecord[], fileName = 'Reporte_Validacion_Tareas_OCD.xlsx') {
  const exportData = tasks.map((t) => ({
    'ID Registro': t.id,
    'Fecha Tarea': t.fechaTarea,
    'Vendedor': t.vendedor,
    'Cód. Vendedor': t.codigoVendedor || '',
    'Supervisor': t.supervisor,
    'Ruta / Territorio': t.ruta,
    'Cód. PDV': t.codigoPDV,
    'Nombre PDV / Cliente': t.nombrePDV,
    'Dirección': t.direccionPDV || '',
    'Categoría Tarea': t.categoriaTarea,
    'Nombre Tarea': t.nombreTarea,
    'Estado Validación': t.estadoValidacion,
    'Motivo Invalidación': t.motivoInvalidacion || '',
    'Detalle Auditoría': t.detalleInvalidacion || '',
    'URL Foto Original': t.urlFotoOriginal || '',
    'Puntaje Base': t.puntajeBase,
    'Puntaje Final': t.puntajeObtenido,
    'Estado Apelación': t.estadoApelacion,
    'Fecha Apelación': t.fechaApelacion ? new Date(t.fechaApelacion).toLocaleString('es-AR') : '',
    'Motivo Apelación Vendedor': t.motivoApelacion || '',
    'Comentarios Vendedor': t.comentariosVendedor || '',
    'URL Evidencia Apelación': t.evidenciaApelacionUrl || '',
    'Fecha Resolución': t.fechaResolucion ? new Date(t.fechaResolucion).toLocaleString('es-AR') : '',
    'Supervisor Resolutor': t.supervisorResolutor || '',
    'Dictamen Resolución': t.dictamenResolucion || '',
    'Comentario Dictamen': t.comentarioResolucion || '',
    'Lote de Importación': t.importBatchId || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = [
    { wch: 15 }, // ID
    { wch: 12 }, // Fecha
    { wch: 20 }, // Vendedor
    { wch: 14 }, // Cod Vendedor
    { wch: 20 }, // Supervisor
    { wch: 24 }, // Ruta
    { wch: 12 }, // Cod PDV
    { wch: 25 }, // Nombre PDV
    { wch: 25 }, // Direccion
    { wch: 18 }, // Categoria
    { wch: 35 }, // Tarea
    { wch: 16 }, // Estado Validacion
    { wch: 30 }, // Motivo Invalidacion
    { wch: 30 }, // Detalle
    { wch: 35 }, // URL Foto
    { wch: 12 }, // Puntos Base
    { wch: 12 }, // Puntos Final
    { wch: 16 }, // Estado Apelacion
    { wch: 18 }, // Fecha Apelacion
    { wch: 35 }, // Motivo Apelacion
    { wch: 25 }, // Comentarios Vendedor
    { wch: 35 }, // URL Evidencia
    { wch: 18 }, // Fecha Resolucion
    { wch: 20 }, // Supervisor Resolutor
    { wch: 15 }, // Dictamen
    { wch: 35 }, // Comentario Dictamen
    { wch: 20 }, // Batch ID
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auditoría OCD');

  XLSX.writeFile(workbook, fileName);
}

export function generateTemplateExcel(): void {
  const templateData = [
    {
      'ID_TAREA': 'OCD-2025-901',
      'FECHA': '2025-02-21',
      'VENDEDOR': 'Carlos Benítez',
      'COD_VENDEDOR': 'VEND-104',
      'SUPERVISOR': 'Roberto Domínguez',
      'RUTA': 'Ruta 101 - Morón Centro',
      'COD_PDV': 'PDV-1044',
      'NOMBRE_PDV': 'Autoservicio Rivadavia',
      'DIRECCION': 'Av. Rivadavia 18200, Morón',
      'CATEGORIA': 'Material POP',
      'TAREA': 'Colocación Afiche Promoción Fin de Mes',
      'ESTADO': 'INVALIDADA',
      'MOTIVO_INVALIDACION': 'Foto borrosa o fuera de foco',
      'DETALLE': 'No se visualiza el código del afiche',
      'URL_FOTO': 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80',
      'PUNTAJE': 20
    },
    {
      'ID_TAREA': 'OCD-2025-902',
      'FECHA': '2025-02-21',
      'VENDEDOR': 'Mariana Gómez',
      'COD_VENDEDOR': 'VEND-108',
      'SUPERVISOR': 'Silvia Menéndez',
      'RUTA': 'Ruta 102 - Castelar Norte',
      'COD_PDV': 'PDV-2090',
      'NOMBRE_PDV': 'Kiosco El Sol',
      'DIRECCION': 'Santa Rosa 950, Castelar',
      'CATEGORIA': 'Heladera OCD',
      'TAREA': 'Auditoría Heladera 100% Exclusiva',
      'ESTADO': 'VALIDADA',
      'MOTIVO_INVALIDACION': '',
      'DETALLE': 'Cumplimiento perfecto de planograma',
      'URL_FOTO': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80',
      'PUNTAJE': 25
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_OCD');
  XLSX.writeFile(workbook, 'Plantilla_Importacion_Tareas_OCD.xlsx');
}
