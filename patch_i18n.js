const fs = require('fs');

const dataEn = JSON.parse(fs.readFileSync('public/locales/en/translation.json', 'utf8'));
const dataAr = JSON.parse(fs.readFileSync('public/locales/ar/translation.json', 'utf8'));
const dataKu = JSON.parse(fs.readFileSync('public/locales/ku/translation.json', 'utf8'));
const dataKmr = JSON.parse(fs.readFileSync('public/locales/kmr/translation.json', 'utf8'));

const addKeys = (data, selectLanguage, storageFull, units) => {
  if (!data.common) data.common = {};
  data.common.selectLanguage = selectLanguage;
  data.common.storageFullWarning = storageFull;
  
  if (!data.units) data.units = {};
  data.units.kmh = units.kmh;
  data.units.mph = units.mph;
  data.units.calories = units.calories;
  data.units.ev = units.ev;
  data.units.radians = units.radians;
  return data;
};

addKeys(dataEn, "Select Language", "Storage is full. Cannot save more data.", {kmh: "km/h", mph: "Miles per Hour", calories: "Calories", ev: "Electron-volts", radians: "Radians"});
addKeys(dataAr, "اختر اللغة", "مساحة التخزين ممتلئة. لا يمكن حفظ المزيد من البيانات.", {kmh: "كم/ساعة", mph: "ميل في الساعة", calories: "سعرات حرارية", ev: "إلكترون-فولت", radians: "راديان"});
addKeys(dataKu, "زمانێک هەڵبژێرە", "بیرگە پڕە. ناتوانرێت داتای زیاتر خەزن بکرێت.", {kmh: "کم/کاتژمێر", mph: "میل لە کاتژمێرێکدا", calories: "کالۆری", ev: "ئەلیکترۆن-ڤۆڵت", radians: "ڕادیان"});
addKeys(dataKmr, "Ziman Hilbijêre", "Cihê tomarkirinê tije ye. Daneyên zêdetir nayên tomarkirin.", {kmh: "km/h", mph: "Mîl di Saetê de", calories: "Kalorî", ev: "Elektron-volt", radians: "Radyan"});

fs.writeFileSync('public/locales/en/translation.json', JSON.stringify(dataEn, null, 2));
fs.writeFileSync('public/locales/ar/translation.json', JSON.stringify(dataAr, null, 2));
fs.writeFileSync('public/locales/ku/translation.json', JSON.stringify(dataKu, null, 2));
fs.writeFileSync('public/locales/kmr/translation.json', JSON.stringify(dataKmr, null, 2));

console.log("i18n patched");
