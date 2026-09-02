import { Calculator, ChevronDown, ChevronUp, Eye, Delete, RotateCcw, Check, Copy, Sparkles, Hash, CornerDownLeft, X, Layers } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { evaluate } from 'mathjs';

import { Language } from '../types';

interface PhysicsEquationKeyboardProps {
  lang: Language;
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
  const evaluateExpression = () => {
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
        const getSyntaxError = () => {
          if (lang === 'ku') return 'تکایە دڵنیابە لە دروستی ژمارەکان و هاوکێشەکە';
          if (lang === 'kmr') return 'Ji kerema xwe rastbûna hejmar û formulê kontrol bikin';
          if (lang === 'en') return 'Check numerical and operator syntax';
          return 'تأكد من صحة الأرقام والصيغة الرياضية';
        };
        setEvalError(getSyntaxError());
      }
    } catch {
      const getEvalError = () => {
        if (lang === 'ku') return 'ناتوانرێت ئەنجامەکەی بە شێوەی ڕاستەوخۆ هەژمار بکرێت (نموونە: 1.5 * 2 + 3.14)';
        if (lang === 'kmr') return 'Ev formul nayê hesabkirin (Mînak: 1.5 * 2 + 3.14)';
        if (lang === 'en') return 'Cannot evaluate expression (e.g. try: 1.5 * 2 + 3.14)';
        return 'صيغة غير قابلة للحساب المباشر (جرب مثلاً: 1.5 * 2 + 3.14)';
      };
      setEvalError(getEvalError());
    }
  };

  const getLabel = (item: { ar: string; ku: string; kmr: string; en: string }) => {
    switch (lang) {
      case 'ku': return item.ku;
      case 'kmr': return item.kmr;
      case 'en': return item.en;
      case 'ar':
      default: return item.ar;
    }
  };

  const mathOperators = [
    // Primary Numbers & Decimals
    { s: '.', label: { ar: 'فاصلة عشرية (بوينت)', ku: 'خاڵی دەیی (پۆینت)', kmr: 'Xala dehiyê (Point)', en: 'Decimal Point (.)' } },
    { s: ',', label: { ar: 'فاصلة فصل', ku: 'کۆما', kmr: 'Koma', en: 'Comma (,)' } },
    { s: '+', label: { ar: 'جمع (+)', ku: 'کۆکردنەوە', kmr: 'Komkirin', en: 'Add (+)' } },
    { s: '-', label: { ar: 'طرح (-)', ku: 'لێدەرکردن', kmr: 'Dergirtin', en: 'Subtract (-)' } },
    { s: '×', label: { ar: 'ضرب (×)', ku: 'کەڕەت', kmr: 'Kerkirin', en: 'Multiply (×)' } },
    { s: '÷', label: { ar: 'قسمة (÷)', ku: 'دابەشکردن', kmr: 'Dabeşkirin', en: 'Divide (÷)' } },
    { s: '=', label: { ar: 'يساوي (=)', ku: 'یەکسانە بە', kmr: 'Wekhev e', en: 'Equals (=)' } },
    { s: '±', label: { ar: 'زائد أو ناقص (±)', ku: 'کۆ یان کەم', kmr: 'Zêde an Kêm', en: 'Plus-Minus (±)' } },
    
    // Parentheses & Groups
    { s: '(', label: { ar: 'قوس فتح', ku: 'کەوانەی کراوە', kmr: 'Kevana Vekirî', en: 'Open Parenthesis' } },
    { s: ')', label: { ar: 'قوس إغلاق', ku: 'کەوانەی داخراو', kmr: 'Kevana Girtî', en: 'Close Parenthesis' } },
    { s: '[', label: { ar: 'قوس معقوف فتح', ku: 'کەوانەی چوارگۆشە', kmr: 'Kevana Çargoşe', en: 'Open Bracket' } },
    { s: ']', label: { ar: 'قوس معقوف إغلاق', ku: 'کەوانەی چوارگۆشەی داخراو', kmr: 'Kevana Çargoşe ya Girtî', en: 'Close Bracket' } },
    { s: '|', label: { ar: 'قيمة مطلقة / معيار', ku: 'بڕی ڕووت', kmr: 'Nirxê Bêguman', en: 'Absolute Value (|x|)' } },
    
    // Powers & Roots
    { s: '^', label: { ar: 'أس (x^y)', ku: 'توان (x^y)', kmr: 'Hêz (x^y)', en: 'Power (^)' } },
    { s: '²', label: { ar: 'تربيع (²)', ku: 'دووجا (²)', kmr: 'Duco (²)', en: 'Square (x²)' } },
    { s: '³', label: { ar: 'تكعيب (³)', ku: 'سێجا (³)', kmr: 'Sêco (³)', en: 'Cube (x³)' } },
    { s: '√(', label: { ar: 'جذر تربيعي (√)', ku: 'ڕەگی دووجا', kmr: 'Rehê Ducarî', en: 'Square Root (√)' } },
    { s: '∛(', label: { ar: 'جذر تكعيبي (∛)', ku: 'ڕەگی سێجا', kmr: 'Rehê Sêcarî', en: 'Cube Root (∛)' } },
    { s: '½', label: { ar: 'نصف (½)', ku: 'نیوە (½)', kmr: 'Nîv (½)', en: 'Half (1/2)' } },
    { s: '×10^', label: { ar: 'قوى العشرة (تدوين علمي)', ku: 'توانی دە (هێماکردنی زانستی)', kmr: 'Hêza dehê (Nivîsandina Zanstî)', en: 'Scientific Notation (×10^)' } },
    
    // Trigonometry & Math Functions
    { s: 'sin(', label: { ar: 'جيب الزاوية (sin)', ku: 'ساین', kmr: 'Sînus', en: 'Sine (sin)' } },
    { s: 'cos(', label: { ar: 'جيب تمام الزاوية (cos)', ku: 'کۆساین', kmr: 'Kosînus', en: 'Cosine (cos)' } },
    { s: 'tan(', label: { ar: 'ظل الزاوية (tan)', ku: 'تانجێنت', kmr: 'Tancent', en: 'Tangent (tan)' } },
    { s: 'arcsin(', label: { ar: 'معكوس الجيب (sin⁻¹)', ku: 'پێچەوانەی ساین', kmr: 'Bervajiyê Sînusê', en: 'Inverse Sine (arcsin)' } },
    { s: 'arccos(', label: { ar: 'معكوس جيب التمام (cos⁻¹)', ku: 'پێچەوانەی کۆساین', kmr: 'Bervajiyê Kosînusê', en: 'Inverse Cosine (arccos)' } },
    { s: 'arctan(', label: { ar: 'معكوس الظل (tan⁻¹)', ku: 'پێچەوانەی تانجێنت', kmr: 'Bervajiyê Tancentê', en: 'Inverse Tangent (arctan)' } },
    { s: 'ln(', label: { ar: 'اللوغاريتم الطبيعي (ln)', ku: 'لۆگاریتمی سروشتی', kmr: 'Logarîtmaya Xwezayî', en: 'Natural Log (ln)' } },
    { s: 'log(', label: { ar: 'اللوغاريتم العشري (log₁₀)', ku: 'لۆگاریتمی دەیی', kmr: 'Logarîtmaye Dehî', en: 'Base-10 Log (log)' } },
    { s: 'exp(', label: { ar: 'الدالة الأسية الطبيعية (eˣ)', ku: 'نەخشەی توانی سروشتی', kmr: 'Fonksiyona Ekspomansiyel', en: 'Exponential (e^x)' } },
    
    // Relations & Calculus
    { s: '≈', label: { ar: 'تقريباً (≈)', ku: 'نزیکەی', kmr: 'Nêzîkî', en: 'Approximately (≈)' } },
    { s: '≠', label: { ar: 'لا يساوي (≠)', ku: 'یەکسان نییە', kmr: 'Wekhev nîne', en: 'Not Equal (≠)' } },
    { s: '≤', label: { ar: 'أصغر من أو يساوي (≤)', ku: 'بچووکتر یان یەکسان', kmr: 'Kêmtir an Wekhev', en: 'Less or Equal (≤)' } },
    { s: '≥', label: { ar: 'أكبر من أو يساوي (≥)', ku: 'گەورەتر یان یەکسان', kmr: 'Mezintir an Wekhev', en: 'Greater or Equal (≥)' } },
    { s: '·', label: { ar: 'ضرب نقطي / قياسي', ku: 'لێکدانی خاڵی', kmr: 'Kêşana Xalî', en: 'Dot Product (·)' } },
    { s: 'Δ', label: { ar: 'تغير / دلتا (Δ)', ku: 'گۆڕانکاری (دەلتا)', kmr: 'Guherîn (Delta)', en: 'Delta / Change (Δ)' } },
    { s: '∫', label: { ar: 'تكامل (∫)', ku: 'تەواوکاری', kmr: 'Întegral', en: 'Integral (∫)' } },
    { s: 'd/dt', label: { ar: 'مشتقة بالنسبة للزمن', ku: 'داڕێژراو بەپێی کات', kmr: 'Dergirtî li gorî demê', en: 'Time Derivative (d/dt)' } },
    { s: '∞', label: { ar: 'لانهاية (∞)', ku: 'بێ کۆتا', kmr: 'Bêdawî', en: 'Infinity (∞)' } },
    { s: '%', label: { ar: 'نسبة مئوية (%)', ku: 'ڕێژەی سەدی', kmr: 'Rêjeya Sedî', en: 'Percent (%)' } },
  ];

  const greekLetters = [
    { s: 'θ', label: { ar: 'ثيتا (زاوية)', ku: 'تێتا (گۆشە)', kmr: 'Têta (Goşe)', en: 'Theta (angle)' } },
    { s: 'α', label: { ar: 'ألفا (تسارع زاوي)', ku: 'ئەلفا (تاودانی گۆشەیی)', kmr: 'Alfa (Lezgîniya goşeyî)', en: 'Alpha (angular accel)' } },
    { s: 'β', label: { ar: 'بيتا', ku: 'بێتا', kmr: 'Bêta', en: 'Beta' } },
    { s: 'γ', label: { ar: 'غاما', ku: 'گاما', kmr: 'Gama', en: 'Gamma' } },
    { s: 'δ', label: { ar: 'دلتا صغيرة', ku: 'دەلتای بچووک', kmr: 'Deltaya Biçûk', en: 'delta (small)' } },
    { s: 'Δ', label: { ar: 'دلتا كبيرة (تغير)', ku: 'دەلتای گەورە (گۆڕان)', kmr: 'Deltaya Mezin (Guherîn)', en: 'Delta (change)' } },
    { s: 'ε', label: { ar: 'إبسيلون (سماحية)', ku: 'ئیپسیلۆن', kmr: 'Epsîlon', en: 'Epsilon (permittivity)' } },
    { s: 'λ', label: { ar: 'لامدا (طول موجي)', ku: 'لامبدا (درێژی شەپۆل)', kmr: 'Lambda (Dirêjahiya pêlê)', en: 'Lambda (wavelength)' } },
    { s: 'μ', label: { ar: 'ميو (معامل احتكاك / ميكرو)', ku: 'میۆ (هاوکۆلکەی لێکخشان)', kmr: 'Mîyû (Hevkêşeya xişandinê)', en: 'Mu (friction / micro)' } },
    { s: 'π', label: { ar: 'باي (ثابت الدائرة 3.14159)', ku: 'پای (نەگۆڕی 3.14159)', kmr: 'Pî (Neguhêrbar 3.14159)', en: 'Pi (3.14159...)' } },
    { s: 'ρ', label: { ar: 'رو (الكثافة / المقاومية)', ku: 'ڕۆ (چڕی)', kmr: 'Rho (Tîrbûn)', en: 'Rho (density / resistivity)' } },
    { s: 'σ', label: { ar: 'سيغما (كثافة شحنة / إجهاد)', ku: 'سیگما', kmr: 'Sîgma', en: 'Sigma (stress / surface charge)' } },
    { s: 'τ', label: { ar: 'تاو (عزم القوة / ثابت زمن)', ku: 'تاو (زەبری هێز)', kmr: 'Taw (Torq)', en: 'Tau (torque / time constant)' } },
    { s: 'φ', label: { ar: 'فاي (طور / تدفق)', ku: 'فای (قۆناغ / لێشاو)', kmr: 'Fay (Herikîn)', en: 'Phi (phase / flux)' } },
    { s: 'ω', label: { ar: 'أوميغا صغيرة (سرعة زاوية)', ku: 'ئۆمێگای بچووک (خێرایی گۆشەیی)', kmr: 'Omega ya biçûk (Leza goşeyî)', en: 'Omega (angular velocity)' } },
    { s: 'Ω', label: { ar: 'أوميغا كبيرة (أوم)', ku: 'ئۆمێگای گەورە (ئۆم)', kmr: 'Omega ya mezin (Ohm)', en: 'Omega (Ohm resistance)' } },
    { s: 'Σ', label: { ar: 'سيغما كبيرة (مجموع)', ku: 'سیگمای گەورە (کۆکراوە)', kmr: 'Sîgma ya Mezin (Komkirin)', en: 'Sigma (Summation)' } },
    { s: 'Ψ', label: { ar: 'بساي (دالة موجية)', ku: 'پسی (نەخشەی شەپۆلی)', kmr: 'Psi (Fonksiyona pêlê)', en: 'Psi (wavefunction)' } },
    { s: 'η', label: { ar: 'إيتا (كفاءة / لزوجة)', ku: 'ئیتا (کارایی / لینجی)', kmr: 'Eta (Şiyana bikêr)', en: 'Eta (efficiency / viscosity)' } },
    { s: 'ν', label: { ar: 'نيو (تردد)', ku: 'نیۆ (ڕەنگە)', kmr: 'Nû (Pirbûn)', en: 'Nu (frequency)' } },
  ];

  const physicsVariables = [
    { s: 'm', label: { ar: 'الكتلة (Mass)', ku: 'بارستە', kmr: 'Bariste', en: 'Mass (m)' } },
    { s: 'v', label: { ar: 'السرعة المتجهة (Velocity)', ku: 'خێرایی', kmr: 'Lez', en: 'Velocity (v)' } },
    { s: 'v₀', label: { ar: 'السرعة الابتدائية (Initial v)', ku: 'خێرایی سەرەتایی', kmr: 'Leza destpêkê', en: 'Initial Velocity (v₀)' } },
    { s: 'a', label: { ar: 'التسارع الخطي (Acceleration)', ku: 'تاودان', kmr: 'Lezgînî', en: 'Acceleration (a)' } },
    { s: 'g', label: { ar: 'تسارع الجاذبية (Gravity)', ku: 'تاودانی کێشکردن', kmr: 'Lezkirina kêşkirinê', en: 'Gravity (g)' } },
    { s: 't', label: { ar: 'الزمن (Time)', ku: 'کات', kmr: 'Dem', en: 'Time (t)' } },
    { s: 'F', label: { ar: 'القوة (Force)', ku: 'هێز', kmr: 'Hêz', en: 'Force (F)' } },
    { s: 'p', label: { ar: 'الزخم الخطي (Momentum)', ku: 'تەوژمی هێڵی', kmr: 'Momentûm', en: 'Momentum (p)' } },
    { s: 'E_k', label: { ar: 'طاقة الحركة (Kinetic Energy)', ku: 'وزەی جوڵە', kmr: 'Enerjiya tevgerê', en: 'Kinetic Energy (Ek)' } },
    { s: 'E_p', label: { ar: 'طاقة الوضع (Potential Energy)', ku: 'وزەی پۆتێنشیاڵ', kmr: 'Enerjiya potansiyel', en: 'Potential Energy (Ep)' } },
    { s: 'W', label: { ar: 'الشغل المنجز (Work)', ku: 'ئیشی ئەنجامدراو', kmr: 'Karê kirî', en: 'Work (W)' } },
    { s: 'P', label: { ar: 'القدرة / الضغط (Power / Pressure)', ku: 'توانا / پەستان', kmr: 'Hêz / Zext', en: 'Power / Pressure' } },
    { s: 'L', label: { ar: 'الطول (Length)', ku: 'درێژی', kmr: 'Dirêjahî', en: 'Length (L)' } },
    { s: 'r', label: { ar: 'نصف القطر (Radius)', ku: 'نیوەتیرە', kmr: 'Nîv-tîrêj', en: 'Radius (r)' } },
    { s: 'd', label: { ar: 'المسافة / الإزاحة (Distance)', ku: 'دووری / لادان', kmr: 'Dûrahî', en: 'Distance (d)' } },
    { s: 'h', label: { ar: 'الارتفاع (Height)', ku: 'بەرزی', kmr: 'Bilindahî', en: 'Height (h)' } },
    { s: 'T', label: { ar: 'الزمن الدوري / درجة الحرارة', ku: 'خول / پلەی گەرمی', kmr: 'Dema gerê / Germî', en: 'Period / Temp (T)' } },
    { s: 'f', label: { ar: 'التردد (Frequency)', ku: 'ڕەنگە', kmr: 'Pirhêzî', en: 'Frequency (f)' } },
    { s: 'k', label: { ar: 'ثابت النابض (Spring Constant)', ku: 'هاوکۆلکەی کانی (سپرینگ)', kmr: 'Hevkêşeya kanî', en: 'Spring Constant (k)' } },
    { s: 'I', label: { ar: 'شدة التيار / عزم القصور', ku: 'تەزووی کارەبا / زەبری سستی', kmr: 'Tewzûya elektrîkê / Sistî', en: 'Current / Inertia (I)' } },
    { s: 'V', label: { ar: 'فرق الجهد / الحجم (Voltage/Volume)', ku: 'جیاوازی ڤۆڵتیە / قەبارە', kmr: 'Volt / Qeware', en: 'Voltage / Volume (V)' } },
    { s: 'R', label: { ar: 'المقاومة الكهربائية (Resistance)', ku: 'بەرگریی کارەبایی', kmr: 'Berxwedan', en: 'Resistance (R)' } },
    { s: 'q', label: { ar: 'الشحنة الكهربائية (Charge)', ku: 'بارگەی کارەبایی', kmr: 'Barga elektrîkê', en: 'Electric Charge (q)' } },
    { s: 'C', label: { ar: 'السعة الكهربائية (Capacitance)', ku: 'توانستی کارەبایی', kmr: 'Kapasîte', en: 'Capacitance (C)' } },
    { s: 'B', label: { ar: 'المجال المغناطيسي (Magnetic Field)', ku: 'بواری موگناتیسی', kmr: 'Qada Magnetîk', en: 'Magnetic Field (B)' } },
    { s: 'c', label: { ar: 'سرعة الضوء (Speed of Light)', ku: 'خێرایی ڕووناکی', kmr: 'Leza ronahiyê', en: 'Speed of Light (c)' } },
  ];

  const siUnits = [
    { s: 'm', label: { ar: 'متر (مسافة)', ku: 'مەتر', kmr: 'Metre', en: 'meter (length)' } },
    { s: 's', label: { ar: 'ثانية (زمن)', ku: 'چرکە', kmr: 'Saniye', en: 'second (time)' } },
    { s: 'kg', label: { ar: 'كيلوغرام (كتلة)', ku: 'کیلۆگرام', kmr: 'Kîlogram', en: 'kilogram (mass)' } },
    { s: 'm/s', label: { ar: 'م/ث (سرعة)', ku: 'م/چ (خێرایی)', kmr: 'm/s (lez)', en: 'm/s (velocity)' } },
    { s: 'm/s²', label: { ar: 'م/ث² (تسارع)', ku: 'م/چ² (تاودان)', kmr: 'm/s² (lezgînî)', en: 'm/s² (accel)' } },
    { s: 'N', label: { ar: 'نيوتن (قوة)', ku: 'نیوتن (هێز)', kmr: 'Newton (hêz)', en: 'Newton (force)' } },
    { s: 'J', label: { ar: 'جول (طاقة/شغل)', ku: 'جول (وزە)', kmr: 'Joule (enerjî)', en: 'Joule (energy)' } },
    { s: 'W', label: { ar: 'واط (قدرة)', ku: 'وات (توانا)', kmr: 'Watt (hêz)', en: 'Watt (power)' } },
    { s: 'Pa', label: { ar: 'باسكال (ضغط)', ku: 'پاسکال (پەستان)', kmr: 'Paskal (zext)', en: 'Pascal (pressure)' } },
    { s: 'V', label: { ar: 'فولت (جهد)', ku: 'ڤۆڵت (جیاوازی پۆتێنشیاڵ)', kmr: 'Volt (voltaj)', en: 'Volt (potential)' } },
    { s: 'A', label: { ar: 'أمبير (تيار)', ku: 'ئەمپێر (تەزوو)', kmr: 'Amper (tewzû)', en: 'Ampere (current)' } },
    { s: 'Ω', label: { ar: 'أوم (مقاومة)', ku: 'ئۆم (بەرگری)', kmr: 'Ohm (berxwedan)', en: 'Ohm (resistance)' } },
    { s: 'Hz', label: { ar: 'هرتز (تردد)', ku: 'هێرتز (ڕەنگە)', kmr: 'Hertz (pirhêzî)', en: 'Hertz (frequency)' } },
    { s: 'C', label: { ar: 'كولوم (شحنة)', ku: 'کۆلۆم (بارگە)', kmr: 'Coulomb (barg)', en: 'Coulomb (charge)' } },
    { s: 'F', label: { ar: 'فاراد (سعة)', ku: 'فاراد (توانست)', kmr: 'Farad (kapasîte)', en: 'Farad (capacitance)' } },
    { s: 'T', label: { ar: 'تسلا (مجال مغناطيسي)', ku: 'تێسلا (بواری موگناتیسی)', kmr: 'Tesla (qada magnetîk)', en: 'Tesla (mag field)' } },
    { s: '°', label: { ar: 'درجة زاوية (°)', ku: 'پلەی گۆشەیی', kmr: 'Pileyê goşeyî', en: 'degree (°)' } },
    { s: 'rad', label: { ar: 'راديان (زاوية نصف قطرية)', ku: 'ڕادیان', kmr: 'Radyen', en: 'radian (rad)' } },
    { s: 'K', label: { ar: 'كلفن (حرارة مطلقة)', ku: 'کەلڤین (گەرمی)', kmr: 'Kelvîn', en: 'Kelvin (temp)' } },
    { s: 'eV', label: { ar: 'إلكترون فولت', ku: 'ئەلیکترۆن ڤۆڵت', kmr: 'Elektron-volt', en: 'electron-volt (eV)' } },
  ];

  const readyFormulas = [
    { 
      name: lang === 'ar' ? 'الزمن الدوري للبندول' : lang === 'ku' ? 'خولی لەرینەوەی پەندۆڵ' : lang === 'kmr' ? 'Dema gerê ya pendulê' : 'Pendulum Period', 
      eq: 'T = 2π √(L / g)' 
    },
    { 
      name: lang === 'ar' ? 'المدى الأفقي للمقذوف' : lang === 'ku' ? 'مەودای ئاسۆیی هاوێژراو' : lang === 'kmr' ? 'Dûrahiya asoyî ya avêtinê' : 'Projectile Range', 
      eq: 'R = (v₀² · sin(2θ)) / g' 
    },
    { 
      name: lang === 'ar' ? 'أقصى ارتفاع للمقذوف' : lang === 'ku' ? 'بەرزترین ئاستی هاوێژراو' : lang === 'kmr' ? 'Bilindahiya herî zêde ya avêtinê' : 'Max Projectile Height', 
      eq: 'H = (v₀ · sin θ)² / (2g)' 
    },
    { 
      name: lang === 'ar' ? 'قانون هووك للنابض' : lang === 'ku' ? 'یاسای هووک بۆ کانی' : lang === 'kmr' ? 'Qanûna Hooke ya kanî' : "Hooke's Law", 
      eq: 'F = -k · x' 
    },
    { 
      name: lang === 'ar' ? 'قانون نيوتن الثاني' : lang === 'ku' ? 'یاسای دووەمی نیوتن' : lang === 'kmr' ? 'Qanûna duyemîn a Newton' : "Newton's 2nd Law", 
      eq: 'F = m · a' 
    },
    { 
      name: lang === 'ar' ? 'طاقة الحركة' : lang === 'ku' ? 'وزەی جوڵە' : lang === 'kmr' ? 'Enerjiya tevgerê' : 'Kinetic Energy', 
      eq: 'E_k = ½ · m · v²' 
    },
    { 
      name: lang === 'ar' ? 'طاقة الوضع الثقالية' : lang === 'ku' ? 'وزەی پۆتێنشیاڵی کێش' : lang === 'kmr' ? 'Enerjiya potansiyel a kêşkirinê' : 'Potential Energy', 
      eq: 'E_p = m · g · h' 
    },
    { 
      name: lang === 'ar' ? 'قانون أوم' : lang === 'ku' ? 'یاسای ئۆم' : lang === 'kmr' ? 'Qanûna Ohm' : "Ohm's Law", 
      eq: 'V = I · R' 
    },
    { 
      name: lang === 'ar' ? 'القدرة الكهربائية' : lang === 'ku' ? 'توانای کارەبایی' : lang === 'kmr' ? 'Hêza elektrîkî' : 'Electric Power', 
      eq: 'P = V · I = I² · R' 
    },
    { 
      name: lang === 'ar' ? 'قانون سنيل للانكسار' : lang === 'ku' ? 'یاسای سنێل بۆ شکانەوە' : lang === 'kmr' ? 'Qanûna Snell ya şikestinê' : "Snell's Law", 
      eq: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)' 
    },
    { 
      name: lang === 'ar' ? 'اتساع هدب يونغ' : lang === 'ku' ? 'پانی هێڵی تاقیکردنەوەی یۆنگ' : lang === 'kmr' ? 'Berfirehiya qada Young' : "Young's Slit Width", 
      eq: 'Δy = (λ · L) / d' 
    },
    { 
      name: lang === 'ar' ? 'معادلة السقوط الحر' : lang === 'ku' ? 'هاوکێشەی کەوتنی ئازاد' : lang === 'kmr' ? 'Hevkêşeya ketina azad' : 'Free Fall Distance', 
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
              {lang === 'ar' 
                ? 'لوحة إدخال المعادلات والرموز الرياضية والفيزيائية' 
                : lang === 'ku'
                ? 'تەختەکلیلی هاوکێشە، هێما و ژمارە فیزیاییەکان'
                : lang === 'kmr'
                ? 'Tebleya Hevkêşe, Hêma û Hejmarên Fîzîkî'
                : 'Physics Equation, Symbols & Formulas Keyboard'}
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
            title={lang === 'ar' ? 'حساب القيمة العددية' : 'Evaluate Numerical Expression'}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">
              {lang === 'ar' ? 'حاسبة فورية' : lang === 'ku' ? 'شیکارکەری ژمارەیی' : lang === 'kmr' ? 'Hesabker' : 'Compute'}
            </span>
          </button>

          <button
            id="toggle-collapse-kb-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={isCollapsed ? (lang === 'ar' ? 'توسيع' : 'Expand') : (lang === 'ar' ? 'طي' : 'Collapse')}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              id="close-keyboard-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title={lang === 'ar' ? 'إغلاق' : 'Close'}
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
                {lang === 'ar' 
                  ? 'المعادلة أو القيمة الحالية المعروضة:' 
                  : lang === 'ku'
                  ? 'هاوکێشە یان بڕی نووسراوی ئێستا:'
                  : lang === 'kmr'
                  ? 'Hevkêşe an nirxa niha ya xuyakirî:'
                  : 'Current Expression Display:'}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {currentValue.length} {lang === 'ar' ? 'رمز' : lang === 'ku' ? 'پیت' : 'chars'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="equation-display-input"
                type="text"
                value={currentValue}
                onChange={(e) => updateValue(e.target.value)}
                placeholder={
                  lang === 'ar' 
                    ? 'اكتب هنا أو انقر الرموز بالأسفل (يدعم الأرقام، الفاصلة 1.5، والدوال)...' 
                    : lang === 'ku'
                    ? 'لێرە بنووسە یان هێماکان دابگرە (پشتگیری ژمارە، خاڵی دەیی 1.5 و نەخشەکان)...'
                    : lang === 'kmr'
                    ? 'Li vir binivîse an hêmayan bitikîne (piştgiriya hejmar, xala 1.5 û fonksiyonan)...'
                    : 'Type or click symbols below (supports decimals 1.5, operators, functions)...'
                }
                className="w-full bg-transparent text-indigo-200 font-mono text-base sm:text-lg focus:outline-none placeholder:text-zinc-600"
                dir="ltr"
              />

              <div className="flex items-center gap-1 shrink-0">
                <button
                  id="kb-backspace-btn"
                  onClick={handleBackspace}
                  disabled={!currentValue}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors"
                  title={lang === 'ar' ? 'حذف آخر رمز' : 'Backspace'}
                >
                  <Delete className="w-4 h-4" />
                </button>
                <button
                  id="kb-undo-btn"
                  onClick={handleUndo}
                  disabled={historyIdx <= 0}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors"
                  title={lang === 'ar' ? 'تراجع' : 'Undo'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  id="kb-copy-btn"
                  onClick={handleCopy}
                  disabled={!currentValue}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 transition-colors"
                  title={lang === 'ar' ? 'نسخ المعادلة' : 'Copy'}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  id="kb-clear-btn"
                  onClick={handleClear}
                  disabled={!currentValue}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs border border-rose-500/30 disabled:opacity-40 transition-colors font-medium"
                >
                  {lang === 'ar' ? 'مسح' : lang === 'ku' ? 'سڕینەوە' : lang === 'kmr' ? 'Paqij bike' : 'Clear'}
                </button>
              </div>
            </div>

            {/* Evaluator Panel */}
            {showEvaluator && (
              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs bg-zinc-950/80 p-2.5 rounded-lg">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-400 font-medium">
                    {lang === 'ar' ? 'الناتج الحسابي الدقيق:' : lang === 'ku' ? 'ئەنجامی ژمێریاری:' : lang === 'kmr' ? 'Encama hesabkirî:' : 'Evaluated Result:'}
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
                  <span>{lang === 'ar' ? 'احسب الآن' : lang === 'ku' ? 'هەژمارکردن' : lang === 'kmr' ? 'Hesab bike' : 'Compute'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-zinc-800 scrollbar-none">
            {[
              { 
                id: 'operators', 
                label: { ar: '➗ عمليات ودوال وأرقام', ku: '➗ کرداری، نەخشە و ژمارەکان', kmr: '➗ Kiryar û Fonksiyon', en: '➗ Operators & Math' } 
              },
              { 
                id: 'variables', 
                label: { ar: '⚛️ كميات فيزيائية', ku: '⚛️ بڕە فیزیاییەکان', kmr: '⚛️ Mezinahiyên Fîzîkî', en: '⚛️ Physics Variables' } 
              },
              { 
                id: 'greek', 
                label: { ar: 'αβγ حروف يونانية', ku: 'αβγ پیتە یۆنانییەکان', kmr: 'αβγ Tîpên Yewnanî', en: 'αβγ Greek Letters' } 
              },
              { 
                id: 'units', 
                label: { ar: '📏 وحدات دولية SI', ku: '📏 یەکە نێودەوڵەتییەکان', kmr: '📏 Yekeyên Navneteweyî', en: '📏 SI Units' } 
              },
              { 
                id: 'presets', 
                label: { ar: '📜 قوانين ومعادلات جاهزة', ku: '📜 یاسا و هاوکێشە ئامادەکراوەکان', kmr: '📜 Formulên Amade', en: '📜 Ready Formulas' } 
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
                {getLabel(tab.label)}
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
                    title={getLabel(op.label)}
                  >
                    <span className="font-mono font-bold text-base text-zinc-100 group-hover:text-white">{op.s}</span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-indigo-100 truncate max-w-full font-sans tracking-tight">
                      {getLabel(op.label)}
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
                    title={getLabel(v.label)}
                  >
                    <span className="font-bold text-sm text-indigo-300 group-hover:text-white">{v.s}</span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-indigo-100 truncate max-w-full font-sans">
                      {getLabel(v.label)}
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
                    title={getLabel(g.label)}
                  >
                    <span className="font-serif text-lg text-zinc-100 group-hover:text-white">{g.s}</span>
                    <span className="text-[9px] text-zinc-400 group-hover:text-indigo-100 font-sans truncate max-w-full">
                      {getLabel(g.label)}
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
                    title={getLabel(u.label)}
                  >
                    <span className="font-bold text-emerald-400 group-hover:text-white">{u.s}</span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-emerald-100 font-sans truncate max-w-full">
                      {getLabel(u.label)}
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
                  title={num === '.' || num === '٫' ? (lang === 'ar' ? 'فاصلة عشرية (بوينت)' : 'Decimal point') : undefined}
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
                title={lang === 'ar' ? 'تبديل نمط الأرقام (١٢٣ / 123)' : 'Toggle Arabic/Latin digits'}
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
                <span className="truncate">{lang === 'ar' ? 'مسافة' : lang === 'ku' ? 'بۆشایی' : 'Space'}</span>
              </button>

              {onInsert && (
                <button
                  onClick={() => onInsert(currentValue)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0 min-w-0"
                >
                  <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{lang === 'ar' ? 'إدراج في الحقل' : lang === 'ku' ? 'تێکردن بۆ خانە' : lang === 'kmr' ? 'Têxe nav xanî' : 'Insert'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};