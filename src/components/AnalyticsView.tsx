import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  MapPin
} from 'lucide-react';
import { TaskRecord } from '../types';
import { OcdSymbol } from './OcdLogo';

interface AnalyticsViewProps {
  tasks: TaskRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks }) => {
  // 1. Invalidation reasons ranking
  const invalidTasks = tasks.filter((t) => t.estadoValidacion === 'INVALIDADA');
  const reasonsMap = new Map<string, number>();
  invalidTasks.forEach((t) => {
    const reason = t.motivoInvalidacion || 'Sin motivo especificado';
    reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
  });
  const reasonsList = Array.from(reasonsMap.entries())
    .map(([motivo, count]) => ({ motivo, count, pct: Math.round((count / Math.max(1, invalidTasks.length)) * 100) }))
    .sort((a, b) => b.count - a.count);

  // 2. Performance by Vendedor
  const vendedorMap = new Map<string, { total: number; validadas: number; apeladas: number; aprobadas: number; puntos: number; base: number }>();
  tasks.forEach((t) => {
    const v = t.vendedor || 'Sin Vendedor';
    const entry = vendedorMap.get(v) || { total: 0, validadas: 0, apeladas: 0, aprobadas: 0, puntos: 0, base: 0 };
    entry.total += 1;
    if (t.estadoValidacion === 'VALIDADA') entry.validadas += 1;
    if (t.estadoApelacion === 'EN_REVISION' || t.estadoApelacion === 'APROBADA' || t.estadoApelacion === 'RECHAZADA') entry.apeladas += 1;
    if (t.estadoApelacion === 'APROBADA') entry.aprobadas += 1;
    entry.puntos += t.puntajeObtenido || 0;
    entry.base += t.puntajeBase || 0;
    vendedorMap.set(v, entry);
  });

  const vendedorStats = Array.from(vendedorMap.entries()).map(([nombre, s]) => {
    const efectivas = s.validadas + s.aprobadas;
    const efectividadPct = s.total > 0 ? Math.round((efectivas / s.total) * 100) : 0;
    return {
      nombre,
      ...s,
      efectivas,
      efectividadPct,
      puntosPct: s.base > 0 ? Math.round((s.puntos / s.base) * 100) : 0,
    };
  }).sort((a, b) => b.efectividadPct - a.efectividadPct);

  // 3. Performance by Ruta
  const rutaMap = new Map<string, { total: number; efectivas: number }>();
  tasks.forEach((t) => {
    const r = t.ruta || 'General';
    const current = rutaMap.get(r) || { total: 0, efectivas: 0 };
    current.total += 1;
    if (t.estadoValidacion === 'VALIDADA' || t.estadoApelacion === 'APROBADA') {
      current.efectivas += 1;
    }
    rutaMap.set(r, current);
  });

  const rutaStats = Array.from(rutaMap.entries()).map(([ruta, d]) => ({
    ruta,
    total: d.total,
    efectivas: d.efectivas,
    pct: d.total > 0 ? Math.round((d.efectivas / d.total) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

  const globalCompliance = tasks.length > 0
    ? Math.round(
        ((tasks.filter((t) => t.estadoValidacion === 'VALIDADA' || t.estadoApelacion === 'APROBADA').length) /
          tasks.length) *
          100
      )
    : 0;

  return (
    <div className="space-y-5">
      
      {/* Top Banner with OCD Branding */}
      <div className="bg-gradient-to-r from-[#071D38] via-[#0B2F5B] to-[#0D386B] text-white p-6 rounded-2xl border border-[#2B98BA]/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="bg-white p-2 rounded-full border border-[#2B98BA]/40 shadow-xs shrink-0">
            <OcdSymbol size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#2B98BA]/30 text-[#4AC3E7] font-mono text-[10px] px-2 py-0.5 rounded border border-[#2B98BA]/40 font-bold">
                OCD ANALYTICS
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Dashboard de Efectividad & Auditoría Comercial
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Oeste Centro de Distribución · Pareto de rechazos en PDV, efectividad por preventista y circuitos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#06182E]/80 px-5 py-2.5 rounded-xl border border-[#2B98BA]/40 shadow-xs">
          <div className="text-right">
            <div className="text-[11px] text-slate-300 font-semibold">Cumplimiento Global OCD</div>
            <div className="text-2xl font-black text-[#4AC3E7]">
              {globalCompliance}%
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-[#2B98BA]" />
        </div>
      </div>

      {/* Grid: Reasons for invalidation & Rutas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Motivos de Invalidación más Frecuentes */}
        <div className="bg-white p-5 rounded-xl border border-[#D5E5ED] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-xs text-[#0B2F5B] uppercase tracking-wider">
                Motivos de Rechazo en Auditoría
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {invalidTasks.length} rechazos totales
            </span>
          </div>

          <div className="space-y-3">
            {reasonsList.slice(0, 6).map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 line-clamp-1 max-w-[80%]">
                    {idx + 1}. {item.motivo}
                  </span>
                  <span className="font-bold text-[#0B2F5B]">
                    {item.count} <span className="text-[10px] text-slate-400 font-normal">({item.pct}%)</span>
                  </span>
                </div>
                <div className="w-full bg-[#EBF3F7] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all" 
                    style={{ width: `${item.pct}%` }} 
                  />
                </div>
              </div>
            ))}

            {reasonsList.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">
                No hay tareas invalidadas registradas en el período.
              </p>
            )}
          </div>
        </div>

        {/* Efectividad por Ruta Comercial */}
        <div className="bg-white p-5 rounded-xl border border-[#D5E5ED] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2B98BA]" />
              <h3 className="font-bold text-xs text-[#0B2F5B] uppercase tracking-wider">
                Efectividad por Territorio / Ruta OCD
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {rutaStats.length} circuitos activos
            </span>
          </div>

          <div className="space-y-3">
            {rutaStats.map((r, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{r.ruta}</span>
                  <span className="font-bold text-[#0B2F5B]">
                    {r.pct}% <span className="text-[10px] text-slate-400 font-normal">({r.efectivas}/{r.total})</span>
                  </span>
                </div>
                <div className="w-full bg-[#EBF3F7] h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      r.pct >= 80 ? 'bg-gradient-to-r from-[#2B98BA] to-[#0B2F5B]' : r.pct >= 60 ? 'bg-[#2B98BA]' : 'bg-rose-500'
                    }`} 
                    style={{ width: `${r.pct}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Tabla de Rendimiento por Vendedor / Preventista */}
      <div className="bg-white rounded-xl border border-[#D5E5ED] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#EBF3F7] bg-[#F7FBFD] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2B98BA]" />
            <h3 className="font-black text-xs text-[#0B2F5B] uppercase tracking-wider">
              Ranking & Cumplimiento por Vendedor OCD
            </h3>
          </div>
          <span className="text-[11px] text-[#2B98BA] font-bold">
            Puntaje ponderado sobre tareas auditadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#F2FAFD] text-[#0B2F5B] font-black text-[11px] uppercase border-b border-[#D5E5ED]">
              <tr>
                <th className="py-3 px-4">Vendedor</th>
                <th className="py-3 px-3 text-center">Total Tareas</th>
                <th className="py-3 px-3 text-center">Validadas Directas</th>
                <th className="py-3 px-3 text-center">Apelaciones Aprobadas</th>
                <th className="py-3 px-3 text-center">Efectividad Total</th>
                <th className="py-3 px-4 text-right">Puntos Obtenidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBF3F7]">
              {vendedorStats.map((v, i) => (
                <tr key={i} className="hover:bg-[#F2FAFD] transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#EBF7FA] text-[#17657D] border border-[#2B98BA]/30 font-mono text-[10px] flex items-center justify-center font-black">
                        {i + 1}
                      </span>
                      <span>{v.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold">{v.total}</td>
                  <td className="py-3 px-3 text-center text-emerald-800 font-bold">
                    {v.validadas}
                  </td>
                  <td className="py-3 px-3 text-center text-[#2B98BA] font-bold">
                    {v.aprobadas} / {v.apeladas} apel.
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                      v.efectividadPct >= 80 
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                        : v.efectividadPct >= 60 
                        ? 'bg-[#EBF7FA] text-[#17657D] border border-[#2B98BA]/40' 
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}>
                      {v.efectividadPct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-[#0B2F5B]">
                    {v.puntos} <span className="text-[10px] text-slate-400 font-normal">/ {v.base} pts</span>
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
