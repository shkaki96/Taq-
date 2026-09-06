# Badini UI Derivation Notes (derived from KMR)

As JSON specification (RFC 8259) does not permit inline comments (`//`), all derivation notes for `public/locales/bad/translation.json` are systematically recorded here for each non-experiment section.

Each section outside `experiments.*` has been derived from `public/locales/kmr/translation.json` as the linguistic base, translated into Kurdish Badini in Arabic-Kurdish script (RTL) with close grammatical and lexical alignment.

---

### appTitle
// derived-from-kmr, not glossary-verified
- Source (kmr): "Laboratuvara Înteraktîf a Fîzîkê"
- Derived Badini: "تاقیگەها کارلێککەرا یا فیزیایێ"

### appSubtitle
// derived-from-kmr, not glossary-verified
- Source (kmr): "Sîmulasyona mekanîk, çerxên elektrîkê, optîk û pêlan bi tomarkirina daneyan û hesabkirina şaşiyan"
- Derived Badini: "سیمولەیشنا میکانیک، بازنەیێن کارەبایی، بینایی و پێلان ب تۆمارکرنا داتایان و هژمارتنا خەلەتیێ"

### headerSubtitle
// derived-from-kmr, not glossary-verified
- Source (kmr): "Laboratuvara Fîzîkê ya Înteraktîf"
- Derived Badini: "تاقیگەها فیزیایێ یا کارلێککەر"

### tabs
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - experiments: "تاقیکرنەڤەیێن فیزیایێ"
  - notebook: "دەڤەرا تۆماران و داتایان"
  - formulas: "ڕێبەرێ هاوکێشەیان"
  - challenges: "ئاستەنگ و تاقیکرنێن فیزیایێ"
  - notebookShort: "دەفتەرا تاقیگەهێ"
  - formulasShort: "ڕێبەرێ یاسایان"
  - equationKeys: "تەختەکلیکا هێمایان"
  - challengesShort: "تاقیکرنەڤە"

### controls
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - play: "دەستپێکرن"
  - pause: "راوەستاندن"
  - reset: "زڤڕاندن بۆ دەستپێکێ"
  - step: "پێنگاڤەک بەرەڤ پێش"
  - speed: "لەزاتیا نیشاندانێ"
  - logData: "📝 د دەڤەرا تۆماراندا بنڤیسە"
  - loggedSuccess: "پێڤان ب سەرکەفتیانە د دەڤەرا تۆماراندا هاتە تۆمارکرن!"
  - stopwatch: "دەمژمێرا تاقیگەهێ"
  - calculator: "ژمێرەرا فیزیایێ"
  - constants: "نەگۆڕێن فیزیایی"
  - planetPreset: "هەلبژارتنا کێشکرنا هەسارێ"

### notebook
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - title: "دەڤەرا تۆماران و داتایێن تاقیکرنێ"
  - description: "تاقیکرنێن خوە تۆمار بکە، پێڤانێن تیۆری و تاقیگەهی بەراورد بکە و رێژەیا خەلەتیێ بهژمێرە."
  - empty: "هیچ داتایەک نەهاتیە تۆمارکرن. تاقیکرنەکێ ئەنجام بدە و ل سەر \"د دەڤەرا تۆماراندا بنڤیسە\" کلیک بکە."
  - tableHeaders:
    - experiment: "تاقیکرن"
    - variable: "گوهۆڕکەیێ پێڤای"
    - measured: "بهایێ پێڤای"
    - theoretical: "بهایێ تیۆری"
    - error: "رێژەیا خەلەتیێ %"
    - parameters: "مەرجێن تاقیکرنێ"
    - notes: "تێبینی و روونکردن"
    - time: "دەم"
    - actions: "کریار"
  - clearAll: "هەمی تۆماران ژێببە"
  - exportCSV: "داگرتن وەک CSV"
  - exportJSON: "داگرتن وەک JSON"
  - addNotePlaceholder: "تێبینی یان روونکردنەکا زانستی زێدە بکە..."
  - errorFormula: "رێژەیا خەلەتیێ = |(پێڤای - تیۆری) / تیۆری| × 100%"
  - confirmClearTitle: "پشتڕاستکرنا پاقژکرنا هەمی تۆماران"
  - confirmClearMessage: "ئەرێ تۆ یا پشتڕاستی کو تە دڤێت هەمی تۆمار و پێڤانان ژ دەفتەرا تاقیگەهێ ژێببەی؟ تۆ نیشێی وان بزڤڕینی."
  - confirmClearBtn: "بەلێ، هەمیان پاقژ بکە"
  - searchPlaceholder: "ل تۆمار، تاقیکرن یان تێبینیان بگەڕە..."
  - emptyInstructions: "بچە هەر تاقیکرنەکێ و ل سەر دوگمەیا \"پێڤانێ ل دەفتەرا تاقیگەهێ تۆمار بکە\" کلیک بکە دا کو ئەزموونەکا نوی زێدە بکەی و رێژەیا راستیێ بهژمێری."
  - insertEquation: "ب تەختەکلیکێ هاوکێشەیا بیرکاری تێخە"
  - deleteRecord: "تۆمارێ ژێببە"

