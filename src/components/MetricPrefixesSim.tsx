import { Scale, BookmarkCheck, ArrowRightLeft, Layers } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language, MeasurementRecord } from '../types';

interface Props {
  lang: Language;
  onLogMeasurement: (data: Omit<MeasurementRecord, 'id' | 'timestamp' | 'percentError'>) => void;
}

interface PrefixDef {
  nameAr: string;
  nameEn: string;
  nameKu: string;
  nameKmr: string;
  symbol: string;
  factor: number; // exponent 10^factor
  exampleAr: string;
  exampleEn: string;
  exampleKmr: string;
}

const PREFIXES: PrefixDef[] = [
  { nameAr: 'تيرا (Tera)', nameEn: 'Tera', nameKu: 'تێرا (Tera)', nameKmr: 'Tera', symbol: 'T', factor: 12, exampleAr: 'سعة القرص الصلب (1 TB)', exampleEn: 'Hard drive capacity (1 TB)', exampleKmr: 'Kapasîteya dîskê (1 TB)' },
  { nameAr: 'جيجا (Giga)', nameEn: 'Giga', nameKu: 'گیگا (Giga)', nameKmr: 'Giga', symbol: 'G', factor: 9, exampleAr: 'تردد المعالجات (3 GHz)', exampleEn: 'CPU frequency (3 GHz)', exampleKmr: 'Lêdana CPU (3 GHz)' },
  { nameAr: 'ميجا (Mega)', nameEn: 'Mega', nameKu: 'مێگا (Mega)', nameKmr: 'Mega', symbol: 'M', factor: 6, exampleAr: 'محطات توليد الطاقة (50 MW)', exampleEn: 'Power plant output (50 MW)', exampleKmr: 'Hêza santralê (50 MW)' },
  { nameAr: 'كيلو (Kilo)', nameEn: 'Kilo', nameKu: 'کیلۆ (Kilo)', nameKmr: 'Kilo', symbol: 'k', factor: 3, exampleAr: 'المسافة بين المدن (1 km = 1000 m)', exampleEn: 'Distance (1 km = 1000 m)', exampleKmr: 'Masafe (1 km = 1000 m)' },
  { nameAr: 'هيكتو (Hecto)', nameEn: 'Hecto', nameKu: 'هێکتۆ (Hecto)', nameKmr: 'Hecto', symbol: 'h', factor: 2, exampleAr: 'الضغط الجوي (1 hPa = 100 Pa)', exampleEn: 'Pressure (1 hPa = 100 Pa)', exampleKmr: 'Pext (1 hPa = 100 Pa)' },
  { nameAr: 'ديكا (Deca)', nameEn: 'Deca', nameKu: 'دیکا (Deca)', nameKmr: 'Deka', symbol: 'da', factor: 1, exampleAr: '1 dam = 10 m', exampleEn: '1 dam = 10 m', exampleKmr: '1 dam = 10 m' },
  { nameAr: 'الوحدة الأساسية (Base)', nameEn: 'Base Unit', nameKu: 'یەکەی بنەڕەتی', nameKmr: 'Yekeya bingehîn', symbol: '-', factor: 0, exampleAr: 'متر (m), جرام (g), ثانية (s), جول (J)', exampleEn: 'Meter (m), Gram (g), Second (s), Joule (J)', exampleKmr: 'Metre (m), Gram (g), Çirke (s), Joule (J)' },
  { nameAr: 'ديسي (Deci)', nameEn: 'Deci', nameKu: 'دێسی (Deci)', nameKmr: 'Desi', symbol: 'd', factor: -1, exampleAr: '1 dm = 0.1 m', exampleEn: '1 dm = 0.1 m', exampleKmr: '1 dm = 0.1 m' },
  { nameAr: 'سنتي (Centi)', nameEn: 'Centi', nameKu: 'سەنتی (Centi)', nameKmr: 'Senti', symbol: 'c', factor: -2, exampleAr: 'مسطرة القياس (1 cm = 0.01 m)', exampleEn: 'Ruler scale (1 cm = 0.01 m)', exampleKmr: 'Pîvan (1 cm = 0.01 m)' },
  { nameAr: 'مللي (Milli)', nameEn: 'Milli', nameKu: 'میلی (Milli)', nameKmr: 'Mili', symbol: 'm', factor: -3, exampleAr: 'سُمك بطاقة (1 mm = 0.001 m)', exampleEn: 'Card thickness (1 mm = 0.001 m)', exampleKmr: 'Stûriya kartê (1 mm = 0.001 m)' },
  { nameAr: 'ميكرو (Micro)', nameEn: 'Micro', nameKu: 'مایکرۆ (Micro)', nameKmr: 'Mîkro', symbol: 'μ', factor: -6, exampleAr: 'حجم خلية الدم (7 μm)', exampleEn: 'Red blood cell size (7 μm)', exampleKmr: 'Mezinhiya xaneyê (7 μm)' },
  { nameAr: 'نانو (Nano)', nameEn: 'Nano', nameKu: 'نانۆ (Nano)', nameKmr: 'Nano', symbol: 'n', factor: -9, exampleAr: 'الطول الموجي للضوء (500 nm)', exampleEn: 'Light wavelength (500 nm)', exampleKmr: 'Dirêjahiya pêlê (500 nm)' },
  { nameAr: 'بيكو (Pico)', nameEn: 'Pico', nameKu: 'پیکۆ (Pico)', nameKmr: 'Pîko', symbol: 'p', factor: -12, exampleAr: 'نصف قطر الذرة (100 pm)', exampleEn: 'Atomic radius (100 pm)', exampleKmr: 'Nîvçapa atomê (100 pm)' },
  { nameAr: 'فيمتو (Femto)', nameEn: 'Femto', nameKu: 'فێمتۆ (Femto)', nameKmr: 'Femto', symbol: 'f', factor: -15, exampleAr: 'حجم النواة الذرية (1 fm)', exampleEn: 'Atomic nucleus size (1 fm)', exampleKmr: 'Mezinhiya noyeyê (1 fm)' },
];

