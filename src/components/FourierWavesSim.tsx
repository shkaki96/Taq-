import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Waves, 
  RotateCcw, 
  Activity, 
  BookmarkCheck, 
  Play, 
  Pause, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Sliders, 
  BarChart3, 
  Eye, 
  Info,
  Trash2,
  Maximize2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface FourierWavesSimProps {
  lang: Language;
  onLogMeasurement?: (data: any) => void;
}

export const FourierWavesSim: React.FC<FourierWavesSimProps> = ({ lang, onLogMeasurement }) => {
  const { t: tI18n } = useTranslation();

  // 11 Harmonics (n = 1 to 11)
  const numHarmonics = 11;
  // Default to square wave approximation
  const [harmonics, setHarmonics] = useState<number[]>([
    1.0, 0.0, 1 / 3, 0.0, 1 / 5, 0.0, 1 / 7, 0.0, 1 / 9, 0.0, 1 / 11
  ]);
  const [fundamentalFreq, setFundamentalFreq] = useState<number>(1.0); // Hz
  const [activePreset, setActivePreset] = useState<'square' | 'sawtooth' | 'triangle' | 'sine' | 'pulse' | 'custom'>('square');

  // Animation & Audio States
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [showComponents, setShowComponents] = useState<boolean>(true);
  const [showSpectrum, setShowSpectrum] = useState<boolean>(true);

  // Logging state
  const [logged, setLogged] = useState<boolean>(false);

  // Canvas & Audio References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscNodesRef = useRef<OscillatorNode[]>([]);
  const oscGainsRef = useRef<GainNode[]>([]);
  const timeRef = useRef<number>(0);

  // Harmonic Colors Palette
  const harmonicColors = [
    '#38bdf8', // n=1 Sky
    '#fbbf24', // n=2 Amber
    '#34d399', // n=3 Emerald
    '#f472b6', // n=4 Pink
    '#a78bfa', // n=5 Purple
    '#fb923c', // n=6 Orange
    '#2dd4bf', // n=7 Teal
    '#e879f9', // n=8 Fuchsia
    '#60a5fa', // n=9 Blue
    '#4ade80', // n=10 Green
    '#f87171', // n=11 Red
  ];

  // Mathematical Quantities
  const { rmsVoltage, totalPower, thdPercent } = useMemo(() => {
    const sumSq = harmonics.reduce((sum, a) => sum + a * a, 0);
    const rms = Math.sqrt(0.5 * sumSq);
    const power = 0.5 * sumSq;
    
    // THD = sqrt(sum_{n=2..11} An^2) / |A1|
    const higherHarmonicsSq = harmonics.slice(1).reduce((sum, a) => sum + a * a, 0);
    const fundamentalAmp = Math.abs(harmonics[0]);
    const thd = fundamentalAmp > 0.001 ? (Math.sqrt(higherHarmonicsSq) / fundamentalAmp) * 100 : 0;

    return {
      rmsVoltage: parseFloat(rms.toFixed(3)),
      totalPower: parseFloat(power.toFixed(3)),
      thdPercent: parseFloat(thd.toFixed(1)),
    };
  }, [harmonics]);

  // Preset Setters
  const setSquareWave = useCallback(() => {
    const arr = new Array(numHarmonics).fill(0);
    for (let n = 1; n <= numHarmonics; n++) {
      if (n % 2 !== 0) {
        arr[n - 1] = parseFloat((1 / n).toFixed(3));
      }
    }
    setHarmonics(arr);
    setActivePreset('square');
  }, [numHarmonics]);

  const setSawtoothWave = useCallback(() => {
    const arr = new Array(numHarmonics).fill(0);
    for (let n = 1; n <= numHarmonics; n++) {
      arr[n - 1] = parseFloat(((n % 2 === 1 ? 1 : -1) * (1 / n)).toFixed(3));
    }
    setHarmonics(arr);
    setActivePreset('sawtooth');
  }, [numHarmonics]);

  const setTriangleWave = useCallback(() => {
    const arr = new Array(numHarmonics).fill(0);
    for (let n = 1; n <= numHarmonics; n++) {
      if (n % 2 !== 0) {
        const k = (n - 1) / 2;
        const sign = k % 2 === 0 ? 1 : -1;
        arr[n - 1] = parseFloat((sign * (1 / (n * n))).toFixed(3));
      }
    }
    setHarmonics(arr);
    setActivePreset('triangle');
  }, [numHarmonics]);

  const setPureSine = useCallback(() => {
    const arr = new Array(numHarmonics).fill(0);
    arr[0] = 1.0;
    setHarmonics(arr);
    setActivePreset('sine');
  }, [numHarmonics]);

  const setPulseTrain = useCallback(() => {
    const arr = new Array(numHarmonics).fill(0);
    for (let n = 1; n <= numHarmonics; n++) {
      arr[n - 1] = 0.45;
    }
    setHarmonics(arr);
    setActivePreset('pulse');
  }, [numHarmonics]);

  const clearAllHarmonics = useCallback(() => {
    setHarmonics(new Array(numHarmonics).fill(0));
    setActivePreset('custom');
  }, [numHarmonics]);

  // Update Individual Harmonic
  const updateHarmonic = (idx: number, val: number) => {
    setHarmonics((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
    setActivePreset('custom');
  };

  // Web Audio Synthesizer Engine
  useEffect(() => {
    if (!isAudioPlaying) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const baseFreq = 220; // 220 Hz (A3 musical pitch)
      const oscs: OscillatorNode[] = [];
      const gains: GainNode[] = [];

      harmonics.forEach((amp, idx) => {
        const n = idx + 1;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * n, ctx.currentTime);
        g.gain.setValueAtTime(Math.abs(amp) * 0.4, ctx.currentTime);

        osc.connect(g);
        g.connect(masterGain);
        osc.start();

        oscs.push(osc);
        gains.push(g);
      });

      oscNodesRef.current = oscs;
      oscGainsRef.current = gains;
    } catch (e) {
      console.warn('Audio Context initialization prevented:', e);
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isAudioPlaying]);

  // Update Audio Gains on Harmonic Changes
  useEffect(() => {
    if (!isAudioPlaying || !audioCtxRef.current || oscGainsRef.current.length === 0) return;
    const ctx = audioCtxRef.current;

    harmonics.forEach((amp, idx) => {
      if (oscGainsRef.current[idx]) {
        oscGainsRef.current[idx].gain.setTargetAtTime(Math.abs(amp) * 0.4, ctx.currentTime, 0.05);
      }
    });
  }, [harmonics, isAudioPlaying]);

  // Canvas Wave Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isRunning) {
        const speedMultiplier = isSlowMo ? 0.35 : 1.0;
        timeRef.current += dt * fundamentalFreq * 2 * Math.PI * speedMultiplier;
      }
      const t = timeRef.current;

      ctx.clearRect(0, 0, 600, 280);

      // Deep Tech Canvas Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 280);
      bgGrad.addColorStop(0, '#020617');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 280);

      const centerY = 140;
      const startX = 40;
      const endX = 560;
      const width = endX - startX;
      const numSamplePoints = 180;

      // 1. Grid & Axes
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;

      // Center Line
      ctx.beginPath();
      ctx.moveTo(startX - 20, centerY);
      ctx.lineTo(endX + 20, centerY);
      ctx.stroke();

      // Dotted ±1.0V Amplitude Boundaries
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
      ctx.beginPath();
      ctx.moveTo(startX - 10, centerY - 65);
      ctx.lineTo(endX + 10, centerY - 65);
      ctx.moveTo(startX - 10, centerY + 65);
      ctx.lineTo(endX + 10, centerY + 65);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText('+1.0V', startX - 35, centerY - 62);
      ctx.fillText('-1.0V', startX - 35, centerY + 68);
      ctx.fillText('0.0V', startX - 32, centerY + 3);

      // 2. Render Individual Harmonic Sub-waves (Optional Overlay)
      if (showComponents) {
        harmonics.forEach((amp, idx) => {
          if (Math.abs(amp) < 0.01) return;
          const n = idx + 1;
          const color = harmonicColors[idx % harmonicColors.length];

          ctx.beginPath();
          for (let p = 0; p <= numSamplePoints; p++) {
            const frac = p / numSamplePoints;
            const x = startX + frac * width;
            const spatialX = frac * Math.PI * 4; // 2 complete spatial wavelengths for n=1
            const yOffset = amp * Math.sin(n * spatialX - (isRunning ? n * t : 0)) * 65;
            const y = centerY - yOffset;

            if (p === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = 0.45;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        });
      }

      // 3. Render Master Synthesized Composite Wave (f(x, t))
      ctx.beginPath();
      for (let p = 0; p <= numSamplePoints; p++) {
        const frac = p / numSamplePoints;
        const x = startX + frac * width;
        const spatialX = frac * Math.PI * 4;

        let compositeY = 0;
        for (let idx = 0; idx < numHarmonics; idx++) {
          const amp = harmonics[idx];
          if (Math.abs(amp) < 0.001) continue;
          const n = idx + 1;
          compositeY += amp * Math.sin(n * spatialX - (isRunning ? n * t : 0));
        }

        const y = centerY - compositeY * 65;
        if (p === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Glowing composite wave stroke
      ctx.save();
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Draw Time Cursor / Phase Indicator
      const cursorFrac = 0.5;
      const cursorX = startX + cursorFrac * width;
      let curY = 0;
      for (let idx = 0; idx < numHarmonics; idx++) {
        const amp = harmonics[idx];
        const n = idx + 1;
        curY += amp * Math.sin(n * (cursorFrac * Math.PI * 4) - (isRunning ? n * t : 0));
      }
      const markerY = centerY - curY * 65;

      ctx.beginPath();
      ctx.arc(cursorX, markerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isRunning,
    isSlowMo,
    harmonics,
    fundamentalFreq,
    showComponents,
    numHarmonics,
    harmonicColors,
  ]);

  // Log Experiment Data
  const handleLog = () => {
    if (onLogMeasurement) {
      onLogMeasurement({
        experiment: 'fourier_making_waves',
        variableName: 'Fourier_Composite_Wave_Synthesis',
        measuredValue: rmsVoltage,
        theoreticalValue: parseFloat((Math.max(...harmonics.map((a) => Math.abs(a))) / Math.SQRT2).toFixed(3)),
        unit: 'V',
        parameters: {
          Active_Preset: activePreset.toUpperCase(),
          Fundamental_Frequency_f0: `${fundamentalFreq.toFixed(2)} Hz`,
          Harmonic_Count: `${numHarmonics} Harmonics`,
          Harmonic_1_A1: `${harmonics[0].toFixed(2)} V`,
          Harmonic_2_A2: `${harmonics[1].toFixed(2)} V`,
          Harmonic_3_A3: `${harmonics[2].toFixed(2)} V`,
          Harmonic_4_A4: `${harmonics[3].toFixed(2)} V`,
          Harmonic_5_A5: `${harmonics[4].toFixed(2)} V`,
          Harmonic_6_A6: `${harmonics[5].toFixed(2)} V`,
          Harmonic_7_A7: `${harmonics[6].toFixed(2)} V`,
          Harmonic_8_A8: `${harmonics[7].toFixed(2)} V`,
          Harmonic_9_A9: `${harmonics[8].toFixed(2)} V`,
          Harmonic_10_A10: `${harmonics[9].toFixed(2)} V`,
          Harmonic_11_A11: `${harmonics[10].toFixed(2)} V`,
          Synthesized_RMS_Voltage: `${rmsVoltage} V`,
          Total_Harmonic_Power: `${totalPower} W`,
          Total_Harmonic_Distortion: `${thdPercent}%`,
        },
        equation: 'f(t) = Σ [A_n · sin(n·ω·t)] | V_RMS = √[0.5 · Σ(A_n²)] | THD = √(Σ_{n>1} A_n²) / |A_1|',
        timestamp: new Date().toISOString(),
      });
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 text-slate-100 shadow-xl select-none" id="fourier-waves-root">
      
      {/* 1. Header Bar: Title, Subtitle, and Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-sky-500/10 border border-indigo-500/30 rounded-xl text-indigo-400 shadow-inner shrink-0">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span>{tI18n('experiments.fourier_making_waves.title')}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-indigo-300 whitespace-nowrap">
                f(x) = Σ Aₙ sin(nωt)
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{tI18n('experiments.fourier_making_waves.subtitle')}</p>
          </div>
        </div>

        {/* Action Controls - Strictly Protected Against Text Overflow */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Play / Pause Toggle */}
          <button
            id="fourier-play-pause-btn"
            onClick={() => setIsRunning(!isRunning)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
            <span>{isRunning ? tI18n('experiments.fourier_making_waves.pause') : tI18n('experiments.fourier_making_waves.play')}</span>
          </button>

          {/* Slow Motion Toggle */}
          <button
            onClick={() => setIsSlowMo(!isSlowMo)}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 border ${
              isSlowMo
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{isSlowMo ? '0.35x' : '1.0x'}</span>
          </button>

          {/* Audio Synthesizer Toggle */}
          <button
            id="fourier-audio-btn"
            onClick={() => setIsAudioPlaying(!isAudioPlaying)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 border ${
              isAudioPlaying
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/30 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isAudioPlaying ? <Volume2 className="w-4 h-4 shrink-0" /> : <VolumeX className="w-4 h-4 shrink-0" />}
            <span>{isAudioPlaying ? tI18n('experiments.fourier_making_waves.audioMute') : tI18n('experiments.fourier_making_waves.audioPlay')}</span>
          </button>

          {/* Log Measurement Button */}
          <button
            id="fourier-log-btn"
            onClick={handleLog}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0 ${
              logged
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span>{logged ? (tI18n('experiments.fourier_making_waves.logged') || 'Logged ✓') : (tI18n('experiments.fourier_making_waves.log') || 'Log')}</span>
          </button>

          {/* Reset Button */}
          <button
            id="fourier-reset-btn"
            onClick={setSquareWave}
            title={tI18n('experiments.fourier_making_waves.reset')}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors flex items-center justify-center shrink-0"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
          </button>

        </div>
      </div>

      {/* 2. Presets Bar: Standard Waveforms */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap me-1">
              {tI18n('experiments.fourier_making_waves.presets')}:
            </span>
            
            <button
              onClick={setSquareWave}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                activePreset === 'square'
                  ? 'bg-indigo-500/20 border-indigo-500/70 text-indigo-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              ⬛ {tI18n('experiments.fourier_making_waves.square')}
            </button>

            <button
              onClick={setSawtoothWave}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                activePreset === 'sawtooth'
                  ? 'bg-indigo-500/20 border-indigo-500/70 text-indigo-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              📐 {tI18n('experiments.fourier_making_waves.sawtooth')}
            </button>

            <button
              onClick={setTriangleWave}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                activePreset === 'triangle'
                  ? 'bg-indigo-500/20 border-indigo-500/70 text-indigo-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              🔺 {tI18n('experiments.fourier_making_waves.triangle')}
            </button>

            <button
              onClick={setPureSine}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                activePreset === 'sine'
                  ? 'bg-indigo-500/20 border-indigo-500/70 text-indigo-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              〰️ {tI18n('experiments.fourier_making_waves.sine')}
            </button>

            <button
              onClick={setPulseTrain}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 whitespace-nowrap shrink-0 ${
                activePreset === 'pulse'
                  ? 'bg-indigo-500/20 border-indigo-500/70 text-indigo-200 font-bold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              ⚡ {tI18n('experiments.fourier_making_waves.pulse')}
            </button>
          </div>

          {/* Clear All Harmonics */}
          <button
            onClick={clearAllHarmonics}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-all active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>{tI18n('experiments.fourier_making_waves.clearAll')}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Stage: Composite Wave Visualizer & Harmonic Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Stage: Canvas & Mathematical Quantities */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between items-center relative min-h-[440px] overflow-hidden shadow-inner">
          
          {/* Top Formula & Realtime Readouts */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-10 font-mono shadow-sm">
            <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
              <span className="text-slate-400 font-semibold">{tI18n('experiments.fourier_making_waves.rmsVoltage')}:</span>
              <span className="text-emerald-400 font-bold text-base sm:text-lg">{rmsVoltage.toFixed(3)} V</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-mono">
              <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">P = </span>
                <span className="font-bold text-amber-400">{totalPower.toFixed(3)} W</span>
              </div>
              <div className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">THD = </span>
                <span className="font-bold text-sky-400">{thdPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Interactive Waveform Canvas */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-2 relative">
            <canvas
              ref={canvasRef}
              width={600}
              height={280}
              className="w-full h-auto max-h-[280px] rounded-xl bg-slate-950 border border-slate-900 shadow-inner"
            />
          </div>

          {/* Bottom Visualizer Options (Components Toggle & Fundamental Freq) */}
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showComponents}
                  onChange={(e) => setShowComponents(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="whitespace-nowrap">{tI18n('experiments.fourier_making_waves.showComponents')}</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSpectrum}
                  onChange={(e) => setShowSpectrum(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer shrink-0"
                />
                <span className="whitespace-nowrap">{tI18n('experiments.fourier_making_waves.showSpectrum')}</span>
              </label>
            </div>

            {/* Fundamental Frequency Slider */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 font-sans">{tI18n('experiments.fourier_making_waves.fundamental')}:</span>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={fundamentalFreq}
                onChange={(e) => setFundamentalFreq(Number(e.target.value))}
                className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="font-bold text-indigo-300 w-12 text-right">{fundamentalFreq.toFixed(1)} Hz</span>
            </div>
          </div>

        </div>

        {/* Right Stage: Harmonics Sliders & Interactive Spectrum */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Harmonics Control Panel */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
                {tI18n('experiments.fourier_making_waves.harmonicsHeader')}
              </span>
              <span className="text-[11px] font-mono text-slate-500">n = 1..{numHarmonics}</span>
            </div>

            {/* Interactive Amplitude Sliders List */}
            <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
              {harmonics.map((amp, idx) => {
                const n = idx + 1;
                const color = harmonicColors[idx % harmonicColors.length];

                return (
                  <div key={idx} className="flex items-center gap-2 text-xs bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80">
                    <span 
                      className="w-8 font-mono font-bold text-right shrink-0"
                      style={{ color }}
                    >
                      A{n}:
                    </span>
                    
                    <input
                      type="range"
                      min="-1.00"
                      max="1.00"
                      step="0.02"
                      value={amp}
                      onChange={(e) => updateHarmonic(idx, Number(e.target.value))}
                      className="touch-none flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: color }}
                    />

                    <span className="w-12 font-mono text-right text-slate-200 shrink-0">
                      {amp >= 0 ? `+${amp.toFixed(2)}` : amp.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Interactive Harmonic FFT Spectrum Bar Chart */}
            {showSpectrum && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                  <BarChart3 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  Amplitude Spectrum |Aₙ|
                </span>

                <div className="h-16 flex items-end justify-between gap-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  {harmonics.map((amp, idx) => {
                    const n = idx + 1;
                    const barHeightPct = Math.min(100, Math.abs(amp) * 100);
                    const color = harmonicColors[idx % harmonicColors.length];

                    return (
                      <div 
                        key={idx} 
                        onClick={() => updateHarmonic(idx, amp === 0 ? 0.5 : 0)}
                        className="flex-1 h-full flex flex-col justify-end items-center cursor-pointer group"
                        title={`Harmonic n=${n}: ${amp.toFixed(2)}`}
                      >
                        <div 
                          className="w-full rounded-t-sm transition-all duration-150 group-hover:brightness-125"
                          style={{ 
                            height: `${Math.max(4, barHeightPct)}%`, 
                            backgroundColor: color 
                          }} 
                        />
                        <span className="text-[9px] font-mono text-slate-500 mt-1">{n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Educational Note */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {tI18n('experiments.fourier_making_waves.tip')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
