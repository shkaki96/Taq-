import { Activity, BookmarkCheck, Cpu, ShieldAlert } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface MaterialSpec {
  id: string;
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  youngModulusGPa: number; // GPa
  yieldStrengthMPa: number; // MPa
  tensileStrengthMPa: number; // Ultimate MPa
  color: string;
}

const MATERIALS: MaterialSpec[] = [
  { id: 'steel', nameAr: 'الفولاذ الإنشائي (Structural Steel)', nameEn: 'Structural Steel', nameKu: 'پۆڵای بیناسازی', nameKmr: 'Pola (Structural Steel)', youngModulusGPa: 200, yieldStrengthMPa: 250, tensileStrengthMPa: 400, color: '#94a3b8' },
  { id: 'aluminium', nameAr: 'الألومنيوم (Aluminium Alloy)', nameEn: 'Aluminium Alloy', nameKu: 'ئەلۆمینیۆم', nameKmr: 'Aloyaja Alumînyumê', youngModulusGPa: 70, yieldStrengthMPa: 95, tensileStrengthMPa: 110, color: '#cbd5e1' },
  { id: 'copper', nameAr: 'النحاس (Copper)', nameEn: 'Copper', nameKu: 'مس', nameKmr: 'Mis', youngModulusGPa: 110, yieldStrengthMPa: 70, tensileStrengthMPa: 220, color: '#f97316' },
  { id: 'titanium', nameAr: 'التيتانيوم (Titanium Grade 5)', nameEn: 'Titanium Grade 5', nameKu: 'تیتانیۆم', nameKmr: 'Tîtanîum', youngModulusGPa: 115, yieldStrengthMPa: 880, tensileStrengthMPa: 950, color: '#a855f7' },
  { id: 'brass', nameAr: 'سبيكة النحاس الأصفر (Brass)', nameEn: 'Brass Alloy', nameKu: 'برنج', nameKmr: 'Pirinc', youngModulusGPa: 100, yieldStrengthMPa: 200, tensileStrengthMPa: 380, color: '#eab308' },
  { id: 'wood', nameAr: 'خشب البلوط (Oak Wood)', nameEn: 'Oak Wood', nameKu: 'دار بەڕوو', nameKmr: 'Darê Berûyê', youngModulusGPa: 12, yieldStrengthMPa: 40, tensileStrengthMPa: 60, color: '#a16207' },
  { id: 'rubber', nameAr: 'المطاط الصناعي (Elastomer Rubber)', nameEn: 'Synthetic Rubber', nameKu: 'لاستیک', nameKmr: 'Lastîk', youngModulusGPa: 0.05, yieldStrengthMPa: 10, tensileStrengthMPa: 20, color: '#10b981' },
];

