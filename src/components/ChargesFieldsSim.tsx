import { Sparkles, RotateCcw, Plus, Minus } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface ChargesFieldsSimProps {
  lang: Language;
}

interface Charge {
  id: number;
  x: number;
  y: number;
  q: number; // +1 or -1 in nC
}

export const ChargesFieldsSim: React.FC<ChargesFieldsSimProps> = ({ lang }) => {
  const { t: tI18n } = useTranslation();
  const [charges, setCharges] = useState<Charge[]>([
    { id: 1, x: 200, y: 150, q: 1 },
    { id: 2, x: 400, y: 150, q: -1 },
  ]);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [sensorPos, setSensorPos] = useState<{ x: number; y: number }>({ x: 300, y: 100 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Coulomb constant k = 8.99 * 10^9
  // Calculate electric field vector E = (Ex, Ey) and potential V at (x, y)
  const calcFieldAndPotential = (px: number, py: number) => {
    let Ex = 0;
    let Ey = 0;
    let V = 0;

    charges.forEach((c) => {
      const dx = px - c.x;
      const dy = py - c.y;
      const r2 = Math.max(dx * dx + dy * dy, 100);
      const r = Math.sqrt(r2);
      const k = 9000; // scaled for pixels

      // E = k * q / r^2
      const E_mag = (k * c.q) / r2;
      Ex += E_mag * (dx / r);
      Ey += E_mag * (dy / r);

      // V = k * q / r
      V += (k * c.q) / r;
    });

    const E_total = Math.sqrt(Ex * Ex + Ey * Ey);
    return { Ex, Ey, E_total, V };
  };

  const sensorReading = calcFieldAndPotential(sensorPos.x, sensorPos.y);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.direction = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';

    ctx.clearRect(0, 0, 600, 300);

    // Draw Vector Grid if enabled
    if (showVectors) {
      const step = 30;
      for (let x = step / 2; x < 600; x += step) {
        for (let y = step / 2; y < 300; y += step) {
          const { Ex, Ey, E_total } = calcFieldAndPotential(x, y);
          if (E_total > 0.05) {
            const angle = Math.atan2(Ey, Ex);
            const len = Math.min(E_total * 0.8, 14);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            // Vector arrow
            ctx.beginPath();
            ctx.moveTo(-len / 2, 0);
            ctx.lineTo(len / 2, 0);
            ctx.lineTo(len / 2 - 3, -2);
            ctx.moveTo(len / 2, 0);
            ctx.lineTo(len / 2 - 3, 2);

            const alpha = Math.min(E_total / 8, 0.8) + 0.15;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    }

    // Draw Charges
    charges.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = c.q > 0 ? '#ef4444' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label + / -
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.q > 0 ? '+' : '-', c.x, c.y);
    });

    // Draw Sensor
    ctx.beginPath();
    ctx.arc(sensorPos.x, sensorPos.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [charges, showVectors, sensorPos]);

  const addCharge = (q: number) => {
    if (charges.length >= 8) return;
    const newCharge: Charge = {
      id: Date.now(),
      x: 100 + Math.random() * 400,
      y: 80 + Math.random() * 140,
      q,
    };
    setCharges((prev) => [...prev, newCharge]);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 600;
    const y = ((e.clientY - rect.top) / rect.height) * 300;
    setSensorPos({ x, y });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Sparkles  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tI18n('experiments.charges_and_fields.title')}</h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.charges_and_fields.subtitle')}</p>
          </div>
        </div>

        <button className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw  className="w-3.5 h-3.5"/>
          {tI18n('experiments.charges_and_fields.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            onClick={handleCanvasClick}
           className="w-full h-auto max-h-[340px] rounded-xl bg-slate-950 cursor-crosshair border border-slate-900"/>
          <span className="text-[11px] text-slate-400 mt-2 font-mono">{tI18n('experiments.charges_and_fields.clickToPlaceSensor')}</span>
        </div>

        {/* Controls & Sensor Readings */}
        <div className="lg:col-span-4 space-y-4">
          {/* Add Charges */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">{tI18n('experiments.charges_and_fields.manageCharges')}</span>
            <div className="grid grid-cols-2 gap-2">
              <button className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold transition-colors"
              >
                <Plus  className="w-4 h-4"/>
                {tI18n('experiments.charges_and_fields.addPos')}
              </button>
              <button className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold transition-colors"
              >
                <Minus  className="w-4 h-4"/>
                {tI18n('experiments.charges_and_fields.addNeg')}
              </button>
            </div>

            <button className="min-h-[44px] min-w-[44px] w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              {showVectors ? tI18n('experiments.charges_and_fields.hideVectors') : tI18n('experiments.charges_and_fields.toggleVectors')}
            </button>
          </div>

          {/* Sensor Probe Readout */}
          <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
            <span className="text-xs text-amber-300 font-bold block">{tI18n('experiments.charges_and_fields.sensorHeader')}</span>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>{tI18n('experiments.charges_and_fields.potential')}:</span>
                <span className="font-bold text-amber-400">{sensorReading.V.toFixed(1)} V</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>{tI18n('experiments.charges_and_fields.fieldIntensity')}:</span>
                <span className="font-bold text-sky-400">{sensorReading.E_total.toFixed(2)} V/m</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-amber-500/20">
                <span>(Ex, Ey):</span>
                <span>({sensorReading.Ex.toFixed(1)}, {sensorReading.Ey.toFixed(1)})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};