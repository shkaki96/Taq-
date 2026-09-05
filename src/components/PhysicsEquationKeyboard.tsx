import { Calculator, ChevronDown, ChevronUp, Eye, Delete, RotateCcw, Check, Copy, Sparkles, Hash, CornerDownLeft, X, Layers } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Language } from '../types';

interface PhysicsEquationKeyboardProps {
  lang?: Language;
  value?: string;
  onChange?: (val: string) => void;
  onInsert?: (symbol: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
  docked?: boolean;
  targetInputId?: string;
}

type TabType = 'operators' | 'variables' | 'greek' | 'units' | 'presets';

export const PhysicsEquationKeyboard: React.FC<PhysicsEquationKeyboardProps> = ({
  lang,
  value = '',
  onChange,
  onInsert,
  onClose,
  isOpen = true,
  docked = false,
}) => {
  const { t, i18n } = useTranslation();
  const [internalValue, setInternalValue] = useState(value);
  const [activeTab, setActiveTab] = useState<TabType>('operators');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showEvaluator, setShowEvaluator] = useState(false);
  const [evalResult, setEvalResult] = useState<string | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [useArabicNumerals, setUseArabicNumerals] = useState(false);

  const currentValue = onChange ? value : internalValue;

  const updateValue = (newVal: string) => {
    if (onChange) {
      onChange(newVal);
    } else {
      setInternalValue(newVal);
    }
    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(newVal);
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
  };

  const handleInsert = (sym: string) => {
    if (onInsert) {
      onInsert(sym);
    }
    updateValue(currentValue + sym);
  };

  const handleBackspace = () => {
    if (!currentValue) return;
    updateValue(currentValue.slice(0, -1));
  };

