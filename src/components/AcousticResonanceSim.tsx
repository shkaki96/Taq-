import { Waves, Volume2, VolumeX, Sparkles, BookmarkCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

export default function AcousticResonanceSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  // Tube & Acoustic Parameters
  const [tubeType, setTubeType] = useState<'closed' | 'open'>('closed');
  const [tubeLength, setTubeLength] = useState<number>(0.85); // meters (L: 0.2 to 2.0)
  const [frequency, setFrequency] = useState<number>(340); // Hz (f: 80 to 1200)
  const [temperatureC, setTemperatureC] = useState<number>(20); // Celsius
  const [harmonicIndex, setHarmonicIndex] = useState<number>(1); // harmonic number n

  // Audio Playback with Web Audio API
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Simulation & Logging
  const [logged, setLogged] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Speed of Sound in air as a function of temperature: v = 331.3 * sqrt(1 + T/273.15)
  const speedOfSound = 331.3 * Math.sqrt(1 + temperatureC / 273.15);

  // Wavelength from source frequency: lambda = v / f
  const wavelength = speedOfSound / frequency;

  // Natural resonant frequencies for current tube length:
  // For closed tube: f_n = (2n - 1) * (v / (4L))
  // For open tube: f_n = n * (v / (2L))
  const resonantFrequencies = Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    if (tubeType === 'closed') {
      const f = ((2 * n - 1) * speedOfSound) / (4 * tubeLength);
      return { n, harmonicLabel: `${2 * n - 1}st`, f };
    } else {
      const f = (n * speedOfSound) / (2 * tubeLength);
      return { n, harmonicLabel: `${n}th`, f };
    }
  });

  // Check resonance proximity (resonance Q factor / bandwidth)
  const currentHarmonic = resonantFrequencies[harmonicIndex - 1] ?? resonantFrequencies[0];
  const resonanceDistance = Math.abs(frequency - currentHarmonic.f);
  // Resonance intensity factor from 0.0 (off-resonance) to 1.0 (perfect resonance)
  const resonanceIntensity = Math.max(0.05, Math.exp(-Math.pow(resonanceDistance / 15, 2)));
  const isAtResonance = resonanceIntensity > 0.65;

  // Audio synthesis controls
  useEffect(() => {
    if (isPlayingAudio) {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        if (!oscRef.current) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(frequency, ctx.currentTime);

          // Volume increases significantly when tube is at resonance!
          const vol = 0.08 + resonanceIntensity * 0.25;
          gain.gain.setValueAtTime(vol, ctx.currentTime);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();

          oscRef.current = osc;
          gainNodeRef.current = gain;
        } else {
          oscRef.current.frequency.setValueAtTime(frequency, ctx.currentTime);
          if (gainNodeRef.current) {
            const vol = 0.08 + resonanceIntensity * 0.25;
            gainNodeRef.current.gain.setValueAtTime(vol, ctx.currentTime);
          }
        }
      } catch (err) {
        console.error('Audio initialization error:', err);
      }
    } else {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
    }

    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (e) {
          // ignore
        }
        oscRef.current = null;
      }
    };
  }, [isPlayingAudio, frequency, resonanceIntensity]);

  // Canvas Standing Wave Animation Loop
  useEffect(() => {
    let animTime = 0;

    const render = () => {
      animTime += 0.04;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.direction = (lang === 'ar' || lang === 'ku' || lang === 'bad') ? 'rtl' : 'ltr';

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

      const tubeStartX = 70;
      const tubeY = height * 0.42;
      const tubeH = 90;
      const maxTubeLengthPix = 500;
      const tubePix = Math.min(maxTubeLengthPix, tubeLength * 260);
      const tubeEndX = tubeStartX + tubePix;

      // Draw Loudspeaker / Tuning Fork Acoustic Driver at left open end
      ctx.fillStyle = '#475569';
      ctx.fillRect(tubeStartX - 40, tubeY - 20, 28, tubeH + 40);
      ctx.beginPath();
      ctx.moveTo(tubeStartX - 12, tubeY - 10);
      ctx.lineTo(tubeStartX - 4, tubeY + 15);
      ctx.lineTo(tubeStartX - 4, tubeY + tubeH - 15);
      ctx.lineTo(tubeStartX - 12, tubeY + tubeH + 10);
      ctx.closePath();
      ctx.fillStyle = isAtResonance ? '#38bdf8' : '#64748b';
      ctx.fill();

      // Sound emission rings from speaker
      if (isPlayingAudio || isAtResonance) {
        const ringAlpha = 0.3 + 0.5 * Math.sin(animTime * 6);
        ctx.strokeStyle = `rgba(56, 189, 248, ${ringAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tubeStartX - 4, tubeY + tubeH / 2, 18, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tubeStartX - 4, tubeY + tubeH / 2, 28, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      // Draw Acoustic Resonance Tube Walls
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(tubeStartX, tubeY, tubePix, tubeH);

      // Top and Bottom Glass tube boundaries
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tubeStartX, tubeY);
      ctx.lineTo(tubeEndX, tubeY);
      ctx.moveTo(tubeStartX, tubeY + tubeH);
      ctx.lineTo(tubeEndX, tubeY + tubeH);
      ctx.stroke();

      // Right End Boundary: Solid wall if closed, open if open
      if (tubeType === 'closed') {
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(tubeEndX, tubeY - 6, 12, tubeH + 12);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(tubeEndX, tubeY - 6, 12, tubeH + 12);

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(tI18n('experiments.acoustic_resonance.closedNode'), tubeEndX - 20, tubeY - 14);
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(tI18n('experiments.acoustic_resonance.openAntinode'), tubeEndX - 30, tubeY - 14);
      }

      // Draw Air Particles & Acoustic Pressure / Displacement Standing Wave
      const k = (2 * Math.PI) / wavelength;
      const amp = (tubeH / 2 - 10) * resonanceIntensity;
      const midY = tubeY + tubeH / 2;

      // Draw Displacement Wave Envelope
      ctx.strokeStyle = isAtResonance ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2.5;

      // Upper and Lower envelope standing wave curves
      const phase = Math.sin(animTime * 8);

      ctx.beginPath();
      for (let x = 0; x <= tubePix; x += 3) {
        const xPosMeters = (x / tubePix) * tubeLength;
        // Boundary condition:
        // Closed at right end: x = L is a Displacement Node (amp = 0)
        // Open at left end: x = 0 is a Displacement Antinode
        let spatialEnvelope = 0;
        if (tubeType === 'closed') {
          spatialEnvelope = Math.sin(k * (tubeLength - xPosMeters));
        } else {
          spatialEnvelope = Math.cos(k * (xPosMeters - tubeLength / 2));
        }

        const yOffset = spatialEnvelope * amp * phase;
        const curY = midY + yOffset;
        if (x === 0) ctx.moveTo(tubeStartX + x, curY);
        else ctx.lineTo(tubeStartX + x, curY);
      }
      ctx.stroke();

      // Inverted envelope curve (dotted)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let x = 0; x <= tubePix; x += 3) {
        const xPosMeters = (x / tubePix) * tubeLength;
        let spatialEnvelope = 0;
        if (tubeType === 'closed') {
          spatialEnvelope = Math.sin(k * (tubeLength - xPosMeters));
        } else {
          spatialEnvelope = Math.cos(k * (xPosMeters - tubeLength / 2));
        }
        const yOffset = -spatialEnvelope * amp * phase;
        const curY = midY + yOffset;
        if (x === 0) ctx.moveTo(tubeStartX + x, curY);
        else ctx.lineTo(tubeStartX + x, curY);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Nodes & Antinodes Markers
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';

      // Tube Dimension Ruler below tube
      const rulerY = tubeY + tubeH + 30;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tubeStartX, rulerY);
      ctx.lineTo(tubeEndX, rulerY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(tubeStartX, rulerY - 6);
      ctx.lineTo(tubeStartX, rulerY + 6);
      ctx.moveTo(tubeEndX, rulerY - 6);
      ctx.lineTo(tubeEndX, rulerY + 6);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`L = ${tubeLength.toFixed(2)} m`, (tubeStartX + tubeEndX) / 2, rulerY + 16);

      // Resonance Intensity Indicator Bar
      const meterX = width * 0.78;
      const meterY = height * 0.18;
      const meterH = 150;
      const fillH = resonanceIntensity * meterH;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(meterX, meterY, 20, meterH);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(meterX, meterY, 20, meterH);

      const grad = ctx.createLinearGradient(0, meterY + meterH, 0, meterY);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.6, '#10b981');
      grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = grad;
      ctx.fillRect(meterX, meterY + meterH - fillH, 20, fillH);

      ctx.fillStyle = isAtResonance ? '#4ade80' : '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tI18n('experiments.acoustic_resonance.resonanceAmp'), meterX + 10, meterY - 8);
      ctx.fillText(`${Math.round(resonanceIntensity * 100)}%`, meterX + 10, meterY + meterH + 16);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [tubeType, tubeLength, frequency, wavelength, isAtResonance, isPlayingAudio, resonanceIntensity, lang]);

  const snapToResonance = (fTarget: number) => {
    setFrequency(Math.round(fTarget * 10) / 10);
  };

  const handleLog = () => {
    onLogMeasurement({
      experiment: 'acoustic_resonance',
      parameters: {
        tubeType: tubeType,
        tubeLength: `${tubeLength.toFixed(2)} m`,
        frequency: `${frequency.toFixed(1)} Hz`,
        temperature: `${temperatureC}°C`,
        speedOfSound: `${speedOfSound.toFixed(1)} m/s`,
        harmonic: currentHarmonic.harmonicLabel,
      },
      variableName: 'Acoustic Resonance Frequency',
      measuredValue: Number(frequency.toFixed(1)),
      theoreticalValue: Number(currentHarmonic.f.toFixed(1)),
      unit: 'Hz',
      equation: tubeType === 'closed' ? 'fn = (2n-1)·(v / 4L)' : 'fn = n·(v / 2L)',
      notes: `Resonance Intensity: ${Math.round(resonanceIntensity * 100)}%, λ=${wavelength.toFixed(3)}m, v=${speedOfSound.toFixed(1)}m/s at ${temperatureC}°C`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <div id="acoustic-resonance-simulation" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Canvas Area */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Waves  className="w-5 h-5"/>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">
                  {tI18n('experiments.acoustic_resonance.title')}
                </h3>
                <p className="text-sm text-zinc-400 font-mono">
                  v = {speedOfSound.toFixed(1)} m/s • λ = {wavelength.toFixed(3)} m • {tubeType === 'closed' ? 'L = (2n-1) λ/4' : 'L = n λ/2'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPlayingAudio
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                {isPlayingAudio ? <Volume2  className="w-4 h-4 animate-pulse"/> : <VolumeX  className="w-4 h-4 text-zinc-400"/>}
                <span>{isPlayingAudio ? tI18n('experiments.acoustic_resonance.audioOn') : tI18n('experiments.acoustic_resonance.playTone')}</span>
              </button>
            </div>
          </div>

          <div className="relative flex justify-center items-center bg-zinc-950/70 rounded-xl border border-zinc-800/60 overflow-hidden">
            <canvas ref={canvasRef} width={700} height={360}  className="max-w-full h-auto"/>
          </div>

          {/* Real-time Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.acoustic_resonance.sourceFreq')}</div>
              <div className="text-base font-bold font-mono text-teal-400">
                {frequency.toFixed(1)} <span className="text-sm text-zinc-400">Hz</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.acoustic_resonance.resonanceFreq')}</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {currentHarmonic.f.toFixed(1)} <span className="text-sm text-zinc-400">Hz</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.acoustic_resonance.wavelength')}</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {wavelength.toFixed(3)} <span className="text-sm text-zinc-400">m</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-center">
              <div className="text-[11px] text-zinc-400">{tI18n('experiments.acoustic_resonance.speedOfSound')}</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {speedOfSound.toFixed(1)} <span className="text-sm text-zinc-400">m/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theoretical Description */}
        <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-800/30 text-xs text-zinc-300 space-y-2">
          <div className="font-semibold text-teal-300 flex items-center gap-1.5">
            <Sparkles  className="w-4 h-4"/>
            <span>{tI18n('experiments.acoustic_resonance.theoryTitle')}</span>
          </div>
          <p>
            {tI18n('experiments.acoustic_resonance.theoryDesc')}
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl space-y-5">
          <h4 className="text-sm font-bold text-zinc-200 pb-2 border-b border-zinc-800">
            {tI18n('experiments.acoustic_resonance.tubeTypeHeader')}
          </h4>

          {/* Tube Type Selection */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button 
              onClick={() => setTubeType('closed')}
              className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl font-semibold border ${
                tubeType === 'closed' ? 'bg-zinc-800 text-teal-400 border-teal-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {tI18n('experiments.acoustic_resonance.closedTube')}
            </button>
            <button 
              onClick={() => setTubeType('open')}
              className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl font-semibold border ${
                tubeType === 'open' ? 'bg-zinc-800 text-teal-400 border-teal-500/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'
              }`}
            >
              {tI18n('experiments.acoustic_resonance.openTube')}
            </button>
          </div>

          {/* Harmonic Selector Quick Snap */}
          <div className="space-y-1.5">
            <label className="text-sm text-zinc-400">{tI18n('experiments.acoustic_resonance.snapHarmonics')}</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {resonantFrequencies.slice(0, 3).map((res) => (
                <button 
                  key={res.n}
                  onClick={() => {
                    setHarmonicIndex(res.n);
                    snapToResonance(res.f);
                  }}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-teal-400 font-mono text-center"
                >
                  <div className="text-[10px] text-zinc-400">n={res.n}</div>
                  <div className="font-bold">{res.f.toFixed(0)} Hz</div>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency Slider */}
          <div className="space-y-1 pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.acoustic_resonance.freqLabel')}</span>
              <span className="font-mono text-teal-400 font-bold">{frequency.toFixed(1)} Hz</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="1"
              value={frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>

          {/* Tube Length Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.acoustic_resonance.tubeLengthLabel')}</span>
              <span className="font-mono text-sky-400 font-bold">{tubeLength.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.8"
              step="0.02"
              value={tubeLength}
              onChange={(e) => setTubeLength(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Air Temperature Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">{tI18n('experiments.acoustic_resonance.airTempLabel')}</span>
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
            className={`min-h-[44px] min-w-[44px] w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${ logged ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-teal-900/30' }`}
          >
            <BookmarkCheck  className="w-4 h-4"/>
            <span>
              {logged ? tI18n('experiments.acoustic_resonance.loggedSuccess') : tI18n('experiments.acoustic_resonance.logButton')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}