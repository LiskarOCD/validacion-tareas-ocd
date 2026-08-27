import React from 'react';
import { Search, X, Filter, Sparkles } from 'lucide-react';
import { FilterState, UserRole } from '../types';

interface TaskFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  vendedores: string[];
  supervisores: string[];
  rutas: string[];
  categorias: string[];
  userRole: UserRole;
  counts: {
    todas: number;
    sinApelar: number;
    enRevision: number;
    aprobadas: number;
    rechazadas: number;
    validadas: number;
  };
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFilterChange,
  vendedores,
  supervisores,
  rutas,
  categorias,
  userRole,
  counts,
}) => {
  const handleQuickTab = (tab: string) => {
    if (tab === 'TODAS') {
      onFilterChange({ ...filters, estadoValidacion: '', estadoApelacion: '' });
    } else if (tab === 'SIN_APELAR') {
      onFilterChange({ ...filters, estadoValidacion: 'INVALIDADA', estadoApelacion: 'SIN_APELAR' });
    } else if (tab === 'EN_REVISION') {
      onFilterChange({ ...filters, estadoValidacion: 'INVALIDADA', estadoApelacion: 'EN_REVISION' });
    } else if (tab === 'APROBADA') {
      onFilterChange({ ...filters, estadoValidacion: 'INVALIDADA', estadoApelacion: 'APROBADA' });
    } else if (tab === 'RECHAZADA') {
      onFilterChange({ ...filters, estadoValidacion: 'INVALIDADA', estadoApelacion: 'RECHAZADA' });
    } else if (tab === 'VALIDADA') {
      onFilterChange({ ...filters, estadoValidacion: 'VALIDADA', estadoApelacion: '' });
    }
  };

  const isTabActive = (tab: string) => {
    if (tab === 'TODAS') return !filters.estadoValidacion && !filters.estadoApelacion;
    if (tab === 'SIN_APELAR') return filters.estadoValidacion === 'INVALIDADA' && filters.estadoApelacion === 'SIN_APELAR';
    if (tab === 'EN_REVISION') return filters.estadoValidacion === 'INVALIDADA' && filters.estadoApelacion === 'EN_REVISION';
    if (tab === 'APROBADA') return filters.estadoValidacion === 'INVALIDADA' && filters.estadoApelacion === 'APROBADA';
    if (tab === 'RECHAZADA') return filters.estadoValidacion === 'INVALIDADA' && filters.estadoApelacion === 'RECHAZADA';
    if (tab === 'VALIDADA') return filters.estadoValidacion === 'VALIDADA' && !filters.estadoApelacion;
    return false;
  };

  const hasActiveFilters = 
    filters.searchTerm || 
    filters.vendedor || 
    filters.supervisor || 
    filters.ruta || 
    filters.categoria || 
    filters.estadoValidacion || 
    filters.estadoApelacion ||
    filters.fechaDesde ||
    filters.fechaHasta;

  const resetFilters = () => {
    onFilterChange({
      searchTerm: '',
      vendedor: '',
      supervisor: '',
      ruta: '',
      categoria: '',
      estadoValidacion: '',
      estadoApelacion: '',
      fechaDesde: '',
      fechaHasta: '',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#D5E5ED] shadow-xs p-4 mb-5">
      
      {/* Quick Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-[#EBF3F7] no-scrollbar">
        <button
          type="button"
          onClick={() => handleQuickTab('TODAS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            isTabActive('TODAS')
              ? 'bg-[#0B2F5B] text-white shadow-xs'
              : 'bg-[#F2FAFC] text-[#0B2F5B] hover:bg-[#E2F2F7] border border-[#D5E5ED]'
          }`}
        >
          <span>Todas las Tareas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            isTabActive('TODAS') ? 'bg-white/20 text-white' : 'bg-[#D5EAF2] text-[#0B2F5B] font-bold'
          }`}>
            {counts.todas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickTab('SIN_APELAR')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            isTabActive('SIN_APELAR')
              ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/40'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100/80'
          }`}
        >
          <span>Invalidadas s/ Apelar</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            isTabActive('SIN_APELAR') ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-950 font-bold'
          }`}>
            {counts.sinApelar}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickTab('EN_REVISION')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            isTabActive('EN_REVISION')
              ? 'bg-[#2B98BA] text-white shadow-xs ring-2 ring-[#4AC3E7]/50'
              : 'bg-[#EBF7FA] text-[#17657D] border border-[#2B98BA]/40 hover:bg-[#D5F0F7]'
          }`}
        >
          <span>En Revisión OCD</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            isTabActive('EN_REVISION') ? 'bg-white/20 text-white' : 'bg-[#BCE6F2] text-[#0B2F5B] font-black'
          }`}>
            {counts.enRevision}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickTab('APROBADA')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            isTabActive('APROBADA')
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100/80'
          }`}
        >
          <span>Apelaciones Aprobadas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            isTabActive('APROBADA') ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-950 font-bold'
          }`}>
            {counts.aprobadas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickTab('RECHAZADA')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            isTabActive('RECHAZADA')
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100/80'
          }`}
        >
          <span>Apelaciones Rechazadas</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            isTabActive('RECHAZADA') ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-950 font-bold'
          }`}>
            {counts.rechazadas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickTab('VALIDADA')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            isTabActive('VALIDADA')
              ? 'bg-[#0B2F5B] text-white shadow-xs'
              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span>Validadas Iniciales</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            isTabActive('VALIDADA') ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800 font-bold'
          }`}>
            {counts.validadas}
          </span>
        </button>
      </div>

      {/* Search & Filter Dropdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        
        {/* Search Bar */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2B98BA]" />
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
            placeholder="Buscar por PDV, Tarea, Vendedor, Motivo..."
            className="w-full pl-9 pr-8 py-2 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] transition-all placeholder:text-slate-400 font-medium"
          />
          {filters.searchTerm && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, searchTerm: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vendedor Dropdown (only selectable if supervisor, or if not locked) */}
        {userRole.role === 'SUPERVISOR' && (
          <div>
            <select
              value={filters.vendedor}
              onChange={(e) => onFilterChange({ ...filters, vendedor: e.target.value })}
              className="w-full py-2 px-2.5 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] font-medium"
            >
              <option value="">👤 Todos los Vendedores</option>
              {vendedores.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ruta Dropdown */}
        <div>
          <select
            value={filters.ruta}
            onChange={(e) => onFilterChange({ ...filters, ruta: e.target.value })}
            className="w-full py-2 px-2.5 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] font-medium"
          >
            <option value="">🗺️ Todas las Rutas OCD</option>
            {rutas.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Categoría Dropdown */}
        <div>
          <select
            value={filters.categoria}
            onChange={(e) => onFilterChange({ ...filters, categoria: e.target.value })}
            className="w-full py-2 px-2.5 bg-[#F6FAFC] border border-[#D5E5ED] rounded-lg text-xs text-[#181B1E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2B98BA]/30 focus:border-[#2B98BA] font-medium"
          >
            <option value="">🏷️ Todas las Categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Active Filter Clear Tag */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#EBF3F7] text-xs text-slate-500">
          <div className="flex items-center gap-1 text-[#0B2F5B] font-medium">
            <Filter className="w-3.5 h-3.5 text-[#2B98BA]" />
            <span>Filtros activos en auditoría</span>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-[#2B98BA] hover:text-[#17657D] font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="w-3 h-3" />
            Limpiar todos los filtros
          </button>
        </div>
      )}

    </div>
  );
};
