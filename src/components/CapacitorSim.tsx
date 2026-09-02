import { Battery, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface CapacitorSimProps {
  lang: Language;
}

export const CapacitorSim: React.FC<CapacitorSimProps> = ({ lang }) => {
  const [voltage, setVoltage] = useState<number>(1.5); // 0 to 1.5 V
  const [plateArea_mm2, setPlateArea_mm2] = useState<number>(200); // 100 to 400 mm2
  const [separation_mm, setSeparation_mm] = useState<number>(5.0); // 2 to 10 mm
  const [dielectricK, setDielectricK] = useState<number>(1.0); // 1.0 (Air), 2.1 (Teflon), 3.0 (Paper), 80.0 (Water)

  // eps_0 = 8.854 * 10^-12 F/m
  const eps0 = 8.854e-12;
  const A_m2 = plateArea_mm2 * 1e-6;
  const d_m = separation_mm * 1e-3;

  // Capacitance C = eps_0 * K * A / d (in Picofarads pF)
  const capacitance_pF = ((eps0 * dielectricK * A_m2) / d_m) * 1e12;

  // Charge Q = C * V (in Picocoulombs pC)
  const charge_pC = capacitance_pF * voltage;

  // Stored Energy U = 0.5 * C * V^2 (in Picojoules pJ)
  const energy_pJ = 0.5 * capacitance_pF * Math.pow(voltage, 2);

  // Electric Field E = V / d (in V/m)
  const electricField_V_m = voltage / d_m;

  const t = {
    ar: {
      title: 'مختبر المكثف الكهربائي وسعة التخزين (C = ε₀A/d, Q = CV)',
      subtitle: 'مختبر الفيزياء الكهرومغناطيسية', // غير موثّق بمصدر
      batteryVoltage: 'جهد البطارية (V)',
      plateArea: 'مساحة اللوحين (A)',
      separation: 'المسافة الفاصلة بين اللوحين (d)',
      dielectric: 'ثابت العازل الكهربائي (κ)',
      capacitance: 'السعة الكهربائية (C)',
      storedCharge: 'الشحنة المخزنة (Q = CV)',
      storedEnergy: 'الطاقة الكهروستاتيكية (U = ½CV²)',
      electricField: 'شدة المجال الكهربائي المنتظم (E = V/d)',
      air: 'هواء / فراغ (κ=1)',
      paper: 'ورق (κ=3.5)',
      glass: 'زجاج (κ=5)',
      reset: 'إعادة ضبط',
      topPlateLabel: '+Q (اللوح الموجب العلوي)', // غير موثّق بمصدر
      bottomPlateLabel: '-Q (اللوح السلبي السفلي)', // غير موثّق بمصدر
    },
    en: {
      title: 'Capacitor Lab & Energy Storage (C = ε₀A/d, Q = CV)',
      subtitle: 'Electromagnetism Physics Lab', // غير موثّق بمصدر
      batteryVoltage: 'Battery Voltage (V)',
      plateArea: 'Plate Area (A)',
      separation: 'Plate Separation (d)',
      dielectric: 'Dielectric Constant (κ)',
      capacitance: 'Capacitance (C)',
      storedCharge: 'Stored Charge (Q = CV)',
      storedEnergy: 'Stored Energy (U = ½CV²)',
      electricField: 'Electric Field Strength (E = V/d)',
      air: 'Vacuum / Air (κ=1)',
      paper: 'Paper (κ=3.5)',
      glass: 'Glass (κ=5)',
      reset: 'Reset',
      topPlateLabel: '+Q (Top Positive Plate)', // غير موثّق بمصدر
      bottomPlateLabel: '-Q (Bottom Negative Plate)', // غير موثّق بمصدر
    },
    ku: {
      title: 'تاقیگەی بارگەکەر (C = ε₀A/d, Q = CV)',
      subtitle: 'تاقیگەی فیزیا', // غير موثّق بمصدر
      batteryVoltage: 'ڤۆڵتیەی باتری (V)',
      plateArea: 'ڕووبەری پلێتەکان (A)',
      separation: 'دووری نێوان پلێتەکان (d)',
      dielectric: 'نەگۆڕی عازل (κ)',
      capacitance: 'بارگەیی (C)',
      storedCharge: 'بارگەی کۆکراوە (Q)',
      storedEnergy: 'وزەی کۆکراوە (U)',
      electricField: 'بڕی بواری کارەبایی (E)',
      air: 'هەوا (κ=1)',
      paper: 'کاغەز (κ=3.5)',
      glass: 'شووشە (κ=5)',
      reset: 'ڕێکخستنەوە',
      topPlateLabel: '+Q (پلێتی ئەرێنی سەرەوە)', // غير موثّق بمصدر
      bottomPlateLabel: '-Q (پلێتی نەرێنی خوارەوە)', // غير موثّق بمصدر
    },
    kmr: {
      title: 'Laboratûwara Kondansatorê (C = ε₀A/d, Q = CV)',
      subtitle: 'Laboratûwara Fîzîkê', // غير موثّق بمصدر
      batteryVoltage: 'Voltaja Bataryayê (V)',
      plateArea: 'Rûbera Pelan (A)',
      separation: 'Dûriya Navberê (d)',
      dielectric: 'Qatjimara Bêguhêzbar (κ)',
      capacitance: 'Kapasîteya Elektrîkî (C)',
      storedCharge: 'Barga Tomarkirî (Q)',
      storedEnergy: 'Enerjiya Tomarkirî (U)',
      electricField: 'Qada Elektrîkê ya Yekreng (E)',
      air: 'Hewa (κ=1)',
      paper: 'Kaxez (κ=3.5)',
      glass: 'Cam (κ=5)',
      reset: 'Nûkirin',
      topPlateLabel: '+Q (Pela Erênî ya Jorîn)', // غير موثّق بمصدر
      bottomPlateLabel: '-Q (Pela Negatîf a Jêrîn)', // غير موثّق بمصدر
    },
  }[lang];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Battery  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{t.title}</h2>
            <p className="text-xs text-slate-400 font-mono">{t.subtitle}</p>
          </div>
        </div>

        <button className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw  className="w-3.5 h-3.5"/>
          {t.reset}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Capacitor Diagram */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative min-h-[340px]">
          {/* Top Plate */}
          <div className="w-full flex flex-col items-center pt-2">
            <div
              style={{ width: `${Math.min(Math.max((plateArea_mm2 / 400) * 100, 30), 90)}%` }}
             className="h-7 bg-gradient-to-r from-red-600 to-rose-500 rounded-lg border border-red-300 shadow-lg flex items-center justify-around px-2 text-white font-mono text-[10px] transition-all">
              {Array.from({ length: Math.min(Math.round(charge_pC * 3), 12) }).map((_, i) => (
                <span key={i} className="font-bold">+</span>
              ))}
            </div>
            <span className="text-[10px] text-red-400 font-semibold mt-0.5">{t.topPlateLabel}</span>
          </div>

          {/* Electric Field Vector Zone */}
          <div
            style={{ height: `${separation_mm * 12}px` }}
           className="w-3/4 my-2 border-x border-dashed border-sky-500/30 flex flex-col justify-around items-center transition-all overflow-hidden relative">
            {/* Field lines */}
            {voltage > 0 && (
              <div className="w-full flex justify-around opacity-75">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center text-sky-400 text-xs animate-bounce">
                    ↓
                  </div>
                ))}
              </div>
            )}
            <span className="text-[10px] text-sky-300/80 font-mono">
              E = {electricField_V_m.toFixed(0)} V/m
            </span>
          </div>

          {/* Bottom Plate */}
          <div className="w-full flex flex-col items-center pb-2">
            <span className="text-[10px] text-blue-400 font-semibold mb-0.5">{t.bottomPlateLabel}</span>
            <div
              style={{ width: `${Math.min(Math.max((plateArea_mm2 / 400) * 100, 30), 90)}%` }}
             className="h-7 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-lg border border-blue-300 shadow-lg flex items-center justify-around px-2 text-white font-mono text-[10px] transition-all">
              {Array.from({ length: Math.min(Math.round(charge_pC * 3), 12) }).map((_, i) => (
                <span key={i} className="font-bold">-</span>
              ))}
            </div>
          </div>

          {/* Meters Bar */}
          <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center">
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-400 block">{t.capacitance}</span>
              <span className="text-sm font-bold text-sky-400 font-mono">{capacitance_pF.toFixed(2)} pF</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-400 block">{t.storedCharge}</span>
              <span className="text-sm font-bold text-amber-400 font-mono">{charge_pC.toFixed(2)} pC</span>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg">
              <span className="text-[10px] text-slate-400 block">{t.storedEnergy}</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{energy_pJ.toFixed(2)} pJ</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Voltage */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-400">{t.batteryVoltage} (V)</span>
                <span className="font-mono text-white text-sm">{voltage.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.1"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Plate Area */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{t.plateArea} (A)</span>
                <span className="font-mono text-white text-sm">{plateArea_mm2} mm²</span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                step="10"
                value={plateArea_mm2}
                onChange={(e) => setPlateArea_mm2(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Separation */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{t.separation} (d)</span>
                <span className="font-mono text-white text-sm">{separation_mm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.5"
                value={separation_mm}
                onChange={(e) => setSeparation_mm(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {/* Dielectric Picker */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-300 block">{t.dielectric}</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-center transition-all ${
                    dielectricK === 1.0 ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {t.air}
                </button>
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-center transition-all ${
                    dielectricK === 3.5 ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {t.paper}
                </button>
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-center transition-all ${
                    dielectricK === 5.0 ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {t.glass}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};