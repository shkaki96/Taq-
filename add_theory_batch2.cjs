const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['en', 'ar', 'ku', 'kmr'];

const content = {
  en: {
    heat_conduction: "Heat conduction is the process of thermal energy transfer through a solid material from a region of higher temperature to lower temperature. Fourier's Law states that the rate of this heat transfer is proportional to the temperature gradient and the cross-sectional area of the material. This principle is vital in engineering everyday products, such as designing effective insulation for houses to reduce heating costs, or creating metal heat sinks to prevent computer processors from overheating.",
    viscosity_stokes: "Viscosity represents a fluid's internal resistance to flow. Stokes' Law mathematically describes the opposing drag force acting on a spherical object moving through a viscous fluid. As the object accelerates, the drag increases until it perfectly balances the gravitational force, causing the object to fall at a constant 'terminal velocity'. This physics principle is used in medical laboratories to measure the sedimentation rate of red blood cells (ESR test) and is crucial for designing aerodynamic vehicles and parachutes.",
    prescription_glasses: "Optical lenses refract (bend) light to focus it precisely, which is the foundational mechanism for correcting human vision. Lens power, measured in Diopters, indicates how strongly a lens converges (for farsightedness) or diverges (for nearsightedness) incoming light to ensure it focuses exactly on the retina. Beyond prescription eyeglasses and contact lenses, this identical principle is used to engineer multiple-lens systems in modern smartphone cameras, microscopes, and telescopes.",
    periscope: "A periscope is an optical instrument that allows observation over, around, or through an obstacle from a concealed position. It fundamentally relies on the Law of Reflection, where light strikes two parallel plane mirrors set at 45-degree angles, reflecting the image 90 degrees twice to reach the observer's eye (Angle of incidence = Angle of reflection). This simple but powerful concept is famously used in submarines to view above the water surface, and variations are used in medical endoscopes to look inside the human body.",
    work_heat: "The First Law of Thermodynamics is the application of energy conservation to heat and thermodynamic systems. It states that the change in the internal energy of a closed system equals the heat added to the system minus the mechanical work done by the system. This law is the physical foundation for all heat engines, explaining how a car's internal combustion engine converts the chemical heat of burning fuel into the mechanical work that physically moves the vehicle forward."
  },
  ar: {
    heat_conduction: "يصف التوصيل الحراري عملية انتقال الطاقة الحرارية عبر المواد الصلبة من المنطقة ذات درجة الحرارة الأعلى إلى الأقل. ينص قانون فورييه على أن معدل انتقال الحرارة يتناسب طردياً مع مساحة المقطع وفرق درجات الحرارة. يُعد هذا المبدأ أساسياً في التطبيقات الهندسية، مثل تصميم العوازل الحرارية للمباني لتقليل استهلاك الطاقة، وتصنيع المشتتات الحرارية (Heat sinks) لحماية معالجات الحواسيب من التلف الحراري.",
    viscosity_stokes: "تمثل اللزوجة مقاومة المائع (السائل أو الغاز) للجريان أو التدفق. يصف قانون ستوكس قوة الإعاقة التي تؤثر على جسم كروي يسقط خلال مائع لزج. مع تسارع الجسم، تزداد قوة الإعاقة حتى تتساوى مع قوة الجاذبية، ليصل الجسم إلى سرعة هبوط ثابتة تُعرف بـ 'السرعة الحدية'. يُستخدم هذا المبدأ في المختبرات الطبية لقياس سرعة ترسب كريات الدم الحمراء (فحص ESR)، كما أنه أساسي في تصميم المظلات (الباراشوت) ودراسة ديناميكا الهواء.",
    prescription_glasses: "تقوم العدسات بكسر (حني) أشعة الضوء لتركيزها بدقة، وهو الأساس العلمي لتصحيح عيوب الإبصار. تشير قوة العدسة، التي تُقاس بوحدة 'الديوبتر'، إلى مدى قدرة العدسة على تجميع الضوء (لعلاج طول النظر) أو تفريقه (لعلاج قصر النظر) لضمان سقوط الصورة تماماً على الشبكية. إلى جانب النظارات الطبية والعدسات اللاصقة، يُستخدم نفس المبدأ في هندسة أنظمة العدسات المتعددة في كاميرات الهواتف الذكية والمجاهر الدقيقة.",
    periscope: "البيرسكوب (منظار الأفق) هو أداة بصرية تتيح المراقبة من خلف أو فوق العوائق مع البقاء في موضع مخفي. يعتمد تصميمه الأساسي على 'قانون الانعكاس' (زاوية السقوط = زاوية الانعكاس)، حيث يستخدم مرآتين مستويتين متوازيتين بزاوية 45 درجة لعكس مسار الضوء بزاوية 90 درجة مرتين وإيصال الصورة لعين المراقب. يُستخدم هذا المبدأ بشكل شهير في الغواصات لمراقبة سطح الماء، وتُستخدم تطبيقات مشابهة له في المناظير الطبية لرؤية داخل جسم الإنسان.",
    work_heat: "يمثل القانون الأول للديناميكا الحرارية تطبيقاً مباشراً لمبدأ حفظ الطاقة على الأنظمة الحرارية. ينص على أن التغير في الطاقة الداخلية لنظام مغلق يساوي كمية الحرارة المضافة إليه مطروحاً منها الشغل الميكانيكي الذي يبذله النظام. يُعد هذا القانون الأساس الفيزيائي الذي تعمل به جميع المحركات الحرارية، حيث يفسر كيف يحول محرك الاحتراق الداخلي في السيارات حرارة الوقود المحترق إلى شغل ميكانيكي حركي يدفع السيارة للأمام."
  },
  ku: {
    heat_conduction: "گەیاندنی گەرمی (Heat conduction) پرۆسەی گواستنەوەی وزەی گەرمییە بەناو ماددە ڕەقەکاندا لە ناوچەی پلەی گەرمی بەرزەوە بۆ نزم. یاسای فۆریێ دەڵێت کە تێکڕای گواستنەوەی گەرمی هاوڕێژەیە لەگەڵ ڕووبەری بڕگە و جیاوازی پلەی گەرمی. ئەم بنەمایە زۆر گرنگە لە ئەندازیاریدا، بۆ نموونە لە دروستکردنی نەگەیەنەری گەرمی (عازل) بۆ بیناکان بۆ کەمکردنەوەی خەرجی وزە، یان دروستکردنی پارچەی ساردکەرەوە بۆ پاراستنی چارەسەرکەری کۆمپیوتەر لە گەرمبوونی لەڕادەبەدەر.",
    viscosity_stokes: "خەستی (ئاستی لزجەت) نوێنەرایەتی بەرگری شلگازێک دەکات لە دژی ڕۆیشتن. یاسای ستۆکس هێزی بەرگری (هێزی لێکخشان) دەپێوێت کە کاردەکاتە سەر تەنێکی گۆیی لە کاتی کەوتنەخوارەوەی بەناو شلگازێکی خەستدا. کاتێک هێزی بەرگری یەکسان دەبێت بە هێزی کێشکردن، تەنەکە بە خێراییەکی نەگۆڕ دەکەوێتە خوارەوە کە پێی دەوترێت 'خێرایی کۆتایی'. ئەم یاسایە لە تاقیگە پزیشکییەکاندا بەکاردێت بۆ پێوانی تێکڕای نیشتنی خڕۆکە سوورەکانی خوێن، وە زۆر گرنگە بۆ دروستکردنی پەڕەشوت.",
    prescription_glasses: "هاوێنەکان ڕووناکی دەشکێننەوە بۆ ئەوەی بە دروستی کۆیبکەنەوە، کە ئەمە بنەمای ڕاستکردنەوەی بینینە. هێزی هاوێنە کە بە (دایۆپتەر) دەپێورێت، پێمان دەڵێت کە هاوێنەکە چەندە تیشکەکان کۆدەکاتەوە (بۆ چارەسەری دووربینی) یان پەڕتیان دەکات (بۆ چارەسەری کورت بینی) تاوەکو وێنەکە بەتەواوی لەسەر تۆڕەی چاو دروست بێت. جگە لە چویلکەی پزیشکی، ئەم بنەمایە لە کامێرای مۆبایلە زیرەکەکان و وردبینەکاندا (مایکرۆسکۆپ) بەکاردێت.",
    periscope: "پێریسکۆپ ئامێرێکی بیناییە کە ڕێگە بە چاودێریکردن دەدات لە پشت بەربەستەکانەوە لە کاتێکدا کەسەکە خۆی حەشارداوە. بە شێوەیەکی بنەڕەتی پشت بە یاسای دانەوەی ڕووناکی دەبەستێت (گۆشەی لێدان = گۆشەی دانەوە)، کە تێیدا دوو ئاوێنەی ڕاست لەسەر گۆشەی ٤٥ پلە دادەنرێن بۆ ئەوەی تیشکی ڕووناکی دوو جار بە گۆشەی ٩٠ پلە پەرچبدەنەوە و وێنەکە بگەیەننە چاوی کەسەکە. ئەم بیرۆکەیە لە ژێردەریاییەکاندا بەکاردێت بۆ بینینی سەر ڕووی ئاوەکە، هەروەها جۆرێکی تر لەم بنەمایە لە ئامێری نازووری پزیشکیدا بەکاردێت.",
    work_heat: "یاسای یەکەمی داینامیکی گەرمی جێبەجێکردنی بنەمای پاراستنی وزەیە لە سیستمە گەرمییەکاندا. یاساکە دەڵێت گۆڕان لە وزەی ناوەکی سیستەمێکی داخراودا یەکسانە بەو بڕە گەرمییەی دەدرێت بە سیستەمەکە کەمکرایەوە لەو کارە میکانیکییەی کە سیستەمەکە ئەنجامی دەدات. ئەم یاسایە بنەمای فیزیایی کارکردنی هەموو بزوێنەرە گەرمییەکانە؛ بۆ نموونە ڕوونی دەکاتەوە کە چۆن بزوێنەری ئۆتۆمبێل وزەی گەرمی سووتەمەنی دەگۆڕێت بۆ کارێکی میکانیکی تا ئۆتۆمبێلەکە بباتە پێشەوە."
  },
  kmr: {
    heat_conduction: "Gihandina germiyê pêvajoya veguhastina wizeya germî di nav maddeyên hişk de ji devera ku germahiya wê bilind e ber bi ya nizm e. Qanûna Fourier destnîşan dike ku rêjeya veguhastina germiyê bi rûber û cudahiya germahiyê re rasthevnas e. Ev prensîb di endezyariyê de gelek girîng e; wek mînak di dîzaynkirina îzolasyona germî ya avahiyan de ji bo kêmkirina xerckirina wizeyê, an çêkirina sarkerên metalî ji bo parastina pêvajoyên komputerê.",
    viscosity_stokes: "Lînciya ronan nîşan dide ku şilek an gaz çiqas li hember herikînê xwegir e. Zagona Stoks (Stokes) hêza xwegiriya ron a li ber tevgera gewdeyekî gogî di nav ronayekî lînc de hesab dike. Dema ku ev hêza xwegiriyê bi hêza kêşkirinê re yeksan dibe, gewde digihîje lezeke sabît ku jê re 'leza dawî' tê gotin. Ev prensîb di laboratuwarên bijîşkî de ji bo pîvana leza niştecîbûna xaneyên sor ên xwînê tê bikaranîn û ji bo dîzayna paraşûtan gelek girîng e.",
    prescription_glasses: "Nîsk (Lens) ronahiyê dişikînin da ku wê rast kom bikin, ku ev yek bingeha rastkirina dîtina çavan e. Hêza nîskê, ku bi (Diopter) tê pîvan, nîşan dide ku nîskek çiqasî ronahiyê kom dike (ji bo dûrdîtinê) an belav dike (ji bo nêzîkdîtinê) daku dîmen bi awayekî rast li ser retînayê çêbibe. Ji bilî berçavkên bijîşkî, ev prensîb di çêkirina kamerayên têlefonên zîrek û mîkroskopan de jî tê bikaranîn.",
    periscope: "Perîskop amûreke optîkî ye ku dihêle mirov li pişt astengiyan an ji cihekî veşartî çavdêriyê bike. Ew bi bingehîn xwe dispêre zagona vajîbûnê (goşeya hatinê = goşeya vajîbûnê). Di perîskopê de du neynikên rast bi goşeya 45 pileyî tên danîn daku ronahiyê du caran bi goşeya 90 pileyî vajî bikin û dîmenê bigihînin çavê mirov. Ev raman bi navdarî di keştiyên binavî (submarines) de ji bo dîtina ser rûyê avê tê bikaranîn, û herweha di endoskopiya bijîşkî de jî sûd jê tê wergirtin.",
    work_heat: "Qanûna yekem a termodînamîkê sepandina prensîba parastina wizeyê ye li ser sîstemên germî. Qanûn dibêje ku guherîna wizeya hundirîn a sîstemeke girtî yeksan e bi wizeya germî ya ku li sîstemê hatiye zêdekirin, kêmî wî karê (êş) mêkanîkî ku sîstemê kiriye. Ev qanûn bingeha fîzîkî ya hemû motorên germî ye; ew rave dike ku çawa motora otomobîlê germahiya sotemeniyê vediguherîne karekî mêkanîkî ku otomobîlê dide meşandin."
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