### formulas
// derived-from-kmr, not glossary-verified
- Derived Badini: All 40 formula entries categorized by topic with Badini descriptions and variables.

### challenges
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - title: "ئاستەنگ و تاقیکرنێن تاقیگەها فیزیایێ"
  - description: "تێگەهشتنا خوە یا چەمکێن فیزیایی یێن کو تە د تاقیگەهێدا تاقیکرین بپێڤە."
  - score: "خالێن نوکە"
  - checkAnswer: "بەرسڤێ کۆنترۆل بکە"
  - next: "پرسیارا دی"
  - restart: "تاقیکرنێ ژ نوی دەستپێبکە"
  - explanation: "شڕۆڤەکرنا زانستی:"
  - perfectScore: "🎉 گەلەک باشە! تۆ زانایەکێ راستەقینە یێ فیزیایێ یی!"
  - goodScore: "ئەنجامەکێ گەلەک باشە! بەردەوام بە ل سەر لێگەڕیانێ."
  - keepTrying: "دووبارە تاقی بکەڤە و بزڤڕە بۆ تاقیکرنان."

### common
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - logMeasurement: "تۆمارکرنا پێڤانێ"
  - logged: "هاتە تۆمارکرن ✓"
  - seconds: "چرکە (s)"
  - meters: "مەتر (m)"
  - metersPerSec: "م/چ (m/s)"
  - metersPerSec2: "م/چ² (m/s²)"
  - joules: "جول (J)"
  - volts: "فۆڵت (V)"
  - amperes: "ئەمپێر (A)"
  - ohms: "ئۆم (Ω)"
  - watts: "وات (W)"
  - degrees: "پلە (°)"
  - close: "گرتن"
  - copy: "کۆپیکرن"
  - copied: "هاتە کۆپیکرن!"
  - hide: "ڤەشێڕە"
  - showDetails: "هویرکاریان نیشان بدە"
  - cancel: "هەلوەشاندن"
  - errorBoundary:
    - title: "د ڤێ تاقیکرنێدا خەلەتیەک چێبوو"
    - description: "خەلەتیەکا نەچاڤەڕێکری چێبوو. تۆ دشێی دووبارە تاقی بکەی یان تاقیکرنەکا دی هەلبژێری."
    - retry: "دووبارە تاقی بکە"
  - selectLanguage: "زمانەکی هەلبژێڕە"
  - storageFullWarning: "جهێ تۆمارکرنێ تژیە. داتایێن زێدەتر ناهێنە تۆمارکرن."

### catalog
// derived-from-kmr, not glossary-verified
- Derived Badini: All 73 experiment catalog cards with Badini descriptions, inputs, outputs, and theory background.

### planets
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - earth: "ئەرد (دنیا)"
  - moon: "هەیڤ"
  - mars: "مەریخ"
  - jupiter: "مووشتەری"
  - sun: "رۆژ"
  - space: "ڤالاهیا گەردوونی (بێ کێش)"

### opticalMediums
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - air: "هەوا / ڤالاهی"
  - water: "ئاڤ"
  - oil: "زەیتا نەباتی"
  - glass: "جام (Crown Glass)"
  - flint_glass: "Flint Glass"
  - diamond: "ئەلماس"

### constants
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - g: "لەزدانا کێشکرنا ئەردی یا ستاندارد"
  - c: "لەزاتیا رووناهیێ د ڤالاهیێدا"
  - G: "نەگۆڕێ کێشکرنا گشتی"
  - e: "بارگەیێ بنەرەتی یێ ئەلیکترۆنی"
  - ε0: "هاوکۆلکێ ڤەگوهاستنا کارەبایی د ڤالاهیێدا"
  - h: "نەگۆڕێ پلانکی"
  - kB: "نەگۆڕێ بۆڵتزمان"

### quiz
// derived-from-kmr, not glossary-verified
- Derived Badini: 10 conceptual physics quiz questions and options translated into Badini.

