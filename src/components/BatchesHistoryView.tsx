import React from 'react';
import { Layers, Calendar, FileSpreadsheet, CheckCircle2, Download } from 'lucide-react';
import { ImportBatch, TaskRecord } from '../types';
import { exportTasksToExcel } from '../utils/excelParser';
import { OcdSymbol } from './OcdLogo';

interface BatchesHistoryProps {
  batches: ImportBatch[];
  tasks: TaskRecord[];
  onOpenImport: () => void;
}

export const BatchesHistoryView: React.FC<BatchesHistoryProps> = ({
  batches,
  tasks,
  onOpenImport,
}) => {
  return (
    <div className="space-y-5">
      
      {/* Header card */}
      <div className="bg-white p-6 rounded-2xl border border-[#D5E5ED] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-[#EBF7FA] text-[#2B98BA] rounded-xl border border-[#2B98BA]/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#EBF7FA] text-[#17657D] font-mono text-[10px] px-2 py-0.5 rounded border border-[#2B98BA]/30 font-bold">
                BATCH MANAGER
              </span>
              <h2 className="text-base font-black text-[#0B2F5B]">
                Historial Acumulativo de Importaciones OCD
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro histórico de lotes Excel importados en el sistema OCD sin pérdida de descargos ni resoluciones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportTasksToExcel(tasks, 'Historial_Completo_OCD.xlsx')}
            className="bg-[#F2FAFD] hover:bg-[#E2F2F7] text-[#0B2F5B] border border-[#D5E5ED] text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#2B98BA]" />
            Descargar Base Completa
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="bg-[#2B98BA] hover:bg-[#2183A0] text-white text-xs font-black px-3.5 py-2 rounded-lg transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Importar Nuevo Lote
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-[#D5E5ED] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#EBF3F7] bg-[#F7FBFD] flex items-center justify-between">
          <h3 className="font-black text-xs text-[#0B2F5B] uppercase tracking-wider">
            Lotes Procesados ({batches.length})
          </h3>
          <span className="text-[11px] text-[#2B98BA] font-bold">Base de datos sincronizada</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#F2FAFD] text-[#0B2F5B] font-black text-[11px] uppercase border-b border-[#D5E5ED]">
              <tr>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-3">Nombre Archivo</th>
                <th className="py-3 px-3">ID Lote</th>
                <th className="py-3 px-3 text-center">Nuevas</th>
                <th className="py-3 px-3 text-center">Actualizadas</th>
                <th className="py-3 px-3 text-center">Total Filas</th>
                <th className="py-3 px-4 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF3F7]">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-[#F2FAFD] transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#2B98BA]" />
                    <span>{new Date(b.importDate).toLocaleString('es-AR')}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#181B1E]">
                    {b.fileName}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#2B98BA] font-semibold">
                    {b.id}
                  </td>
                  <td className="py-3 px-3 text-center font-black text-emerald-700">
                    {b.insertedRows}
                  </td>
                  <td className="py-3 px-3 text-center font-black text-[#2B98BA]">
                    {b.updatedRows}
                  </td>
                  <td className="py-3 px-3 text-center font-black text-[#0B2F5B]">
                    {b.totalRows}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Procesado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
