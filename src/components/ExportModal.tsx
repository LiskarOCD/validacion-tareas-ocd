import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { TaskRecord } from '../types';
import { exportTasksToExcel } from '../utils/excelParser';
import { OcdSymbol } from './OcdLogo';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTasks: TaskRecord[];
  filteredTasks: TaskRecord[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  allTasks,
  filteredTasks,
}) => {
  if (!isOpen) return null;

  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [fileName, setFileName] = useState(
    `Auditoria_OCD_${new Date().toISOString().split('T')[0]}.xlsx`
  );

  const handleExport = () => {
    const tasksToExport = exportScope === 'filtered' ? filteredTasks : allTasks;
    exportTasksToExcel(tasksToExport, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#071D38]/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#D5E5ED] overflow-hidden text-xs text-[#181B1E]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#071D38] via-[#0B2F5B] to-[#0D386B] text-white px-5 py-4 flex items-center justify-between border-b border-[#2B98BA]/30">
          <div className="flex items-center gap-2.5">
            <div className="bg-white p-1 rounded-full border border-[#2B98BA]/40 shadow-xs shrink-0">
              <OcdSymbol size={22} />
            </div>
            <h3 className="font-black text-sm text-white">Exportar Reporte Excel OCD</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block font-bold text-[#0B2F5B] mb-1.5">
              Alcance de la exportación
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#D5E5ED] cursor-pointer hover:bg-[#F2FAFD] transition-colors">
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'filtered'}
                  onChange={() => setExportScope('filtered')}
                  className="text-[#2B98BA] focus:ring-[#2B98BA]"
                />
                <div>
                  <div className="font-bold text-[#0B2F5B]">
                    Solo tareas filtradas actuales ({filteredTasks.length} registros)
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Respeta los filtros activos de vendedor, estado y búsqueda.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#D5E5ED] cursor-pointer hover:bg-[#F2FAFD] transition-colors">
                <input
                  type="radio"
                  name="scope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="text-[#2B98BA] focus:ring-[#2B98BA]"
                />
                <div>
                  <div className="font-bold text-[#0B2F5B]">
                    Base completa acumulada ({allTasks.length} registros)
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Incluye todas las tareas históricas e importaciones en el sistema.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#0B2F5B] mb-1">
              Nombre de archivo Excel
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full p-2 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] font-medium"
            />
          </div>

          <div className="pt-2 border-t border-[#EBF3F7] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="bg-[#2B98BA] hover:bg-[#2183A0] text-white font-black text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generar & Descargar .xlsx</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
