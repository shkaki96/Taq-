import { Crosshair, RotateCcw, Scale, Plus, Trash2, BookmarkCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface PointMass {
  id: string;
  name: string;
  m: number; // kg
  x: number; // meters (-4 to +4)
  y: number; // meters (-3 to +3)
  color: string;
}

export default function CenterOfMassSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const t = {
    ar: {
      title: 'تحديد مركز الكتلة للأجسام الصلبة (Xcm = Σmi xi / Σmi)',
      subTitle: 'تحديد مركز الكتلة للأجسام الصلبة (Xcm = Σmi xi / Σmi)',
      shortDesc: 'حساب موقع مركز الكتلة لنظام كتل نقطية وتجربة خيط الشاقول',
      dragPrompt: 'اسحب الكتل بالماوس على الشبكة لرؤية موضع مركز الكتلة ⨁ يتحرك في الزمن الحقيقي', // غير موثّق بمصدر
      xCmLabel: 'إحداثي X لمركز الكتلة',
      yCmLabel: 'إحداثي Y لمركز الكتلة',
      totalMassLabel: 'الكتلة الكلية (M_total)',
      firstMomentLabel: 'العزم الأول (Σ mi xi)',
      physicsTitle: 'القوانين الفيزيائية لمركز الكتلة والاتزان:',
      physicsText: 'مركز الكتلة هو النقطة المتوسطة الموزونة بكتل الأجسام، حيث يتصرف الجسم وكأن كتلته كلها متركزة فيها وتؤثر القوى الخارجية عليها: X_cm = Σ(m_i·x_i)/Σm_i و Y_cm = Σ(m_i·y_i)/Σm_i. عند وضع نقطة الارتكاز تحته مباشرة، يكون عزم الدوران المحصل صفراً فيحدث اتزان سكوني تام.',
      modeTitle: 'أسلوب العرض والتجربة', // غير موثّق بمصدر
      modeParticles: 'نظام الكتل', // غير موثّق بمصدر
      modePlumbline: 'خيط الشاقول', // غير موثّق بمصدر
      modeBalance: 'ميزان الارتكاز', // غير موثّق بمصدر
      pivotLabel: 'نقطة التعليق الحرة:', // غير موثّق بمصدر
      pivotA: 'الثقب A', // غير موثّق بمصدر
      pivotB: 'الثقب B', // غير موثّق بمصدر
      pivotC: 'الثقب C', // غير موثّق بمصدر
      plumblineDesc: 'عند تعليق الصفيحة من نقطتين مختلفتين، يمر خط الشاقول الرأسي دائماً بمركز الثقل، ونقطة تقاطع الخطين تحدده عملياً بدقة.', // غير موثّق بمصدر
      pointMassesLabel: 'الكتل النقطية:', // غير موثّق بمصدر
      addMassBtn: 'إضافة كتلة', // غير موثّق بمصدر
      loggedMsg: 'تم تسجيل القياس في دفتر المختبر!', // غير موثّق بمصدر
      logBtn: 'تسجيل إحداثيات مركز الكتلة', // غير موثّق بمصدر
      plumbCenterLabel: 'مركز الثقل الهندسي ⨁', // غير موثّق بمصدر
      rotEquilMsg: '✓ النظام في حالة اتزان دوراني كامل (Στ = 0) حول نقطة الارتكاز X_cm', // غير موثّق بمصدر
    },
    en: {
      title: 'Center of Mass Determination (Xcm = Σmi xi / Σmi)',
      subTitle: 'Center of Mass Determination (Xcm = Σmi xi / Σmi)',
      shortDesc: 'Calculate Center of Mass coordinates for point masses and plumb line experiments.',
      dragPrompt: 'Drag masses on the grid to observe real-time shift of Center of Mass ⨁', // غير موثّق بمصدر
      xCmLabel: 'X_cm Coordinate',
      yCmLabel: 'Y_cm Coordinate',
      totalMassLabel: 'Total Mass',
      firstMomentLabel: 'First Moment (Σ mi xi)',
      physicsTitle: 'Center of Mass & Equilibrium Physics:',
      physicsText: 'The Center of Mass is the mass-weighted average position of all particles: X_cm = Σ(mi xi)/Σmi and Y_cm = Σ(mi yi)/Σmi. Placing a pivot directly below the center of mass yields zero net gravitational torque, achieving static rotational equilibrium.',
      modeTitle: 'Experiment Mode', // غير موثّق بمصدر
      modeParticles: 'Particles', // غير موثّق بمصدر
      modePlumbline: 'Plumb Line', // غير موثّق بمصدر
      modeBalance: 'Fulcrum', // غير موثّق بمصدر
      pivotLabel: 'Suspension Pivot Point:', // غير موثّق بمصدر
      pivotA: 'Pivot A', // غير موثّق بمصدر
      pivotB: 'Pivot B', // غير موثّق بمصدر
      pivotC: 'Pivot C', // غير موثّق بمصدر
      plumblineDesc: 'Suspending from two different pivots draws vertical plumb lines that intersect exactly at the center of gravity.', // غير موثّق بمصدر
      pointMassesLabel: 'Point Masses:', // غير موثّق بمصدر
      addMassBtn: 'Add Mass', // غير موثّق بمصدر
      loggedMsg: 'Logged to Lab Notebook!', // غير موثّق بمصدر
      logBtn: 'Log Center of Mass Data', // غير موثّق بمصدر
      plumbCenterLabel: 'Geometric Center of Gravity ⨁', // غير موثّق بمصدر
      rotEquilMsg: '✓ System in perfect rotational equilibrium (Στ = 0) about fulcrum at X_cm', // غير موثّق بمصدر
    },
    ku: {
      title: 'دیاریکردنی چەقی بارستایی تەنەکان (Xcm = Σmi xi / Σmi)',
      subTitle: 'دیاریکردنی چەقی بارستایی تەنەکان (Xcm = Σmi xi / Σmi)',
      shortDesc: 'ئەژمارکردنی شوێنی چەقی بارستایی بۆ سیستەمی بارستە خاڵییەکان.',
      dragPrompt: 'بارستەی سەر تۆڕەکە ڕابکێشە بۆ بینینی جووڵەی چەقی بارستایی ⨁ لە کاتی ڕاستەقینەدا', // غير موثّق بمصدر
      xCmLabel: 'پۆتانی X ی چەقی بارستایی',
      yCmLabel: 'پۆتانی Y ی چەقی بارستایی',
      totalMassLabel: 'کۆی بارستایی (M_total)',
      firstMomentLabel: 'زەبری یەکەم (Σ mi xi)',
      physicsTitle: 'یاسا فیزیاییەکانی چەقی بارستایی و هاوسەنگی:',
      physicsText: 'چەقی بارستایی بریتییە لە ناوەندی بارستایی تێکڕای شوێنی گەردیلەکان: X_cm = Σ(mi xi)/Σmi. هەڵواسینی ڕاستەوخۆ لەژێر چەقی بارستاییدا هاوسەنگیی خولانەوەیی دروست دەکات.',
      modeTitle: 'جۆری نیشاندان و تاقیکردنەوە', // غير موثّق بمصدر
      modeParticles: 'سیستەمی بارستەکان', // غير موثّق بمصدر
      modePlumbline: 'داوەشاگوڵ', // غير موثّق بمصدر
      modeBalance: 'تەرازووی لێژین', // غير موثّق بمصدر
      pivotLabel: 'خاڵی هەڵواسینی ئازاد:', // غير موثّق بمصدر
      pivotA: 'کون A', // غير موثّق بمصدر
      pivotB: 'کون B', // غير موثّق بمصدر
      pivotC: 'کون C', // غير موثّق بمصدر
      plumblineDesc: 'کاتێک پەڕەکە لە دوو خاڵی جیاوازەوە هەڵدەواسرێت، ڕاڕەوی داوەشاگوڵ هەمیشە لە چەقی بارستایی دەرژێت.', // غير موثّق بمصدر
      pointMassesLabel: 'بارستە خاڵییەکان:', // غير موثّق بمصدر
      addMassBtn: 'زیادکردنی بارستایی', // غير موثّق بمصدر
      loggedMsg: 'تۆمارکرا لە دەفتەری تاقیگە!', // غير موثّق بمصدر
      logBtn: 'تۆمارکردنی پۆتانەکانی چەقی بارستایی', // غير موثّق بمصدر
      plumbCenterLabel: 'چەقی قورسایی ئەندازیاری ⨁', // غير موثّق بمصدر
      rotEquilMsg: '✓ سیستەمەکە لە هاوسەنگیی خولانەوەیی تەواودایە (Στ = 0) لە دەوری X_cm', // غير موثّق بمصدر
    },
    kmr: {
      title: 'Diyar kirina navenda massayê ya laşan (Xcm = Σmi xi / Σmi)',
      subTitle: 'Diyar kirina navenda massayê ya laşan (Xcm = Σmi xi / Σmi)',
      shortDesc: 'Hesabkirina koordînatên navenda massayê ji bo massayên xalî û azmûnên hêla plumbê.',
      dragPrompt: 'Massayan li ser torê bikşîne ji bo dîtina tevgera navenda massayê ⨁ di dema rastî de', // غير موثّق بمصدر
      xCmLabel: 'Koordînata X_cm',
      yCmLabel: 'Koordînata Y_cm',
      totalMassLabel: 'Massa giştî',
      firstMomentLabel: 'Momena yekem (Σ mi xi)',
      physicsTitle: 'Fîzîka navenda massayê û hevsengiyê:',
      physicsText: 'Navenda massayê cihê navînî ye ku li ser bingeha giranaiya parçikan hatî hejmartin: X_cm = Σ(mi xi)/Σmi û Y_cm = Σ(mi yi)/Σmi.',
      modeTitle: 'Moda azmûnê', // غير موثّق بمصدر
      modeParticles: 'Parçik', // غير موثّق بمصدر
      modePlumbline: 'Hêla plumbê', // غير موثّق بمصدر
      modeBalance: 'Mêzîn', // غير موثّق بمصدر
      pivotLabel: 'Xala dalikandina azad:', // غير موثّق بمصدر
      pivotA: 'Sura A', // غير موثّق بمصدر
      pivotB: 'Sura B', // غير موثّق بمصدر
      pivotC: 'Sura C', // غير موثّق بمصدر
      plumblineDesc: 'Daliqandina ji du xalên cuda dihêle ku hêla plumbê di navenda massayê re derbas bibe.', // غير موثّق بمصدر
      pointMassesLabel: 'Massayên xalî:', // غير موثّق بمصدر
      addMassBtn: 'Zêdekirina massayê', // غير موثّق بمصدر
      loggedMsg: 'Hat tomarkirin di defterê de!', // غير موثّق بمصدر
      logBtn: 'Tomarkirina koordînatên navenda massayê', // غير موثّق بمصدر
      plumbCenterLabel: 'Navenda giraniyê ya geometrîk ⨁', // غير موثّق بمصدر
      rotEquilMsg: '✓ Sîstem di hevsengiya zevirînê de ye (Στ = 0) li dora X_cm', // غير موثّق بمصدر
    },
  }[lang] || {
    title: 'تحديد مركز الكتلة للأجسام الصلبة (Xcm = Σmi xi / Σmi)',
    subTitle: 'تحديد مركز الكتلة للأجسام الصلبة (Xcm = Σmi xi / Σmi)',
    shortDesc: 'حساب موقع مركز الكتلة لنظام كتل نقطية وتجربة خيط الشاقول',
    dragPrompt: 'اسحب الكتل بالماوس على الشبكة لرؤية موضع مركز الكتلة ⨁ يتحرك في الزمن الحقيقي',
    xCmLabel: 'إحداثي X لمركز الكتلة',
    yCmLabel: 'إحداثي Y لمركز الكتلة',
    totalMassLabel: 'الكتلة الكلية (M_total)',
    firstMomentLabel: 'العزم الأول (Σ mi xi)',
    physicsTitle: 'القوانين الفيزيائية لمركز الكتلة والاتزان:',
    physicsText: 'مركز الكتلة هو النقطة المتوسطة الموزونة بكتل الأجسام، حيث يتصرف الجسم وكأن كتلته كلها متركزة فيها وتؤثر القوى الخارجية عليها: X_cm = Σ(m_i·x_i)/Σm_i و Y_cm = Σ(m_i·y_i)/Σm_i. عند وضع نقطة الارتكاز تحته مباشرة، يكون عزم الدوران المحصل صفراً فيحدث اتزان سكوني تام.',
    modeTitle: 'أسلوب العرض والتجربة',
    modeParticles: 'نظام الكتل',
    modePlumbline: 'خيط الشاقول',
    modeBalance: 'ميزان الارتكاز',
    pivotLabel: 'نقطة التعليق الحرة:',
    pivotA: 'الثقب A',
    pivotB: 'الثقب B',
    pivotC: 'الثقب C',
    plumblineDesc: 'عند تعليق الصفيحة من نقطتين مختلفتين، يمر خط الشاقول الرأسي دائماً بمركز الثقل، ونقطة تقاطع الخطين تحدده عملياً بدقة.',
    pointMassesLabel: 'الكتل النقطية:',
    addMassBtn: 'إضافة كتلة',
    loggedMsg: 'تم تسجيل القياس في دفتر المختبر!',
    logBtn: 'تسجيل إحداثيات مركز الكتلة',
    plumbCenterLabel: 'مركز الثقل الهندسي ⨁',
    rotEquilMsg: '✓ النظام في حالة اتزان دوراني كامل (Στ = 0) حول نقطة الارتكاز X_cm',
  };

  const [mode, setMode] = useState<'particles' | 'plumbline' | 'balance'>('particles');

  // Particles System State
  const [masses, setMasses] = useState<PointMass[]>([
    { id: 'm1', name: 'm₁', m: 2.0, x: -2.0, y: 1.5, color: '#38bdf8' },
    { id: 'm2', name: 'm₂', m: 3.0, x: 2.5, y: 1.0, color: '#f59e0b' },
    { id: 'm3', name: 'm₃', m: 1.5, x: 0.0, y: -2.0, color: '#10b981' },
    { id: 'm4', name: 'm₄', m: 2.5, x: -1.5, y: -1.0, color: '#ec4899' },
  ]);

  // Plumb-line Suspension Pivot (for rigid L-shape plate)
  const [pivotPoint, setPivotPoint] = useState<'A' | 'B' | 'C'>('A');
  const [plumbLineAngle, setPlumbLineAngle] = useState<number>(0);
  const [logged, setLogged] = useState<boolean>(false);

  // Center of Mass Calculations
  const totalMass = masses.reduce((sum, item) => sum + item.m, 0);
  const sumMx = masses.reduce((sum, item) => sum + item.m * item.x, 0);
  const sumMy = masses.reduce((sum, item) => sum + item.m * item.y, 0);

  const xCM = totalMass > 0 ? sumMx / totalMass : 0;
  const yCM = totalMass > 0 ? sumMy / totalMass : 0;

  // Canvas Reference
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingIdRef = useRef<string | null>(null);

  // Draw on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const originX = width * 0.5;
    const originY = height * 0.5;
    const scale = 48; // pixels per meter

    // Coordinate Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = originX % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = originY % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // X and Y Principal Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis coordinate labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    for (let i = -5; i <= 5; i++) {
      if (i !== 0) {
        ctx.fillText(`${i}m`, originX + i * scale - 8, originY + 14);
        ctx.fillText(`${-i}m`, originX + 6, originY + i * scale + 3);
      }
    }

    if (mode === 'particles') {
      // Connect each mass to Center of Mass with dotted lines
      const cmPixX = originX + xCM * scale;
      const cmPixY = originY - yCM * scale;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      masses.forEach((p) => {
        const px = originX + p.x * scale;
        const py = originY - p.y * scale;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(cmPixX, cmPixY);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw each point mass
      masses.forEach((p) => {
        const px = originX + p.x * scale;
        const py = originY - p.y * scale;
        const radiusPix = Math.max(10, Math.min(26, Math.sqrt(p.m) * 10));

        // Mass circle
        ctx.beginPath();
        ctx.arc(px, py, radiusPix, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Mass label
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, px, py + 4);

        // Coordinates & Mass text under circle
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px monospace';
        ctx.fillText(`${p.m}kg (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`, px, py + radiusPix + 14);
      });

      // Draw Center of Mass Crosshair & Target Marker (X_cm, Y_cm)
      ctx.beginPath();
      ctx.arc(cmPixX, cmPixY, 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Crosshair lines
      ctx.beginPath();
      ctx.moveTo(cmPixX - 20, cmPixY);
      ctx.lineTo(cmPixX + 20, cmPixY);
      ctx.moveTo(cmPixX, cmPixY - 20);
      ctx.lineTo(cmPixX, cmPixY + 20);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center of mass label
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`CM (${xCM.toFixed(2)}, ${yCM.toFixed(2)})m`, cmPixX + 18, cmPixY - 8);
    } else if (mode === 'plumbline') {
      // Rigid L-Shape Plate Suspension Experiment
      const plateOriginX = originX - 60;
      const plateOriginY = originY + 60;

      // Draw L-shaped rigid plate
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(plateOriginX, plateOriginY);
      ctx.lineTo(plateOriginX + 180, plateOriginY);
      ctx.lineTo(plateOriginX + 180, plateOriginY - 60);
      ctx.lineTo(plateOriginX + 60, plateOriginY - 60);
      ctx.lineTo(plateOriginX + 60, plateOriginY - 180);
      ctx.lineTo(plateOriginX, plateOriginY - 180);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pivot Holes
      const holeA = { x: plateOriginX + 20, y: plateOriginY - 160 };
      const holeB = { x: plateOriginX + 160, y: plateOriginY - 20 };
      const holeC = { x: plateOriginX + 20, y: plateOriginY - 20 };

      const activePivot = pivotPoint === 'A' ? holeA : pivotPoint === 'B' ? holeB : holeC;

      // Plumb Line from active pivot
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(activePivot.x, activePivot.y);
      ctx.lineTo(activePivot.x, activePivot.y + 240);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Plumb Bob (weight at bottom of string)
      ctx.beginPath();
      ctx.arc(activePivot.x, activePivot.y + 240, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      // Suspension Pin
      ctx.beginPath();
      ctx.arc(activePivot.x, activePivot.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Precalculated True Center of Mass for this L-Shape
      // (Rectangle 1: 60x180 => A1=10800, c1=(30, 90); Rectangle 2: 120x60 => A2=7200, c2=(120, 30))
      // Xcm = (10800*30 + 7200*120)/18000 = (324000 + 864000)/18000 = 66 px
      // Ycm = (10800*90 + 7200*30)/18000 = (972000 + 216000)/18000 = 66 px
      const cmPlateX = plateOriginX + 66;
      const cmPlateY = plateOriginY - 66;

      ctx.beginPath();
      ctx.arc(cmPlateX, cmPlateY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(t.plumbCenterLabel, cmPlateX + 12, cmPlateY + 4);
    } else {
      // Fulcrum Balance Mode: Balance beam on a pivot
      const beamLength = 400;
      const beamY = originY + 20;

      // Balance Beam
      ctx.fillStyle = '#475569';
      ctx.fillRect(originX - beamLength / 2, beamY, beamLength, 12);

      // Fulcrum Triangle at CM
      const fulcrumX = originX + xCM * scale;
      ctx.beginPath();
      ctx.moveTo(fulcrumX, beamY + 12);
      ctx.lineTo(fulcrumX - 16, beamY + 50);
      ctx.lineTo(fulcrumX + 16, beamY + 50);
      ctx.closePath();
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Masses on beam (1D projection)
      masses.forEach((p) => {
        const px = originX + p.x * scale;
        const h = Math.max(16, p.m * 10);
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 14, beamY - h, 28, h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px - 14, beamY - h, 28, h);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.m}kg`, px, beamY - h / 2 + 4);
      });

      // Equilibrium check text
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.rotEquilMsg, originX, height - 30);
    }
  }, [masses, xCM, yCM, mode, pivotPoint, lang, t]);

  // Dragging masses on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'particles') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const originX = canvas.width * 0.5;
    const originY = canvas.height * 0.5;
    const scale = 48;

    // Check if clicked near any mass
    for (const p of masses) {
      const px = originX + p.x * scale;
      const py = originY - p.y * scale;
      const dist = Math.hypot(clickX - px, clickY - py);
      if (dist < 25) {
        draggingIdRef.current = p.id;
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingIdRef.current || mode !== 'particles') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const moveY = e.clientY - rect.top;

    const originX = canvas.width * 0.5;
    const originY = canvas.height * 0.5;
    const scale = 48;

    const newX = Math.round(((moveX - originX) / scale) * 10) / 10;
    const newY = Math.round(((originY - moveY) / scale) * 10) / 10;

    const clampedX = Math.max(-4.5, Math.min(4.5, newX));
    const clampedY = Math.max(-3.0, Math.min(3.0, newY));

    setMasses((prev) =>
      prev.map((item) => (item.id === draggingIdRef.current ? { ...item, x: clampedX, y: clampedY } : item))
    );
  };

  const handleMouseUp = () => {
    draggingIdRef.current = null;
  };

  const handleAddMass = () => {
    if (masses.length >= 6) return;
    const newId = `m${Date.now() % 1000}`;
    const colors = ['#a855f7', '#06b6d4', '#84cc16', '#f43f5e'];
    const newMass: PointMass = {
      id: newId,
      name: `m${masses.length + 1}`,
      m: 2.0,
      x: Math.round((Math.random() * 4 - 2) * 10) / 10,
      y: Math.round((Math.random() * 3 - 1.5) * 10) / 10,
      color: colors[masses.length % colors.length],
    };
    setMasses((prev) => [...prev, newMass]);
  };

  const handleRemoveMass = (id: string) => {
    if (masses.length <= 2) return;
    setMasses((prev) => prev.filter((m) => m.id !== id));
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'center_of_mass',
      parameters: {
        totalMass: `${totalMass.toFixed(2)} kg`,
        numMasses: masses.length,
        sumMx: `${sumMx.toFixed(2)} kg·m`,
        sumMy: `${sumMy.toFixed(2)} kg·m`,
      },
      variableName: 'Center of Mass (Xcm, Ycm)',
      measuredValue: Number(xCM.toFixed(3)),
      theoreticalValue: Number((sumMx / totalMass).toFixed(3)),
      unit: 'm',
      equation: 'Xcm = Σ(mi·xi) / Σmi',
      notes: `CM Coordinates: (${xCM.toFixed(2)}, ${yCM.toFixed(2)}) m, Total Mass = ${totalMass.toFixed(2)} kg with ${masses.length} bodies`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="center-of-mass-simulation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Canvas Area */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <Crosshair  className="w-5 h-5"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {t.subTitle}
                </h3>
                <p className="text-sm text-zinc-400">
                  {t.dragPrompt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                title="Reset"
              >
                <RotateCcw  className="w-4 h-4"/>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center items-center bg-zinc-950/70 rounded-xl border border-zinc-800/60 overflow-hidden">
            <canvas
              ref={canvasRef}
              width={700}
              height={380}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
             className="cursor-grab active:cursor-grabbing max-w-full h-auto"/>
          </div>

          {/* Real-time Coordinates Output */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.xCmLabel}</div>
              <div className="text-base font-bold font-mono text-red-400">
                {xCM.toFixed(3)} <span className="text-sm text-zinc-400">m</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.yCmLabel}</div>
              <div className="text-base font-bold font-mono text-red-400">
                {yCM.toFixed(3)} <span className="text-sm text-zinc-400">m</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.totalMassLabel}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {totalMass.toFixed(2)} <span className="text-sm text-zinc-400">kg</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.firstMomentLabel}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {sumMx.toFixed(2)} <span className="text-sm text-zinc-400">kg·m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theoretical Concept Card */}
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-800/30 text-xs text-zinc-300 space-y-2">
          <div className="font-semibold text-red-300 flex items-center gap-1.5">
            <Scale  className="w-4 h-4"/>
            <span>{t.physicsTitle}</span>
          </div>
          <p>{t.physicsText}</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
          <h4 className="text-sm font-bold text-zinc-200 pb-2 border-b border-zinc-800">
            {t.modeTitle}
          </h4>

          {/* Mode Selection Buttons */}
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-semibold border ${
                mode === 'particles' ? 'bg-zinc-800 text-red-400 border-red-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {t.modeParticles}
            </button>
            <button className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-semibold border ${
                mode === 'plumbline' ? 'bg-zinc-800 text-red-400 border-red-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {t.modePlumbline}
            </button>
            <button className={`min-h-[44px] min-w-[44px] p-2 rounded-xl font-semibold border ${
                mode === 'balance' ? 'bg-zinc-800 text-red-400 border-red-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {t.modeBalance}
            </button>
          </div>

          {mode === 'plumbline' && (
            <div className="space-y-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <label className="text-sm text-zinc-300 font-semibold">{t.pivotLabel}</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg font-bold ${pivotPoint === 'A' ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
                >
                  {t.pivotA}
                </button>
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg font-bold ${pivotPoint === 'B' ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
                >
                  {t.pivotB}
                </button>
                <button className={`min-h-[44px] min-w-[44px] p-2 rounded-lg font-bold ${pivotPoint === 'C' ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
                >
                  {t.pivotC}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 pt-1">{t.plumblineDesc}</p>
            </div>
          )}

          {/* Mass List with sliders */}
          {mode === 'particles' && (
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-300 font-bold">{t.pointMassesLabel}</span>
                <button
                  onClick={handleAddMass}
                  disabled={masses.length >= 6}
                  className="min-h-[44px] min-w-[44px] px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 disabled:opacity-40"
                >
                  <Plus  className="w-3.5 h-3.5"/>
                  <span>{t.addMassBtn}</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {masses.map((p) => (
                  <div key={p.id} className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span style={{ color: p.color }} className="font-bold flex items-center gap-1.5">
                        <span style={{ backgroundColor: p.color }}  className="w-2.5 h-2.5 rounded-full inline-block"/>
                        {p.name}
                      </span>
                      <span className="font-mono text-zinc-300">{p.m.toFixed(1)} kg</span>
                      {masses.length > 2 && (
                        <button className="min-h-[44px] min-w-[44px] text-zinc-500 hover:text-red-400 p-0.5"
                          title="Delete"
                        >
                          <Trash2  className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10.0"
                      step="0.5"
                      value={p.m}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setMasses((prev) => prev.map((item) => (item.id === p.id ? { ...item, m: val } : item)));
                      }}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log Measurement Button */}
          <button className={`min-h-[44px] min-w-[44px] min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${ logged ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-red-900/30' }`}>
            <BookmarkCheck  className="w-4 h-4"/>
            <span>{logged ? t.loggedMsg : t.logBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
}