### categories
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - all: "هەمی تاقیکرنەڤە"
  - mechanics: "میکانیک، لڤین و هێز"
  - waves_sound: "پێل، دەنگ و لەرزین"
  - em_atomic: "کارۆموگناتیسی، ئەتۆم و کوانتەم"
  - fluids_thermo_optics: "شلگاز، داینامیکا گەرمی و بینایی"
  - gravity_astrophysics: "کێشکرن، گەردوونناسی و خولگە"

### catalogUI
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - category: "پشک:"
  - searchPlaceholder: "ل تاقیکرن، ژمارە، یاسا یان گوهۆڕکەی بگەڕە..."
  - newBadge: "★ نوی"
  - launchLab: "تاقیکرنێ دەستپێبکە"
  - noResults: "هیچ تاقیکرنەک ل دویف لێگەڕیانا تە نەهاتە دیتن"
  - resetFilters: "پالێوەران ژ نوی رێکبێخە"
  - backToCatalog: "بزڤڕە بۆ لیستا تاقیکرنان"
  - theoryTitle: "شڕۆڤەکرنا زانستی و یاسایێن فیزیایێ"
  - physicalLaw: "یاسایا فیزیایێ:"
  - simulationInputs: "گوهۆڕکەیێن ژڤان (Inputs):"
  - simulationOutputs: "بەرهەنجامێن پێڤانێ (Outputs):"
  - loading: "تاقیکرن دهێتە بارکرن..."

### navigation
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - returnToSim: "بزڤڕە بۆ تاقیکرنێ: {{title}} (#{{id}})"
  - homeCatalog: "سەرەکی (لیستا تاقیکرنان)"
  - returnBack: "↩ بزڤڕە"
  - returnToSimShort: "بزڤڕە"
  - closeOrReturn: "گرتن / بزڤڕە"

### equationKeyboard
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - modalTitle: "تەختەکلیکا هێما و هاوکێشەیێن بیرکاری"
  - modalSubtitle: "تێخستنا پیتێن یۆنانی، گوهۆڕکە و هژمارتنا راستەوخۆ"
  - title: "تەختەکلیکا هاوکێشە، هێما و ژمارەیێن فیزیایی"
  - evalTitle: "هژمارتنا بهایێ ژمارەیی"
  - compute: "ژمێرەر"
  - computeNow: "بهژمێرە"
  - expand: "بەرفرەهـ بکە"
  - collapse: "کۆم بکە"
  - currentDisplay: "هاوکێشە یان بهایێ نوکە یێ دیارکری:"
  - chars: "پیت"
  - inputPlaceholder: "ل ڤێرێ بنڤیسە یان هێمایان کلیک بکە (پشتەڤانیا ژمارە، خالا 1.5 و نەخشان)..."
  - backspace: "پیتێ دووماهیێ ژێببە"
  - undo: "ڤەگەڕە"
  - copy: "کۆپی بکە"
  - clear: "پاقژ بکە"
  - evalResultLabel: "ئەنجامێ هژمارتی:"
  - decimalPoint: "خالا دەیی (Point)"
  - toggleDigits: "گوهۆڕینا شێوازێ ژمارەیان (١٢٣ / 123)"
  - space: "ڤالاهی"
  - insertInField: "تێخە د ناڤ خانیکێدا"
  - errors: syntax, eval
  - tabs: operators, variables, greek, units, presets
  - formulas: pendulumPeriod, projectileRange, maxProjectileHeight, hookesLaw, newtonsSecondLaw, kineticEnergy, potentialEnergy, ohmsLaw, electricPower, snellsLaw, youngsSlitWidth, freeFallDistance

### footer
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - text: "تاقیگەها فیزیایێ یا کارلێککەر • {{count}} تاقیکرنێن زانستی یێن بێبەرامبەر (١ هەتا {{count}})"

### labTools
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - title: "ئامراز و ژێدەرێن تاقیگەهێ"
  - stopwatch: tab, start, pause, lap, reset
  - converter: tab, speed, energy, angle, inputSpeed, inputEnergy, inputAngle
  - constants: tab

### units
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - kmh: "کم/دەمژمێر"
  - mph: "میل د دەمژمێرەکێدا"
  - calories: "کالۆری"
  - ev: "ئەلیکترۆن فۆڵت"
  - radians: "رادیەن"

### keyboard
// derived-from-kmr, not glossary-verified
- Derived Badini:
  - variables: m, v, v0, a, g, t, F, p, E_k, E_p, W, P, L, r, d, h, T, f, k, I, V, R, q, C, B, c
  - greek: θ, α, β, γ, δ, Δ, ε, λ, μ, π, ρ, σ, τ, φ, ω, Ω, Σ, Ψ, η, ν
  - units: mathematical operators, functions, and physical units
