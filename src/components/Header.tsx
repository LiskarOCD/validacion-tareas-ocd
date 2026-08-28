import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  BarChart3, 
  ListFilter, 
  RotateCcw,
  ShieldCheck,
  User,
  Layers,
  Sparkles,
  Trash2,
  MoreVertical,
  ChevronDown,
  Database
} from 'lucide-react';
import { UserRole } from '../types';
import { OcdLogo } from './OcdLogo';

interface HeaderProps {
  user: User;
  onChange: (: User) => void;
  vendedoresList: string[];
  onOpenImport: () => void;
  onOpenExport: () => void;
  activeView: 'tasks' | 'analytics' | 'batches';
  setActiveView: (view: 'tasks' | 'analytics' | 'batches') => void;
  onResetData: () => void;
  onClearData: () => void;
  pendingAppealsCount: number;
  totalTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  onRoleChange,
  vendedoresList,
  onOpenImport,
  onOpenExport,
  activeView,
  setActiveView,
  onResetData,
  onClearData,
  pendingAppealsCount,
  totalTasksCount,
}) => {
  const [showDbMenu, setShowDbMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDbMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-[#071D38] via-[#0B2F5B] to-[#0D386B] text-white border-b border-[#2B98BA]/30 sticky top-0 z-30 shadow-md">
      {/* Top micro banner accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#2B98BA] via-[#4AC3E7] to-[#0B2F5B]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2.5 gap-3">
          
          {/* Logo & System Title */}
          <div className="flex items-center gap-3.5">
            <OcdLogo variant="pill" size="md" className="shrink-0 shadow-sm" />

            <div className="border-l border-white/20 pl-3.5 hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="bg-[#2B98BA]/25 text-[#4AC3E7] font-mono text-[10px] px-1.5 py-0.5 rounded border border-[#2B98BA]/40 font-bold tracking-wider">
                  CONTROL TOWER
                </span>
                <h1 className="text-sm font-bold tracking-tight text-white">
                  Validación de Tareas & Auditoría Comercial
                </h1>
              </div>
              <p className="text-[11px] text-slate-300">
                Auditoría en campo, gestión de descargos fotográficos y dictámenes
              </p>
            </div>
          </div>

          {/* Role & Vendedor Switcher + Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* View Switcher */}
            <div className="bg-[#06182E]/80 p-1 rounded-lg border border-[#2B98BA]/30 flex items-center text-xs backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setActiveView('tasks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeView === 'tasks'
                    ? 'bg-[#2B98BA] text-white shadow-sm ring-1 ring-white/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Auditoría</span>
                {pendingAppealsCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {pendingAppealsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeView === 'analytics'
                    ? 'bg-[#2B98BA] text-white shadow-sm ring-1 ring-white/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Métricas OCD</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('batches')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  activeView === 'batches'
                    ? 'bg-[#2B98BA] text-white shadow-sm ring-1 ring-white/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Lotes Excel</span>
              </button>
            </div>

           {/* Current authenticated profile */}
<div className="bg-[#06182E]/80 px-2.5 py-1 rounded-lg border border-[#2B98BA]/30 flex items-center gap-2">
  <div className="flex items-center gap-1.5 text-slate-300 text-xs">
    {userRole.role === 'ADMIN' ? (
      <ShieldCheck className="w-4 h-4 text-amber-300" />
    ) : userRole.role === 'SUPERVISOR' ? (
      <ShieldCheck className="w-4 h-4 text-[#4AC3E7]" />
    ) : (
      <User className="w-4 h-4 text-[#2B98BA]" />
    )}

    <span className="hidden sm:inline text-[11px] font-medium">
      Perfil:
    </span>

    <span className="text-xs font-bold text-white">
      {userRole.role === 'ADMIN'
        ? `👑 ${userRole.name}`
        : userRole.role === 'SUPERVISOR'
          ? `🛡️ ${userRole.name}`
          : `👤 ${userRole.name}`}
    </span>
  </div>
</div>

            {/* Import & Export Buttons */}
            <div className="flex items-center gap-1.5">
             {userRole.role === 'ADMIN' && (
  <button
    type="button"
    onClick={onOpenImport}
    className="bg-[#2B98BA] hover:bg-[#2183A0] text-white text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
    title="Importar Excel con nuevas tareas o actualizaciones"
  >
    <Upload className="w-3.5 h-3.5" />
    <span>Cargar Excel</span>
  </button>
)}

              {totalTasksCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenExport}
                  className="bg-[#09223F] hover:bg-[#0E325A] text-slate-200 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#2B98BA]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Exportar base completa o filtrada"
                >
                  <Download className="w-3.5 h-3.5 text-[#2B98BA]" />
                  <span className="hidden md:inline">Exportar</span>
                </button>
              )}

             {/* Database Options Dropdown */}
{userRole.role === 'ADMIN' && (
  <div className="relative" ref={menuRef}>
    <button
      type="button"
      onClick={() => setShowDbMenu(!showDbMenu)}
      className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-0.5 border border-white/10 cursor-pointer"
      title="Opciones de base de datos"
    >
      <Database className="w-3.5 h-3.5 text-[#4AC3E7]" />
      <ChevronDown className="w-3 h-3 text-slate-400" />
    </button>

    {showDbMenu && (
      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#D5E5ED] py-1 z-50 text-slate-800 text-xs animate-fade-in">
        <div className="px-3 py-1.5 border-b border-[#EBF3F7] text-[10px] uppercase font-bold text-slate-400">
          Gestión de Datos OCD
        </div>

        <button
          type="button"
          onClick={() => {
            setShowDbMenu(false);
            onResetData();
          }}
          className="w-full text-left px-3.5 py-2 hover:bg-[#F2FAFD] flex items-center gap-2 text-[#0B2F5B] font-semibold cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2B98BA]" />
          <span>Cargar datos demo (Prueba)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowDbMenu(false);

            if (
              confirm(
                '¿Estás seguro de que deseas vaciar toda la información de tareas y lotes cargados?'
              )
            ) {
              onClearData();
            }
          }}
          className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-700 font-semibold cursor-pointer border-t border-[#EBF3F7]"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span>Limpiar / Vaciar base de datos</span>
        </button>
      </div>
    )}
  </div>
)}
