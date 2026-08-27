import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Award,
  AlertTriangle,
  Target
} from 'lucide-react';
import { TaskRecord } from '../types';

interface MetricCardsProps {
  tasks: TaskRecord[];
  filteredTasks: TaskRecord[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ tasks, filteredTasks }) => {
  const currentTasks = filteredTasks;

  const total = currentTasks.length;
  const validadas = currentTasks.filter((t) => t.estadoValidacion === 'VALIDADA').length;
  const invalidadas = currentTasks.filter((t) => t.estadoValidacion === 'INVALIDADA').length;
  
  const sinApelar = currentTasks.filter(
    (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'SIN_APELAR'
  ).length;

  const enRevision = currentTasks.filter(
    (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'EN_REVISION'
  ).length;

  const aprobadas = currentTasks.filter(
    (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'APROBADA'
  ).length;

  const rechazadas = currentTasks.filter(
    (t) => t.estadoValidacion === 'INVALIDADA' && t.estadoApelacion === 'RECHAZADA'
  ).length;

  // Commercial execution compliance: (Validadas + Apelaciones Aprobadas) / Total * 100
  const efectivas = validadas + aprobadas;
  const efectividadPct = total > 0 ? Math.round((efectivas / total) * 100) : 0;

  // Score stats
  const puntajeBaseTotal = currentTasks.reduce((acc, t) => acc + (t.puntajeBase || 0), 0);
  const puntajeObtenidoTotal = currentTasks.reduce((acc, t) => acc + (t.puntajeObtenido || 0), 0);
  const puntajePct = puntajeBaseTotal > 0 ? Math.round((puntajeObtenidoTotal / puntajeBaseTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
      
      {/* 1. Total & Efectividad OCD */}
      <div className="bg-white p-4 rounded-xl border border-[#D5E5ED] shadow-xs flex flex-col justify-between hover:border-[#2B98BA]/60 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B2F5B]">
            Efectividad OCD
          </span>
          <div className="p-1 rounded-md bg-[#EBF7FA] text-[#2B98BA]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[#0B2F5B]">{efectividadPct}%</span>
          <span className="text-xs text-slate-500 font-medium">({efectivas}/{total} ok)</span>
        </div>
        <div className="w-full bg-[#EBF3F7] h-2 rounded-full mt-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#2B98BA] to-[#0B2F5B] h-full rounded-full transition-all duration-500" 
            style={{ width: `${Math.min(100, efectividadPct)}%` }} 
          />
        </div>
      </div>

      {/* 2. Tareas Validadas */}
      <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/25 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-all">
        <div className="flex items-center justify-between text-emerald-800 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Validadas Directas</span>
          <div className="p-1 rounded-md bg-emerald-100/70 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-950">{validadas}</span>
          <span className="text-xs text-emerald-700 font-medium">
            {total > 0 ? Math.round((validadas / total) * 100) : 0}% total
          </span>
        </div>
        <p className="text-[11px] text-emerald-800/80 mt-1">
          Auditoría de campo aprobada
        </p>
      </div>

      {/* 3. Invalidadas Pendientes de Apelar */}
      <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all">
        <div className="flex items-center justify-between text-amber-800 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">Invalidadas s/ Apelar</span>
          <div className="p-1 rounded-md bg-amber-100 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-amber-950">{sinApelar}</span>
          <span className="text-xs text-amber-700 font-medium">de {invalidadas}</span>
        </div>
        <p className="text-[11px] text-amber-800/80 mt-1">
          Disponibles para descargo vendedor
        </p>
      </div>

      {/* 4. En Revisión / Dictamen */}
      <div className="bg-white p-4 rounded-xl border border-[#2B98BA]/30 bg-[#F2FAFD] shadow-xs flex flex-col justify-between hover:border-[#2B98BA] transition-all">
        <div className="flex items-center justify-between text-[#0B2F5B] mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider">En Revisión</span>
          <div className="p-1 rounded-md bg-[#EBF7FA] text-[#2B98BA]">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[#0B2F5B]">{enRevision}</span>
          <span className="text-xs text-[#2B98BA] font-bold">
            {aprobadas + rechazadas} resueltas
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px]">
          <span className="text-emerald-700 font-semibold">{aprobadas} aprob.</span>
          <span className="text-slate-300">·</span>
          <span className="text-rose-700 font-semibold">{rechazadas} rech.</span>
        </div>
      </div>

      {/* 5. Puntaje Comercial */}
      <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-[#D5E5ED] shadow-xs flex flex-col justify-between hover:border-[#2B98BA]/60 transition-all">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B2F5B]">
            Puntaje / Ejecución
          </span>
          <div className="p-1 rounded-md bg-amber-50 text-amber-600">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-[#0B2F5B]">{puntajeObtenidoTotal}</span>
          <span className="text-xs text-slate-500 font-medium">/ {puntajeBaseTotal} pts</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600">
          <span>Rendimiento: <b className="text-[#0B2F5B]">{puntajePct}%</b></span>
          <span className="text-emerald-700 font-semibold">+{aprobadas * 20} pts recup.</span>
        </div>
      </div>

    </div>
  );
};
