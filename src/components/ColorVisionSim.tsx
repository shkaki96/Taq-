import { Eye, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Language } from '../types';

interface ColorVisionSimProps {
  lang: Language;
}

export const ColorVisionSim: React.FC<ColorVisionSimProps> = ({ lang }) => {
  const [red, setRed] = useState<number>(255);
  const [green, setGreen] = useState<number>(180);
  const [blue, setBlue] = useState<number>(0);

  const t = {
    ar: {
      title: 'رؤية الألوان والخلط الجمعي للضوء (RGB Additive Mixing)',
      redBeam: 'الكشاف الأحمر (R - 700 nm)',
      greenBeam: 'الكشاف الأخضر (G - 546 nm)',
      blueBeam: 'الكشاف الأزرق (B - 435 nm)',
      perceivedBrain: 'اللون المدرك في الدماغ البشري',
      cones: 'استجابة المخاريط البصرية في شبكية العين (L, M, S Cones)',
      lCones: 'المخاريط الطويلة L (أحمر 560nm)',
      mCones: 'المخاريط المتوسطة M (أخضر 530nm)',
      sCones: 'المخاريط القصيرة S (أزرق 420nm)',
      reset: 'إعادة ضبط (أصفر)',
      colorCustom: 'مزيج مخصص (RGB)', // غير موثّق بمصدر
      colorWhite: 'أبيض (ضوء أبيض)',
      colorBlack: 'أسود (عدم وجود ضوء)',
      colorYellow: 'أصفر (R + G)',
      colorCyan: 'سماوي (G + B)',
      colorMagenta: 'أرجواني (R + B)',
      colorPureRed: 'أحمر نقي',
      colorPureGreen: 'أخضر نقي',
      colorPureBlue: 'أزرق نقي',
    },
    en: {
      title: 'Color Vision & Additive RGB Mixing',
      redBeam: 'Red Flashlight (R - 700 nm)',
      greenBeam: 'Green Flashlight (G - 546 nm)',
      blueBeam: 'Blue Flashlight (B - 435 nm)',
      perceivedBrain: 'Brain Perceived Color',
      cones: 'Retinal Cone Photoreceptors (L, M, S Cones)',
      lCones: 'L-Cones (Red 560nm)',
      mCones: 'M-Cones (Green 530nm)',
      sCones: 'S-Cones (Blue 420nm)',
      reset: 'Reset to Yellow',
      colorCustom: 'Custom RGB Mix', // غير موثّق بمصدر
      colorWhite: 'White (White Light)',
      colorBlack: 'Black (No Light)',
      colorYellow: 'Yellow (R + G)',
      colorCyan: 'Cyan (G + B)',
      colorMagenta: 'Magenta (R + B)',
      colorPureRed: 'Pure Red',
      colorPureGreen: 'Pure Green',
      colorPureBlue: 'Pure Blue',
    },
    ku: {
      title: 'بینینی ڕەنگەکان و تێکەڵکردنی ڕووناکی RGB',
      redBeam: 'ڕووناکی سوور (700 nm)',
      greenBeam: 'ڕووناکی سەوز (546 nm)',
      blueBeam: 'ڕووناکی شین (435 nm)',
      perceivedBrain: 'ڕەنگی دەرکپێکراو لە مێشکدا',
      cones: 'وەڵامدانەوەی خانەکانی چاو (L, M, S Cones)',
      lCones: 'خانەکانی L (سوور 560nm)',
      mCones: 'خانەکانی M (سەوز 530nm)',
      sCones: 'خانەکانی S (شین 420nm)',
      reset: 'ڕێکخستنەوە بۆ زەرد',
      colorCustom: 'تێکەڵەی تایبەت (RGB)', // غير موثّق بمصدر
      colorWhite: 'سپی (ڕووناکی سپی)',
      colorBlack: 'ڕەش (بێ ڕووناکی)',
      colorYellow: 'زەرد (R + G)',
      colorCyan: 'سماوی (G + B)',
      colorMagenta: 'ئەرخەوانی (R + B)',
      colorPureRed: 'سووری پەتی',
      colorPureGreen: 'سەوزی پەتی',
      colorPureBlue: 'شینی پەتی',
    },
    kmr: {
      title: 'Dîtina Rengan û Tevlihevkirina RGB',
      redBeam: 'Ronahiya Sor (700 nm)',
      greenBeam: 'Ronahiya Kesk (546 nm)',
      blueBeam: 'Ronahiya Şîn (435 nm)',
      perceivedBrain: 'Rengê di Mejî de Têgihiştî',
      cones: 'Hestiyarên Çavê Mirovan (L, M, S Cones)',
      lCones: 'Hestiyarên L (Sor 560nm)',
      mCones: 'Hestiyarên M (Kesk 530nm)',
      sCones: 'Hestiyarên S (Şîn 420nm)',
      reset: 'Nûkirin bo Zer',
      colorCustom: 'Tevliheviya Taybet (RGB)', // غير موثّق بمصدر
      colorWhite: 'Spî (Ronahiya Spî)',
      colorBlack: 'Reş (Bê Ronahî)',
      colorYellow: 'Zer (R + G)',
      colorCyan: 'Siyan (G + B)',
      colorMagenta: 'Macenta (R + B)',
      colorPureRed: 'Sora Paqij',
      colorPureGreen: 'Keska Paqij',
      colorPureBlue: 'Şîna Paqij',
    },
  }[lang];

  // RGB to perceived color hex
  const rgbString = `rgb(${red}, ${green}, ${blue})`;

  // Color name identification
  let colorName = t.colorCustom;
  if (red > 200 && green > 200 && blue > 200) colorName = t.colorWhite;
  else if (red < 30 && green < 30 && blue < 30) colorName = t.colorBlack;
  else if (red > 200 && green > 200 && blue < 50) colorName = t.colorYellow;
  else if (red < 50 && green > 200 && blue > 200) colorName = t.colorCyan;
  else if (red > 200 && green < 50 && blue > 200) colorName = t.colorMagenta;
  else if (red > 200 && green < 50 && blue < 50) colorName = t.colorPureRed;
  else if (red < 50 && green > 200 && blue < 50) colorName = t.colorPureGreen;
  else if (red < 50 && green < 50 && blue > 200) colorName = t.colorPureBlue;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-100 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            <Eye  className="w-6 h-6"/>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{t.title}</h2>
            <p className="text-xs text-slate-400 font-mono">CLUSTER A • SIMULATION 7</p>
          </div>
        </div>

        <button className="min-h-[44px] min-w-[44px]"
          onClick={() => {
            setRed(255);
            setGreen(180);
            setBlue(0);
          }}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw  className="w-3.5 h-3.5"/>
          {t.reset}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Mixing Stage */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[320px] overflow-hidden">
          {/* Flashlight Beams Meeting in Center */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Red spot */}
            <div
              style={{ opacity: red / 255 }}
             className="absolute -top-4 w-36 h-36 rounded-full bg-red-600 blur-xl mix-blend-screen"/>
            {/* Green spot */}
            <div
              style={{ opacity: green / 255 }}
             className="absolute -bottom-4 -left-4 w-36 h-36 rounded-full bg-green-600 blur-xl mix-blend-screen"/>
            {/* Blue spot */}
            <div
              style={{ opacity: blue / 255 }}
             className="absolute -bottom-4 -right-4 w-36 h-36 rounded-full bg-blue-600 blur-xl mix-blend-screen"/>

            {/* Central Perception Display Disc */}
            <div
              style={{ backgroundColor: rgbString }}
             className="relative z-10 w-28 h-28 rounded-full border-4 border-slate-800 shadow-2xl transition-colors duration-150 flex items-center justify-center"/>
          </div>

          <div className="mt-4 text-center">
            <span className="text-sm font-bold text-white block">{colorName}</span>
            <span className="text-sm font-mono text-slate-400">RGB({red}, {green}, {blue})</span>
          </div>
        </div>

        {/* Sliders & Retinal Cones */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Red */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-red-400">{t.redBeam}</span>
                <span className="font-mono text-white text-sm">{red}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={red}
                onChange={(e) => setRed(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            {/* Green */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-400">{t.greenBeam}</span>
                <span className="font-mono text-white text-sm">{green}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={green}
                onChange={(e) => setGreen(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Blue */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-sky-400">{t.blueBeam}</span>
                <span className="font-mono text-white text-sm">{blue}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                value={blue}
                onChange={(e) => setBlue(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>

          <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-200/90 space-y-1.5">
            <span className="font-bold text-indigo-300 block">{t.cones}:</span>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span>{t.lCones}:</span>
                <span>{((red / 255) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>{t.mCones}:</span>
                <span>{((green / 255) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>{t.sCones}:</span>
                <span>{((blue / 255) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};