import { Droplets, Volume2, Gauge, BookmarkCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface TuningFork {
  name: string;
  f: number;
}

const TUNING_FORKS: TuningFork[] = [
  { name: 'C₄ (256 Hz)', f: 256 },
  { name: '340 Hz', f: 340 },
  { name: 'A₄ (440 Hz)', f: 440 },
  { name: 'C₅ (512 Hz)', f: 512 },
  { name: '1024 Hz', f: 1024 },
];

export default function SoundSpeedSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Parameters
  const [selectedFork, setSelectedFork] = useState<number>(440); // Hz
  const [waterLevel, setWaterLevel] = useState<number>(0.75); // m (height of water column from bottom)
  const [tubeRadius, setTubeRadius] = useState<number>(0.025); // m (r = 2.5 cm)
  const [temperatureC, setTemperatureC] = useState<number>(20); // deg C
  const [isStriking, setIsStriking] = useState<boolean>(false);
  const [logged, setLogged] = useState<boolean>(false);

  const totalTubeLength = 1.0; // 1 meter total tube length
  const airColumnLength = Math.max(0.02, totalTubeLength - waterLevel); // L (meters)

  // End correction: c = 0.6 * r
  const endCorrection = 0.6 * tubeRadius;
  const effectiveLength = airColumnLength + endCorrection;

  // Theoretical Speed of Sound in Air at T: v = 331.3 * sqrt(1 + T/273.15)
  const theoreticalSpeedOfSound = 331.3 * Math.sqrt(1 + temperatureC / 273.15);

  // Theoretical Wavelength: lambda = v / f
  const theoreticalWavelength = theoreticalSpeedOfSound / selectedFork;

  // Resonant air column lengths for closed tube:
  // L1 = lambda/4 - endCorrection
  // L2 = 3*lambda/4 - endCorrection
  const resonantL1 = Math.max(0.01, theoreticalWavelength / 4 - endCorrection);
  const resonantL2 = Math.max(0.01, (3 * theoreticalWavelength) / 4 - endCorrection);

  // Check resonance proximity (closest to L1 or L2)
  const distL1 = Math.abs(airColumnLength - resonantL1);
  const distL2 = Math.abs(airColumnLength - resonantL2);
  const minResDist = Math.min(distL1, distL2);

  const resonanceIntensity = Math.max(0.05, Math.exp(-Math.pow(minResDist / 0.03, 2)));
  const isAtResonance = resonanceIntensity > 0.7;

  // Experimental Speed of sound calculated from single position L1:
  const expSpeedOfSound = 4 * effectiveLength * selectedFork;

  // Web Audio API Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const t = {
    ar: {
      movableReservoir: 'مستودع الماء المتحرك',
      title: 'تعيين سرعة الصوت باستخدام أنبوب الرنين المغلق وعمود الماء',
      strikeFork: 'طرق الشوكة الرنانة 🔔', // غير موثّق بمصدر
      airColumnL: 'طول عمود الهواء (L)',
      measuredSpeed: 'سرعة الصوت المقاسة (v)',
      theoreticalSpeed: 'سرعة الصوت النظرية',
      endCorrection: 'تصحيح النهاية (0.6r)',
      procedureTitle: 'طريقة تعيين سرعة الصوت عملياً:',
      procedureDesc: 'توضع الشوكة الرنانة المهتزة عند فوهة الأنبوب، ويتم خفض مستودع الماء تدريجياً لزيادة طول عمود الهواء L حتى يُسمع أعلى تضخيم للصوت (موضع الرنين الأول L₁ ≈ λ/4 - c). وعند خفضه أكثر نصل للرنين الثاني (L₂ ≈ 3λ/4 - c). نحسب الطول الموجي λ = 2(L₂ - L₁) وسرعة الصوت v = f · λ بدقة بالغة وبدون الاعتماد على تصحيح النهاية.',
      controlHeader: 'الشوكة الرنانة ومستوى الماء',
      selectFork: 'اختيار الشوكة الرنانة القياسية:',
      theoreticalPos: 'مواضع الرنين المحسوبة (L₁ و L₂):',
      firstResonance: 'الرنين الأول L₁',
      secondResonance: 'الرنين الثاني L₂',
      waterLevelHeight: 'ارتفاع الماء في الأنبوب',
      ambientTemp: 'درجة حرارة الهواء المحيط (T)',
      loggedSuccess: 'تم تسجيل القياس في دفتر المختبر!', // غير موثّق بمصدر
      logButton: 'تسجيل سرعة الصوت المقاسة',
    },
    en: {
      movableReservoir: 'Movable Reservoir',
      title: 'Speed of Sound via Closed Resonance Tube & Water Column',
      strikeFork: 'Strike Fork 🔔', // غير موثّق بمصدر
      airColumnL: 'Air Column Length (L)',
      measuredSpeed: 'Measured Speed of Sound (v)',
      theoreticalSpeed: 'Theoretical Speed of Sound',
      endCorrection: 'End Correction (0.6r)',
      procedureTitle: 'Experimental Procedure:',
      procedureDesc: 'Hold vibrating fork over open top, lower water level to find 1st resonance (L1 ≈ λ/4 - c) and 2nd resonance (L2 ≈ 3λ/4 - c). Compute wavelength λ = 2(L2 - L1) and speed of sound v = f · λ independent of end correction.',
      controlHeader: 'Tuning Fork & Water Level',
      selectFork: 'Select Tuning Fork:',
      theoreticalPos: 'Theoretical Resonance Positions:',
      firstResonance: '1st Resonance L₁',
      secondResonance: '2nd Resonance L₂',
      waterLevelHeight: 'Water Column Height',
      ambientTemp: 'Ambient Air Temperature (T)',
      loggedSuccess: 'Logged to Lab Notebook!', // غير موثّق بمصدر
      logButton: 'Log Measured Speed of Sound',
    },
    ku: {
      movableReservoir: 'خەزێنەی ئاوی گوێزراوە',
      title: 'دیاریکردنی خێراییی دەنگ بە بۆریی ڕەنین و ستوونی ئاو',
      strikeFork: 'لێدانی چەنگاڵی دەنگدار 🔔', // غير موثّق بمصدر
      airColumnL: 'درێژیی ستوونی هەوا (L)',
      measuredSpeed: 'خێراییی دەنگی پێوراو (v)',
      theoreticalSpeed: 'خێراییی دەنگی بیردۆزی',
      endCorrection: 'ڕاستکردنەوەی سەر (0.6r)',
      procedureTitle: 'ڕێگەی دیاریکردنی خێراییی دەنگ بە شێوەی کرداری:',
      procedureDesc: 'چەنگاڵی دەنگداری لەرراو دەخرێتە سەر دەمی بۆرییەکە، و خەزێنەی ئاوەکە هێدی هێدی دێنرێتە خوارەوە بۆ زیادکردنی درێژیی ستوونی هەوا L تاوەکو بەرزترین دەنگدانەوە دەبيسرێت (شوێنی دەنگدانەوەی یەکەم L₁ ≈ λ/4 - c). لەگەڵ هێنانيەخوارەوەی زیاتر دەگەینە دەنگدانەوەی دووەم (L₂ ≈ 3λ/4 - c). درێژیی شەپۆل λ = 2(L₂ - L₁) و خێراییی دەنگ v = f · λ بە وردیی دەپێوین.',
      controlHeader: 'چەنگاڵی دەنگدار و ئاستی ئاو',
      selectFork: 'هەڵبژاردنی چەنگاڵی دەنگداری سنوردار (پێوەر):',
      theoreticalPos: 'شوێنەکانی دەنگدانەوەی ئەژمارکراو (L₁ و L₂):',
      firstResonance: 'دەنگدانەوەی یەکەم L₁',
      secondResonance: 'دەنگدانەوەی دووەم L₂',
      waterLevelHeight: 'بەرزیی ئاو لە بۆریدا',
      ambientTemp: 'پلەی گەرمیی هەوای دەوروبەر (T)',
      loggedSuccess: 'پێوانەکە لە دەفتەری تاقیگەدا تۆمارکرا!', // غير موثّق بمصدر
      logButton: 'تۆمارکردنی خێراییی دەنگی پێوراو',
    },
    kmr: {
      movableReservoir: 'Rezervuarê avê yê gerok',
      title: 'Diyarkirina leza dengî bi boriyan dengvedanê û stûna avê',
      strikeFork: 'Lêdana çengala dengdar 🔔', // غير موثّق بمصدر
      airColumnL: 'Dirêjahiya stûna hewayê (L)',
      measuredSpeed: 'Leza dengî ya pîvawî (v)',
      theoreticalSpeed: 'Leza dengî ya teorîk',
      endCorrection: 'Rastkirina serî (0.6r)',
      procedureTitle: 'Rêbaza diyarkirina leza dengî bi rengê pratîkî:',
      procedureDesc: 'Çengala dengdar a hejandî li ser devê boriyê tê danîn, û rezervuarê avê hêdî hêdî tê daxistin ji bo zêdekirina dirêjahiya stûna hewayê L heta ku dengvedana herî bilind tê bihîstin (cihê dengvedana yekem L₁ ≈ λ/4 - c). Dema daxistina zêdetir em digihêjin dengvedana duyem (L₂ ≈ 3λ/4 - c). Dirêjahiya pêlê λ = 2(L₂ - L₁) û leza dengî v = f · λ bipîvin.',
      controlHeader: 'Çengala dengdar û asta avê',
      selectFork: 'Hilbijartina çengala dengdar a standard:',
      theoreticalPos: 'Cihên dengvedanê yên hesabkirî (L₁ û L₂):',
      firstResonance: 'Dengvedana yekem L₁',
      secondResonance: 'Dengvedana duyem L₂',
      waterLevelHeight: 'Bilindahiya avê di boriyê de',
      ambientTemp: 'Pileya germahiya hewaya derdorê (T)',
      loggedSuccess: 'Pîvan di deftera labê de hat tomarkirin!', // غير موثّق بمصدر
      logButton: 'Tomarkirina leza dengî ya pîvawî',
    },
  }[lang] || {
    movableReservoir: 'مستودع الماء المتحرك',
    title: 'تعيين سرعة الصوت باستخدام أنبوب الرنين المغلق وعمود الماء',
    strikeFork: 'طرق الشوكة الرنانة 🔔',
    airColumnL: 'طول عمود الهواء (L)',
    measuredSpeed: 'سرعة الصوت المقاسة (v)',
    theoreticalSpeed: 'سرعة الصوت النظرية',
    endCorrection: 'تصحيح النهاية (0.6r)',
    procedureTitle: 'طريقة تعيين سرعة الصوت عملياً:',
    procedureDesc: 'توضع الشوكة الرنانة المهتزة عند فوهة الأنبوب، ويتم خفض مستودع الماء تدريجياً لزيادة طول عمود الهواء L حتى يُسمع أعلى تضخيم للصوت (موضع الرنين الأول L₁ ≈ λ/4 - c). وعند خفضه أكثر نصل للرنين الثاني (L₂ ≈ 3λ/4 - c). نحسب الطول الموجي λ = 2(L₂ - L₁) وسرعة الصوت v = f · λ بدقة بالغة وبدون الاعتماد على تصحيح النهاية.',
    controlHeader: 'الشوكة الرنانة ومستوى الماء',
    selectFork: 'اختيار الشوكة الرنانة القياسية:',
    theoreticalPos: 'مواضع الرنين المحسوبة (L₁ و L₂):',
    firstResonance: 'الرنين الأول L₁',
    secondResonance: 'الرنين الثاني L₂',
    waterLevelHeight: 'ارتفاع الماء في الأنبوب',
    ambientTemp: 'درجة حرارة الهواء المحيط (T)',
    loggedSuccess: 'تم تسجيل القياس في دفتر المختبر!',
    logButton: 'تسجيل سرعة الصوت المقاسة',
  };

  // Sound strike effect
  const strikeFork = () => {
    setIsStriking(true);
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {
          // ignore
        }
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(selectedFork, ctx.currentTime);

      const peakVol = 0.1 + resonanceIntensity * 0.35;
      gain.gain.setValueAtTime(peakVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.5);

      oscRef.current = osc;
      gainNodeRef.current = gain;
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => setIsStriking(false), 2500);
  };

  // Canvas Drawing Loop
  useEffect(() => {
    let animTime = 0;

    const render = () => {
      animTime += 0.05;
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

      const tubeX = width * 0.38;
      const tubeTopY = 70;
      const tubeH = 260;
      const tubeW = 46;

      // Draw Tuning Fork at top of tube
      const forkY = tubeTopY - 35;
      const forkVibe = isStriking ? Math.sin(animTime * 30) * 3 : 0;

      // Fork stem
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(tubeX + tubeW / 2 - 4, forkY + 18, 8, 14);

      // Fork prongs
      ctx.strokeStyle = isStriking ? '#38bdf8' : '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Left prong
      ctx.moveTo(tubeX + tubeW / 2 - 12 - forkVibe, forkY);
      ctx.lineTo(tubeX + tubeW / 2 - 12 - forkVibe, forkY + 18);
      ctx.lineTo(tubeX + tubeW / 2, forkY + 22);
      ctx.lineTo(tubeX + tubeW / 2 + 12 + forkVibe, forkY + 18);
      ctx.lineTo(tubeX + tubeW / 2 + 12 + forkVibe, forkY);
      ctx.stroke();

      // Sound Waves if vibrating
      if (isStriking) {
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + 0.4 * Math.sin(animTime * 10)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tubeX + tubeW / 2, tubeTopY - 5, 14, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tubeX + tubeW / 2, tubeTopY - 5, 24, 0, Math.PI);
        ctx.stroke();
      }

      // Draw Vertical Glass Tube
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.fillRect(tubeX, tubeTopY, tubeW, tubeH);

      // Water inside tube
      const waterHeightPix = (waterLevel / totalTubeLength) * tubeH;
      const waterTopY = tubeTopY + tubeH - waterHeightPix;

      const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, tubeTopY + tubeH);
      waterGrad.addColorStop(0, 'rgba(14, 165, 233, 0.7)');
      waterGrad.addColorStop(1, 'rgba(2, 132, 199, 0.9)');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(tubeX, waterTopY, tubeW, waterHeightPix);

      // Water meniscus line
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tubeX, waterTopY);
      ctx.lineTo(tubeX + tubeW, waterTopY);
      ctx.stroke();

      // Air column standing wave inside tube
      const airHeightPix = tubeH - waterHeightPix;
      if (isStriking && isAtResonance) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        const wavePhase = Math.sin(animTime * 12);
        const waveAmp = (tubeW / 2 - 4) * resonanceIntensity * wavePhase;

        ctx.beginPath();
        for (let y = 0; y <= airHeightPix; y += 2) {
          // Node at water surface (y = airHeightPix), Antinode at open top (y = 0)
          const k = Math.PI / (2 * airHeightPix);
          const xOffset = waveAmp * Math.cos(k * y);
          const drawX = tubeX + tubeW / 2 + xOffset;
          const drawY = tubeTopY + y;
          if (y === 0) ctx.moveTo(drawX, drawY);
          else ctx.lineTo(drawX, drawY);
        }
        ctx.stroke();
      }

      // Glass Tube Outer Walls
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tubeX, tubeTopY);
      ctx.lineTo(tubeX, tubeTopY + tubeH);
      ctx.lineTo(tubeX + tubeW, tubeTopY + tubeH);
      ctx.lineTo(tubeX + tubeW, tubeTopY);
      ctx.stroke();

      // Calibrated Ruler along the side of the tube
      const rulerX = tubeX - 35;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rulerX, tubeTopY);
      ctx.lineTo(rulerX, tubeTopY + tubeH);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      for (let cm = 0; cm <= 100; cm += 10) {
        const yPos = tubeTopY + (cm / 100) * tubeH;
        ctx.beginPath();
        ctx.moveTo(rulerX - 5, yPos);
        ctx.lineTo(rulerX + 5, yPos);
        ctx.stroke();
        ctx.fillText(`${cm}cm`, rulerX - 8, yPos + 3);
      }

      // Air Column Length (L) Dimension Arrow
      const arrowX = tubeX + tubeW + 25;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(arrowX, tubeTopY);
      ctx.lineTo(arrowX, waterTopY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(arrowX - 4, tubeTopY);
      ctx.lineTo(arrowX + 4, tubeTopY);
      ctx.moveTo(arrowX - 4, waterTopY);
      ctx.lineTo(arrowX + 4, waterTopY);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`L = ${(airColumnLength * 100).toFixed(1)} cm`, arrowX + 8, (tubeTopY + waterTopY) / 2 + 4);

      // Connected Water Reservoir Flask on right side
      const resX = width * 0.76;
      const resY = waterTopY - 20;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.7)';
      ctx.fillRect(resX - 20, resY, 40, 70);
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      ctx.strokeRect(resX - 20, resY, 40, 70);

      // Connecting flexible rubber hose between tube bottom and reservoir
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(tubeX + tubeW / 2, tubeTopY + tubeH);
      ctx.bezierCurveTo(tubeX + tubeW / 2, tubeTopY + tubeH + 40, resX, tubeTopY + tubeH + 40, resX, resY + 70);
      ctx.stroke();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.movableReservoir, resX, resY - 8);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [waterLevel, selectedFork, isStriking, isAtResonance, airColumnLength, resonanceIntensity, lang, t]);

  const snapToL1 = () => {
    const targetWater = totalTubeLength - resonantL1;
    setWaterLevel(Math.max(0, Math.min(0.98, targetWater)));
  };

  const snapToL2 = () => {
    const targetWater = totalTubeLength - resonantL2;
    setWaterLevel(Math.max(0, Math.min(0.98, targetWater)));
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'sound_speed',
      parameters: {
        tuningForkFreq: `${selectedFork} Hz`,
        airColumnL: `${(airColumnLength * 100).toFixed(1)} cm`,
        endCorrection: `${(endCorrection * 100).toFixed(2)} cm`,
        temperature: `${temperatureC}°C`,
        theoreticalSpeed: `${theoreticalSpeedOfSound.toFixed(1)} m/s`,
      },
      variableName: 'Speed of Sound (v = 4(L + c)f)',
      measuredValue: Number(expSpeedOfSound.toFixed(1)),
      theoreticalValue: Number(theoreticalSpeedOfSound.toFixed(1)),
      unit: 'm/s',
      equation: 'v = 4(L + 0.6r)·f = f·λ',
      notes: `Tuning Fork: ${selectedFork}Hz, L=${(airColumnLength * 100).toFixed(1)}cm, c=${(endCorrection * 100).toFixed(1)}cm, v_exp=${expSpeedOfSound.toFixed(1)}m/s, v_theo=${theoreticalSpeedOfSound.toFixed(1)}m/s`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="sound-speed-simulation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Simulation Canvas */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {t.title}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  v = 4(L + 0.6r) f • v_theo = {theoreticalSpeedOfSound.toFixed(1)} m/s at {temperatureC}°C
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={strikeFork}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-sky-900/30 transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span>{t.strikeFork}</span>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center items-center bg-zinc-950/70 rounded-xl border border-zinc-800/60 overflow-hidden">
            <canvas ref={canvasRef} width={700} height={380} className="max-w-full h-auto" />
          </div>

          {/* Real-time Measurements Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.airColumnL}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {(airColumnLength * 100).toFixed(1)} <span className="text-xs text-zinc-400">cm</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.measuredSpeed}</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {expSpeedOfSound.toFixed(1)} <span className="text-xs text-zinc-400">m/s</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.theoreticalSpeed}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {theoreticalSpeedOfSound.toFixed(1)} <span className="text-xs text-zinc-400">m/s</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{t.endCorrection}</div>
              <div className="text-base font-bold font-mono text-purple-400">
                {(endCorrection * 100).toFixed(2)} <span className="text-xs text-zinc-400">cm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theoretical Methodology Card */}
        <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-800/30 text-xs text-zinc-300 space-y-2">
          <div className="font-semibold text-sky-300 flex items-center gap-1.5">
            <Gauge className="w-4 h-4" />
            <span>{t.procedureTitle}</span>
          </div>
          <p>
            {t.procedureDesc}
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
          <h4 className="text-sm font-bold text-zinc-200 pb-2 border-b border-zinc-800">
            {t.controlHeader}
          </h4>

          {/* Tuning Fork Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">{t.selectFork}</label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {TUNING_FORKS.map((fork) => (
                <button
                  key={fork.f}
                  onClick={() => setSelectedFork(fork.f)}
                  className={`p-2 rounded-xl text-center font-mono border ${
                    selectedFork === fork.f
                      ? 'bg-sky-950/50 text-sky-300 border-sky-500/60 shadow-md'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold">{fork.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resonance Quick Snaps */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            <label className="text-xs text-zinc-400">{t.theoreticalPos}</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={snapToL1}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sky-400 hover:bg-zinc-800 font-mono text-center"
              >
                <div>{t.firstResonance}</div>
                <div className="font-bold">{(resonantL1 * 100).toFixed(1)} cm</div>
              </button>
              <button
                onClick={snapToL2}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sky-400 hover:bg-zinc-800 font-mono text-center"
              >
                <div>{t.secondResonance}</div>
                <div className="font-bold">{(resonantL2 * 100).toFixed(1)} cm</div>
              </button>
            </div>
          </div>

          {/* Water Level Slider */}
          <div className="space-y-1 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t.waterLevelHeight}</span>
              <span className="font-mono text-cyan-400 font-bold">{(waterLevel * 100).toFixed(1)} cm</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.005"
              value={waterLevel}
              onChange={(e) => setWaterLevel(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Air Temperature Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{t.ambientTemp}</span>
              <span className="font-mono text-amber-400 font-bold">{temperatureC}°C</span>
            </div>
            <input
              type="range"
              min="-10"
              max="45"
              step="1"
              value={temperatureC}
              onChange={(e) => setTemperatureC(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Log Measurement Button */}
          <button
            onClick={handleLog}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              logged
                ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-900/30'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>
              {logged ? t.loggedSuccess : t.logButton}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}