const BASE_UNITS = [
  { id: 'm', nameAr: 'متر (m) - الطول', nameEn: 'Meter (m) - Length', nameKu: 'مەتر (m) - درێژی', nameKmr: 'Metre (m) - Dirêjahî', symbol: 'm' },
  { id: 'g', nameAr: 'جرام (g) - الكتلة', nameEn: 'Gram (g) - Mass', nameKu: 'گرام (g) - بارستە', nameKmr: 'Gram (g) - Bariste', symbol: 'g' },
  { id: 's', nameAr: 'ثانية (s) - الزمن', nameEn: 'Second (s) - Time', nameKu: 'چرکە (s) - کات', nameKmr: 'Çirke (s) - Dem', symbol: 's' },
  { id: 'Hz', nameAr: 'هيرتز (Hz) - التردد', nameEn: 'Hertz (Hz) - Frequency', nameKu: 'هێرتز (Hz) - فریکوێنسی', nameKmr: 'Hertz (Hz) - Frîkans', symbol: 'Hz' },
  { id: 'J', nameAr: 'جول (J) - الطاقة', nameEn: 'Joule (J) - Energy', nameKu: 'جوول (J) - وزە', nameKmr: 'Joule (J) - Anarşî', symbol: 'J' },
  { id: 'W', nameAr: 'واط (W) - القدرة', nameEn: 'Watt (W) - Power', nameKu: 'وات (W) - توان', nameKmr: 'Watt (W) - Hêz', symbol: 'W' },
  { id: 'V', nameAr: 'فولت (V) - الجهد', nameEn: 'Volt (V) - Voltage', nameKu: 'ڤۆڵت (V) - ڤۆڵتیە', nameKmr: 'Volt (V) - Voltaj', symbol: 'V' },
  { id: 'A', nameAr: 'أمبير (A) - التيار', nameEn: 'Ampere (A) - Current', nameKu: 'ئەمپێر (A) - تەزوو', nameKmr: 'Ampere (A) - Herikîn', symbol: 'A' },
  { id: 'F', nameAr: 'فاراد (F) - السعة', nameEn: 'Farad (F) - Capacitance', nameKu: 'فاراد (F) - بارگەگری', nameKmr: 'Farad (F) - Kapasîte', symbol: 'F' },
  { id: 'Pa', nameAr: 'باسكال (Pa) - الضغط', nameEn: 'Pascal (Pa) - Pressure', nameKu: 'پاسکال (Pa) - پەستان', nameKmr: 'Pascal (Pa) - Pext', symbol: 'Pa' },
];

