const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['en', 'ar', 'ku', 'kmr'];

const content = {
  en: {
    gas_diffusion: "Gas diffusion is the gradual mixing of molecules of one gas with molecules of another by virtue of their kinetic properties. Graham's Law of Effusion states that the rate of effusion of a gas is inversely proportional to the square root of its molar mass, meaning lighter gases travel faster. This principle is vital in separating isotopes, such as enriching uranium for nuclear power, and explains how smells rapidly travel across a room.",
    states_of_matter: "Matter generally exists in three states: solid, liquid, and gas, depending on its temperature and pressure. When matter changes from one state to another (phase transition), it requires or releases thermal energy without changing temperature; this is called 'Latent Heat'. This physics principle explains why sweating cools the human body (latent heat of vaporization absorbs body heat) and is the foundation for how modern refrigerators and air conditioners operate to cool air.",
    color_vision: "Color vision is determined by how our eyes perceive different wavelengths of the electromagnetic spectrum in the visible range. The RGB (Red, Green, Blue) additive color model dictates that mixing varying intensities of these three primary light colors can create any perceptible color, producing pure white when combined equally. This optical principle is directly utilized in engineering all modern digital displays, including television screens, computer monitors, and smartphone OLED panels.",
    thermodynamics: "The state of a thermodynamic system is defined by macroscopic variables such as pressure, volume, and temperature, related by the Ideal Gas Law (PV = nRT). Analyzing state changes through thermodynamic processes (like isothermal, isobaric, or adiabatic expansions) reveals how energy transforms between heat and work. This foundational theory is essential for designing internal combustion engines, air compressors, and predicting atmospheric weather patterns.",
    buoyancy: "The Archimedes Principle dictates that any object submerged in a fluid experiences an upward buoyant force equal to the weight of the fluid it displaces. This fundamental law of fluid mechanics dictates whether an object will sink, float, or rise based on its density relative to the fluid. It is the core engineering principle allowing massive steel ships and submarines to float on oceans, and hot air balloons to soar through the atmosphere."
  },
  ar: {
    gas_diffusion: "يمثل الانتشار الغازي عملية التداخل التدريجي لجزيئات الغازات مع بعضها بسبب حركتها العشوائية. ينص قانون جراهام للتدفق على أن معدل تدفق الغاز يتناسب عكسياً مع الجذر التربيعي لكتلته المولية، مما يعني أن الغازات الأخف تتحرك بسرعة أكبر. يُستخدم هذا المبدأ بشكل حيوي في فصل النظائر، مثل تخصيب اليورانيوم لتوليد الطاقة النووية، ويفسر كيفية انتشار الروائح بسرعة في أرجاء الغرفة.",
    states_of_matter: "توجد المادة عموماً في ثلاث حالات: صلبة، سائلة، وغازية، وذلك بناءً على درجة حرارتها وضغطها. عندما تتحول المادة من حالة لأخرى، فإنها تمتص أو تحرر طاقة حرارية دون تغير في درجة حرارتها، وهو ما يُعرف بـ 'الحرارة الكامنة'. يفسر هذا المبدأ الفيزيائي كيف يبرد جسم الإنسان عند التعرق (حيث تمتص الحرارة الكامنة للتبخر حرارة الجسم)، وهو أيضاً الأساس الذي تعمل به الثلاجات ومكيفات الهواء الحديثة للتبريد.",
    color_vision: "تتحدد رؤية الألوان بكيفية استقبال العين للأطوال الموجية المختلفة للطيف الكهرومغناطيسي ضمن النطاق المرئي. ينص نموذج خلط الألوان الجمعي (RGB) على أن دمج نسب مختلفة من ألوان الضوء الأساسية الثلاثة (الأحمر، الأخضر، الأزرق) يولد أي لون يمكن إدراكه، وينتج اللون الأبيض عند دمجها بكثافة متساوية. يُستخدم هذا المبدأ البصري بشكل مباشر في هندسة جميع الشاشات الرقمية الحديثة، بما في ذلك أجهزة التلفاز، وشاشات الحواسيب، وشاشات الهواتف الذكية (OLED).",
    thermodynamics: "تُعرَّف حالة النظام الديناميكي الحراري بمتغيرات فيزيائية كبرى مثل الضغط والحجم ودرجة الحرارة، والتي يربطها معاً قانون الغاز المثالي (PV = nRT). يتيح تحليل تغيرات الحالة عبر العمليات الحرارية (مثل التمدد بثبات الحرارة أو الضغط) فهم كيفية تحول الطاقة بين الحرارة والشغل. تُعد هذه النظرية أساسية في تصميم محركات الاحتراق الداخلي، وضاغطات الهواء، بالإضافة إلى التنبؤ بأنماط الطقس في الغلاف الجوي.",
    buoyancy: "ينص مبدأ أرخميدس على أن أي جسم يُغمر في مائع يتعرض لقوة دفع (قوة طفو) نحو الأعلى تساوي وزن المائع الذي يُزيحه هذا الجسم. يحدد هذا القانون الأساسي في ميكانيكا الموائع ما إذا كان الجسم سيغوص أو يطفو أو يرتفع بناءً على كثافته مقارنة بكثافة المائع. يُعد هذا المبدأ الهندسي الأساس الذي يسمح للسفن الفولاذية الضخمة والغواصات بالطفو فوق المحيطات، والمناطيد بالارتفاع في الغلاف الجوي."
  },
  ku: {
    gas_diffusion: "بڵاوبوونەوەی گازەکان (Gas diffusion) پرۆسەیەکە تێیدا گەردەکانی گازێک بەهۆی جووڵەی هەڕەمەکییانەوە لەگەڵ گازێکی تردا تێکەڵ دەبن. یاسای گراهام بۆ دزەکردن دەڵێت کە تێکڕای دزەکردنی گازێک پێچەوانە هاوڕێژەیە لەگەڵ ڕەگی دووجای بارستایی مۆلییەکەی، واتە گازە سووکەکان خێراتر دەجووڵێن. ئەم بنەمایە زۆر گرنگە لە جیاکردنەوەی هاوتاکان (ئایزۆتۆپەکان) وەک پیتاندنی یۆرانیۆم بۆ وزەی ناوەکی، هەروەها ڕوونی دەکاتەوە کە چۆن بۆن بە خێرایی بە ژوورێکدا بڵاودەبێتەوە.",
    states_of_matter: "بەگشتی ماددە سێ باری هەیە: ڕەق، شل، و گاز، کە بەندە لەسەر پلەی گەرمی و پەستان. کاتێک ماددە لە بارێکەوە دەگۆڕێت بۆ بارێکی تر، وزەی گەرمی هەڵدەمژێت یان دەردەدات بێ ئەوەی پلەی گەرمییەکەی بگۆڕێت، ئەمەش پێی دەوترێت 'گەرمی شاراوە' (ماتەگەرمی). ئەم بنەمایە ڕوونی دەکاتەوە کە چۆن ئارەقکردنەوە جەستەی مرۆڤ سارد دەکاتەوە (گەرمی شاراوەی بەهەڵمبوون گەرمی جەستە هەڵدەمژێت)، هەروەها بنەمای کارکردنی سەلاجە و فێنککەرەوە (موكەیف)ـە مۆدێرنەکانە.",
    color_vision: "بینینی ڕەنگەکان بەندە لەسەر چۆنیەتی هەستکردنی چاو بە درێژییە شەپۆلە جیاوازەکانی شەبەنگی کارۆموگناتیسی لە مەودای بینراودا. مۆدێلی تێکەڵکردنی ڕەنگەکان (سوور، سەوز، شین - RGB) دەڵێت کە تێکەڵکردنی بڕی جیاواز لەم سێ ڕەنگە بنەڕەتییەی ڕووناکی دەتوانێت هەر ڕەنگێک دروست بکات، وە کاتێک بە یەکسانی تێکەڵ دەکرێن ڕەنگی سپی دەدەن. ئەم بنەما بیناییە ڕاستەوخۆ بەکاردێت لە دروستکردنی هەموو شاشە دیجیتاڵییەکاندا، وەک تەلەفزیۆن، شاشەی کۆمپیوتەر و مۆبایلە زیرەکەکان.",
    thermodynamics: "باری سیستەمێکی داینامیکی گەرمی بە گۆڕاوە گەورەکانی وەک پەستان، قەبارە، و پلەی گەرمی پێناسە دەکرێت، کە لە ڕێگەی یاسای گازی نموونەییەوە (PV = nRT) بەیەکەوە بەستراون. شیکردنەوەی گۆڕانکارییەکانی بار لە ڕێگەی پرۆسە گەرمییەکانەوە (وەک کشان لە پلەی گەرمی نەگۆڕ یان پەستانی نەگۆڕ) دەریدەخات کە چۆن وزە لە نێوان گەرمی و کاردا دەگۆڕێت. ئەم بیردۆزە بنەڕەتییە زۆر پێویستە بۆ دروستکردنی بزوێنەری ئۆتۆمبێل، پەستێنەری هەوا (کۆمپرێسەر)، و پێشبینیکردنی کەشوهەوا.",
    buoyancy: "بنەمای ئەرخەمیدس دەڵێت کە هەر تەنێک بخرێتە ناو شلگازێکەوە، ئەوا هێزێکی سەرخەر (هێزی پاڵپێوەنەر) ڕووەو سەرەوە کاردەکاتە سەری کە یەکسانە بە کێشی ئەو شلگازەی کە تەنەکە لایداوە. ئەم یاسا بنەڕەتییەی میکانیکی شلگازەکان دیاری دەکات کە ئایا تەنێک نقوم دەبێت، سەرئەکەوێت، یان لەسەر ئاو دەمێنێتەوە بە پشتبەستن بە چڕییەکەی بەراورد بە شلگازەکە. ئەمە ئەو بنەما ئەندازیارییە سەرەکییەیە کە ڕێگە بە کەشتییە پۆڵایینە زەبەلاحەکان دەدات لەسەر ئاو مەلە بکەن و باڵۆنە گەرمەکان بە ئاسماندا فڕن."
  },
  kmr: {
    gas_diffusion: "Belavbûna gazê pêvajoyek e ku tê de molekulên gazekê ji ber tevgera xwe ya kînetîk bi molekulên gazeke din re tevlîhev dibin. Zagona Graham ji bo herikînê dibêje ku rêjeya herikîna gazekê bi koka çargoşeya barsteya wê ya molî re vajîhevnas e; ango gazên siviktir zûtir diherikin. Ev prensîb di veqetandina îzotopan de gelek girîng e, mîna dewlemendkirina uranyumê ji bo wizeya navokî, û herweha rave dike ka çawa bêhn bi lez di hundirê odeyekê de belav dibe.",
    states_of_matter: "Made bi gelemperî di sê rewşan de heye: hişk, ron û gaz, ku ev girêdayî pileya germahî û dewisînê ye. Dema ku made ji rewşekê derbasî rewşeke din dibe, ew wizeya germî dikişîne an berdide bêyî ku germahiya wê biguhere; ji vê re 'Têhna veşartî' (Latent heat) tê gotin. Ev prensîb rave dike ku çawa xwêdan bedena mirovan hênik dike (têhna veşartî ya kelînê germahiya bedenê dikişîne) û herweha bingeha karkirina sarinc û klîmayên nûjen e.",
    color_vision: "Dîtina rengan girêdayî wê yekê ye ku çavên me çawa pêlên cihêreng ên şebenga elektromagnetîkî ya dîtbar hîs dikin. Modela tevlihevkirina rengan (Sor, Kesk, Şîn - RGB) diyar dike ku bi tevlihevkirina van her sê rengên sereke yên ronahiyê em dikarin her rengekî çêbikin, û eger bi heman astê werin têkelkirin rengê spî çêdibin. Ev prensîba optîkî bi awayekî rasterast di çêkirina hemû dîmenderên dîjîtal ên nûjen de, wekî televîzyon, dîmenderên komputerê û têlefonên zîrek, tê bikaranîn.",
    thermodynamics: "Rewşa sîstemeke termodînamîk bi guherbarên mezin ên wekî dewisîn (pestan), qebare û pileya germahiyê tê naskirin, ku bi rêya qanûna xaza nimûneyî (PV = nRT) bi hev ve girêdayî ne. Analîzkirina guherînên rewşê bi rêya pêvajoyên germî (mîna vekşîna di germahî an dewisîna sabît de) nîşan dide ku wize çawa di navbera germî û kar de vediguhere. Ev teoriya bingehîn ji bo dîzaynkirina motorên otomobîlan, kompresorên hewayê û pêşbînîkirina seqayê gelek girîng e.",
    buoyancy: "Prensîba Arxemîdês (Archimedes) destnîşan dike ku her gewdeyê ku bikeve nav ronayekî (şilek an gaz), rastî hêzeke dehfdanê (hêza paldanê) ya ber bi jor ve tê ku yeksanî giraniya wî ronayî ye ku ji cihê xwe ketiye. Ev zagona bingehîn a mêkanîka ronan diyar dike ku gelo gewdeyek wê binav bibe an li ser avê bimîne, li gorî tîrbûna wî li hember tîrbûna ronayê. Ev prensîba endezyariyê ya bingehîn e ku dihêle keştiyên mezin ên ji pola li ser deryayan bimînin û balonên hewayê li asîmanan bifirin."
  }
};

for (const lang of langs) {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.catalog) data.catalog = {};
    
    for (const [expKey, theoryText] of Object.entries(content[lang])) {
      if (!data.catalog[expKey]) data.catalog[expKey] = {};
      data.catalog[expKey].theoryBackground = theoryText;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}/translation.json`);
  }
}