  const handleClear = () => {
    updateValue('');
    setEvalResult(null);
    setEvalError(null);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      if (onChange) onChange(prev);
      else setInternalValue(prev);
    }
  };

  const handleCopy = () => {
    if (!currentValue) return;
    navigator.clipboard.writeText(currentValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe Expression Evaluator for Physics Formulas using mathjs
  const evaluateExpression = async () => {
    try {
      setEvalError(null);
      let rawExpr = currentValue.trim();
      if (!rawExpr) {
        setEvalResult(null);
        return;
      }
      
      // If it's an equation like T = 2 * pi * sqrt(L / g), take the RHS
      if (rawExpr.includes('=')) {
        const parts = rawExpr.split('=');
        rawExpr = parts[parts.length - 1].trim();
      }

      // 1. Normalize Eastern Arabic & Persian/Kurdish numerals to ASCII digits
      const easternArabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      let expr = rawExpr;
      for (let i = 0; i <= 9; i++) {
        expr = expr.replaceAll(easternArabicDigits[i], String(i));
        expr = expr.replaceAll(persianDigits[i], String(i));
      }

      // 2. Normalize Arabic decimal separators (٫, ،)
      expr = expr.replaceAll('٫', '.').replaceAll('،', ',');

      // 3. Format physics shorthand characters for mathjs
      expr = expr
        .replace(/π/g, 'pi')
        .replace(/×10\^/g, '*10^')
        .replace(/×/g, '*')
        .replace(/·/g, '*')
        .replace(/÷/g, '/')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/½/g, '(1/2)')
        .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
        .replace(/√([0-9.]+)/g, 'sqrt($1)')
        .replace(/∛\(([^)]+)\)/g, 'cbrt($1)')
        .replace(/∛([0-9.]+)/g, 'cbrt($1)')
        .replace(/ln\(/g, 'log(') // in mathjs, log(x) is natural log
        .replace(/log\(/g, 'log10('); // log base 10

      // Evaluate safely with mathjs with predefined physics constants
      const { evaluate } = await import('mathjs');
      const res = evaluate(expr, {
        g: 9.80665,
        c: 299792458,
        G: 6.67430e-11,
        h: 6.62607015e-34,
        hbar: 1.054571817e-34,
        kB: 1.380649e-23,
        e: 1.602176634e-19,
        eps0: 8.8541878128e-12,
        mu0: 1.25663706212e-6,
      });

      if (typeof res === 'number' && !isNaN(res)) {
        setEvalResult(res.toLocaleString(undefined, { maximumFractionDigits: 6 }));
      } else if (res && typeof res.toNumber === 'function') {
        const num = res.toNumber();
        setEvalResult(num.toLocaleString(undefined, { maximumFractionDigits: 6 }));
      } else {
        setEvalError(t('equationKeyboard.errors.syntax'));
      }
    } catch {
      setEvalError(t('equationKeyboard.errors.eval'));
    }
  };

  const getLabel = (item: { ar: string; ku: string; kmr: string; en: string }) => {
    const curLang = i18n.language || lang;
    switch (curLang) {
      case 'ku': return item.ku;
      case 'kmr': return item.kmr;
      case 'en': return item.en;
      case 'ar':
      default: return item.ar;
    }
  };

  const mathOperators = [
    // Primary Numbers & Decimals
    { s: '.', labelKey: 'keyboard.units..' },
    { s: ',', labelKey: 'keyboard.units.,' },
    { s: '+', labelKey: 'keyboard.units.+' },
    { s: '-', labelKey: 'keyboard.units.-' },
    { s: '×', labelKey: 'keyboard.units.×' },
    { s: '÷', labelKey: 'keyboard.units.÷' },
    { s: '=', labelKey: 'keyboard.units.=' },
    { s: '±', labelKey: 'keyboard.units.±' },
    
    // Parentheses & Groups
    { s: '(', labelKey: 'keyboard.units.(' },
    { s: ')', labelKey: 'keyboard.units.)' },
    { s: '[', labelKey: 'keyboard.units.[' },
    { s: ']', labelKey: 'keyboard.units.]' },
    { s: '|', labelKey: 'keyboard.units.|' },
    
    // Powers & Roots
    { s: '^', labelKey: 'keyboard.units.^' },
    { s: '²', labelKey: 'keyboard.units.2' },
    { s: '³', labelKey: 'keyboard.units.³' },
    { s: '√(', labelKey: 'keyboard.units.√(' },
    { s: '∛(', labelKey: 'keyboard.units.∛(' },
    { s: '½', labelKey: 'keyboard.units.½' },
    { s: '×10^', labelKey: 'keyboard.units.×10^' },
    
    // Trigonometry & Math Functions
    { s: 'sin(', labelKey: 'keyboard.units.sin(' },
    { s: 'cos(', labelKey: 'keyboard.units.cos(' },
    { s: 'tan(', labelKey: 'keyboard.units.tan(' },
    { s: 'arcsin(', labelKey: 'keyboard.units.arcsin(' },
    { s: 'arccos(', labelKey: 'keyboard.units.arccos(' },
    { s: 'arctan(', labelKey: 'keyboard.units.arctan(' },
    { s: 'ln(', labelKey: 'keyboard.units.ln(' },
    { s: 'log(', labelKey: 'keyboard.units.log(' },
    { s: 'exp(', labelKey: 'keyboard.units.exp(' },
    
    // Relations & Calculus
    { s: '≈', labelKey: 'keyboard.units.≈' },
    { s: '≠', labelKey: 'keyboard.units.≠' },
    { s: '≤', labelKey: 'keyboard.units.≤' },
    { s: '≥', labelKey: 'keyboard.units.≥' },
    { s: '·', labelKey: 'keyboard.units.·' },
    { s: 'Δ', labelKey: 'keyboard.units.Δ' },
    { s: '∫', labelKey: 'keyboard.units.∫' },
    { s: 'd/dt', labelKey: 'keyboard.units.d_per_dt' },
    { s: '∞', labelKey: 'keyboard.units.∞' },
    { s: '%', labelKey: 'keyboard.units.%' },
  ];

  const greekLetters = [
    { s: 'θ', labelKey: 'keyboard.greek.θ' },
    { s: 'α', labelKey: 'keyboard.greek.α' },
    { s: 'β', labelKey: 'keyboard.greek.β' },
    { s: 'γ', labelKey: 'keyboard.greek.γ' },
    { s: 'δ', labelKey: 'keyboard.greek.δ' },
    { s: 'Δ', labelKey: 'keyboard.greek.Δ' },
    { s: 'ε', labelKey: 'keyboard.greek.ε' },
    { s: 'λ', labelKey: 'keyboard.greek.λ' },
    { s: 'μ', labelKey: 'keyboard.greek.μ' },
    { s: 'π', labelKey: 'keyboard.greek.π' },
    { s: 'ρ', labelKey: 'keyboard.greek.ρ' },
    { s: 'σ', labelKey: 'keyboard.greek.σ' },
    { s: 'τ', labelKey: 'keyboard.greek.τ' },
    { s: 'φ', labelKey: 'keyboard.greek.φ' },
    { s: 'ω', labelKey: 'keyboard.greek.ω' },
    { s: 'Ω', labelKey: 'keyboard.greek.Ω' },
    { s: 'Σ', labelKey: 'keyboard.greek.Σ' },
    { s: 'Ψ', labelKey: 'keyboard.greek.Ψ' },
    { s: 'η', labelKey: 'keyboard.greek.η' },
    { s: 'ν', labelKey: 'keyboard.greek.ν' },
  ];

  const physicsVariables = [
    { s: 'm', labelKey: 'keyboard.variables.m' },
    { s: 'v', labelKey: 'keyboard.variables.v' },
    { s: 'v₀', labelKey: 'keyboard.variables.v0' },
    { s: 'a', labelKey: 'keyboard.variables.a' },
    { s: 'g', labelKey: 'keyboard.variables.g' },
    { s: 't', labelKey: 'keyboard.variables.t' },
    { s: 'F', labelKey: 'keyboard.variables.F' },
    { s: 'p', labelKey: 'keyboard.variables.p' },
    { s: 'E_k', labelKey: 'keyboard.variables.E_k' },
    { s: 'E_p', labelKey: 'keyboard.variables.E_p' },
    { s: 'W', labelKey: 'keyboard.variables.W' },
    { s: 'P', labelKey: 'keyboard.variables.P' },
    { s: 'L', labelKey: 'keyboard.variables.L' },
    { s: 'r', labelKey: 'keyboard.variables.r' },
    { s: 'd', labelKey: 'keyboard.variables.d' },
    { s: 'h', labelKey: 'keyboard.variables.h' },
    { s: 'T', labelKey: 'keyboard.variables.T' },
    { s: 'f', labelKey: 'keyboard.variables.f' },
    { s: 'k', labelKey: 'keyboard.variables.k' },
    { s: 'I', labelKey: 'keyboard.variables.I' },
    { s: 'V', labelKey: 'keyboard.variables.V' },
    { s: 'R', labelKey: 'keyboard.variables.R' },
    { s: 'q', labelKey: 'keyboard.variables.q' },
    { s: 'C', labelKey: 'keyboard.variables.C' },
    { s: 'B', labelKey: 'keyboard.variables.B' },
    { s: 'c', labelKey: 'keyboard.variables.c' },
  ];

  const siUnits = [
    { s: 'm', labelKey: 'keyboard.units.m' },
    { s: 's', labelKey: 'keyboard.units.s' },
    { s: 'kg', labelKey: 'keyboard.units.kg' },
    { s: 'm/s', labelKey: 'keyboard.units.m_per_s' },
    { s: 'm/s²', labelKey: 'keyboard.units.m_per_s2' },
    { s: 'N', labelKey: 'keyboard.units.N' },
    { s: 'J', labelKey: 'keyboard.units.J' },
    { s: 'W', labelKey: 'keyboard.units.W' },
    { s: 'Pa', labelKey: 'keyboard.units.Pa' },
    { s: 'V', labelKey: 'keyboard.units.V' },
    { s: 'A', labelKey: 'keyboard.units.A' },
    { s: 'Ω', labelKey: 'keyboard.units.Ω' },
    { s: 'Hz', labelKey: 'keyboard.units.Hz' },
    { s: 'C', labelKey: 'keyboard.units.C' },
    { s: 'F', labelKey: 'keyboard.units.F' },
    { s: 'T', labelKey: 'keyboard.units.T' },
    { s: '°', labelKey: 'keyboard.units.deg' },
    { s: 'rad', labelKey: 'keyboard.units.rad' },
    { s: 'K', labelKey: 'keyboard.units.K' },
    { s: 'eV', labelKey: 'keyboard.units.eV' },
  ];

  const readyFormulas = [
    { 
      name: t('equationKeyboard.formulas.pendulumPeriod'), 
      eq: 'T = 2π √(L / g)' 
    },
    { 
      name: t('equationKeyboard.formulas.projectileRange'), 
      eq: 'R = (v₀² · sin(2θ)) / g' 
    },
    { 
      name: t('equationKeyboard.formulas.maxProjectileHeight'), 
      eq: 'H = (v₀ · sin θ)² / (2g)' 
    },
    { 
      name: t('equationKeyboard.formulas.hookesLaw'), 
      eq: 'F = -k · x' 
    },
    { 
      name: t('equationKeyboard.formulas.newtonsSecondLaw'), 
      eq: 'F = m · a' 
    },
    { 
      name: t('equationKeyboard.formulas.kineticEnergy'), 
      eq: 'E_k = ½ · m · v²' 
    },
    { 
      name: t('equationKeyboard.formulas.potentialEnergy'), 
      eq: 'E_p = m · g · h' 
    },
    { 
      name: t('equationKeyboard.formulas.ohmsLaw'), 
      eq: 'V = I · R' 
    },
    { 
      name: t('equationKeyboard.formulas.electricPower'), 
      eq: 'P = V · I = I² · R' 
    },
    { 
      name: t('equationKeyboard.formulas.snellsLaw'), 
      eq: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)' 
    },
    { 
      name: t('equationKeyboard.formulas.youngsSlitWidth'), 
      eq: 'Δy = (λ · L) / d' 
    },
    { 
      name: t('equationKeyboard.formulas.freeFallDistance'), 
      eq: 'h = ½ · g · t²' 
    },
  ];

  if (!isOpen) return null;

  const currentDigits = useArabicNumerals 
    ? ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٫', '،']
    : ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ','];

  return (
    <div 
      id="physics-equation-keyboard" 
      className={`bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 ${
        docked ? 'w-full my-3' : 'w-full max-w-3xl mx-auto'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-serif font-bold text-base border border-indigo-500/30">
            ∑
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
              {t('equationKeyboard.title')}
              <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.5 rounded font-mono">v2.5</span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="toggle-evaluator-btn"
            onClick={() => {
              setShowEvaluator(!showEvaluator);
              if (!showEvaluator) evaluateExpression();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              showEvaluator ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700'
            }`}
            title={t('equationKeyboard.evalTitle')}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">
              {t('equationKeyboard.compute')}
            </span>
          </button>

          <button
            id="toggle-collapse-kb-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isCollapsed ? t('equationKeyboard.expand') : t('equationKeyboard.collapse')}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              id="close-keyboard-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3.5 space-y-3">
          {/* Live Equation Display / Input box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                {t('equationKeyboard.currentDisplay')}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {currentValue.length} {t('equationKeyboard.chars')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="equation-display-input"
                type="text"
                value={currentValue}
                onChange={(e) => updateValue(e.target.value)}
                placeholder={t('equationKeyboard.inputPlaceholder')}
                className="w-full bg-transparent text-indigo-200 font-mono text-base sm:text-lg focus:outline-none placeholder:text-zinc-600"
                dir="ltr"
              />

              <div className="flex items-center gap-1 shrink-0">
                <button
                  id="kb-backspace-btn"
                  onClick={handleBackspace}
                  disabled={!currentValue}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors"
                  title={t('equationKeyboard.backspace')}
                >
                  <Delete className="w-4 h-4" />
                </button>
                <button
                  id="kb-undo-btn"
                  onClick={handleUndo}
                  disabled={historyIdx <= 0}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors"
                  title={t('equationKeyboard.undo')}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  id="kb-copy-btn"
                  onClick={handleCopy}
                  disabled={!currentValue}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors"
                  title={t('equationKeyboard.copy')}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  id="kb-clear-btn"
                  onClick={handleClear}
                  disabled={!currentValue}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs border border-rose-500/30 disabled:opacity-40 transition-colors font-medium"
                >
                  {t('equationKeyboard.clear')}
                </button>
              </div>
            </div>

            {/* Evaluator Panel */}
            {showEvaluator && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs bg-zinc-950/80 p-2.5 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-400 font-medium">
                    {t('equationKeyboard.evalResultLabel')}
                  </span>
                  {evalResult !== null && (
                    <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-800/60">
                      = {evalResult}
                    </span>
                  )}
                  {evalError && (
                    <span className="text-amber-400 text-[11px] font-mono">{evalError}</span>
                  )}
                </div>
                <button
                  id="run-eval-btn"
                  onClick={evaluateExpression}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t('equationKeyboard.computeNow')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-zinc-800 scrollbar-none">
            {[
              { 
                id: 'operators', 
                label: t('equationKeyboard.tabs.operators') 
              },
              { 
                id: 'variables', 
                label: t('equationKeyboard.tabs.variables') 
              },
              { 
                id: 'greek', 
                label: t('equationKeyboard.tabs.greek') 
              },
              { 
                id: 'units', 
                label: t('equationKeyboard.tabs.units') 
              },
              { 
                id: 'presets', 
                label: t('equationKeyboard.tabs.presets') 
              },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`kb-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/50 shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Tab Key Grids */}
          <div className="min-h-[160px] max-h-[250px] overflow-y-auto pr-1">
            {activeTab === 'operators' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                {mathOperators.map((op, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInsert(op.s)}
                    className="p-2 bg-zinc-900/90 hover:bg-indigo-600 hover:text-white border border-zinc-800 hover:border-indigo-400/60 rounded-xl transition-all hover:scale-102 active:scale-95 text-center flex flex-col items-center justify-center shadow-xs group"
                    title={t(op.labelKey)}
                  >
                    <span className="font-mono font-bold text-base text-zinc-100 group-hover:text-white">{op.s}</span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-indigo-100 truncate max-w-full font-sans tracking-tight">
                      {t(op.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'variables' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                {physicsVariables.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInsert(v.s)}
                    className="p-2 bg-zinc-900/90 hover:bg-indigo-600 hover:text-white border border-zinc-800 hover:border-indigo-400/60 rounded-xl font-mono transition-all hover:scale-102 active:scale-95 text-center flex flex-col items-center justify-center shadow-xs group"
                    title={t(v.labelKey)}
                  >
                    <span className="font-bold text-sm text-indigo-300 group-hover:text-white">{v.s}</span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-indigo-100 truncate max-w-full font-sans">
                      {t(v.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'greek' && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
                {greekLetters.map((g, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInsert(g.s)}
                    className="p-2 bg-zinc-900/90 hover:bg-indigo-600 hover:text-white border border-zinc-800 hover:border-indigo-400/60 rounded-xl transition-all hover:scale-105 active:scale-95 text-center flex flex-col items-center justify-center shadow-xs group"
                    title={t(g.labelKey)}
                  >
                    <span className="font-serif text-lg text-zinc-100 group-hover:text-white">{g.s}</span>
                    <span className="text-[9px] text-zinc-400 group-hover:text-indigo-100 font-sans truncate max-w-full">
                      {t(g.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'units' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                {siUnits.map((u, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInsert(' ' + u.s)}
                    className="p-2 bg-zinc-900/90 hover:bg-emerald-600 hover:text-white border border-zinc-800 hover:border-emerald-400/60 rounded-xl font-mono text-sm transition-all hover:scale-102 active:scale-95 text-center flex flex-col items-center justify-center shadow-xs group"
                    title={t(u.labelKey)}
                  >
                    <span className="font-bold text-emerald-400 group-hover:text-white">{u.s}</span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-emerald-100 font-sans truncate max-w-full">
                      {t(u.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'presets' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {readyFormulas.map((f, idx) => (
                  <button
                    key={idx}
                    onClick={() => updateValue(f.eq)}
                    className="p-2.5 bg-zinc-900/80 hover:bg-indigo-950/60 border border-zinc-800 hover:border-indigo-500/50 rounded-xl text-left rtl:text-right transition-all group flex flex-col justify-between"
                  >
                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-indigo-300 mb-1">
                      {f.name}
                    </span>
                    <span className="font-mono text-xs text-indigo-400 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800/80 dir-ltr text-left">
                      {f.eq}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Common Number Pad & Space Bar */}
          <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap text-xs bg-zinc-900/40 p-2 rounded-xl">
            <div className="flex items-center gap-1 font-mono flex-wrap">
              {currentDigits.map((num) => (
                <button
                  key={num}
                  onClick={() => handleInsert(num)}
                  className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all ${
                    num === '.' || num === '٫'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-extrabold text-base'
                      : 'bg-zinc-900 hover:bg-zinc-750 text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                  }`}
                  title={num === '.' || num === '٫' ? t('equationKeyboard.decimalPoint') : undefined}
                >
                  {num}
                </button>
              ))}

              {/* Toggle Eastern Arabic Numerals (٠-٩) */}
              <button
                onClick={() => setUseArabicNumerals(!useArabicNumerals)}
                className={`px-2 h-8 rounded-lg text-[11px] font-sans border transition-colors flex items-center gap-1 ${
                  useArabicNumerals 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
                title={t('equationKeyboard.toggleDigits')}
              >
                <Hash className="w-3 h-3" />
                <span>{useArabicNumerals ? '١٢٣' : '123'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 min-w-0">
              <button
                onClick={() => handleInsert(' ')}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-750 text-zinc-300 rounded-lg border border-zinc-800 font-mono text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>␣</span>
                <span className="truncate">{t('equationKeyboard.space')}</span>
              </button>

              {onInsert && (
                <button
                  onClick={() => onInsert(currentValue)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0 min-w-0"
                >
                  <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t('equationKeyboard.insertInField')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};