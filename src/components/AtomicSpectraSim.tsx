import { Sparkles, Eye, Zap, BookmarkCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface SpectralLine {
  wavelength: number; // in nanometers (nm)
  color: string;
  intensity: number; // 0.1 to 1.0
  name?: string;
  transition?: string;
  energyEV?: number;
}

interface ElementSpectrum {
  id: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr?: string;
  glowColor: string;
  lines: SpectralLine[];
}

const ELEMENTS: ElementSpectrum[] = [
  {
    id: 'hydrogen',
    nameAr: 'الهيدروجين (سلسلة بالمر)',
    nameEn: 'Hydrogen (Balmer Series)',
    nameKu: 'هایدرۆجین (زنجیرەی باڵمەر)',
    nameKmr: 'Hîdrojen (Rêzika Balmer)',
    glowColor: '#ec4899',
    lines: [
      { wavelength: 656.3, color: '#ef4444', intensity: 1.0, name: 'H-α', transition: 'n=3 → n=2', energyEV: 1.89 },
      { wavelength: 486.1, color: '#06b6d4', intensity: 0.8, name: 'H-β', transition: 'n=4 → n=2', energyEV: 2.55 },
      { wavelength: 434.0, color: '#3b82f6', intensity: 0.6, name: 'H-γ', transition: 'n=5 → n=2', energyEV: 2.86 },
      { wavelength: 410.2, color: '#8b5cf6', intensity: 0.4, name: 'H-δ', transition: 'n=6 → n=2', energyEV: 3.03 },
    ],
  },
  {
    id: 'helium',
    nameAr: 'الهيليوم (He)',
    nameEn: 'Helium (He)',
    nameKu: 'هیلیۆم (He)',
    nameKmr: 'Helyûm (He)',
    glowColor: '#fed7aa',
    lines: [
      { wavelength: 706.5, color: '#dc2626', intensity: 0.7, name: 'He 706' },
      { wavelength: 667.8, color: '#ef4444', intensity: 0.9, name: 'He 667' },
      { wavelength: 587.6, color: '#eab308', intensity: 1.0, name: 'He 587' },
      { wavelength: 501.6, color: '#22c55e', intensity: 0.7, name: 'He 501' },
      { wavelength: 492.2, color: '#06b6d4', intensity: 0.6, name: 'He 492' },
      { wavelength: 471.3, color: '#3b82f6', intensity: 0.6, name: 'He 471' },
      { wavelength: 447.1, color: '#6366f1', intensity: 0.8, name: 'He 447' },
    ],
  },
  {
    id: 'sodium',
    nameAr: 'الصوديوم (ثنائية الخط D)',
    nameEn: 'Sodium (D-Doublet)',
    nameKu: 'سۆدیۆم (دووانەی هێڵی D)',
    nameKmr: 'Sodyûm (Cot-hêşa D)',
    glowColor: '#fbbf24',
    lines: [
      { wavelength: 589.0, color: '#f59e0b', intensity: 1.0, name: 'D₂ Line', energyEV: 2.105 },
      { wavelength: 589.6, color: '#f59e0b', intensity: 0.95, name: 'D₁ Line', energyEV: 2.103 },
    ],
  },
  {
    id: 'mercury',
    nameAr: 'الزئبق (Hg)',
    nameEn: 'Mercury (Hg)',
    nameKu: 'جیوە (Hg)',
    nameKmr: 'Zîbeq (Hg)',
    glowColor: '#bae6fd',
    lines: [
      { wavelength: 579.1, color: '#eab308', intensity: 0.7, name: 'Yellow-2' },
      { wavelength: 577.0, color: '#facc15', intensity: 0.7, name: 'Yellow-1' },
      { wavelength: 546.1, color: '#22c55e', intensity: 1.0, name: 'Green Line' },
      { wavelength: 435.8, color: '#3b82f6', intensity: 0.9, name: 'Blue Line' },
      { wavelength: 404.7, color: '#8b5cf6', intensity: 0.6, name: 'Violet Line' },
    ],
  },
  {
    id: 'neon',
    nameAr: 'النيون (Ne)',
    nameEn: 'Neon (Ne)',
    nameKu: 'نیۆن (Ne)',
    nameKmr: 'Neon (Ne)',
    glowColor: '#f97316',
    lines: [
      { wavelength: 703.2, color: '#b91c1c', intensity: 0.8 },
      { wavelength: 650.6, color: '#dc2626', intensity: 0.9 },
      { wavelength: 640.2, color: '#ef4444', intensity: 1.0 },
      { wavelength: 614.3, color: '#f97316', intensity: 0.8 },
      { wavelength: 588.2, color: '#f59e0b', intensity: 0.7 },
      { wavelength: 585.2, color: '#eab308', intensity: 0.7 },
    ],
  },
];

export default function AtomicSpectraSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const [selectedElementId, setSelectedElementId] = useState<string>('hydrogen');
  const [activeView, setActiveView] = useState<'spectrometer' | 'bohr_model'>('spectrometer');
  const [selectedTransition, setSelectedTransition] = useState<number>(3); // n_initial (3, 4, 5, 6 for Hydrogen)
  const [probeWavelength, setProbeWavelength] = useState<number>(656.3); // nm
  const [logged, setLogged] = useState<boolean>(false);

  const t = {
    ar: {
      title: 'التحليل الطيفي للعناصر والأطياف الذرية (ΔE = hf = hc/λ)',
      bohrModel: 'نموذج بوهر الذري',
      spectrometer: 'جهاز المطياف',
      gasDischarge: 'أنبوب التفريغ الغازي',
      grating: 'محبك الحيود',
      wavelengthRuler: 'الطول الموجي λ (نانومتر)',
      wavelengthLabel: 'الطول الموجي للفوتون (λ)',
      photonEnergyLabel: 'طاقة الفوتون المنبعث (ΔE)',
      frequencyLabel: 'التردد الضوئي (f)',
      energyJoulesLabel: 'طاقة الفوتون بالجول (J)',
      theoryTitle: 'الفيزياء الذرية وقوانين الانبعاث الكمي:',
      theoryDesc: 'تعتبر الأطياف الخطية بمثابة "بصمة إصبع مميزة" لكل عنصر كيميائي؛ فعند إثارة ذرات الغاز، تقفز الإلكترونات لمستويات طاقة أعلى، وعند عودتها لمستويات أدنى تطلق فوتونات بطاقات محددة بدقة: ΔE = E_initial - E_final = h·f = hc/λ. وفي ذرة الهيدروجين تعطي متسلسلة بالمر (العودة إلى المدار n=2) خطوط الطيف المرئي الأربعة الشهيرة.',
      chemElementTitle: 'العنصر الكيميائي والخطوط الطيفية',
      selectElementLabel: 'اختيار العنصر الكيميائي للتحليل:',
      emissionLinesLabel: 'خطوط الطيف المنبعثة للعنصر:',
      hydrogenTransitionLabel: 'انتقال المدار في ذرة الهيدروجين (n_i → n_f=2):',
      loggedSuccess: 'تم تسجيل القياس في دفتر المختبر!', // غير موثّق بمصدر
      logBtn: 'تسجيل طاقة الفوتون والطول الموجي', // غير موثّق بمصدر
    },
    en: {
      title: 'Atomic Emission Spectra & Quantum Photon Transitions',
      bohrModel: 'Bohr Model',
      spectrometer: 'Spectrometer',
      gasDischarge: 'Gas Discharge',
      grating: 'GRATING',
      wavelengthRuler: 'Wavelength λ (nm)',
      wavelengthLabel: 'Wavelength (λ)',
      photonEnergyLabel: 'Photon Energy (ΔE)',
      frequencyLabel: 'Optical Frequency (f)',
      energyJoulesLabel: 'Energy in Joules',
      theoryTitle: 'Atomic Quantum Emission Laws:',
      theoryDesc: 'Line emission spectra act as unique fingerprints for chemical elements. Excited electrons drop to lower orbitals, emitting photons with exact quantized energies: ΔE = hf = hc/λ. The Hydrogen Balmer series represents all electron transitions falling down to the n=2 orbital.',
      chemElementTitle: 'Chemical Element & Spectral Lines',
      selectElementLabel: 'Select Chemical Element:',
      emissionLinesLabel: 'Element Emission Lines:',
      hydrogenTransitionLabel: 'Bohr Orbital Transition (ni → nf=2):',
      loggedSuccess: 'Logged to Lab Notebook!', // غير موثّق بمصدر
      logBtn: 'Log Photon Quantum Data', // غير موثّق بمصدر
    },
    ku: {
      title: 'شیکاری سپێکتڕۆمی توخمەکان و سپێکتڕۆمی گەردیلەیی',
      bohrModel: 'مۆدێلی بۆر',
      spectrometer: 'ئامێری سپێکتڕۆمیتەر', // غير موثّق بمصدر
      gasDischarge: 'بۆڕی تخلەی گاز', // غير موثّق بمصدر
      grating: 'تۆڕی پەرشبوون', // غير موثّق بمصدر
      wavelengthRuler: 'درێژی شەپۆل λ (nm)',
      wavelengthLabel: 'درێژی شەپۆلی فۆتۆن (λ)',
      photonEnergyLabel: 'توانای فۆتۆنی دەرچوو (ΔE)',
      frequencyLabel: 'لەرەلەری ڕووناکی (f)',
      energyJoulesLabel: 'توانای فۆتۆن بە ژول (J)',
      theoryTitle: 'فیزیکی گەردیلەیی و یاساکانی دەرچوونی کوانتەم:', // غير موثّق بمصدر
      theoryDesc: 'سپێکتڕۆمی هێڵی وەک پەنجەمۆر وایە بۆ توخمە کیمیاییەکان. کاتێک ئەلیکترۆنە دەرپەڕیوەکان دادەبەزن بۆ ئاستی نزمتر، فۆتۆن بە توانای دیاریکراوەوە دەردەدەن: ΔE = hf = hc/λ.',
      chemElementTitle: 'توخمی کیمیایی و هێڵەکانی سپێکتڕۆم', // غير موثّق بمصدر
      selectElementLabel: 'هەڵبژاردنی توخمی کیمیایی:', // غير موثّق بمصدر
      emissionLinesLabel: 'هێڵەکانی سپێکتڕۆمی دەردراو:', // غير موثّق بمصدر
      hydrogenTransitionLabel: 'گواستنەوەی خولگە لە گەردیلەی هایدرۆجین (n_i → n_f=2):', // غير موثّق بمصدر
      loggedSuccess: 'تۆمارکرا لە دەفتەری تاقیگە!', // غير موثّق بمصدر
      logBtn: 'تۆمارکردنی زانیاری فۆتۆن', // غير موثّق بمصدر
    },
    kmr: {
      title: 'Analîza Spektrûma Atomî û Veguhestina Kuantumî', // غير موثّق بمصدر
      bohrModel: 'Mawdelê Bohr', // غير موثّق بمصدر
      spectrometer: 'Spektrometre', // غير موثّق بمصدر
      gasDischarge: 'Tûba valakirina gazê', // غير موثّق بمصدر
      grating: 'Şebekeya tewandinê', // غير موثّق بمصدر
      wavelengthRuler: 'Dirêjahiya pêlê λ (nm)',
      wavelengthLabel: 'Dirêjahiya pêla fotonê (λ)',
      photonEnergyLabel: 'Anargiya fotonê derketî (ΔE)',
      frequencyLabel: 'Lêdana ronahiyê (f)',
      energyJoulesLabel: 'Anargî bi Joule (J)',
      theoryTitle: 'Fîzîka atomî û qanûnên derketina kuantumî:', // غير موثّق بمصدر
      theoryDesc: 'Spektrûmên xêzî wekî şopek taybet in ji bo hêmanên kîmyayî. Dema ku elektronên excited dadikevin astên nizm tir, fotonan bi anargiyên diyarkirî derdixin: ΔE = hf = hc/λ.',
      chemElementTitle: 'Hêmana kîmyayî û xêzên spektrûmê', // غير موثّق بمصدر
      selectElementLabel: 'Hilbijartina hêmana kîmyayî:', // غير موثّق بمصدر
      emissionLinesLabel: 'Xêzên spektrûmê derketî:', // غير موثّق بمصدر
      hydrogenTransitionLabel: 'Veguhestina rênîşan di atoma hîdrojenê de (n_i → n_f=2):', // غير موثّق بمصدر
      loggedSuccess: 'Hat tomarkirin di defterê de!', // غير موثّق بمصدر
      logBtn: 'Tomarkirina daneyên kuantumî yên fotonê', // غير موثّق بمصدر
    },
  }[lang] || {
    title: 'التحليل الطيفي للعناصر والأطياف الذرية (ΔE = hf = hc/λ)',
    bohrModel: 'نموذج بوهر الذري',
    spectrometer: 'جهاز المطياف',
    gasDischarge: 'أنبوب التفريغ الغازي',
    grating: 'محبك الحيود',
    wavelengthRuler: 'الطول الموجي λ (نانومتر)',
    wavelengthLabel: 'الطول الموجي للفوتون (λ)',
    photonEnergyLabel: 'طاقة الفوتون المنبعث (ΔE)',
    frequencyLabel: 'التردد الضوئي (f)',
    energyJoulesLabel: 'طاقة الفوتون بالجول (J)',
    theoryTitle: 'الفيزياء الذرية وقوانين الانبعاث الكمي:',
    theoryDesc: 'تعتبر الأطياف الخطية بمثابة "بصمة إصبع مميزة" لكل عنصر كيميائي؛ فعند إثارة ذرات الغاز، تقفز الإلكترونات لمستويات طاقة أعلى، وعند عودتها لمستويات أدنى تطلق فوتونات بطاقات محددة بدقة: ΔE = E_initial - E_final = h·f = hc/λ. وفي ذرة الهيدروجين تعطي متسلسلة بالمر (العودة إلى المدار n=2) خطوط الطيف المرئي الأربعة الشهيرة.',
    chemElementTitle: 'العنصر الكيميائي والخطوط الطيفية',
    selectElementLabel: 'اختيار العنصر الكيميائي للتحليل:',
    emissionLinesLabel: 'خطوط الطيف المنبعثة للعنصر:',
    hydrogenTransitionLabel: 'انتقال المدار في ذرة الهيدروجين (n_i → n_f=2):',
    loggedSuccess: 'تم تسجيل القياس في دفتر المختبر!',
    logBtn: 'تسجيل طاقة الفوتون والطول الموجي',
  };

  const selectedElement = ELEMENTS.find((e) => e.id === selectedElementId) ?? ELEMENTS[0];

  // Fundamental Constants
  const h_Planck = 6.62607015e-34; // J*s
  const c_Light = 2.99792458e8; // m/s
  const eV_to_J = 1.602176634e-19; // J/eV

  // Photon Energy Calculations for probed wavelength
  const probeWavelengthMeters = probeWavelength * 1e-9;
  const photonEnergyJoules = (h_Planck * c_Light) / probeWavelengthMeters;
  const photonEnergyEV = photonEnergyJoules / eV_to_J;
  const photonFrequencyTHz = (c_Light / probeWavelengthMeters) / 1e12; // THz

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Wavelength to RGB Conversion for continuous spectrum
  const wavelengthToColor = (wl: number): string => {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) {
      r = -(wl - 440) / (440 - 380);
      b = 1.0;
    } else if (wl >= 440 && wl < 490) {
      g = (wl - 440) / (490 - 440);
      b = 1.0;
    } else if (wl >= 490 && wl < 510) {
      g = 1.0;
      b = -(wl - 510) / (510 - 490);
    } else if (wl >= 510 && wl < 580) {
      r = (wl - 510) / (580 - 510);
      g = 1.0;
    } else if (wl >= 580 && wl < 645) {
      r = 1.0;
      g = -(wl - 645) / (645 - 580);
    } else if (wl >= 645 && wl <= 780) {
      r = 1.0;
    }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  };

  // Canvas Animation & Rendering
  useEffect(() => {
    let animTime = 0;

    const render = () => {
      animTime += 0.03;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (activeView === 'spectrometer') {
        // Discharge Gas Tube Visual on Top Left
        const tubeX = 40;
        const tubeY = 40;
        const tubeW = 20;
        const tubeH = 120;

        // Tube Glow Glow Effect
        const tubeGrad = ctx.createRadialGradient(tubeX + tubeW / 2, tubeY + tubeH / 2, 2, tubeX + tubeW / 2, tubeY + tubeH / 2, 60);
        tubeGrad.addColorStop(0, selectedElement.glowColor);
        tubeGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = tubeGrad;
        ctx.fillRect(tubeX - 40, tubeY - 20, tubeW + 80, tubeH + 40);

        // Glass Tube & Electrodes
        ctx.fillStyle = selectedElement.glowColor;
        ctx.fillRect(tubeX, tubeY, tubeW, tubeH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tubeX, tubeY, tubeW, tubeH);

        ctx.fillStyle = '#64748b';
        ctx.fillRect(tubeX - 2, tubeY - 8, tubeW + 4, 8);
        ctx.fillRect(tubeX - 2, tubeY + tubeH, tubeW + 4, 8);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px sans-serif';
        ctx.fillText(t.gasDischarge, tubeX - 10, tubeY + tubeH + 24);

        // Spectrometer Slit & Collimator Lens
        const slitX = 140;
        ctx.fillStyle = '#334155';
        ctx.fillRect(slitX, tubeY + 20, 6, 80);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(slitX + 2, tubeY + 55, 2, 10);

        // Diffraction Grating / Prism in middle
        const gratingX = 220;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gratingX, tubeY + 20);
        ctx.lineTo(gratingX + 30, tubeY + 60);
        ctx.lineTo(gratingX, tubeY + 100);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px sans-serif';
        ctx.fillText(t.grating, gratingX - 8, tubeY + 115);

        // Dispersed Light Rays
        selectedElement.lines.forEach((line) => {
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gratingX + 15, tubeY + 60);
          const targetSpectrogramX = 350 + ((line.wavelength - 380) / (750 - 380)) * 310;
          ctx.lineTo(targetSpectrogramX, 70);
          ctx.stroke();
        });

        // Main Spectrometer Photographic Spectrum Bar (380 nm to 750 nm)
        const specX = 70;
        const specY = 220;
        const specW = 560;
        const specH = 65;

        // Dark Spectrum Background
        ctx.fillStyle = '#05070d';
        ctx.fillRect(specX, specY, specW, specH);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(specX, specY, specW, specH);

        // Draw Element Spectral Lines inside Spectrum Bar
        selectedElement.lines.forEach((line) => {
          const lineX = specX + ((line.wavelength - 380) / (750 - 380)) * specW;

          // Glow line
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(lineX, specY);
          ctx.lineTo(lineX, specY + specH);
          ctx.stroke();

          // Label above line
          ctx.fillStyle = line.color;
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${line.wavelength.toFixed(1)}nm`, lineX, specY - 6);
          if (line.name) {
            ctx.font = '9px sans-serif';
            ctx.fillText(line.name, lineX, specY + specH + 14);
          }
        });

        // Calibrated Wavelength Scale Ruler under Spectrogram
        const rulerY = specY + specH + 30;
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(specX, rulerY);
        ctx.lineTo(specX + specW, rulerY);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        for (let wl = 400; wl <= 750; wl += 50) {
          const rx = specX + ((wl - 380) / (750 - 380)) * specW;
          ctx.beginPath();
          ctx.moveTo(rx, rulerY - 4);
          ctx.lineTo(rx, rulerY + 4);
          ctx.stroke();
          ctx.fillText(`${wl}`, rx, rulerY + 15);
        }
        ctx.fillText(t.wavelengthRuler, specX + specW / 2, rulerY + 30);
      } else {
        // Bohr Model Atomic Quantum Jumps Visualizer (Hydrogen)
        const atomCenterX = width * 0.48;
        const atomCenterY = height * 0.48;

        // Nucleus
        ctx.beginPath();
        ctx.arc(atomCenterX, atomCenterY, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+1', atomCenterX, atomCenterY + 4);

        // Circular Orbitals n=1, 2, 3, 4, 5, 6
        const orbitRadii = [40, 75, 115, 150, 185, 220];

        orbitRadii.forEach((r, idx) => {
          const n = idx + 1;
          ctx.strokeStyle = n === 2 ? '#38bdf8' : n === selectedTransition ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = n === 2 || n === selectedTransition ? 2 : 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(atomCenterX, atomCenterY, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px monospace';
          ctx.fillText(`n=${n}`, atomCenterX + r - 12, atomCenterY - 6);
        });

        // Jumping Electron along Transition Vector
        const currentLine = selectedElement.lines.find((l) => l.transition?.includes(`n=${selectedTransition}`)) ?? selectedElement.lines[0];
        const rInitial = orbitRadii[selectedTransition - 1];
        const rFinal = orbitRadii[1]; // n=2 for Balmer

        // Emitted Photon Wave Packet flying outwards
        const photonAngle = animTime * 4;
        const photonR = rFinal + (animTime * 60) % 180;
        const px = atomCenterX + photonR * Math.cos(0.5);
        const py = atomCenterY - photonR * Math.sin(0.5);

        ctx.strokeStyle = currentLine.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = currentLine.color;
        ctx.fill();

        ctx.fillStyle = currentLine.color;
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`Photon hf (λ = ${currentLine.wavelength} nm, ΔE = ${currentLine.energyEV} eV)`, px + 14, py);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedElement, activeView, selectedTransition, probeWavelength, lang]);

  const getElementName = (elem: ElementSpectrum) => {
    const names: Record<string, string> = {
      ar: elem.nameAr,
      ku: elem.nameKu,
      kmr: elem.nameKmr || elem.nameEn,
      en: elem.nameEn,
    };
    return names[lang] || elem.nameAr;
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'atomic_spectra',
      parameters: {
        element: getElementName(selectedElement),
        wavelength: `${probeWavelength.toFixed(1)} nm`,
        frequency: `${photonFrequencyTHz.toFixed(1)} THz`,
        energyEV: `${photonEnergyEV.toFixed(3)} eV`,
      },
      variableName: 'Photon Emission Energy (ΔE = hc/λ)',
      measuredValue: Number(photonEnergyEV.toFixed(3)),
      theoreticalValue: Number(photonEnergyEV.toFixed(3)),
      unit: 'eV',
      equation: 'ΔE = h·f = (h·c)/λ',
      notes: `Element: ${getElementName(selectedElement)}, λ=${probeWavelength}nm, ΔE=${photonEnergyEV.toFixed(3)} eV (${(photonEnergyJoules * 1e19).toFixed(2)}×10⁻¹⁹ J), f=${photonFrequencyTHz.toFixed(1)} THz`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="atomic-spectra-simulation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simulation Stage */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Sparkles  className="w-5 h-5"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {t.title}
                </h3>
                <p className="text-sm text-zinc-400 font-mono">
                  ΔE = {photonEnergyEV.toFixed(3)} eV • f = {photonFrequencyTHz.toFixed(1)} THz • λ = {probeWavelength.toFixed(1)} nm
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 flex items-center gap-1.5 border border-zinc-700"
              >
                <Eye  className="w-3.5 h-3.5 text-sky-400"/>
                <span>{activeView === 'spectrometer' ? t.bohrModel : t.spectrometer}</span>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center items-center bg-zinc-950/70 rounded-xl border border-zinc-800/60 overflow-hidden">
            <canvas ref={canvasRef} width={700} height={380}  className="max-w-full h-auto"/>
          </div>

          {/* Real-time Quantum Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.wavelengthLabel}</div>
              <div className="text-base font-bold font-mono text-pink-400">
                {probeWavelength.toFixed(1)} <span className="text-sm text-zinc-400">nm</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.photonEnergyLabel}</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {photonEnergyEV.toFixed(3)} <span className="text-sm text-zinc-400">eV</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.frequencyLabel}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {photonFrequencyTHz.toFixed(1)} <span className="text-sm text-zinc-400">THz</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.energyJoulesLabel}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {(photonEnergyJoules * 1e19).toFixed(2)} <span className="text-[10px] text-zinc-400">×10⁻¹⁹ J</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quantum Theory Card */}
        <div className="p-4 rounded-2xl bg-pink-950/20 border border-pink-800/30 text-xs text-zinc-300 space-y-2">
          <div className="font-semibold text-pink-300 flex items-center gap-1.5">
            <Zap  className="w-4 h-4"/>
            <span>{t.theoryTitle}</span>
          </div>
          <p>
            {t.theoryDesc}
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
          <h4 className="text-sm font-bold text-zinc-200 pb-2 border-b border-zinc-800">
            {t.chemElementTitle}
          </h4>

          {/* Element Selection Buttons */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">{t.selectElementLabel}</label>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {ELEMENTS.map((elem) => (
                <button className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-start font-medium flex items-center justify-between border ${
                    selectedElementId === elem.id
                      ? 'bg-pink-950/40 text-pink-300 border-pink-500/60 shadow-md'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span style={{ backgroundColor: elem.glowColor }}  className="w-3 h-3 rounded-full inline-block"/>
                    {getElementName(elem)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">{elem.lines.length} lines</span>
                </button>
              ))}
            </div>
          </div>

          {/* Spectral Lines for current element */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            <label className="text-sm text-zinc-400">{t.emissionLinesLabel}</label>
            <div className="grid grid-cols-2 gap-1.5 text-xs max-h-44 overflow-y-auto pr-1">
              {selectedElement.lines.map((line) => (
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-xl text-center font-mono border ${
                    probeWavelength === line.wavelength
                      ? 'bg-zinc-800 text-pink-300 border-pink-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold flex items-center justify-center gap-1.5">
                    <span style={{ backgroundColor: line.color }}  className="w-2 h-2 rounded-full inline-block"/>
                    {line.wavelength.toFixed(1)} nm
                  </div>
                  {line.name && <div className="text-[10px] text-zinc-400">{line.name}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Hydrogen Transitions Selector if Hydrogen selected */}
          {selectedElementId === 'hydrogen' && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <label className="text-sm text-zinc-400">{t.hydrogenTransitionLabel}</label>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {[3, 4, 5, 6].map((n) => (
                  <button className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-bold font-mono text-center ${
                      selectedTransition === n ? 'bg-pink-600 text-white' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {n} → 2
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Log Measurement Button */}
          <button className={`min-h-[44px] min-w-[44px] min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${ logged ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-900/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>
              {logged ? t.loggedSuccess : t.logBtn}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}