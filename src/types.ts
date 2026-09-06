export type Language = 'ar' | 'en' | 'ku' | 'kmr' | 'bad';

export type SimulationCluster = 
  | 'all'
  | 'cluster_a'
  | 'cluster_b'
  | 'cluster_c'
  | 'cluster_d'
  | 'cluster_e'
  | 'cluster_f'
  | 'atomic_quantum'
  | 'electricity_magnetism'
  | 'gravity_space'
  | 'energy_transformations'
  | 'advanced_waves'
  | 'mechanics_fluids';

export type ExperimentType = 
  // Cluster A: Atomic & Quantum Physics (1-7)
  | 'build_atom'
  | 'build_nucleus'
  | 'rutherford'
  | 'rutherford_scattering'
  | 'models_hydrogen'
  | 'models_h_atom'
  | 'blackbody'
  | 'blackbody_spectrum'
  | 'molecules_light'
  | 'molecules_and_light'
  | 'color_vision'
  // Cluster B: Electricity, Circuits & Magnetism (8-14)
  | 'capacitor'
  | 'capacitor_lab'
  | 'charges_fields'
  | 'charges_and_fields'
  | 'wire_resistance'
  | 'resistance_in_wire'
  | 'circuits'
  | 'circuit_construction_kit'
  | 'generator'
  | 'faradays_law'
  | 'magnet_compass'
  | 'magnetic_field'
  | 'magnets_electromagnets'
  // Cluster C: Gravity & Astrophysics (15-17)
  | 'gravity_orbits'
  | 'gravity_and_orbits'
  | 'kepler_laws'
  | 'keplers_laws'
  | 'projectile_motion'
  | 'gravity_force_lab'
  | 'solar_system'
  // Cluster D: Energy & Momentum (18-20)
  | 'collision_lab'
  | 'energy_skate_park'
  | 'pendulum_lab'
  | 'energy_forms'
  // Cluster E: Advanced Waves & Optics (21-25)
  | 'fourier_waves'
  | 'fourier_making_waves'
  | 'sound_waves'
  | 'normal_modes'
  | 'wave_on_string'
  | 'wave_on_a_string'
  | 'geometric_optics'
  | 'bending_light'
  // Cluster F: Mechanics, Fluids & Thermodynamics (26-30)
  | 'hookes_law_masses'
  | 'fluid_pressure_flow'
  | 'buoyancy_archimedes'
  | 'states_of_matter'
  | 'gas_diffusion'
  | 'diffusion'
  | 'balancing_act'
  | 'buoyancy'
  | 'forces_motion'
  | 'friction'
  | 'gas_properties'
  // Legacy / Additional
  | 'pendulum' 
  | 'projectile' 
  | 'optics' 
  | 'freefall' 
  | 'waves'
  | 'spring'
  | 'collision'
  | 'thermodynamics'
  | 'arc_length'
  | 'rotational_dynamics'
  | 'rotational_dynamics_torque'
  | 'center_of_mass'
  | 'pendulum_energy'
  | 'acoustic_resonance'
  | 'sound_speed'
  | 'atomic_spectra'
  | 'metric_prefixes'
  | 'stress_strain'
  | 'bernoulli'
  | 'angled_mirrors'
  | 'curved_mirrors'
  | 'thin_lenses'
  | 'polarization'
  | 'light_scattering'
  | 'work_heat'
  | 'prescription_glasses'
  | 'periscope'
  | 'static_balloons'
  | 'sled_friction'
  | 'heat_conduction'
  | 'seesaw_torque'
  | 'electromagnetic_induction'
  | 'viscosity_stokes'
  | 'ramp_machine'
  // 5 New Experiments (IDs 66 to 70)
  | 'doppler_effect'
  | 'electrical_transformer'
  | 'photoelectric_effect'
  | 'radioactive_decay'
  | 'calorimetry_equilibrium';

export interface MeasurementRecord {
  id: string;
  experiment: ExperimentType;
  timestamp: string;
  parameters: Record<string, number | string>;
  measuredValue: number;
  theoreticalValue: number;
  unit: string;
  variableName: string;
  percentError: number;
  notes?: string;
  equation?: string;
}

// NOTE: name/description/question/option/explanation text for these four
// types no longer lives here. It was migrated to
// public/locales/{lng}/translation.json under formulas.<id>, quiz.<id>,
// planets.<id>, opticalMediums.<id>. Look it up with e.g.
// t(`formulas.${formula.id}.name`) using the `id`/`symbol` below as the key.
// See physicsData.ts (cleaned) for the language-independent numeric/structural
// data these interfaces now describe.

export interface PhysicsFormula {
  id: string;
  topic: 'mechanics' | 'electricity' | 'optics' | 'waves' | 'thermo';
  formula: string;
  latex?: string;
  variableSymbols: { symbol: string; unit: string }[];
}

export interface QuizQuestion {
  id: string;
  experiment: ExperimentType | 'general';
  correctIndex: number;
}

export interface PlanetGravity {
  id: string;
  g: number;
  icon: string;
}

export interface OpticalMedium {
  id: string;
  n: number;
  color: string;
}

export interface LabTableColumn {
  id: string;
  headerAr: string;
  headerEn: string;
  unit: string;
}

export interface LabTableRow {
  id: string;
  values: Record<string, string | number>;
}

export interface ExperimentTemplate {
  id: string;
  experimentType: ExperimentType | 'custom';
  titleAr: string;
  titleEn: string;
  categoryAr: string;
  categoryEn: string;
  objectiveAr: string;
  objectiveEn: string;
  theoryAr: string;
  theoryEn: string;
  equations: string[];
  apparatusAr: string[];
  apparatusEn: string[];
  procedureAr: string[];
  procedureEn: string[];
  safetyNotesAr: string[];
  safetyNotesEn: string[];
  columns: LabTableColumn[];
  defaultRows: LabTableRow[];
  analysisQuestionsAr: string[];
  analysisQuestionsEn: string[];
  expectedConclusionAr: string;
  expectedConclusionEn: string;
}

export interface SavedLabReport {
  id: string;
  templateId: string;
  title: string;
  studentName: string;
  date: string;
  experimentType: ExperimentType | 'custom';
  objective: string;
  hypothesis: string;
  equations: string[];
  columns: LabTableColumn[];
  rows: LabTableRow[];
  analysisNotes: string;
  calculatedValues: Record<string, string>;
  errorAnalysis: {
    theoretical: string;
    experimental: string;
    percentError: string;
  };
  conclusion: string;
  updatedAt: string;
}
