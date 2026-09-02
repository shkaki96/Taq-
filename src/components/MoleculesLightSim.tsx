import { Waves } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface MoleculesLightSimProps {
  lang: Language;
}

export const MoleculesLightSim: React.FC<MoleculesLightSimProps> = ({ lang }) => {
  const [lightType, setLightType] = useState<'microwave' | 'infrared' | 'visible' | 'uv'>('infrared');
  const [molecule, setMolecule] = useState<'co2' | 'h2o' | 'n2' | 'o3'>('co2');
  const [isEmitting, setIsEmitting] = useState<boolean>(true);
  const [animTick, setAnimTick] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    const update = () => {
      if (isEmitting) {
        setAnimTick((prev) => (prev + 1) % 360);
      }
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [isEmitting]);

  // Physics interaction rules
  // CO2: absorbs IR (vibration), passes Microwave, passes Visible, dissociates with UV
  // H2O: absorbs Microwave (rotation) & IR (vibration)
  // N2: non-polar symmetric -> transparent to Microwave & IR
  // O3: absorbs UV strongly (stratospheric ozone shielding)
  const doesAbsorb =
    (molecule === 'co2' && (lightType === 'infrared' || lightType === 'uv')) ||
    (molecule === 'h2o' && (lightType === 'microwave' || lightType === 'infrared')) ||
    (molecule === 'o3' && lightType === 'uv');

  const effectType = !doesAbsorb
    ? 'transmitted'
    : lightType === 'microwave'
    ? 'rotation'
    : lightType === 'infrared'
    ? 'vibration'
    : lightType === 'uv'
    ? 'dissociation'
    : 'transmitted';

  const t = {
    ar: {
      title: 'تفاعل الجزيئات والضوء (Photon Absorption)',
      lightSource: 'نوع المصدر الإشعاعي (Photon Energy)',
      microwave: 'ميكروويف (طاقة منخفضة - دوران)',
      infrared: 'تحت حمراء (طاقة متوسطة - اهتزاز)',
      visible: 'ضوء مرئي (طاقة إلكترونية)',
      uv: 'فوق بنفسجي (طاقة عالية - تفكك كيميائي)',
      targetMolecule: 'الجزيء الهدف',
      co2: 'ثاني أكسيد الكربون (CO₂ - غاز دفيئة)',
      h2o: 'بخار الماء (H₂O - قطبي)',
      n2: 'النيتروجين (N₂ - غير قطبي)',
      o3: 'الأوزون (O₃ - حامي من الأشعة)',
      effect: 'التأثير المجهري الملاحظ',
      rotationMsg: '🌀 امتصاص الفوتونات يسبب دوران الجزيء ثنائي القطب.',
      vibrationMsg: '🔥 امتصاص الأشعة تحت الحمراء يسبب اهتزاز الروابط الكيميائية (الاحتباس الحراري).',
      dissociationMsg: '💥 طاقة الفوتون الفوق بنفسجي تكسر الروابط التساهمية وتفكك الجزيء.',
      transmittedMsg: '✨ الفوتونات تمر عبر الجزيء دون امتصاص (شفافية تامة).',
      toggleEmitter: 'تشغيل / إيقاف منبع الضوء',
    },
    en: {
      title: 'Molecules & Light Interaction Lab',
      lightSource: 'Photon Energy & Radiation Type',
      microwave: 'Microwave (Rotation)',
      infrared: 'Infrared (Bond Vibration)',
      visible: 'Visible Light',
      uv: 'Ultraviolet (Dissociation)',
      targetMolecule: 'Target Molecule',
      co2: 'Carbon Dioxide (CO₂)',
      h2o: 'Water Vapor (H₂O)',
      n2: 'Nitrogen (N₂)',
      o3: 'Ozone (O₃)',
      effect: 'Microscopic Interaction Mode',
      rotationMsg: '🌀 Photons induce molecular dipole rotation.',
      vibrationMsg: '🔥 IR absorption causes bond stretching/bending (Greenhouse Effect).',
      dissociationMsg: '💥 High-energy UV photon breaks covalent bonds (Photodissociation).',
      transmittedMsg: '✨ Photons pass straight through without absorption.',
      toggleEmitter: 'Toggle Photon Emitter',
    },
    ku: {
      title: 'کارلێکی گەردەکان و تیشکی ڕووناکی',
      lightSource: 'جۆری تیشکدان',
      microwave: 'مایکرۆوەیڤ (خولانەوە)',
      infrared: 'ژێر سوور (لەرزین)',
      visible: 'ڕووناکی بینراو',
      uv: 'سەروو بنەوشەیی (هەڵوەشاندن)',
      targetMolecule: 'گەردی ئامانج',
      co2: 'دووەم ئۆکسیدی کاربۆن (CO₂)',
      h2o: 'هەڵمی ئاو (H₂O)',
      n2: 'نایترۆجین (N₂)',
      o3: 'ئۆزۆن (O₃)',
      effect: 'کاریگەری مایکڕۆسکۆپی',
      rotationMsg: '🌀 فۆتۆنەکان دەبنە هۆی خولانەوەی گەردەکە.',
      vibrationMsg: '🔥 هەڵمژینی تیشکی ژێر سوور دەبێتە هۆی لەرزینی بەستەرەکان.',
      dissociationMsg: '💥 وزەی بەرز بەستەرەکان دەپچڕێنێت.',
      transmittedMsg: '✨ فۆتۆنەکان بەبێ هەڵمژین تێدەپەڕن.',
      toggleEmitter: 'داگیرساندن / کوژاندنەوە',
    },
    kmr: {
      title: 'Têkiliya Molekulan bi Ronahiyê re',
      lightSource: 'Cureyê Tîrêjê',
      microwave: 'Mîkropêl (Zivirîn)',
      infrared: 'Bin-sor (Lerzîna Bendan)',
      visible: 'Ronahiya Xuyanî',
      uv: 'Ser-binefşî (Şikestina Bendan)',
      targetMolecule: 'Molekula Hedefê',
      co2: 'Duyem Oksîda Karbonê (CO₂)',
      h2o: 'Hilma Avê (H₂O)',
      n2: 'Nîtrojen (N₂)',
      o3: 'Ozon (O₃)',
      effect: 'Bandora Mîkroskopîk',
      rotationMsg: '🌀 Foton dibin sedema zivirîna molekulê.',
      vibrationMsg: '🔥 Tîrêjên bin-sor bendên kîmyewî dilerizînin.',
      dissociationMsg: '💥 Fotona bi hêz bendan dişkîne.',
      transmittedMsg: '✨ Foton rasterast derbas dibin bêyî ku werin mijandin.',
      toggleEmitter: 'Vekirin / Girtina Çavkaniyê',
    },
  }[lang];

  // Colors based on light type
  const photonColor =
    lightType === 'microwave'
      ? '#38bdf8'
      : lightType === 'infrared'
      ? '#ef4444'
      : lightType === 'visible'
      ? '#22c55e'
      : '#c084fc';

  // Dynamic animation transform
  let transformStyle = '';
  if (effectType === 'rotation') {
    transformStyle = `rotate(${animTick * 3}deg)`;
  } else if (effectType === 'vibration') {
    const vib = Math.sin((animTick * Math.PI) / 8) * 8;
    transformStyle = `scale(${1 + vib * 0.02}) rotate(${vib * 0.8}deg)`;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            <Waves  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{t.title}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 6</p>
          </div>
        </div>

        <button
          onClick={() => setIsEmitting(!isEmitting)}
          className="min-h-[44px] min-w-[44px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors"
        >
          {isEmitting ? '⏸️ إيقاف الحزمة' : '▶️ إطلاق الفوتونات'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Chamber and Status Banner */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[300px] overflow-hidden">
            {/* Incoming Photon Beam Animation */}
            {isEmitting && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-3 animate-pulse">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: photonColor }}
                   className="w-3.5 h-3.5 rounded-full shadow-lg shadow-current"/>
                ))}
              </div>
            )}

            {/* Target Molecule in center */}
            <div
              style={{ transform: transformStyle }}
             className="transition-transform duration-75 flex items-center justify-center p-6">
              {molecule === 'co2' && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                    O
                  </div>
                  <div className="w-6 h-1.5 bg-slate-500 rounded"></div>
                  <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-black text-sm text-white shadow-xl">
                    C
                  </div>
                  <div className="w-6 h-1.5 bg-slate-500 rounded"></div>
                  <div className="w-9 h-9 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                    O
                  </div>
                </div>
              )}

              {molecule === 'h2o' && (
                <div className="relative w-28 h-24 flex items-center justify-center">
                  <div className="absolute top-0 w-12 h-12 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center font-black text-sm text-white shadow-xl">
                    O
                  </div>
                  <div className="absolute bottom-1 left-2 w-7 h-7 rounded-full bg-sky-300 border-2 border-white flex items-center justify-center font-bold text-xs text-slate-900 shadow-md">
                    H
                  </div>
                  <div className="absolute bottom-1 right-2 w-7 h-7 rounded-full bg-sky-300 border-2 border-white flex items-center justify-center font-bold text-xs text-slate-900 shadow-md">
                    H
                  </div>
                </div>
              )}

              {molecule === 'n2' && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-blue-400 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                    N
                  </div>
                  <div className="w-5 h-2 bg-blue-300 rounded"></div>
                  <div className="w-10 h-10 rounded-full bg-blue-600 border-2 border-blue-400 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                    N
                  </div>
                </div>
              )}

              {molecule === 'o3' && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-600 border-2 border-cyan-400 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                    O
                  </div>
                  <div className="w-8 h-8 rounded-full bg-cyan-500 border-2 border-cyan-300 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                    O
                  </div>
                  <div className="w-8 h-8 rounded-full bg-cyan-600 border-2 border-cyan-400 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                    O
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interaction status banner (Cleanly outside the visual stage) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center text-xs shadow-sm">
            <span className="text-amber-300 font-semibold block mb-0.5">{t.effect}:</span>
            <p className="text-slate-200">
              {effectType === 'rotation'
                ? t.rotationMsg
                : effectType === 'vibration'
                ? t.vibrationMsg
                : effectType === 'dissociation'
                ? t.dissociationMsg
                : t.transmittedMsg}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">{t.lightSource}</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => setLightType('microwave')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    lightType === 'microwave' ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  📡 {t.microwave}
                </button>
                <button
                  onClick={() => setLightType('infrared')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    lightType === 'infrared' ? 'bg-red-500/20 border-red-500 text-red-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  🔥 {t.infrared}
                </button>
                <button
                  onClick={() => setLightType('visible')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    lightType === 'visible' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  🌈 {t.visible}
                </button>
                <button
                  onClick={() => setLightType('uv')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    lightType === 'uv' ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  ⚡ {t.uv}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">{t.targetMolecule}</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => setMolecule('co2')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    molecule === 'co2' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  🌍 {t.co2}
                </button>
                <button
                  onClick={() => setMolecule('h2o')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    molecule === 'h2o' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  💧 {t.h2o}
                </button>
                <button
                  onClick={() => setMolecule('n2')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    molecule === 'n2' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  💨 {t.n2}
                </button>
                <button
                  onClick={() => setMolecule('o3')}
                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border text-left transition-all ${
                    molecule === 'o3' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  🛡️ {t.o3}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};