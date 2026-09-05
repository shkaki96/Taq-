const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'public', 'locales');
const langs = ['en', 'ar', 'ku', 'kmr'];

const content = {
  en: {
    bernoulli: "Bernoulli's principle connects fluid pressure, speed, and height, demonstrating the conservation of energy in flowing fluids. It states that an increase in the speed of a fluid occurs simultaneously with a decrease in static pressure or a decrease in the fluid's potential energy. It explains how airplane wings generate lift (lower pressure above the faster-moving air over the wing) and how atomizers and carburetors work.",
    curved_mirrors: "Curved mirrors (concave and convex) allow us to focus light, magnify images, or widen the field of view. Concave mirrors converge incoming parallel light rays to a focal point, creating real or virtual images depending on object distance. Convex mirrors diverge light, always forming smaller, upright virtual images. Convex mirrors are used in car side mirrors and store security for a wider view. Concave mirrors are used in reflecting telescopes and makeup mirrors.",
    light_scattering: "Scattering explains how light interacts with small particles or molecules in a medium, determining the color of the sky and the visibility of objects in fog. Rayleigh scattering shows that shorter wavelengths (blue) scatter much more strongly than longer wavelengths (red) when interacting with particles smaller than the wavelength of light. It explains why the sky is blue during the day (blue light scatters everywhere) and sunsets are red (blue light is scattered away, leaving red to reach our eyes).",
    optics: "Refraction governs how light changes direction when passing between different media, which is fundamental for lenses and vision. Snell's Law states that the ratio of the sine of the angle of incidence to the sine of the angle of refraction is constant, depending on the refractive indices of the two media. Light bends towards the normal in a denser medium. Optical fibers use total internal reflection (a consequence of Snell's Law) to transmit internet data globally with minimal loss.",
    energy_forms: "The Law of Conservation of Energy dictates that energy cannot be created or destroyed, only transformed, which is the foundation of thermodynamics and mechanics. Energy shifts between various forms—such as kinetic, potential, thermal, chemical, and electrical—while the total energy of a closed system remains constant. Hydroelectric dams convert gravitational potential energy of water into kinetic energy, and then into electrical energy using a generator.",
    gas_properties: "Understanding gas properties is crucial for studying atmospheric physics, engines, and respiration. The Ideal Gas Law relates the pressure, volume, and temperature of a gas to the number of moles. The kinetic theory explains that pressure arises from gas molecules colliding with container walls, with temperature reflecting their average kinetic energy. Hot air balloons rise because heating the gas increases its volume and lowers its density compared to the surrounding air, creating buoyant force."
  },
  ar: {
    bernoulli: "يربط مبدأ برنولي بين ضغط المائع وسرعته وارتفاعه، مما يوضح حفظ الطاقة في الموائع المتحركة. ينص على أن زيادة سرعة المائع تحدث بالتزامن مع انخفاض ضغطه أو انخفاض طاقة وضعه. يفسر هذا المبدأ كيف تولد أجنحة الطائرات قوة الرفع (ضغط أقل فوق الجناح حيث يتحرك الهواء بشكل أسرع)، وكذلك آلية عمل البخاخات ومحركات الاحتراق الداخلي.",
    curved_mirrors: "تسمح المرايا الكروية (المقعرة والمحدبة) بتجميع الضوء أو تكبير الصور أو توسيع مجال الرؤية. تقوم المرايا المقعرة بتجميع الأشعة لتكوين صور حقيقية أو تقديرية، بينما تفرق المرايا المحدبة الضوء لتكوين صور تقديرية مصغرة دائماً. تُستخدم المرايا المحدبة في المرايا الجانبية للسيارات لتوسيع مجال الرؤية، بينما تستخدم المقعرة في التلسكوبات العاكسة ومرايا التجميل.",
    light_scattering: "تفسر استطارة الضوء كيف يتفاعل الضوء مع الجسيمات أو الجزيئات في الوسط، مما يحدد لون السماء ومستوى الرؤية في الضباب. يوضح تشتت رايلي أن الأطوال الموجية القصيرة (الأزرق) تتشتت بشكل أكبر بكثير من الأطوال الموجية الطويلة (الأحمر). هذا يفسر ظهور السماء باللون الأزرق نهاراً، وظهور الشمس باللون الأحمر وقت الغروب بسبب تشتت اللون الأزرق بعيداً.",
    optics: "يحكم الانكسار كيفية تغير اتجاه الضوء عند انتقاله بين أوساط مختلفة الكثافة، وهو أساس عمل العدسات والرؤية. ينص قانون سنيل على أن النسبة بين جيب زاوية السقوط وجيب زاوية الانكسار تعتمد على معاملي الانكسار للوسطين، حيث ينحرف الضوء مقترباً من العمود المقام في الوسط الأكثف. تُستخدم هذه الظاهرة في الألياف الضوئية (عبر الانعكاس الكلي الداخلي) لنقل بيانات الإنترنت عالمياً.",
    energy_forms: "ينص قانون حفظ الطاقة على أن الطاقة لا تفنى ولا تستحدث، بل تتحول من شكل لآخر، وهو أساس الديناميكا الحرارية. تتحول الطاقة بين أشكال متعددة مثل الحركية، الكامنة (الوضع)، الحرارية، والكيميائية، مع بقاء المجموع الكلي للطاقة ثابتاً في النظام المعزول. من تطبيقاته السدود الكهرومائية التي تحول طاقة الوضع التثاقلية للماء إلى طاقة حركية ثم إلى طاقة كهربائية.",
    gas_properties: "فهم خصائص الغازات أمر بالغ الأهمية لدراسة فيزياء الغلاف الجوي وتصميم المحركات. يربط قانون الغاز المثالي بين الضغط والحجم ودرجة الحرارة، وتوضح النظرية الحركية للغازات أن الضغط ناتج عن تصادم الجزيئات بجدران الوعاء. من تطبيقاته المناطيد الحرارية التي ترتفع لأن تسخين الغاز يزيد من حجمه ويقلل من كثافته مقارنة بالهواء المحيط، مما يولد قوة طفو."
  },
  ku: {
    bernoulli: "بنەمای بێرنۆلی (Bernoulli's principle) پەیوەندی نێوان پەستان، خێرایی و بەرزی شلگازەکان دەردەخات، وە سەلمێنەری پاراستنی وزەیە لە شلگازە جووڵاوەکاندا. ئەم بنەمایە دەڵێت کە زیادبوونی خێرایی شلگازێک لەگەڵ کەمبوونەوەی پەستانەکەی یان وزەی ماتەی هاوکاتە. ئەمە ڕوونی دەکاتەوە کە چۆن باڵەکانی فڕۆکە هێزی بەرزکردنەوە دروست دەکەن (بەهۆی کەمبوونەوەی پەستان لە سەرووی باڵەکە بەهۆی خێرایی هەوا)، هەروەها بنەمای کارکردنی پرژێنەرەکان و بزوێنەرەکانە.",
    curved_mirrors: "ئاوێنە گۆییەکان (ڕووچاڵ و قۆقز) ڕێگەمان پێدەدەن ڕووناکی کۆبکەینەوە، وێنەکان گەورە بکەین یان بوارێکی بینینی فراوانتر بەدەست بهێنین. ئاوێنە ڕووچاڵەکان تیشکە تەریبەکان لە خاڵی تیشکۆدا کۆدەکەنەوە بۆ دروستکردنی وێنەی ڕاستەقینە یان خەیاڵی، لە کاتێکدا ئاوێنە قۆقزەکان تیشک بڵاودەکەنەوە و هەمیشە وێنەی خەیاڵی و بچووککراوە دروست دەکەن. ئاوێنەی قۆقز لە ئاوێنەی تەنیشتی ئۆتۆمبێل بەکاردێت بۆ فراوانکردنی بواری بینین، وە ئاوێنەی ڕووچاڵ لە تەلەسکۆپەکان و ئاوێنەی جوانکاریدا بەکاردێت.",
    light_scattering: "پەڕشبوونەوەی ڕووناکی (Scattering) چۆنیەتی کارلێکی ڕووناکی لەگەڵ تەنۆلکە بچووکەکانی ناوەندێکدا ڕووندەکاتەوە، کە ڕەنگی ئاسمان و ئاستی بینین لە تەمومژدا دیاری دەکات. پەڕشبوونەوەی ڕایلی دەریدەخات کە درێژییە شەپۆلە کورتەکان (وەک شین) زۆر زیاتر لە شەپۆلە درێژەکان (وەک سوور) پەڕش دەبنەوە. ئەمەش هۆکاری ئەوەیە کە ئاسمان بە ڕۆژ شینە و لە کاتی خۆرئاوابوونیشدا سوورە (چونکە ڕووناکییە شینەکە پەڕش دەبێتەوە و دوور دەکەوێتەوە).",
    optics: "شکانەوەی ڕووناکی چۆنیەتی گۆڕانی ئاراستەی ڕووناکی لە کاتی تێپەڕبوونی بە ناوەندە جیاوازەکاندا ڕووندەکاتەوە، کە بنەمای کارکردنی هاوێنەکان و بینینە. یاسای سنێل دەڵێت کە ڕێژەی نێوان ساینی گۆشەی لێدان و ساینی گۆشەی شکانەوە نەگۆڕە و پەیوەستە بە هاوکۆلکەی شکانەوەی هەردوو ناوەندەکە. لە تەکنەلۆژیادا، ڕیشاڵە بیناییەکان پشت بە پەرچدانەوەی ناوەکی تەواو (کە دەرئەنجامێکی یاسای سنێلە) دەبەستن بۆ گواستنەوەی زانیارییەکانی ئینتەرنێت.",
    energy_forms: "یاسای پاراستنی وزە دەڵێت کە وزە دروست نابێت و لەناو ناچێت، بەڵکو تەنها لە شێوەیەکەوە دەگۆڕێت بۆ شێوەیەکی تر. ئەمە بنەمایەکی سەرەکییە لە داینامیکی گەرمی و میکانیکدا. وزە لە نێوان شێوەکانی وەک وزەی جووڵە، شیاو (ماتە)، گەرمی، و کارەباییدا دەگۆڕێت لە کاتێکدا کۆی گشتی وزە نەگۆڕ دەمێنێتەوە. بۆ نموونە، بەنداوەکان وزەی شیاوی ئاو دەگۆڕن بۆ وزەی جووڵە و پاشان بۆ وزەی کارەبا بە بەکارهێنانی موەلیدە.",
    gas_properties: "تێگەیشتن لە تایبەتمەندییەکانی گازەکان زۆر گرنگە بۆ خوێندنی فیزیا و بزوێنەرەکان. یاسای گازی نموونەیی پەیوەندی نێوان پەستان، قەبارە، و پلەی گەرمی گازێک ڕووندەکاتەوە، وە بیردۆزی جووڵەیی گازەکان دەریدەخات کە پەستان لە ئەنجامی پێکدادانی گەردەکانی گاز بە دیواری دەفرەکەوە دروست دەبێت. لە ژیانی ڕۆژانەدا، باڵۆنە گەرمەکان بەرز دەبنەوە چونکە گەرمکردنی گازەکە قەبارەکەی زیاد دەکات و چڕییەکەی کەمدەکاتەوە، ئەمەش هێزی سەرخەر دروست دەکات."
  },
  kmr: {
    bernoulli: "Prensîba Pernolî (Bernoulli) pêwendiya navbera pestan, lez û bilindiya ronayan nîşan dide û nîşana parastina wizeyê ye di ronayên livok de. Li gorî vê prensîbê, dema ku leza ronayekê zêde bibe, pestana wê an jî wizeya wê ya potansiyel kêm dibe. Ev prensîb rave dike ku çawa baskên firokeyan hêza rakirinê çêdikin (ji ber pestana kêm a li ser baskê ku hewa zûtir derbas dibe), û herweha bingeha karkirina pijiqîner û motoran e.",
    curved_mirrors: "Neynikên gogî (çal û gir) dihêlin ku em ronahiyê kom bikin, dîmenan mezin bikin an qada dîtinê berfireh bikin. Neynikên çal (komker) tîrêjên hevteb di xala tîşkoyê de kom dikin û dîmenên rasteqîn an xeyalî çêdikin. Lê neynikên gir (cudaker) ronahiyê belav dikin û her dem dîmenên xeyalî û biçûkkirî çêdikin. Neynikên gir di kêlekên otomobîlan de ji bo berfirehkirina qada dîtinê, û neynikên çal jî di teleskop û neynikên makyajê de tên bikaranîn.",
    light_scattering: "Belavbûna ronahiyê (Scattering) nîşan dide ku çawa ronahî bi keriyên biçûk an molekulên di navgînekê de dikeve têkiliyê, ku ev yek rengê ezman û dîtina di nav mijê de diyar dike. Belavbûna Rayleigh destnîşan dike ku pêlên kin (wek şîn) li gorî pêlên dirêj (wek sor) pir zêdetir belav dibin. Ev yek rave dike ku çima ezman bi roj şîn e û di dema rojavabûnê de jî sor e (ji ber ku ronahiya şîn belav dibe û tenê sor digihîje çavên me).",
    optics: "Şikestina ronahiyê (Refraksiyon) rave dike ku çawa arasteya ronahiyê dema derbasî navgînên cihê dibe diguhere, ku ev yek bingeha vîzyon û nîskan (lenses) e. Qanûna Snell diyar dike ku rêjeya navbera sîncê goşeya ketinê û sîncê goşeya şikestinê neguher e û girêdayî pêrista şikestinê ya her du navgînan e. Di teknolojiyê de, fîberên optîkî xwe dispêrin vajîbûna hundirîn a temam (ku encameke Qanûna Snell e) ji bo veguhestina daneyên înternetê.",
    energy_forms: "Qanûna parastina wizeyê diyar dike ku wize nayê afirandin û nayê tunekirin, tenê ji formekê derbasî formeke din dibe. Ev bingeha termodînamîk û mêkanîkê ye. Wize di navbera formên wekî wizeya tevgerî, wizeya potansiyel, germî û elektrîkî de diguhere, lê wizeya giştî ya sîstemê heman dimîne. Wek mînak, bendav wizeya potansiyel a avê vediguherînin wizeya tevgerî û piştre jî dikin wizeya elektrîkê.",
    gas_properties: "Têgihîştina taybetmendiyên xazan ji bo xwendina fîzîkê û motoran gelek girîng e. Qanûna xaza nimûneyî pêwendiya navbera pestan, qebare û germahiya xazekê rave dike. Teoriya kînetîk nîşan dide ku pestan ji ber lêdana molekulên xazê li dîwarên derdan çêdibe. Wekî mînak, balonên hewayê germ radibin ji ber ku germkirina xazê qebareya wê zêde dike û tîrbûna wê kêm dike, û bi vî rengî hêza rakirinê çêdibe."
  }
};

for (const lang of langs) {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Create 'catalog' key if not exists
    if (!data.catalog) {
      data.catalog = {};
    }
    
    // Add theoryBackground for each experiment
    for (const [expKey, theoryText] of Object.entries(content[lang])) {
      if (!data.catalog[expKey]) {
        data.catalog[expKey] = {};
      }
      data.catalog[expKey].theoryBackground = theoryText;
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}/translation.json`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
}
