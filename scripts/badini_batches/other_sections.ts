export const badiniQuiz = {
  q1: {
    experiment: 'pendulum',
    question: 'ئەگەر بارستەیا گۆیا پاندۆلەکێ ٤ جاران زێدە بکەین و درێژیا بەندکی ب نەگۆڕی بمینیت، چ ب سەر دەمێ لەرینێدا دهێت؟',
    options: [
      'دوو جاران زێدە دبیت',
      'دبیتە نیڤ',
      'ب نەگۆڕی دمینیت',
      'چوار جاران زێدە دبیت'
    ],
    correctIndex: 2,
    explanation: 'دەمێ لەرینا پاندۆلێ T = 2π√(L/g) تەنها ب درێژی و لەزدانا کێشکرنێڤە یا گرێدایە و چ پەیوەندی ب بارستەیڤە نینە.'
  },
  q2: {
    experiment: 'projectile',
    question: 'کیژ گۆشەیا هاڤێتنێ زێدەترین مەودایێ ئاسۆیی ددەتە هاوێژراوەکی ل سەر رویێ ئەردی بێ بەرگریا هەوای؟',
    options: [
      '30°',
      '45°',
      '60°',
      '90°'
    ],
    correctIndex: 1,
    explanation: 'ل دویف یاسایا مەودای R = (v₀² sin(2θ))/g د گۆشەیا 45° پلەدا مەزنترین بەها بدەست دهێت چونکی sin(90°) = 1.'
  },
  q3: {
    experiment: 'circuits',
    question: 'دەمێ دوو بەرگریێن وەکهەڤ یێن 10 ئۆم ب هەڤپشک (Parallel) دهێنە گرێدان، بەرگریا هەڤبەش چەندە؟',
    options: [
      '20 Ω',
      '10 Ω',
      '5 Ω',
      '2.5 Ω'
    ],
    correctIndex: 2,
    explanation: 'د گرێدانا ب هەڤپشکدا بۆ بەرگریێن وەکهەڤ: R_eq = R / n = 10 / 2 = 5 Ω.'
  },
  q4: {
    experiment: 'optics',
    question: 'کەنگی ڕەنگڤەدانا تەماما ناڤەکی (Total Internal Reflection) د رووناهیێدا روویددەت؟',
    options: [
      'دەمێ رووناهی ژ ناڤەندەکێ کێمچڕ دچیتە ناڤەندەکا چڕتر',
      'دەمێ رووناهی ژ ناڤەندەکا چڕتر دچیتە ناڤەندەکا کێمچڕ ب گۆشەیەکا مەزنتر ژ گۆشەیا رەخنەگر',
      'دەمێ گۆشەیا کەفتنێ هەر دەم صفر بیت',
      'د هەمی ناڤەنداندا بێ گوڕینا چڕی و گۆشەیان'
    ],
    correctIndex: 1,
    explanation: 'ڕەنگڤەدانا تەماما ناڤەکی تەنها دەمێ روویددەت کو تیشک ژ ناڤەندەکا چڕتر بەرەڤ کێمچڕ بچیت و گۆشەیا کەفتنێ ژ گۆشەیا رەخنەگر مەزنتر بیت.'
  },
  q5: {
    experiment: 'freefall',
    question: 'ئەگەر پەڕەک و تۆپکەکا ئاسنی د بۆڕیەکا ڤالاهی یا تمامدا (بێ هەوا) بهێنە بەردان، کیژک زووتر دگەهیتە ئەردی؟',
    options: [
      'تۆپکا ئاسنی ژ بەر کێشا وێ',
      'پەڕ ژ بەر سڤکیا وێ',
      'هەردوو د ئێک دەمدا دگەهنە خارێ',
      'یا گرێدایە ب رووبەرێ تەنێڤە'
    ],
    correctIndex: 2,
    explanation: 'د ڤالاهیێدا بەرگریا هەوای نینە و هەمی تەن ب هەمان لەزدانا کێشکرنێ (g) دکەڤنە خارێ و د ئێک دەمدا دگەهن.'
  },
  q6: {
    experiment: 'waves',
    question: 'د تاقیکرنا دوو قەلیشێن یۆنگیدا، ئەگەر دووراتیا ناڤبەرا قەلیشان (d) زێدە بکەین، چ ب سەر دووراتیا ناڤبەرا هێلاندا (y) دهێت؟',
    options: [
      'دووراتیا ناڤبەرا هێلان زێدە دبیت',
      'دووراتیا ناڤبەرا هێلان کێم دبیت و نێزیکی ئێک دبن',
      'دووراتی یا نەگۆڕ دمینیت',
      'هێل ب تەمامی ون دبن'
    ],
    correctIndex: 1,
    explanation: 'ل دویف هاوکێشەیا یۆنگی y = (m·λ·L)/d دووراتیا ناڤبەرا هێلان پێچەوانەیە دگەل d، لەوما ب زێدەبوونا d هێل نێزیکی ئێک دبن.'
  },
  q7: {
    experiment: 'spring',
    question: 'ئەگەر بارستەیا 4kg ب سپرینگەکێڤە بلەرزیت ب دەمێ لەرینا 2 چرکە، ئەگەر بارستەی بکەینە 16kg دەمێ لەرینێ دبیتە چەند؟',
    options: [
      '2 چرکە',
      '4 چرکە',
      '8 چرکە',
      '1 چرکە'
    ],
    correctIndex: 1,
    explanation: 'دەمێ لەرینێ T = 2π√(m/k). ب زێدەکرنا بارستەی ب 4 جاران، دەمێ لەرینێ ب رەگێ 4 کو دبیتە 2 جاران زێدە دبیت (2 × 2 = 4 چرکە).'
  },
  q8: {
    experiment: 'buoyancy',
    question: 'پارچەکا دارێ ب چڕیا 600 kg/m³ هاتە هاڤێتنە ناڤ ئاڤەکێ ب چڕیا 1000 kg/m³. چەند ژ سەدێ قەبارێ وێ نوقم دبیت؟',
    options: [
      '40%',
      '60%',
      '100%',
      '0%'
    ],
    correctIndex: 1,
    explanation: 'ڕێژەیا نوقمبوونا تەنێ یەکسانە ب چڕیا تەنێ دابەشی چڕیا شلەمەنیێ: 600 / 1000 = 60%.'
  },
  q9: {
    experiment: 'collision',
    question: 'د پێکدادانا تەواو رەقدا (Elastic Collision) د ناڤبەرا دوو تەناندا، کیژ ژ ڤان بڕێن فیزیکی دهێنە پاراستن؟',
    options: [
      'تەنها تەوژم (تەخم)',
      'تەنها وزەیا لڤینێ',
      'هەردوو تەوژم و وزەیا لڤینێ پێکڤە',
      'لەزاتیا ئاراستەکری یا هەر تەنەکی ب جیاوازی'
    ],
    correctIndex: 2,
    explanation: 'د پێکدادانا تەواو رەقدا هەردوو تەوژما هێلی و وزەیا لڤینێ یا گشتی د سیستەمیدا دهێنە پاراستن.'
  },
  q10: {
    experiment: 'thermodynamics',
    question: 'د پرۆسەیەکا گەرمیێدا ب پلەیا گەرماتیێ یا نەگۆڕ (Isothermal) بۆ گازا نموونەیی، ئەگەر قەبارە دوو جاران زێدە ببیت، پەستان چ لێ دهێت؟',
    options: [
      'پەستان دوو جاران زێدە دبیت',
      'پەستان دبیتە نیڤ',
      'پەستان وەکی خۆ ب نەگۆڕی دمینیت',
      'پەستان دبیتە صفر'
    ],
    correctIndex: 1,
    explanation: 'ل دویف یاسایا بۆیل د پلەیا گەرماتیێ یا نەگۆڕدا P·V = نەگۆڕ، پەستان و قەبارە پێچەوانەن؛ زێدەکرنا قەبارەی بۆ دوو جاران پەستانێ دکەتە نیڤ.'
  }
};

