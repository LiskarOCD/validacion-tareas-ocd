import React from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  ListChecks,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { TaskRecord } from '../types';

interface MetricCardsProps {
  tasks: TaskRecord[];
  filteredTasks: TaskRecord[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ filteredTasks }) => {
  const currentTasks = filteredTasks;

  const total = currentTasks.length;
  const completadas = currentTasks.filter((t) => Boolean(t.completada)).length;
  const validadas = currentTasks.filter((t) => t.estadoValidacion === 'VALIDADA').length;
  const invalidadas = currentTasks.filter((t) => t.estadoValidacion === 'INVALIDADA').length;
  const justificadas = currentTasks.filter((t) => Boolean(t.justificada)).length;

  const pct = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
      <div className="bg-white p-4 rounded-xl border border-[#D5E5ED] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B2F5B]">
            Tareas Totales
          </span>
          <div className="p-1 rounded-md bg-[#EBF7FA] text-[#2B98BA]">
            <ListChecks className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-[#0B2F5B]">
          {total.toLocaleString('es-AR')}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Registros según filtros activos</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900">
            Completadas
          </span>
          <div className="p-1 rounded-md bg-sky-100 text-sky-700">
            <ClipboardCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-sky-950">
            {completadas.toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-sky-700 font-medium">{pct(completadas)}%</span>
        </div>
        <p className="text-[11px] text-sky-800/80 mt-1">Tareas marcadas como completadas</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
            Validadas
          </span>
          <div className="p-1 rounded-md bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-950">
            {validadas.toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-emerald-700 font-medium">{pct(validadas)}%</span>
        </div>
        <p className="text-[11px] text-emerald-800/80 mt-1">Validación aprobada</p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
            Invalidadas
          </span>
          <div className="p-1 rounded-md bg-rose-100 text-rose-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-rose-950">
            {invalidadas.toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-rose-700 font-medium">{pct(invalidadas)}%</span>
        </div>
        <p className="text-[11px] text-rose-800/80 mt-1">Tareas rechazadas en validación</p>
      </div>

      <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
            Justificadas
          </span>
          <div className="p-1 rounded-md bg-amber-100 text-amber-700">
            <FileCheck2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-amber-950">
            {justificadas.toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-amber-700 font-medium">{pct(justificadas)}%</span>
        </div>
        <p className="text-[11px] text-amber-800/80 mt-1">Tareas con justificación registrada</p>
      </div>
    </div>
  );
};
