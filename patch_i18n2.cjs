const fs = require('fs');

const dataEn = JSON.parse(fs.readFileSync('public/locales/en/translation.json', 'utf8'));
const dataAr = JSON.parse(fs.readFileSync('public/locales/ar/translation.json', 'utf8'));
const dataKu = JSON.parse(fs.readFileSync('public/locales/ku/translation.json', 'utf8'));
const dataKmr = JSON.parse(fs.readFileSync('public/locales/kmr/translation.json', 'utf8'));

const kbData = JSON.parse(fs.readFileSync('keyboard_data.json', 'utf8'));

// Initialize objects
[dataEn, dataAr, dataKu, dataKmr].forEach(d => {
  if (!d.keyboard) d.keyboard = {};
  if (!d.keyboard.variables) d.keyboard.variables = {};
  if (!d.keyboard.greek) d.keyboard.greek = {};
  if (!d.keyboard.units) d.keyboard.units = {};
  
  if (!d.experiments) d.experiments = {};
  if (!d.experiments.blackbody_spectrum) d.experiments.blackbody_spectrum = {};
  if (!d.experiments.doppler_effect) d.experiments.doppler_effect = {};
  if (!d.experiments.thin_lenses) d.experiments.thin_lenses = {};
});

// Helper to escape keys for ids
const safeId = (s) => {
  let res = s;
  res = res.replace(/₀/g, '0');
  res = res.replace(/²/g, '2');
  res = res.replace(/°/g, 'deg');
  res = res.replace(/\//g, '_per_');
  return res;
};

// Populate keyboard data
kbData.greek.forEach(item => {
  const id = safeId(item.s);
  dataEn.keyboard.greek[id] = item.label.en;
  dataAr.keyboard.greek[id] = item.label.ar;
  dataKu.keyboard.greek[id] = item.label.ku;
  dataKmr.keyboard.greek[id] = item.label.kmr;
});
kbData.variables.forEach(item => {
  const id = safeId(item.s);
  dataEn.keyboard.variables[id] = item.label.en;
  dataAr.keyboard.variables[id] = item.label.ar;
  dataKu.keyboard.variables[id] = item.label.ku;
  dataKmr.keyboard.variables[id] = item.label.kmr;
});
kbData.units.forEach(item => {
  const id = safeId(item.s);
  dataEn.keyboard.units[id] = item.label.en;
  dataAr.keyboard.units[id] = item.label.ar;
  dataKu.keyboard.units[id] = item.label.ku;
  dataKmr.keyboard.units[id] = item.label.kmr;
});

// Blackbody
dataEn.experiments.blackbody_spectrum.presetsLabel = "Presets:";
dataAr.experiments.blackbody_spectrum.presetsLabel = "نماذج معيارية (Presets):";
dataKu.experiments.blackbody_spectrum.presetsLabel = "پێشوەختەکان (Presets):";
dataKmr.experiments.blackbody_spectrum.presetsLabel = "Pêş-saz (Presets):";

// Doppler Effect
dataEn.experiments.doppler_effect.frontCompression = "(Front Compression)";
dataAr.experiments.doppler_effect.frontCompression = "(انضغاط أمامي)";
dataKu.experiments.doppler_effect.frontCompression = "(پەستێورانی پێشەوە)";
dataKmr.experiments.doppler_effect.frontCompression = "(Pêçana Pêş)";

dataEn.experiments.doppler_effect.rearRarefaction = "(Rear Rarefaction)";
dataAr.experiments.doppler_effect.rearRarefaction = "(تخلخل خلفي)";
dataKu.experiments.doppler_effect.rearRarefaction = "(کشانەوەی دواوە)";
dataKmr.experiments.doppler_effect.rearRarefaction = "(Vekişîna Paş)";

dataEn.experiments.doppler_effect.sourceStationary = "(Source Stationary)";
dataAr.experiments.doppler_effect.sourceStationary = "(المصدر ساكن)";
dataKu.experiments.doppler_effect.sourceStationary = "(سەرچاوە جێگیرە)";
dataKmr.experiments.doppler_effect.sourceStationary = "(Çavkanî Rawestî ye)";

// Thin Lenses
dataEn.experiments.thin_lenses.lensTypeConvexLog = "Convex Converging";
dataAr.experiments.thin_lenses.lensTypeConvexLog = "Convex Converging (محدبة مجمعة)";
dataKu.experiments.thin_lenses.lensTypeConvexLog = "Convex Converging (قۆقز و کۆکەرەوە)";
dataKmr.experiments.thin_lenses.lensTypeConvexLog = "Convex Converging (Xwarok û Berhevkar)";

dataEn.experiments.thin_lenses.lensTypeConcaveLog = "Concave Diverging";
dataAr.experiments.thin_lenses.lensTypeConcaveLog = "Concave Diverging (مقعرة مفرقة)";
dataKu.experiments.thin_lenses.lensTypeConcaveLog = "Concave Diverging (قوپاو و بڵاوکەرەوە)";
dataKmr.experiments.thin_lenses.lensTypeConcaveLog = "Concave Diverging (Kur û Belavkar)";

dataEn.experiments.thin_lenses.imageNatureRealInverted = "Real & Inverted";
dataAr.experiments.thin_lenses.imageNatureRealInverted = "Real & Inverted (حقيقية ومقلوبة)";
dataKu.experiments.thin_lenses.imageNatureRealInverted = "Real & Inverted (ڕاستەقینە و هەڵگەڕاوە)";
dataKmr.experiments.thin_lenses.imageNatureRealInverted = "Real & Inverted (Rastî & Berovajî)";

dataEn.experiments.thin_lenses.imageNatureVirtualUpright = "Virtual & Upright";
dataAr.experiments.thin_lenses.imageNatureVirtualUpright = "Virtual & Upright (خيالية ومعتدلة)";
dataKu.experiments.thin_lenses.imageNatureVirtualUpright = "Virtual & Upright (خەیاڵی و ڕاست)";
dataKmr.experiments.thin_lenses.imageNatureVirtualUpright = "Virtual & Upright (Xeyalî & Rast)";

fs.writeFileSync('public/locales/en/translation.json', JSON.stringify(dataEn, null, 2));
fs.writeFileSync('public/locales/ar/translation.json', JSON.stringify(dataAr, null, 2));
fs.writeFileSync('public/locales/ku/translation.json', JSON.stringify(dataKu, null, 2));
fs.writeFileSync('public/locales/kmr/translation.json', JSON.stringify(dataKmr, null, 2));

console.log("i18n patched phase 2");