export const badiniFormulas: Record<string, any> = {
  pendulum_period: {
    name: 'دەمێ لەرینا پاندۆلا سادە',
    topic: 'میکانیک',
    formula: 'T = 2π √(L / g)',
    description: 'دەمێ لەرینا پاندۆلا سادە بۆ گۆشەیێن بچووک دیار دکەت، کو تەنها ب درێژیا بەندکی و لەزدانا کێشکرنێڤە یا گرێدایە.',
    variables: [
      { symbol: 'T', name: 'دەمێ لەرینێ', unit: 's' },
      { symbol: 'L', name: 'درێژیا بەندکی', unit: 'm' },
      { symbol: 'g', name: 'لەزدانا کێشکرنێ', unit: 'm/s²' }
    ]
  },
  projectile_range: {
    name: 'مەودایێ ئاسۆیی یێ هاوێژراوی',
    topic: 'میکانیک',
    formula: 'R = (v₀² · sin(2θ)) / g',
    description: 'هەمی دووراتیا ئاسۆیی یا کو هاوێژراوەک دبڕیت ژ دەمێ هاڤێتنێ هەتا گەهشتنێ ب هەمان ئاست.',
    variables: [
      { symbol: 'R', name: 'مەودایێ ئاسۆیی', unit: 'm' },
      { symbol: 'v₀', name: 'لەزاتیا دەستپێکێ', unit: 'm/s' },
      { symbol: 'θ', name: 'گۆشەیا هاڤێتنێ', unit: 'degrees (°)' },
      { symbol: 'g', name: 'لەزدانا کێشکرنێ', unit: 'm/s²' }
    ]
  },
  projectile_height: {
    name: 'بلنداهیا هەرە زێدە یا هاوێژراوی',
    topic: 'میکانیک',
    formula: 'H = (v₀ · sin θ)² / (2g)',
    description: 'بلندترین خالا ستوونی یا کو هاوێژراو دگەهیتێ دەمێ لەزاتیا ستوونی دبیتە صفر.',
    variables: [
      { symbol: 'H', name: 'بلنداهیا هەرە زێدە', unit: 'm' },
      { symbol: 'v₀', name: 'لەزاتیا دەستپێکێ', unit: 'm/s' },
      { symbol: 'θ', name: 'گۆشەیا هاڤێتنێ', unit: 'degrees (°)' },
      { symbol: 'g', name: 'لەزدانا کێشکرنێ', unit: 'm/s²' }
    ]
  },
  ohms_law: {
    name: 'یاسایا بنەڕەتی یا ئۆم',
    topic: 'کارەبا',
    formula: 'V = I · R',
    description: 'پەیوەندیا راستەوانە د ناڤبەرا جوداهیا پۆتەنسیالێ، تەزوویا کارەبێ و بەرگریا کارەباییدا نیشان ددەت.',
    variables: [
      { symbol: 'V', name: 'جوداهیا پۆتەنسیالێ (ڤۆڵتیە)', unit: 'V' },
      { symbol: 'I', name: 'تەزوویا کارەبێ', unit: 'A' },
      { symbol: 'R', name: 'بەرگریا کارەبایی', unit: 'Ω' }
    ]
  },
  electric_power: {
    name: 'شیانا کارەبایی',
    topic: 'کارەبا',
    formula: 'P = V · I = I² · R = V² / R',
    description: 'تێکڕایا بکارئینان یان گوهۆڕینا وزەیا کارەبایی بۆ جورێن دی یێن وزەیێ د ئێکەیا دەمیدا.',
    variables: [
      { symbol: 'P', name: 'شیانا کارەبایی', unit: 'W' },
      { symbol: 'V', name: 'ڤۆڵتیە', unit: 'V' },
      { symbol: 'I', name: 'تەزوویا کارەبێ', unit: 'A' },
      { symbol: 'R', name: 'بەرگری', unit: 'Ω' }
    ]
  },
  snells_law: {
    name: 'یاسایا سنێل بۆ شکەستنا رووناهیێ',
    topic: 'بینایی',
    formula: 'n₁ · sin θ₁ = n₂ · sin θ₂',
    description: 'پەیوەندیا د ناڤبەرا گۆشەیا کەفتنێ و شکەستنێ دەمێ رووناهی د ناڤبەرا دوو ناڤەندێن ب چڕیا بینایی یا جودا دەرباز دبیت.',
    variables: [
      { symbol: 'n₁', name: 'کۆلکێ شکەستنێ یێ ناڤەندێ 1', unit: 'dimensionless' },
      { symbol: 'θ₁', name: 'گۆشەیا کەفتنێ', unit: 'degrees (°)' },
      { symbol: 'n₂', name: 'کۆلکێ شکەستنێ یێ ناڤەندێ 2', unit: 'dimensionless' },
      { symbol: 'θ₂', name: 'گۆشەیا شکەستنێ', unit: 'degrees (°)' }
    ]
  },
  critical_angle: {
    name: 'گۆشەیا رەخنەگر بۆ ڕەنگڤەدانا تەماما ناڤەکی',
    topic: 'بینایی',
    formula: 'θ_c = arcsin(n₂ / n₁)',
    description: 'کێمترین گۆشەیا کەفتنێ د ناڤەندەکا چڕتردا کو تێدا رووناهی ب تەمامی دزڤڕیتە ناڤ هەمان ناڤەندێ (n₁ > n₂).',
    variables: [
      { symbol: 'θ_c', name: 'گۆشەیا رەخنەگر', unit: 'degrees (°)' },
      { symbol: 'n₁', name: 'کۆلکێ شکەستنێ یێ ناڤەندێ چڕتر', unit: 'dimensionless' },
      { symbol: 'n₂', name: 'کۆلکێ شکەستنێ یێ ناڤەندێ کێمچڕتر', unit: 'dimensionless' }
    ]
  },
  young_double_slit: {
    name: 'یاسایا دوو قەلیشێن یۆنگی',
    topic: 'پێل و بینایی',
    formula: 'y = (m · λ · L) / d',
    description: 'جهێ هێڵێن رووناک و تاریک د تێکەلکرنا پێلێن رووناهیێدا ل دویف درێژیا پێلێ، دووراتیا پەردێ و درزیان.',
    variables: [
      { symbol: 'y', name: 'دووراتیا هێڵێ ژ ناڤەندێ', unit: 'm' },
      { symbol: 'm', name: 'پلەیا تێکەلکرنێ', unit: 'integer' },
      { symbol: 'λ', name: 'درێژیا پێلا رووناهیێ', unit: 'm' },
      { symbol: 'L', name: 'دووراتیا ناڤبەرا پەردە و قەلیشان', unit: 'm' },
      { symbol: 'd', name: 'دووراتیا ناڤبەرا دوو قەلیشان', unit: 'm' }
    ]
  },
  kinetic_energy: {
    name: 'وزەیا لڤینێ (جوولە وزە)',
    topic: 'میکانیک',
    formula: 'KE = ½ m · v²',
    description: 'وزەیا کو تەن وەردگریت ژ ئەگەرێ لەزاتی و لڤینا خۆ یا هێلی.',
    variables: [
      { symbol: 'KE', name: 'وزەیا لڤینێ', unit: 'J' },
      { symbol: 'm', name: 'بارستەیا تەنێ', unit: 'kg' },
      { symbol: 'v', name: 'لەزاتیا تەنێ', unit: 'm/s' }
    ]
  },
  potential_energy: {
    name: 'وزەیا پۆتەنسیالا کێشکرنێ (ماتە وزە)',
    topic: 'میکانیک',
    formula: 'PE = m · g · h',
    description: 'وزەیا پاشکەفتکری د تەنیدا ژ ئەگەرێ جهێ وێ و بلنداهیێ د بیاڤێ کێشکرنێدا.',
    variables: [
      { symbol: 'PE', name: 'وزەیا پۆتەنسیال', unit: 'J' },
      { symbol: 'm', name: 'بارستە', unit: 'kg' },
      { symbol: 'g', name: 'لەزدانا کێشکرنێ', unit: 'm/s²' },
      { symbol: 'h', name: 'بلنداهی ژ ئاستێ بنەڕەت', unit: 'm' }
    ]
  },
  hookes_law: {
    name: 'یاسایا هووک بۆ سپرینگێ',
    topic: 'میکانیک',
    formula: 'F = -k · x',
    description: 'هێزا ڤەگێڕ یا دروستبووی د سپرینگەکێدا کو راستەوانەیە دگەل بڕێ لادان یان درێژبوونێ.',
    variables: [
      { symbol: 'F', name: 'هێزا ڤەگێڕ', unit: 'N' },
      { symbol: 'k', name: 'نەگۆڕێ سپرینگێ', unit: 'N/m' },
      { symbol: 'x', name: 'لادان ژ جهێ هەڤسەنگیێ', unit: 'm' }
    ]
  },
  spring_oscillator_period: {
    name: 'دەمێ لەرینا سپرینگ و بارستەیێ',
    topic: 'میکانیک',
    formula: 'T = 2π √(m / k)',
    description: 'دەمێ پێویست بۆ ئێک خول یان لەرینا تەواو د لەرینەرا بارستە و سپرینگێدا.',
    variables: [
      { symbol: 'T', name: 'دەمێ لەرینێ', unit: 's' },
      { symbol: 'm', name: 'بارستەیا هەلاویستی', unit: 'kg' },
      { symbol: 'k', name: 'نەگۆڕێ سپرینگێ', unit: 'N/m' }
    ]
  },
  archimedes_buoyancy: {
    name: 'هێزا بلندکرنا ئەرشەمیدس',
    topic: 'شلەمەنی',
    formula: 'F_b = ρ · V · g',
    description: 'هێزا بلندکرنا بەرەڤ ژۆر کو کارتێکرنێ ل سەر تەنێ نوقمبووی دکەت و یەکسانە ب کێشا شلەمەنیا لادای.',
    variables: [
      { symbol: 'F_b', name: 'هێزا بلندکرنێ', unit: 'N' },
      { symbol: 'ρ', name: 'چڕیا شلەمەنیێ', unit: 'kg/m³' },
      { symbol: 'V', name: 'قەبارێ نوقمبووی یێ تەنێ', unit: 'm³' },
      { symbol: 'g', name: 'لەزدانا کێشکرنێ', unit: 'm/s²' }
    ]
  },
  momentum_conservation: {
    name: 'یاسایا پاراستنا تەوژمێ',
    topic: 'میکانیک',
    formula: 'm₁v₁ + m₂v₂ = m₁v₁’ + m₂v₂’',
    description: 'کۆما تەوژما هێلی د سیستەمەکێ داخستیدا بەریا پێکدادانێ یەکسانە ب کۆما تەوژمێ پشتی پێکدادانێ.',
    variables: [
      { symbol: 'm₁', name: 'بارستەیا تەنێ 1', unit: 'kg' },
      { symbol: 'v₁', name: 'لەزاتیا 1 بەریا لێککەفتنێ', unit: 'm/s' },
      { symbol: 'm₂', name: 'بارستەیا تەنێ 2', unit: 'kg' },
      { symbol: 'v₂', name: 'لەزاتیا 2 بەریا لێککەفتنێ', unit: 'm/s' }
    ]
  },
  ideal_gas_law: {
    name: 'یاسایا گشتی یا گازا نموونەیی',
    topic: 'گەرمی و گاز',
    formula: 'P · V = n · R · T',
    description: 'پەیوەندیا ناڤبەرا پەستان، قەبارە، ژمارەیا مۆلان و پلەیا گەرماتیێ بۆ گازا نموونەیی.',
    variables: [
      { symbol: 'P', name: 'پەستان', unit: 'Pa' },
      { symbol: 'V', name: 'قەبارە', unit: 'm³' },
      { symbol: 'n', name: 'ژمارەیا مۆلان', unit: 'mol' },
      { symbol: 'R', name: 'نەگۆڕێ گازان (8.314)', unit: 'J/(mol·K)' },
      { symbol: 'T', name: 'پلەیا گەرماتیێ ب کەلڤن', unit: 'K' }
    ]
  },
  arc_length_radian: {
    name: 'درێژیا کەڤانی و گۆشەیا رادیەن',
    topic: 'میکانیک',
    formula: 's = r · θ',
    description: 'پەیوەندیا ناڤبەرا درێژیا کەڤانی، نیڤتیرە و گۆشەیا رادیەن د لڤینا بازنەییدا.',
    variables: [
      { symbol: 's', name: 'درێژیا کەڤانی', unit: 'm' },
      { symbol: 'r', name: 'نیڤتیرەیا بازنەیی', unit: 'm' },
      { symbol: 'θ', name: 'گۆشە ب رادیەن', unit: 'rad' }
    ]
  },
  rotational_inertia_torque: {
    name: 'زەڤرێ زڤڕینێ و لەزدانا گۆشەیی',
    topic: 'میکانیک',
    formula: 'τ = I · α',
    description: 'یاسایا دوویێ یا نیوتنی بۆ لڤینا زڤڕینێ: زەڤرێ زڤڕینێ یەکسانە ب زەڤرێ سستیێ لێکدای لەزدانا گۆشەیی.',
    variables: [
      { symbol: 'τ', name: 'زەڤرێ زڤڕینێ', unit: 'N·m' },
      { symbol: 'I', name: 'زەڤرێ سستیێ', unit: 'kg·m²' },
      { symbol: 'α', name: 'لەزدانا گۆشەیی', unit: 'rad/s²' }
    ]
  },
  center_of_mass_formula: {
    name: 'ناڤەندا بارستەی بۆ سیستەمێ تەنان',
    topic: 'میکانیک',
    formula: 'X_cm = Σ(m_i · x_i) / Σm_i',
    description: 'خالا ناڤەندی یا هاوسەنگیێ کو تێدا تەواوی بارستەیا سیستەمی کۆم بوویە.',
    variables: [
      { symbol: 'X_cm', name: 'جهێ ناڤەندا بارستەی', unit: 'm' },
      { symbol: 'm_i', name: 'بارستەیا هەر تەنەکی', unit: 'kg' },
      { symbol: 'x_i', name: 'جهێ هەر تەنەکی', unit: 'm' }
    ]
  },
  acoustic_pipe_resonance: {
    name: 'دەنگڤەدانا بۆڕیا دەنگی یا سەرڤەکری',
    topic: 'دەنگ و پێل',
    formula: 'f_n = (n · v) / (2L)',
    description: 'فریکوێنسیا لەرینێن دەنگڤەدانێ د بۆڕیا هەوای یا سەرڤەکریدا ل دویف لەزاتیا دەنگی و درێژیا بۆڕیێ.',
    variables: [
      { symbol: 'f_n', name: 'فریکوێنسیا هارمۆنیکێ', unit: 'Hz' },
      { symbol: 'n', name: 'ژمارەیا هارمۆنیکێ (1, 2, 3...)', unit: 'integer' },
      { symbol: 'v', name: 'لەزاتیا دەنگی د هەوایدا', unit: 'm/s' },
      { symbol: 'L', name: 'درێژیا بۆڕیێ', unit: 'm' }
    ]
  },
  sound_speed_formula: {
    name: 'لەزاتیا دەنگی ل دویف پلەیا گەرماتیێ',
    topic: 'دەنگ و پێل',
    formula: 'v = 331.3 + 0.606 · T',
    description: 'حسابکرنا لەزاتیا دەنگی د هەوایێ ئاساییدا ل دویف پلەیا گەرماتیا سیلیزی.',
    variables: [
      { symbol: 'v', name: 'لەزاتیا دەنگی', unit: 'm/s' },
      { symbol: 'T', name: 'پلەیا گەرماتیێ ب سیلیزی', unit: '°C' }
    ]
  },
  solenoid_magnetic_field: {
    name: 'بیاڤێ موگناتیسی د کۆیلێ هەلگری تەزوودا',
    topic: 'کارۆموگناتیس',
    formula: 'B = μ₀ · n · I',
    description: 'چڕیا بیاڤێ موگناتیسی د ناڤەڕۆکا کۆیلەکا درێژدا ب رێژەیا ژمارەیا بادانان و تەزوویێ.',
    variables: [
      { symbol: 'B', name: 'چڕیا بیاڤێ موگناتیسی', unit: 'T' },
      { symbol: 'μ₀', name: 'دەرپەڕینیا موگناتیسی یا ڤالاهیێ', unit: 'T·m/A' },
      { symbol: 'n', name: 'ژمارەیا بادانان د یەکەیێ درێژیدا', unit: 'm⁻¹' },
      { symbol: 'I', name: 'تەزوویا کارەبێ', unit: 'A' }
    ]
  },
  atomic_energy_quantum: {
    name: 'وزەیا فۆتۆنی و بیردۆزا پلانکی',
    topic: 'فیزیا کوانتەم',
    formula: 'E = h · f = (h · c) / λ',
    description: 'وزەیا فۆتۆنەکێ رووناهیێ کو راستەوانەیە دگەل فریکوێنسیا وێ ب رێکا نەگۆڕێ پلانکی.',
    variables: [
      { symbol: 'E', name: 'وزەیا فۆتۆنی', unit: 'J' },
      { symbol: 'h', name: 'نەگۆڕێ پلانکی', unit: 'J·s' },
      { symbol: 'f', name: 'فریکوێنسی', unit: 'Hz' },
      { symbol: 'λ', name: 'درێژیا پێلێ', unit: 'm' }
    ]
  },
  metric_prefixes_scaling: {
    name: 'پێشگرێن مەتری و هێزێن ١٠',
    topic: 'پێڤانێن زانستی',
    formula: 'Value = N × 10^p',
    description: 'نیشاندانا بڕێن فیزیکی ب نڤیسینا زانستی ب رێکا پێشگرێن نێودەولەتی (SI).',
    variables: [
      { symbol: 'Value', name: 'بهایێ کۆتایی', unit: 'various' },
      { symbol: 'N', name: 'ژمارەیا بنەڕەت (1 ≤ N < 10)', unit: 'scalar' },
      { symbol: 'p', name: 'توانا یان هێزا ١٠', unit: 'integer' }
    ]
  },
  stress_strain_young: {
    name: 'مۆدیۆلێ یۆنگی بۆ تەشیاریێ',
    topic: 'میکانیکا ماددەی',
    formula: 'E = (F / A) / (ΔL / L₀)',
    description: 'پەیوەندیا ناڤبەرا شەدین و ڤەکێشانێ د دەڤەرا تەشیاریا ماددەیدا.',
    variables: [
      { symbol: 'E', name: 'مۆدیۆلێ یۆنگی', unit: 'Pa' },
      { symbol: 'F', name: 'هێزا راکێشانێ', unit: 'N' },
      { symbol: 'A', name: 'رووبەرێ بڕگەی', unit: 'm²' },
      { symbol: 'ΔL', name: 'زێدەبوونا درێژیێ', unit: 'm' },
      { symbol: 'L₀', name: 'درێژیا بنەڕەتی', unit: 'm' }
    ]
  },
  bernoulli_principle: {
    name: 'هاوکێشەیا بێرنۆلی بۆ شلەمەنیێن لڤۆک',
    topic: 'داینامیکا شلەمەنیان',
    formula: 'P + ½ ρ · v² + ρ · g · h = const',
    description: 'یاسایا پاراستنا وزەیێ بۆ شلەمەنیا نموونەیی کو لڤین، پەستان و بلنداهیێ گرێدەت.',
    variables: [
      { symbol: 'P', name: 'پەستانا شلەمەنیێ', unit: 'Pa' },
      { symbol: 'ρ', name: 'چڕیا شلەمەنیێ', unit: 'kg/m³' },
      { symbol: 'v', name: 'لەزاتیا لڤینێ', unit: 'm/s' },
      { symbol: 'h', name: 'بلنداهی', unit: 'm' }
    ]
  },
  angled_mirrors_images: {
    name: 'ژمارەیا وێنەیان د ئاڤینکێن گۆشەداردا',
    topic: 'بینایی',
    formula: 'N = (360° / θ) - 1',
    description: 'ژمارەیا وێنەیێن دروستبووی د ناڤبەرا دوو ئاڤینکێن تەختدا دەمێ گۆشەیا ناڤبەرا وان θ بیت.',
    variables: [
      { symbol: 'N', name: 'ژمارەیا وێنەیان', unit: 'integer' },
      { symbol: 'θ', name: 'گۆشەیا ناڤبەرا ئاڤینکان', unit: 'degrees (°)' }
    ]
  },
  curved_mirrors_formula: {
    name: 'هاوکێشەیا ئاڤینکێن چەماو',
    topic: 'بینایی',
    formula: '1/f = 1/d_o + 1/d_i',
    description: 'پەیوەندیا ناڤبەرا دووراتیا تیشکۆیی، دووراتیا تەنێ و دووراتیا وێنەی د ئاڤینکێن قوپچاڵ و قۆقزدا.',
    variables: [
      { symbol: 'f', name: 'دووراتیا تیشکۆیی', unit: 'm' },
      { symbol: 'd_o', name: 'دووراتیا تەنێ ژ ئاڤینکێ', unit: 'm' },
      { symbol: 'd_i', name: 'دووراتیا وێنەی ژ ئاڤینکێ', unit: 'm' }
    ]
  },
  thin_lenses_formula: {
    name: 'هاوکێشەیا گشتی یا هاوێنەیێن تەنک',
    topic: 'بینایی',
    formula: '1/f = 1/d_o + 1/d_i',
    description: 'پەیوەندیا ناڤبەرا تیشکۆ، جهێ تەنێ و جهێ وێنەی د هاوێنەیێن قۆقز و قوپچاڵدا.',
    variables: [
      { symbol: 'f', name: 'دووراتیا تیشکۆیی', unit: 'm' },
      { symbol: 'd_o', name: 'دووراتیا تەنێ', unit: 'm' },
      { symbol: 'd_i', name: 'دووراتیا وێنەی', unit: 'm' }
    ]
  },
  malus_law_polarization: {
    name: 'یاسایا مالۆس بۆ رووناهیا جەمسەرگیر',
    topic: 'بینایی و پێل',
    formula: 'I = I₀ · cos² θ',
    description: 'چڕیا رووناهیا دەربازبووی ژ شیکارکەرێ جەمسەرگیر ل دویف گۆشەیا ناڤبەرا تەوەرێن جەمسەرگیریێ.',
    variables: [
      { symbol: 'I', name: 'چڕیا دەربازبووی', unit: 'W/m²' },
      { symbol: 'I₀', name: 'چڕیا دەستپێکێ', unit: 'W/m²' },
      { symbol: 'θ', name: 'گۆشەیا ناڤبەرا دوو فلتەران', unit: 'degrees (°)' }
    ]
  },
  rayleigh_scattering_law: {
    name: 'یاسایا پەرتبوونا رەیلی',
    topic: 'بینایی',
    formula: 'I ∝ 1 / λ⁴',
    description: 'چڕیا پەرتبوونا رووناهیێ ب تەنۆلکەیێن زۆر بچووک کو ب ڕێژەیا چوارگۆشەیا دوویێ یا درێژیا پێلێ کار دکەت.',
    variables: [
      { symbol: 'I', name: 'چڕیا پەرتبوونێ', unit: 'arbitrary' },
      { symbol: 'λ', name: 'درێژیا پێلا رووناهیێ', unit: 'm' }
    ]
  },
  work_heat_first_law: {
    name: 'یاسایا ئێکێ یا داینامیکا گەرمیێ',
    topic: 'گەرمی و وزە',
    formula: 'ΔU = Q - W',
    description: 'گوهۆڕینا وزەیا ناڤەکی یا سیستەمێ گازی یەکسانە ب گەرماتیا پێدراو کەم ئیشێ ئەنجامدای ب گازی.',
    variables: [
      { symbol: 'ΔU', name: 'گوهۆڕینا وزەیا ناڤەکی', unit: 'J' },
      { symbol: 'Q', name: 'گەرماتیا لادای یان پێدراو', unit: 'J' },
      { symbol: 'W', name: 'ئیشێ ئەنجامدای', unit: 'J' }
    ]
  },
  prescription_glasses_power: {
    name: 'شیانا هاوێنەیێ ب دیۆپتەر',
    topic: 'بینایی و پزیشکی',
    formula: 'D = 1 / f',
    description: 'شیانا هاوێنەیێ بۆ چەماندنا تیشکان کو پێچەوانەیا دووراتیا تیشکۆیێیە ب مەتر.',
    variables: [
      { symbol: 'D', name: 'شیانا هاوێنەیێ (دیۆپتەر)', unit: 'm⁻¹ (Diopter)' },
      { symbol: 'f', name: 'دووراتیا تیشکۆیی', unit: 'm' }
    ]
  },
  periscope_law_reflection: {
    name: 'یاسایا ڕەنگڤەدانا رووناهیێ د پێریسکۆپێدا',
    topic: 'بینایی',
    formula: 'θ_incident = θ_reflected = 45°',
    description: 'یەکسانبوونا گۆشەیا کەفتن و ڕەنگڤەدانێ د ئاڤینکا تەختدا بۆ گوهۆڕینا ئاراستەیا رووناهیێ ب ٩٠ پلە.',
    variables: [
      { symbol: 'θ_i', name: 'گۆشەیا کەفتنێ', unit: 'degrees (°)' },
      { symbol: 'θ_r', name: 'گۆشەیا ڕەنگڤەدانێ', unit: 'degrees (°)' }
    ]
  },
  coulomb_static_balloons: {
    name: 'یاسایا کۆلۆمب بۆ هێزا کارەبایا ساکن',
    topic: 'کارەبا',
    formula: 'F = k · |q₁ · q₂| / r²',
    description: 'هێزا کێشکرن یان پاڵدانێ د ناڤبەرا دوو بارگەیێن کارەبایی یێن خاڵیدا.',
    variables: [
      { symbol: 'F', name: 'هێزا کارەبایی', unit: 'N' },
      { symbol: 'k', name: 'نەگۆڕێ کۆلۆمب (8.99 × 10⁹)', unit: 'N·m²/C²' },
      { symbol: 'q₁', name: 'بارگەیێ ئێکێ', unit: 'C' },
      { symbol: 'q₂', name: 'بارگەیێ دوویێ', unit: 'C' },
      { symbol: 'r', name: 'دووراتیا ناڤبەرا بارگەیان', unit: 'm' }
    ]
  },
  sled_friction_mechanics: {
    name: 'هێزا لێکخشینا لڤۆک و ڕاوەستیای',
    topic: 'میکانیک',
    formula: 'f_k = μ_k · N , f_s,max = μ_s · N',
    description: 'هێزا بەرگریێ یا لێکخشینێ د ناڤبەرا دوو رویاندا کو پەیوەستە ب کۆلکێ لێکخشینێ و هێزا ستوون.',
    variables: [
      { symbol: 'f', name: 'هێزا لێکخشینێ', unit: 'N' },
      { symbol: 'μ', name: 'کۆلکێ لێکخشینێ', unit: 'dimensionless' },
      { symbol: 'N', name: 'هێزا ستوون (mg)', unit: 'N' }
    ]
  },
  fourier_heat_conduction: {
    name: 'یاسایا فۆریێ بۆ گەیاندنا گەرماتیێ',
    topic: 'گەرمی',
    formula: 'q = -k · A · (ΔT / L)',
    description: 'تێکڕایا ڤەگوهاستنا گەرماتیێ د ناڤ ماددەیەکێدا ل دویف رووبەر، درێژی و جوداهیا پلەیا گەرماتیێ.',
    variables: [
      { symbol: 'q', name: 'تێکڕایا گەرماتیێ (dQ/dt)', unit: 'W' },
      { symbol: 'k', name: 'کۆلکێ گەیاندنا گەرمیێ', unit: 'W/(m·K)' },
      { symbol: 'A', name: 'رووبەرێ بڕگەی', unit: 'm²' },
      { symbol: 'ΔT', name: 'جوداهیا پلەیا گەرماتیێ', unit: 'K' },
      { symbol: 'L', name: 'درێژیا داریلکێ', unit: 'm' }
    ]
  },
  seesaw_rotational_torque: {
    name: 'مەرجێ هاوسەنگیا زەڤرێ زڤڕینێ',
    topic: 'میکانیک',
    formula: 'Στ = m₁ · g · d₁ - m₂ · g · d₂ = 0',
    description: 'هاوسەنگبوونا تەواو د زەڤرێن ئاراستەیا دەمژمێرێ و دژە-دەمژمێرێدا ل دۆر خالا پالپشتێ.',
    variables: [
      { symbol: 'Στ', name: 'کۆما زەڤرێ زڤڕینێ', unit: 'N·m' },
      { symbol: 'm₁', name: 'بارستەیا لایێ چەپێ', unit: 'kg' },
      { symbol: 'd₁', name: 'دووراتیا چەپێ ژ پالپشتێ', unit: 'm' },
      { symbol: 'm₂', name: 'بارستەیا لایێ راستێ', unit: 'kg' },
      { symbol: 'd₂', name: 'دووراتیا راستێ ژ پالپشتێ', unit: 'm' }
    ]
  },
  faraday_lenz_induction: {
    name: 'یاسایا فارادای و لێنز بۆ هاندانا کارۆموگناتیسی',
    topic: 'کارۆموگناتیس',
    formula: 'ε = -N · (ΔΦ_B / Δt)',
    description: 'هێزا دەفعدەرا کارەبایی یا دروستبووی د بازنەیەکێدا کو یەکسانە ب تێکڕایا گوهۆڕینا تەوژما موگناتیسی د دەمیدا.',
    variables: [
      { symbol: 'ε', name: 'هێزا دەفعدەرا کارەبایی (EMF)', unit: 'V' },
      { symbol: 'N', name: 'ژمارەیا بادانان', unit: 'integer' },
      { symbol: 'ΔΦ_B', name: 'گوهۆڕینا تەوژما موگناتیسی', unit: 'Wb' },
      { symbol: 'Δt', name: 'ماوەیا دەمی', unit: 's' }
    ]
  },
  stokes_viscosity_terminal_vel: {
    name: 'یاسایا ستۆکس بۆ خەستیێ و لەزاتیا دووماهیکێ',
    topic: 'داینامیکا شلەمەنیان',
    formula: 'v_t = (2/9) · r² · g · (ρ_s - ρ_f) / η',
    description: 'لەزاتیا دووماهیکێ یا تۆپکەکێ دەمێ د ناڤ شلەمەنیەکا خەستدا دکەڤیت و هێزێن کێشکرن و لێکخشین هاوسەنگ دبن.',
    variables: [
      { symbol: 'v_t', name: 'لەزاتیا دووماهیکێ', unit: 'm/s' },
      { symbol: 'r', name: 'نیڤتیرەیا تۆپکێ', unit: 'm' },
      { symbol: 'η', name: 'کۆلکێ خەستیێ (Viscosity)', unit: 'Pa·s' },
      { symbol: 'ρ_s', name: 'چڕیا تۆپکێ', unit: 'kg/m³' },
      { symbol: 'ρ_f', name: 'چڕیا شلەمەنیێ', unit: 'kg/m³' }
    ]
  },
  inclined_plane_simple_machine: {
    name: 'مفایێ میکانیکی یێ روویێ لێژ',
    topic: 'میکانیک',
    formula: 'MA = L / h = 1 / sin θ',
    description: 'رێژەیا کێمکرنا هێزا پێویست بۆ بلندکرنا تەنەکی ب بکارئینانا رویێ لێژ ل شوونا بلندکرنا راستەوخۆ.',
    variables: [
      { symbol: 'MA', name: 'مفایێ میکانیکی یێ تیۆری', unit: 'dimensionless' },
      { symbol: 'L', name: 'درێژیا روویێ لێژ', unit: 'm' },
      { symbol: 'h', name: 'بلنداهیا ستوونی یا رووی', unit: 'm' },
      { symbol: 'θ', name: 'گۆشەیا لێژبوونێ', unit: 'degrees (°)' }
    ]
  }
};
