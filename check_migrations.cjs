const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const filesToCheck = [
  'AcousticResonanceSim', 'AngledMirrorsSim', 'ArcLengthSim', 'AtomicSpectraSim', 'BernoulliSim',
  'BlackbodySim', 'BuildAtomSim', 'BuildNucleusSim', 'BuoyancySim', 'CalorimetrySim',
  'CapacitorSim', 'CenterOfMassSim', 'ChargesFieldsSim', 'ColorVisionSim', 'CurvedMirrorsSim',
  'DiffusionSim', 'DopplerEffectSim', 'ElectricalTransformerSim', 'ElectromagnetSim',
  'ElectromagneticInductionSim', 'EnergySkateParkSim', 'ForcesMotionSim', 'FourierWavesSim',
  'GravityForceSim', 'GravityOrbitsSim', 'HeatConductionSim', 'KeplerLawsSim', 'LightScatteringSim',
  'MagneticFieldSim', 'MetricPrefixesSim', 'MoleculesLightSim', 'NormalModesSim', 'PeriscopeSim',
  'PolarizationSim', 'PrescriptionGlassesSim', 'RampMachineSim', 'RutherfordScatteringSim',
  'SeesawTorqueSim', 'SledFrictionSim', 'SoundSpeedSim', 'SpringSim', 'StatesOfMatterSim',
  'StaticBalloonsSim', 'StressStrainSim', 'ThinLensesSim', 'WaveOnStringSim', 'WireResistanceSim',
  'WorkHeatSim'
].map(f => f + '.tsx');

const results = [];

filesToCheck.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
     results.push({ file, status: 'غير موجود' });
     return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Checking for local objects like `const t = {` or `const t: Record... = {`
  const hasLocalObjectMatch = /const\s+(t|localT|translations|uiTranslations)\s*(:[\s\w<>,\[\]]+)?\s*=\s*{/m.test(content);
  // Exception: if it's just const { t } = useTranslation(), we shouldn't flag it. 
  
  if (hasLocalObjectMatch) {
     results.push({ file, status: 'لا يزال يحتوي كائناً محلياً' });
  } else {
     results.push({ file, status: 'مُرحَّل بالكامل' });
  }
});

console.log(JSON.stringify(results, null, 2));