export default function MetricPrefixesSim({ lang, onLogMeasurement }: Props) {
  const { t: tI18n } = useTranslation();
  const t = {
    ar: {
      title: 'البادئات المترية وتحويل الوحدات الفيزيائية',
      desc: 'التحويل المنهجي بين مضاعفات وأجزاء الوحدات القياسية (SI) باستخدام قوى العدد 10 والقانون العام V_new = V_old × 10^(n1 - n2).',
      logged: 'تم التسجيل في الدفتر ✓', // غير موثّق بمصدر
      log: 'تسجيل في دفتر المختبر', // غير موثّق بمصدر
      panelTitle: 'لوحة تحويل الوحدات والبادئات', // غير موثّق بمصدر
      inputVal: 'القيمة العددية المراد تحويلها:',
      fromPrefix: 'من البادئة المصدر (From):',
      toPrefix: 'إلى البادئة الهدف (To):',
      swap: 'تبديل',
      quickPresets: 'أمثلة فيزيائية شائعة وسريعة:',
      resultTitle: 'النتيجة المحسوبة الدقيقة:',
      equation: 'معادلة التحويل:',
      scientificForm: 'بالصيغة العلمية:',
      scaleTitle: 'سلم المراتب والبادئات المترية (10^n)',
      tagFrom: 'المصدر',
      tagTo: 'الهدف',
    },
    en: {
      title: 'Metric Prefixes & Physical Unit Conversion',
      desc: 'Systematic conversion across SI decimal prefixes using power of ten formulation V_new = V_old × 10^(n1 - n2).',
      logged: 'Logged ✓', // غير موثّق بمصدر
      log: 'Log Measurement', // غير موثّق بمصدر
      panelTitle: 'Unit & Prefix Conversion Panel', // غير موثّق بمصدر
      inputVal: 'Input Numerical Value:',
      fromPrefix: 'From Prefix:',
      toPrefix: 'To Target Prefix:',
      swap: 'Swap',
      quickPresets: 'Quick Physics Presets:',
      resultTitle: 'Calculated Conversion Result:',
      equation: 'Equation:',
      scientificForm: 'Scientific Form:',
      scaleTitle: 'SI Prefix Magnitude Scale (10^n)',
      tagFrom: 'FROM',
      tagTo: 'TO',
    },
    ku: {
      title: 'پێشگرە مەترییەکان و گۆڕینی یەکە فیزیاییەکان',
      desc: 'گۆڕینی ڕێکوپێکی نێوان کەرتبووەکان و دوانەبووەکانی یەکەکانی سیستەمی نێودەوڵەتی SI بە بەکارهێنانی هێزەکانی ١٠.',
      logged: 'تۆمارکرا لە دەفتەر ✓', // غير موثّق بمصدر
      log: 'تۆمارکردنی پێوانە', // غير موثّق بمصدر
      panelTitle: 'تەختەی گۆڕینی پێشگرەکان', // غير موثّق بمصدر
      inputVal: 'بەهای ژمارەیی بۆ گۆڕین:',
      fromPrefix: 'لە پێشگری سەرچاوە:',
      toPrefix: 'بۆ پێشگری ئامانج:',
      swap: 'ئاڵوگۆڕ',
      quickPresets: 'نموونەی فیزیایی دیار:',
      resultTitle: 'ئەنجامی ژمێردراو:',
      equation: 'هاوکێشەی گۆڕین:',
      scientificForm: 'بە شێوازی زانستی:',
      scaleTitle: 'پەیژەی پێشگرە مەترییەکان (10^n)',
      tagFrom: 'سەرچاوە',
      tagTo: 'ئامانج',
    },
    kmr: {
      title: 'Pêşgirên Metrî û Guherandina Yekeyan',
      desc: 'Guherandina sîstematîk a di navbera pêşgirên metrî yên SI de bi karanîna hêzên 10an.',
      logged: 'Hat tomarkirin ✓', // غير موثّق بمصدر
      log: 'Tomarkirina pîvanê', // غير موثّق بمصدر
      panelTitle: 'Panela guherandina pêşgir û yekeyan', // غير موثّق بمصدر
      inputVal: 'Nirxa hejmarî ya ji bo guherandinê:',
      fromPrefix: 'Ji pêşgira çavkanî:',
      toPrefix: 'Ji bo pêşgira mebest:',
      swap: 'Guhertin',
      quickPresets: 'Mînakên fîzîkî yên lez:',
      resultTitle: 'Encama hejmartî:',
      equation: 'Hawrêşeya guherandinê:',
      scientificForm: 'Bi awayê zanistî:',
      scaleTitle: 'Pêleka pêşgirên metrî (10^n)',
      tagFrom: 'ÇAVKANÎ',
      tagTo: 'MEBEST',
    },
  }[lang] || {
    title: 'البادئات المترية وتحويل الوحدات الفيزيائية',
    desc: 'التحويل المنهجي بين مضاعفات وأجزاء الوحدات القياسية (SI) باستخدام قوى العدد 10 والقانون العام V_new = V_old × 10^(n1 - n2).',
    logged: 'تم التسجيل في الدفتر ✓',
    log: 'تسجيل في دفتر المختبر',
    panelTitle: 'لوحة تحويل الوحدات والبادئات',
    inputVal: 'القيمة العددية المراد تحويلها:',
    fromPrefix: 'من البادئة المصدر (From):',
    toPrefix: 'إلى البادئة الهدف (To):',
    swap: 'تبديل',
    quickPresets: 'أمثلة فيزيائية شائعة وسريعة:',
    resultTitle: 'النتيجة المحسوبة الدقيقة:',
    equation: 'معادلة التحويل:',
    scientificForm: 'بالصيغة العلمية:',
    scaleTitle: 'سلم المراتب والبادئات المترية (10^n)',
    tagFrom: 'المصدر',
    tagTo: 'الهدف',
  };

  const [inputValue, setInputValue] = useState<number>(1000);
  const [fromPrefixIdx, setFromPrefixIdx] = useState<number>(6); // Base unit default
  const [toPrefixIdx, setToPrefixIdx] = useState<number>(3); // Kilo default
  const [selectedUnitIdx, setSelectedUnitIdx] = useState<number>(0); // Meter default
  const [logged, setLogged] = useState<boolean>(false);

  const fromPrefix = PREFIXES[fromPrefixIdx];
  const toPrefix = PREFIXES[toPrefixIdx];
  const baseUnit = BASE_UNITS[selectedUnitIdx];

  const getPrefixName = (p: PrefixDef) => {
    const names: Record<string, string> = {
      ar: p.nameAr,
      ku: p.nameKu,
      kmr: p.nameKmr || p.nameEn,
      en: p.nameEn,
    };
    return names[lang] || p.nameAr;
  };

  const getPrefixExample = (p: PrefixDef) => {
    const examples: Record<string, string> = {
      ar: p.exampleAr,
      ku: p.exampleAr,
      kmr: p.exampleKmr || p.exampleEn,
      en: p.exampleEn,
    };
    return examples[lang] || p.exampleAr;
  };

  const getUnitName = (u: typeof BASE_UNITS[0]) => {
    const unitNames: Record<string, string> = {
      ar: u.nameAr,
      ku: u.nameKu,
      kmr: u.nameKmr || u.nameEn,
      en: u.nameEn,
    };
    return unitNames[lang] || u.nameAr;
  };

  // Calculation: Value_in_base = inputValue * 10^(fromFactor)
  // Result_value = Value_in_base / 10^(toFactor) = inputValue * 10^(fromFactor - toFactor)
  const powerDiff = fromPrefix.factor - toPrefix.factor;
  const multiplier = Math.pow(10, powerDiff);
  const convertedValue = inputValue * multiplier;

  const handleSwap = () => {
    const temp = fromPrefixIdx;
    setFromPrefixIdx(toPrefixIdx);
    setToPrefixIdx(temp);
  };

  const handleLog = () => {
    const fromSymbol = fromPrefix.factor === 0 ? baseUnit.symbol : `${fromPrefix.symbol}${baseUnit.symbol}`;
    const toSymbol = toPrefix.factor === 0 ? baseUnit.symbol : `${toPrefix.symbol}${baseUnit.symbol}`;

    onLogMeasurement({
      experiment: 'metric_prefixes',
      variableName: `Prefix Conversion (${fromSymbol} → ${toSymbol})`,
      measuredValue: convertedValue,
      theoreticalValue: convertedValue,
      unit: toSymbol,
      parameters: {
        'Input Value': inputValue,
        'From Unit': fromSymbol,
        'To Unit': toSymbol,
        'Base Unit': baseUnit.symbol,
        'Power Factor Difference': `10^(${powerDiff})`,
      },
      equation: `V_target = V_source × 10^(${fromPrefix.factor} - ${toPrefix.factor}) = ${inputValue} × 10^(${powerDiff}) = ${convertedValue.toExponential(4)}`,
      notes: `Conversion between metric prefixes in physics. Factor: 10^(${powerDiff})`,
    });
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  const formatScientific = (num: number) => {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1e6 || (Math.abs(num) < 0.001 && Math.abs(num) > 0)) {
      return num.toExponential(4);
    }
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-zinc-900 to-indigo-950/40 border border-sky-800/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Scale  className="w-5 h-5 text-sky-400"/>
            <span>{t.title}</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">{t.desc}</p>
        </div>

        <button
          onClick={handleLog}
         className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${ logged ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30' }`}>
          <BookmarkCheck  className="w-4 h-4"/>
          <span>{logged ? t.logged : t.log}</span>
        </button>
      </div>

      {/* Main Grid: Interactive Converter + Visual Scale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Converter Panel */}
        <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <ArrowRightLeft  className="w-4 h-4 text-sky-400"/>
              {t.panelTitle}
            </span>
            {/* Base Unit Selector */}
            <select
              value={selectedUnitIdx}
              onChange={(e) => setSelectedUnitIdx(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              {BASE_UNITS.map((u, i) => (
                <option key={u.id} value={i}>
                  {getUnitName(u)}
                </option>
              ))}
            </select>
          </div>

          {/* Input Value */}
          <div>
            <label className="text-sm text-zinc-400 block mb-1.5 font-medium">
              {t.inputVal}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(Number(e.target.value))}
                className="flex-1 px-3 py-2 text-sm rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-sm font-mono text-zinc-400 px-2 py-2 bg-zinc-800/80 rounded-lg">
                {fromPrefix.factor === 0 ? baseUnit.symbol : `${fromPrefix.symbol}${baseUnit.symbol}`}
              </span>
            </div>
          </div>

          {/* From and To Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* From Prefix */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-zinc-400 font-medium">
                {t.fromPrefix}
              </span>
              <select
                value={fromPrefixIdx}
                onChange={(e) => setFromPrefixIdx(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 font-mono"
              >
                {PREFIXES.map((p, idx) => (
                  <option key={`from-${p.nameEn}`} value={idx}>
                    {p.symbol !== '-' ? `${p.symbol} - ` : ''}
                    {getPrefixName(p)} (10^{p.factor})
                  </option>
                ))}
              </select>
            </div>

            {/* To Prefix */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">
                  {t.toPrefix}
                </span>
                <button
                  onClick={handleSwap}
                 className="min-h-[44px] min-w-[44px] text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline">
                  <ArrowRightLeft  className="w-3 h-3"/>
                  {t.swap}
                </button>
              </div>
              <select
                value={toPrefixIdx}
                onChange={(e) => setToPrefixIdx(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 rounded-xl p-2.5 focus:outline-none focus:border-indigo-500 font-mono"
              >
                {PREFIXES.map((p, idx) => (
                  <option key={`to-${p.nameEn}`} value={idx}>
                    {p.symbol !== '-' ? `${p.symbol} - ` : ''}
                    {getPrefixName(p)} (10^{p.factor})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[10px] text-zinc-400 block mb-1.5">
              {t.quickPresets}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '1 km → m', val: 1, from: 3, to: 6, unit: 0 },
                { label: '500 nm → m', val: 500, from: 11, to: 6, unit: 0 },
                { label: '2.5 GHz → Hz', val: 2.5, from: 1, to: 6, unit: 3 },
                { label: '4500 J → kJ', val: 4500, from: 6, to: 3, unit: 4 },
                { label: '100 μF → F', val: 100, from: 10, to: 6, unit: 8 },
                { label: '1.2 MW → W', val: 1.2, from: 2, to: 6, unit: 5 },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(preset.val);
                    setFromPrefixIdx(preset.from);
                    setToPrefixIdx(preset.to);
                    setSelectedUnitIdx(preset.unit);
                  }}
                  className="min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono border border-zinc-700/60"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversion Result Display Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-sky-950/40 border border-indigo-700/50 space-y-2">
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">
              {t.resultTitle}
            </span>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
                {formatScientific(convertedValue)}
              </span>
              <span className="text-sm sm:text-base font-semibold text-zinc-200">
                {toPrefix.factor === 0 ? baseUnit.symbol : `${toPrefix.symbol}${baseUnit.symbol}`}
              </span>
            </div>

            {/* Step-by-step formula breakdown */}
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-300 space-y-1">
              <div>
                <span className="text-zinc-400">{t.equation} </span>
                <span>
                  {inputValue} × 10<sup>{fromPrefix.factor}</sup> ÷ 10<sup>{toPrefix.factor}</sup> = {inputValue} × 10<sup>{powerDiff}</sup>
                </span>
              </div>
              <div>
                <span className="text-zinc-400">{t.scientificForm} </span>
                <span className="text-sky-300">{convertedValue.toExponential(6)} {toPrefix.factor === 0 ? baseUnit.symbol : `${toPrefix.symbol}${baseUnit.symbol}`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SI Metric Hierarchy Scale Visualizer */}
        <div className="lg:col-span-6 space-y-4 p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Layers  className="w-4 h-4 text-emerald-400"/>
              {t.scaleTitle}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">10^12 → 10^-15</span>
          </div>

          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {PREFIXES.map((p, idx) => {
              const isFrom = idx === fromPrefixIdx;
              const isTo = idx === toPrefixIdx;
              const isBase = p.factor === 0;

              return (
                <div
                  key={p.nameEn}
                  onClick={() => setToPrefixIdx(idx)}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all border ${
                    isFrom && isTo
                      ? 'bg-purple-950/60 border-purple-500 ring-1 ring-purple-400'
                      : isFrom
                      ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-400'
                      : isTo
                      ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-400'
                      : isBase
                      ? 'bg-zinc-800/90 border-zinc-600 font-semibold'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                     className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${ isBase ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-200' }`}>
                      {p.symbol}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-200">
                          {getPrefixName(p)}
                        </span>
                        {isFrom && (
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono">
                            {t.tagFrom}
                          </span>
                        )}
                        {isTo && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                            {t.tagTo}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 block">
                        {getPrefixExample(p)}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-zinc-400 font-bold">
                    10<sup>{p.factor}</sup>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}