export default function StressStrainSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const t = {
    ar: {
      title: 'الإجهاد والانفعال ومعامل يونج',
      desc: 'دراسة المرونة الميكانيكية للمواد الصلبة، قانون هوك σ = E · ε، حدود الخضوع المرن، ونقطة الانقطاع.',
      logged: 'تم التسجيل في الدفتر ✓', // غير موثّق بمصدر
      log: 'تسجيل في دفتر المختبر', // غير موثّق بمصدر
      testParams: 'معايير الاختبار والمادة', // غير موثّق بمصدر
      selectMaterial: 'اختيار مادة العينة:',
      appliedForce: 'قوة الشد المطبقة (F):',
      crossArea: 'مساحة المقطع العرضي (A):',
      initialLength: 'الطول الأصلي للعينة (L₀):',
      manualOverride: 'قياس الاستطالة يدوياً (ΔL):',
      manualHelp: 'أدخل الاستطالة المقاسة لحساب معامل يونج تجريبياً', // غير موثّق بمصدر
      fractured: 'تحذير: انقطاع وكسر العينة (Fracture!)',
      plasticYield: 'تجاوز حد الخضوع: تشوه لدن دائم (Plastic Yield)',
      linearElastic: 'المنطقة المرنة الخطية: قانون هوك سارٍ',
      stress: 'الإجهاد الميكانيكي (σ)',
      strain: 'الانفعال الخطي (ε)',
      youngModulus: 'معامل يونج المحسوب (E)',
      strainEnergy: 'طاقة الانفعال الحجمية (u)',
    },
    en: {
      title: 'Stress, Strain & Young’s Modulus',
      desc: 'Investigation of solid mechanics elasticity, Hooke’s law σ = E · ε, yield strength, and fracture limits.',
      logged: 'Logged ✓', // غير موثّق بمصدر
      log: 'Log Measurement', // غير موثّق بمصدر
      testParams: 'Test Parameters & Material', // غير موثّق بمصدر
      selectMaterial: 'Specimen Material:',
      appliedForce: 'Applied Tensile Force (F):',
      crossArea: 'Cross-Section Area (A):',
      initialLength: 'Initial Length (L₀):',
      manualOverride: 'Manual Elongation Override:',
      manualHelp: 'Input measured ΔL to derive experimental E', // غير موثّق بمصدر
      fractured: 'Warning: Specimen Fractured!',
      plasticYield: 'Plastic Deformation (Yield Point Exceeded)',
      linearElastic: 'Linear Elastic Region (Hooke’s Law Valid)',
      stress: 'Stress (σ = F/A)',
      strain: 'Strain (ε = ΔL/L₀)',
      youngModulus: 'Calculated Young’s Modulus (E)',
      strainEnergy: 'Strain Energy Density (u)',
    },
    ku: {
      title: 'تەنگژە و گرژبوون و هاوکۆلکەی یۆنگ بۆ ماددەکان',
      desc: 'لێکۆڵینەوە لە نەرمی و پتەوی ماددەکان، یاسای هووک σ = E · ε و سنووری شکان.',
      logged: 'تۆمارکرا لە دەفتەر ✓', // غير موثّق بمصدر
      log: 'تۆمارکردنی پێوانە', // غير موثّق بمصدر
      testParams: 'تایبەتمەندییەکانی تاقیکردنەوە و ماددە', // غير موثّق بمصدر
      selectMaterial: 'هەڵبژاردنی ماددەی نموونە:',
      appliedForce: 'هێزی ڕاکێشانی جێبەجێکراو (F):',
      crossArea: 'ڕووبەری بڕگە (A):',
      initialLength: 'درێژیی سەرەتایی (L₀):',
      manualOverride: 'دەستکاریکردنی دەستیی درێژبوونەوە (ΔL):',
      manualHelp: 'درێژبوونەوەی پێوراو بنووسە بۆ هەژمارکردنی Eی تاقیکاری', // غير موثّق بمصدر
      fractured: 'ئاگەداری: پچڕان و شکانی نموونەکە!',
      plasticYield: 'تێپەڕاندنی سنووری نەرمی: شێواندنی هەمیشەیی',
      linearElastic: 'ناوچەی نەرمی هێڵی: یاسای هووک جێبەجێ دەبێت',
      stress: 'پەستان/تەنگژە (σ)',
      strain: 'کشان/گرژبوون (ε)',
      youngModulus: 'مۆدیۆلی یۆنگی هەژمارکراو (E)',
      strainEnergy: 'چڕیی وزەی کشان (u)',
    },
    kmr: {
      title: 'Pextan, Kşan û Modula Young',
      desc: 'Lêkolîna li ser elastîkiya materyalan, zagona Hooke σ = E · ε, sînorê elastîk û xala şikênandinê.',
      logged: 'Hat tomarkirin ✓', // غير موثّق بمصدر
      log: 'Tomarkirina pîvanê', // غير موثّق بمصدر
      testParams: 'Parametreyên azmûnê û materyal', // غير موثّق بمصدر
      selectMaterial: 'Hêlbijartina materyalê mînakê:',
      appliedForce: 'Hêza kişandinê ya sepandî (F):',
      crossArea: 'Rûberê birrê (A):',
      initialLength: 'Dirêjahiya destpêkê (L₀):',
      manualOverride: 'Guherandina destî ya dirêjbûnê (ΔL):',
      manualHelp: 'Dirêjbûna pîvawî binivîse ji bo hesabkirina E ya azmûnî', // غير موثّق بمصدر
      fractured: 'Hişyarî: Şikênandina mînakê!',
      plasticYield: 'Buhurbûna sînorê elastîk: Deformasyona daîmî',
      linearElastic: 'Herêma elastîk a rêzî: Zagona Hooke derbasdar e',
      stress: 'Pextana mekanîkî (σ)',
      strain: 'Kşana rêzî (ε)',
      youngModulus: 'Modula Young a hesabkirî (E)',
      strainEnergy: 'Tirşiya anarşiya kşanê (u)',
    },
  }[lang] || {
    title: 'الإجهاد والانفعال ومعامل يونج',
    desc: 'دراسة المرونة الميكانيكية للمواد الصلبة، قانون هوك σ = E · ε، حدود الخضوع المرن، ونقطة الانقطاع.',
    logged: 'تم التسجيل في الدفتر ✓',
    log: 'تسجيل في دفتر المختبر',
    testParams: 'معايير الاختبار والمادة',
    selectMaterial: 'اختيار مادة العينة:',
    appliedForce: 'قوة الشد المطبقة (F):',
    crossArea: 'مساحة المقطع العرضي (A):',
    initialLength: 'الطول الأصلي للعينة (L₀):',
    manualOverride: 'قياس الاستطالة يدوياً (ΔL):',
    manualHelp: 'أدخل الاستطالة المقاسة لحساب معامل يونج تجريبياً',
    fractured: 'تحذير: انقطاع وكسر العينة (Fracture!)',
    plasticYield: 'تجاوز حد الخضوع: تشوه لدن دائم (Plastic Yield)',
    linearElastic: 'المنطقة المرنة الخطية: قانون هوك سارٍ',
    stress: 'الإجهاد الميكانيكي (σ)',
    strain: 'الانفعال الخطي (ε)',
    youngModulus: 'معامل يونج المحسوب (E)',
    strainEnergy: 'طاقة الانفعال الحجمية (u)',
  };

  const getMaterialName = (m: MaterialSpec) => {
    const matNames: Record<string, string> = {
      ar: m.nameAr,
      ku: m.nameKu,
      kmr: m.nameKmr || m.nameEn,
      en: m.nameEn,
    };
    return matNames[lang] || m.nameAr;
  };
  // Parameters
  const [selectedMatIdx, setSelectedMatIdx] = useState<number>(0);
  const [appliedForceKN, setAppliedForceKN] = useState<number>(25); // kN (0 to 100)
  const [crossAreaMm2, setCrossAreaMm2] = useState<number>(100); // mm² (10 to 500)
  const [initialLengthM, setInitialLengthM] = useState<number>(1.5); // m (0.2 to 5.0)
  const [isManualDeltaL, setIsManualDeltaL] = useState<boolean>(false);
  const [manualDeltaLMm, setManualDeltaLMm] = useState<number>(1.875); // mm
  const [logged, setLogged] = useState<boolean>(false);

  const material = MATERIALS[selectedMatIdx];

  // Derived Calculations
  // Force F in N = appliedForceKN * 1000
  const forceN = appliedForceKN * 1000;
  // Area A in m² = crossAreaMm2 * 1e-6
  const areaM2 = crossAreaMm2 * 1e-6;

  // Stress σ = F / A (Pa) -> σ_MPa = (F_N / A_mm²)
  const stressMPa = crossAreaMm2 > 0 ? (forceN / crossAreaMm2) : 0;
  const stressPa = stressMPa * 1e6;

  // Theoretical strain ε = σ / E
  const theoreticalYoungPa = material.youngModulusGPa * 1e9;
  const theoreticalStrain = theoreticalYoungPa > 0 ? stressPa / theoreticalYoungPa : 0;
  const theoreticalDeltaLMm = theoreticalStrain * (initialLengthM * 1000);

  // Active strain & deltaL
  const actualDeltaLMm = isManualDeltaL ? manualDeltaLMm : theoreticalDeltaLMm;
  const actualDeltaLM = actualDeltaLMm * 1e-3;
  const actualStrain = initialLengthM > 0 ? actualDeltaLM / initialLengthM : 0;

  // Experimental calculated Young's Modulus E = Stress / Strain
  const calculatedYoungGPa = actualStrain > 0 ? (stressPa / actualStrain) / 1e9 : 0;

  // Strain Energy Density u = 1/2 * σ * ε (J/m³ or kJ/m³)
  const strainEnergyDensityKJ = 0.5 * stressMPa * actualStrain * 1000; // kJ/m³

  // Deformation State
  const isYielded = stressMPa > material.yieldStrengthMPa;
  const isFractured = stressMPa > material.tensileStrengthMPa;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dark Background Grid
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 0.8;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Split Canvas into 2 regions: Left (Tensile Rig Specimen), Right (Stress-Strain Curve)
    const rigWidth = width * 0.48;
    const chartX0 = width * 0.54;
    const chartY0 = height - 40;
    const chartW = width * 0.42;
    const chartH = height - 80;

    // --- DRAW TENSILE TEST MACHINE RIG ---
    const centerX = rigWidth / 2;
    const gripTopY = 50;
    const gripBottomY = height - 60;
    const baseSpecimenHeight = gripBottomY - gripTopY - 40;

    // Fixed Top Frame & Grip
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(centerX - 70, 20, 140, 30);
    ctx.fillStyle = '#71717a';
    ctx.fillRect(centerX - 40, 50, 80, 25);
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '10px monospace';
    ctx.fillText('FIXED ANCHOR', centerX - 38, 38);

    // Specimen bar with stretch and necking
    const stretchRatio = Math.min(Math.max(actualStrain * 15, 0), 0.6);
    const specH = baseSpecimenHeight * (1 + stretchRatio);
    const neckFactor = isFractured ? 0 : Math.max(1 - stretchRatio * 0.4, 0.4);
    const specW = Math.max(Math.sqrt(crossAreaMm2) * 2.2 * neckFactor, 8);

    if (isFractured) {
      // Draw fractured 2 halves
      ctx.fillStyle = material.color;
      // Top half
      ctx.fillRect(centerX - specW / 2, 75, specW, specH * 0.4);
      // Bottom half
      ctx.fillRect(centerX - specW / 2, 75 + specH * 0.55, specW, specH * 0.4);

      // Jagged break line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - specW / 2 - 5, 75 + specH * 0.4);
      ctx.lineTo(centerX, 75 + specH * 0.45);
      ctx.lineTo(centerX + specW / 2 + 5, 75 + specH * 0.4);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('FRACTURE / BREAKAGE!', centerX - 65, 75 + specH * 0.5);
    } else {
      // Continuous specimen bar
      // Gradient reflecting stress
      const grad = ctx.createLinearGradient(centerX - specW / 2, 75, centerX + specW / 2, 75 + specH);
      if (isYielded) {
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(0.5, '#ef4444');
        grad.addColorStop(1, '#f97316');
      } else {
        grad.addColorStop(0, material.color);
        grad.addColorStop(1, '#64748b');
      }
      ctx.fillStyle = grad;

      // Specimen with rounded neck in middle
      ctx.beginPath();
      ctx.roundRect(centerX - specW / 2, 75, specW, specH, 4);
      ctx.fill();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Strain Grid markers on specimen
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 0.8;
      const numLines = 6;
      for (let i = 1; i < numLines; i++) {
        const ly = 75 + (specH * i) / numLines;
        ctx.beginPath();
        ctx.moveTo(centerX - specW / 2, ly);
        ctx.lineTo(centerX + specW / 2, ly);
        ctx.stroke();
      }
    }

    // Moving Bottom Hydraulic Grip
    const bottomGripY = 75 + specH;
    ctx.fillStyle = '#71717a';
    ctx.fillRect(centerX - 40, bottomGripY, 80, 25);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(centerX - 70, bottomGripY + 25, 140, 30);

    // Tension Arrows
    if (appliedForceKN > 0 && !isFractured) {
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      const arrowY = bottomGripY + 65;
      ctx.beginPath();
      ctx.moveTo(centerX, arrowY);
      ctx.lineTo(centerX, arrowY + 25);
      ctx.stroke();
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(centerX - 6, arrowY + 18);
      ctx.lineTo(centerX, arrowY + 27);
      ctx.lineTo(centerX + 6, arrowY + 18);
      ctx.fill();

      ctx.font = 'bold 11px monospace';
      ctx.fillText(`F = ${appliedForceKN.toFixed(1)} kN`, centerX + 12, arrowY + 18);
    }

    // Dimension indicators
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    // L0 line
    ctx.beginPath();
    ctx.moveTo(centerX - 55, 75);
    ctx.lineTo(centerX - 55, 75 + baseSpecimenHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`L₀ = ${initialLengthM.toFixed(2)} m`, centerX - 110, 75 + baseSpecimenHeight / 2);

    // ΔL highlight
    if (actualDeltaLMm > 0.01 && !isFractured) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX + specW / 2 + 15, 75 + baseSpecimenHeight);
      ctx.lineTo(centerX + specW / 2 + 15, 75 + specH);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`ΔL = +${actualDeltaLMm.toFixed(2)} mm`, centerX + specW / 2 + 20, 75 + baseSpecimenHeight + 10);
    }

    // --- DRAW STRESS-STRAIN DIAGRAM (σ vs ε) ---
    // Axes
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chartX0, chartY0);
    ctx.lineTo(chartX0 + chartW, chartY0); // Strain axis ε
    ctx.moveTo(chartX0, chartY0);
    ctx.lineTo(chartX0, chartY0 - chartH); // Stress axis σ
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '11px sans-serif';
    ctx.fillText('Strain ε (ΔL / L₀)', chartX0 + chartW - 90, chartY0 + 25);
    ctx.fillText('Stress σ (MPa)', chartX0 - 30, chartY0 - chartH - 10);

    // Curve plotting for this material
    const maxPlotStress = material.tensileStrengthMPa * 1.25;
    const maxPlotStrain = 0.05;

    ctx.strokeStyle = material.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(chartX0, chartY0);

    // Elastic limit point
    const yieldStrain = (material.yieldStrengthMPa * 1e6) / theoreticalYoungPa;
    const yieldPixelX = chartX0 + (yieldStrain / maxPlotStrain) * chartW;
    const yieldPixelY = chartY0 - (material.yieldStrengthMPa / maxPlotStress) * chartH;

    // Ultimate point
    const ultStrain = yieldStrain * 3.5;
    const ultPixelX = chartX0 + (ultStrain / maxPlotStrain) * chartW;
    const ultPixelY = chartY0 - (material.tensileStrengthMPa / maxPlotStress) * chartH;

    // Fracture point
    const fracStrain = ultStrain * 1.3;
    const fracPixelX = chartX0 + (fracStrain / maxPlotStrain) * chartW;
    const fracPixelY = chartY0 - (material.tensileStrengthMPa * 0.85 / maxPlotStress) * chartH;

    ctx.lineTo(yieldPixelX, yieldPixelY); // Linear elastic Hooke region
    ctx.quadraticCurveTo(yieldPixelX + 25, ultPixelY, ultPixelX, ultPixelY); // Plastic region
    ctx.lineTo(fracPixelX, fracPixelY); // Necking to fracture
    ctx.stroke();

    // Elastic Region Shading
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.beginPath();
    ctx.moveTo(chartX0, chartY0);
    ctx.lineTo(yieldPixelX, yieldPixelY);
    ctx.lineTo(yieldPixelX, chartY0);
    ctx.closePath();
    ctx.fill();

    // Marker labels on graph
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.fillText('Elastic Region (Hooke E=σ/ε)', chartX0 + 10, chartY0 - 15);

    // Current Operating Point Circle
    const currentPixelX = Math.min(chartX0 + (actualStrain / maxPlotStrain) * chartW, chartX0 + chartW);
    const currentPixelY = Math.max(chartY0 - (stressMPa / maxPlotStress) * chartH, chartY0 - chartH);

    ctx.fillStyle = isYielded ? '#ef4444' : '#10b981';
    ctx.beginPath();
    ctx.arc(currentPixelX, currentPixelY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dash lines to axes
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(currentPixelX, currentPixelY);
    ctx.lineTo(currentPixelX, chartY0);
    ctx.moveTo(currentPixelX, currentPixelY);
    ctx.lineTo(chartX0, currentPixelY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Operating text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`σ = ${stressMPa.toFixed(1)} MPa`, chartX0 + 8, currentPixelY - 5);
    ctx.fillText(`ε = ${(actualStrain * 100).toFixed(3)}%`, currentPixelX - 25, chartY0 + 15);

  }, [selectedMatIdx, appliedForceKN, crossAreaMm2, initialLengthM, actualDeltaLMm, actualStrain, stressMPa, isYielded, isFractured]);

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'stress_strain',
      variableName: `${t.youngModulus} (${getMaterialName(material)})`,
      measuredValue: calculatedYoungGPa,
      theoreticalValue: material.youngModulusGPa,
      unit: 'GPa',
      parameters: {
        Material: getMaterialName(material),
        'Applied Force F': `${appliedForceKN} kN`,
        'Area A': `${crossAreaMm2} mm²`,
        'Initial Length L0': `${initialLengthM} m`,
        'Elongation ΔL': `${actualDeltaLMm.toFixed(3)} mm`,
        'Stress σ': `${stressMPa.toFixed(2)} MPa`,
        'Strain ε': `${actualStrain.toFixed(6)}`,
      },
      equation: `E = σ / ε = (F / A) / (ΔL / L₀) = (${stressMPa.toFixed(2)} MPa) / (${actualStrain.toFixed(6)}) = ${calculatedYoungGPa.toFixed(2)} GPa`,
      notes: `${t.desc} (${isFractured ? t.fractured : isYielded ? t.plasticYield : t.linearElastic}).`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-sky-950/40 border border-emerald-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Activity  className="w-5 h-5 text-emerald-400"/>
            <span>{t.title}</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">{t.desc}</p>
        </div>

        <button
          onClick={handleLog}
          className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' }`}
        >
          <BookmarkCheck  className="w-4 h-4"/>
          <span>{logged ? t.logged : t.log}</span>
        </button>
      </div>

      {/* Main Grid: Controls + Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Cpu  className="w-4 h-4 text-emerald-400"/>
              {t.testParams}
            </span>
          </div>

          {/* Material Select */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5 font-medium">
              {t.selectMaterial}
            </label>
            <select
              value={selectedMatIdx}
              onChange={(e) => setSelectedMatIdx(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {MATERIALS.map((m, idx) => (
                <option key={m.id} value={idx}>
                  {getMaterialName(m)} (E={m.youngModulusGPa} GPa)
                </option>
              ))}
            </select>
          </div>

          {/* Applied Force Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{t.appliedForce}</span>
              <span className="font-mono text-emerald-400 font-semibold">{appliedForceKN} kN ({(appliedForceKN * 1000).toLocaleString()} N)</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="1"
              value={appliedForceKN}
              onChange={(e) => setAppliedForceKN(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Cross Section Area */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{t.crossArea}</span>
              <span className="font-mono text-sky-400 font-semibold">{crossAreaMm2} mm²</span>
            </div>
            <input
              type="range"
              min="10"
              max="400"
              step="5"
              value={crossAreaMm2}
              onChange={(e) => setCrossAreaMm2(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Initial Length */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-400">{t.initialLength}</span>
              <span className="font-mono text-amber-400 font-semibold">{initialLengthM.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="4.0"
              step="0.1"
              value={initialLengthM}
              onChange={(e) => setInitialLengthM(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Manual vs Automatic Delta L toggle */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-300 font-medium">
                {t.manualOverride}
              </span>
              <button className="min-h-[44px] min-w-[44px]"
                onClick={() => setIsManualDeltaL(!isManualDeltaL)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  isManualDeltaL ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {isManualDeltaL ? 'MANUAL' : 'AUTO (Hooke)'}
              </button>
            </div>

            {isManualDeltaL && (
              <div>
                <input
                  type="number"
                  step="0.05"
                  value={manualDeltaLMm}
                  onChange={(e) => setManualDeltaLMm(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  {t.manualHelp}
                </span>
              </div>
            )}
          </div>

          {/* State Status Banner */}
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${ isFractured ? 'bg-rose-950/40 border-rose-600 text-rose-300' : isYielded ? 'bg-amber-950/40 border-amber-600 text-amber-300' : 'bg-emerald-950/40 border-emerald-600 text-emerald-300' }`}>
            <ShieldAlert  className="w-4 h-4"/>
            <span>
              {isFractured ? t.fractured : isYielded ? t.plasticYield : t.linearElastic}
            </span>
          </div>
        </div>

        {/* Canvas & Live Computed Metrics */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
            <canvas
              ref={canvasRef}
              width={680}
              height={380}
             className="w-full h-[380px] rounded-xl bg-zinc-950 block"/>
          </div>

          {/* Computed Metrics Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Stress */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.stress}
              </span>
              <div className="text-lg font-bold font-mono text-sky-400">
                {stressMPa.toFixed(2)} <span className="text-sm text-zinc-400">MPa</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">{(stressPa).toExponential(3)} Pa</span>
            </div>

            {/* Strain */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.strain}
              </span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {(actualStrain * 100).toFixed(4)} <span className="text-sm text-zinc-400">%</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">ΔL = {actualDeltaLMm.toFixed(3)} mm</span>
            </div>

            {/* Young Modulus */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.youngModulus}
              </span>
              <div className="text-lg font-bold font-mono text-purple-400">
                {calculatedYoungGPa.toFixed(2)} <span className="text-sm text-zinc-400">GPa</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">Theo: {material.youngModulusGPa} GPa</span>
            </div>

            {/* Strain Energy */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                {t.strainEnergy}
              </span>
              <div className="text-lg font-bold font-mono text-amber-400">
                {strainEnergyDensityKJ.toFixed(2)} <span className="text-sm text-zinc-400">kJ/m³</span>
              </div>
              <span className="text-[9px] text-zinc-500 font-mono">u = ½ σ ε</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}