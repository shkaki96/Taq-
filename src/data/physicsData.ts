/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Language-independent physics data.
// All names/descriptions/questions now live in public/locales/{lng}/translation.json
// under planets.<id>, opticalMediums.<id>, constants.<symbol>, formulas.<id>,
// quiz.<id>. Look them up with t(`planets.${id}.name`) etc.

export interface PlanetGravity {
  id: string;
  g: number;
  icon: string;
}

export const PLANETS: PlanetGravity[] = [
  { id: 'earth', g: 9.81, icon: '🌍' },
  { id: 'moon', g: 1.62, icon: '🌕' },
  { id: 'mars', g: 3.71, icon: '🔴' },
  { id: 'jupiter', g: 24.79, icon: '🪐' },
  { id: 'sun', g: 274.0, icon: '☀️' },
  { id: 'space', g: 0.0, icon: '✨' },
];

export interface OpticalMedium {
  id: string;
  n: number;
  color: string;
}

export const OPTICAL_MEDIUMS: OpticalMedium[] = [
  { id: 'air', n: 1.0003, color: 'rgba(224, 242, 254, 0.15)' },
  { id: 'water', n: 1.333, color: 'rgba(56, 189, 248, 0.25)' },
  { id: 'oil', n: 1.47, color: 'rgba(234, 179, 8, 0.25)' },
  { id: 'glass', n: 1.52, color: 'rgba(147, 197, 253, 0.35)' },
  { id: 'flint_glass', n: 1.66, color: 'rgba(168, 85, 247, 0.35)' },
  { id: 'diamond', n: 2.417, color: 'rgba(236, 72, 153, 0.4)' },
];

export interface PhysicsConstant {
  symbol: string;
  value: string;
  unit: string;
}

export const CONSTANTS: PhysicsConstant[] = [
  { symbol: 'g', value: '9.80665', unit: 'm/s²' },
  { symbol: 'c', value: '2.998 × 10⁸', unit: 'm/s' },
  { symbol: 'G', value: '6.674 × 10⁻¹¹', unit: 'N·m²/kg²' },
  { symbol: 'e', value: '1.602 × 10⁻¹⁹', unit: 'C' },
  { symbol: 'ε₀', value: '8.854 × 10⁻¹²', unit: 'F/m' },
  { symbol: 'h', value: '6.626 × 10⁻³⁴', unit: 'J·s' },
  { symbol: 'k_B', value: '1.381 × 10⁻²³', unit: 'J/K' },
];

export interface PhysicsFormulaMeta {
  id: string;
  topic: 'mechanics' | 'electricity' | 'optics' | 'waves' | 'thermo';
  formula: string;
  variableSymbols: { symbol: string; unit: string }[];
}

export const FORMULAS: PhysicsFormulaMeta[] = [
  {
    id: 'pendulum_period',
    topic: 'mechanics',
    formula: 'T = 2π √(L / g)',
    variableSymbols: [{ symbol: 'T', unit: 's' }, { symbol: 'L', unit: 'm' }, { symbol: 'g', unit: 'm/s²' }],
  },
  {
    id: 'projectile_range',
    topic: 'mechanics',
    formula: 'R = (v₀² · sin(2θ)) / g',
    variableSymbols: [{ symbol: 'R', unit: 'm' }, { symbol: 'v₀', unit: 'm/s' }, { symbol: 'θ', unit: 'degrees (°)' }, { symbol: 'g', unit: 'm/s²' }],
  },
  {
    id: 'projectile_height',
    topic: 'mechanics',
    formula: 'H = (v₀ · sin θ)² / (2g)',
    variableSymbols: [{ symbol: 'H', unit: 'm' }, { symbol: 'v₀', unit: 'm/s' }, { symbol: 'θ', unit: 'degrees (°)' }, { symbol: 'g', unit: 'm/s²' }],
  },
  {
    id: 'ohms_law',
    topic: 'electricity',
    formula: 'V = I · R',
    variableSymbols: [{ symbol: 'V', unit: 'V (Volt)' }, { symbol: 'I', unit: 'A (Ampere)' }, { symbol: 'R', unit: 'Ω (Ohm)' }],
  },
  {
    id: 'electric_power',
    topic: 'electricity',
    formula: 'P = V · I = I² · R = V² / R',
    variableSymbols: [{ symbol: 'P', unit: 'W (Watt)' }, { symbol: 'V', unit: 'V' }, { symbol: 'I', unit: 'A' }, { symbol: 'R', unit: 'Ω' }],
  },
  {
    id: 'snells_law',
    topic: 'optics',
    formula: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)',
    variableSymbols: [{ symbol: 'n₁', unit: 'dimensionless' }, { symbol: 'θ₁', unit: '°' }, { symbol: 'n₂', unit: 'dimensionless' }, { symbol: 'θ₂', unit: '°' }],
  },
  {
    id: 'critical_angle',
    topic: 'optics',
    formula: 'θ_c = arcsin(n₂ / n₁)',
    variableSymbols: [{ symbol: 'θ_c', unit: '°' }, { symbol: 'n₁', unit: 'dimensionless' }, { symbol: 'n₂', unit: 'dimensionless' }],
  },
  {
    id: 'young_double_slit',
    topic: 'waves',
    formula: 'y_m = (m · λ · L) / d',
    variableSymbols: [{ symbol: 'y_m', unit: 'm' }, { symbol: 'λ', unit: 'm / nm' }, { symbol: 'L', unit: 'm' }, { symbol: 'd', unit: 'm / mm' }, { symbol: 'm', unit: 'integer' }],
  },
  {
    id: 'kinetic_energy',
    topic: 'mechanics',
    formula: 'E_k = ½ · m · v²',
    variableSymbols: [{ symbol: 'E_k', unit: 'J (Joule)' }, { symbol: 'm', unit: 'kg' }, { symbol: 'v', unit: 'm/s' }],
  },
  {
    id: 'potential_energy',
    topic: 'mechanics',
    formula: 'E_p = m · g · h',
    variableSymbols: [{ symbol: 'E_p', unit: 'J' }, { symbol: 'm', unit: 'kg' }, { symbol: 'g', unit: 'm/s²' }, { symbol: 'h', unit: 'm' }],
  },
  {
    id: 'hookes_law',
    topic: 'mechanics',
    formula: 'F = -k · x',
    variableSymbols: [{ symbol: 'F', unit: 'N' }, { symbol: 'k', unit: 'N/m' }, { symbol: 'x', unit: 'm' }],
  },
  {
    id: 'spring_oscillator_period',
    topic: 'mechanics',
    formula: 'T = 2π √(m / k)',
    variableSymbols: [{ symbol: 'T', unit: 's' }, { symbol: 'm', unit: 'kg' }, { symbol: 'k', unit: 'N/m' }],
  },
  {
    id: 'archimedes_buoyancy',
    topic: 'mechanics',
    formula: 'F_b = ρ_fluid · V_sub · g',
    variableSymbols: [{ symbol: 'F_b', unit: 'N' }, { symbol: 'ρ_fluid', unit: 'kg/m³' }, { symbol: 'V_sub', unit: 'm³' }, { symbol: 'g', unit: 'm/s²' }],
  },
  {
    id: 'momentum_conservation',
    topic: 'mechanics',
    formula: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'',
    variableSymbols: [{ symbol: 'm₁', unit: 'kg' }, { symbol: 'v₁', unit: 'm/s' }, { symbol: 'm₂', unit: 'kg' }, { symbol: 'v₂', unit: 'm/s' }],
  },
  {
    id: 'ideal_gas_law',
    topic: 'thermo',
    formula: 'P · V = n · R · T',
    variableSymbols: [{ symbol: 'P', unit: 'Pa / kPa' }, { symbol: 'V', unit: 'm³ / L' }, { symbol: 'n', unit: 'mol' }, { symbol: 'R', unit: 'J/(mol·K)' }, { symbol: 'T', unit: 'K (Kelvin)' }],
  },
  {
    id: 'arc_length_radian',
    topic: 'mechanics',
    formula: 's = r · θ',
    variableSymbols: [{ symbol: 's', unit: 'm' }, { symbol: 'r', unit: 'm' }, { symbol: 'θ', unit: 'rad' }],
  },
  {
    id: 'rotational_inertia_torque',
    topic: 'mechanics',
    formula: 'τ = I · α',
    variableSymbols: [{ symbol: 'τ', unit: 'N·m' }, { symbol: 'I', unit: 'kg·m²' }, { symbol: 'α', unit: 'rad/s²' }],
  },
  {
    id: 'center_of_mass_formula',
    topic: 'mechanics',
    formula: 'X_cm = (Σ m_i · x_i) / (Σ m_i)',
    variableSymbols: [{ symbol: 'X_cm', unit: 'm' }, { symbol: 'm_i', unit: 'kg' }, { symbol: 'x_i', unit: 'm' }],
  },
  {
    id: 'acoustic_pipe_resonance',
    topic: 'waves',
    formula: 'L = (2n - 1) · (λ / 4)',
    variableSymbols: [{ symbol: 'L', unit: 'm' }, { symbol: 'n', unit: 'integer' }, { symbol: 'λ', unit: 'm' }, { symbol: 'v', unit: 'm/s' }],
  },
  {
    id: 'sound_speed_formula',
    topic: 'waves',
    formula: 'v = 4 · (L + 0.6·r) · f',
    variableSymbols: [{ symbol: 'v', unit: 'm/s' }, { symbol: 'L', unit: 'm' }, { symbol: 'f', unit: 'Hz' }],
  },
  {
    id: 'solenoid_magnetic_field',
    topic: 'electricity',
    formula: 'B = μ₀ · n · I  و  F = I · L · B · sin(θ)',
    variableSymbols: [{ symbol: 'B', unit: 'T (Tesla)' }, { symbol: 'μ₀', unit: 'T·m/A' }, { symbol: 'n', unit: 'm⁻¹' }, { symbol: 'I', unit: 'A' }, { symbol: 'F', unit: 'N' }],
  },
  {
    id: 'atomic_energy_quantum',
    topic: 'optics',
    formula: 'ΔE = h · f = (h · c) / λ',
    variableSymbols: [{ symbol: 'ΔE', unit: 'J / eV' }, { symbol: 'h', unit: 'J·s' }, { symbol: 'f', unit: 'Hz' }, { symbol: 'λ', unit: 'nm' }],
  },
  {
    id: 'metric_prefixes_scaling',
    topic: 'mechanics',
    formula: 'V_target = V_source · 10^(exp_source - exp_target)',
    variableSymbols: [{ symbol: 'V_source', unit: 'SI unit' }, { symbol: 'V_target', unit: 'SI unit' }, { symbol: 'exp', unit: 'power' }],
  },
  {
    id: 'stress_strain_young',
    topic: 'mechanics',
    formula: 'σ = F / A ,  ε = ΔL / L₀ ,  E = σ / ε',
    variableSymbols: [{ symbol: 'σ', unit: 'Pa / MPa' }, { symbol: 'ε', unit: 'ratio' }, { symbol: 'E', unit: 'GPa' }, { symbol: 'F', unit: 'N' }, { symbol: 'A', unit: 'm²' }],
  },
  {
    id: 'bernoulli_principle',
    topic: 'mechanics',
    formula: 'P₁ + ½ρv₁² = P₂ + ½ρv₂²  (A₁v₁ = A₂v₂)',
    variableSymbols: [{ symbol: 'P', unit: 'Pa / kPa' }, { symbol: 'v', unit: 'm/s' }, { symbol: 'ρ', unit: 'kg/m³' }, { symbol: 'A', unit: 'm²' }],
  },
  {
    id: 'angled_mirrors_images',
    topic: 'optics',
    formula: 'N = (360° / θ) - 1',
    variableSymbols: [{ symbol: 'N', unit: 'images' }, { symbol: 'θ', unit: 'degrees (°)' }],
  },
  {
    id: 'curved_mirrors_formula',
    topic: 'optics',
    formula: '1/f = 1/d_o + 1/d_i ,  f = R / 2 ,  m = -d_i / d_o',
    variableSymbols: [{ symbol: 'f', unit: 'cm' }, { symbol: 'd_o', unit: 'cm' }, { symbol: 'd_i', unit: 'cm' }, { symbol: 'm', unit: 'ratio' }],
  },
  {
    id: 'thin_lenses_formula',
    topic: 'optics',
    formula: '1/f = 1/d_o + 1/d_i ,  P = 1 / f(m) = 100 / f(cm)',
    variableSymbols: [{ symbol: 'f', unit: 'cm' }, { symbol: 'P', unit: 'D (Diopters)' }, { symbol: 'd_o', unit: 'cm' }, { symbol: 'd_i', unit: 'cm' }],
  },
  {
    id: 'malus_law_polarization',
    topic: 'optics',
    formula: 'I = I_initial · cos²(θ) ,  E = E₀ · cos(θ)',
    variableSymbols: [{ symbol: 'I', unit: 'W/m²' }, { symbol: 'I_initial', unit: 'W/m²' }, { symbol: 'θ', unit: 'degrees (°)' }],
  },
  {
    id: 'rayleigh_scattering_law',
    topic: 'optics',
    formula: 'I_scatter ∝ 1 / λ⁴ ,  T = e^(-τ)',
    variableSymbols: [{ symbol: 'I_scatter', unit: 'proportional' }, { symbol: 'λ', unit: 'nm' }, { symbol: 'T', unit: 'ratio' }],
  },
  {
    id: 'work_heat_first_law',
    topic: 'mechanics',
    formula: 'Q = m · c · ΔT ,  W = F · d ,  ΔU = Q - W',
    variableSymbols: [{ symbol: 'Q', unit: 'J / kJ' }, { symbol: 'W', unit: 'J / kJ' }, { symbol: 'c', unit: 'J/(kg·K)' }, { symbol: 'ΔT', unit: '°C' }],
  },
  {
    id: 'prescription_glasses_power',
    topic: 'optics',
    formula: 'P = 1 / f (in meters) ,  1/f = 1/d_o + 1/d_i',
    variableSymbols: [{ symbol: 'P', unit: 'Diopters (D)' }, { symbol: 'f', unit: 'm / cm' }, { symbol: 'd_i', unit: 'cm' }],
  },
  {
    id: 'periscope_law_reflection',
    topic: 'optics',
    formula: 'θ_incident = θ_reflected = 45° ,  Δθ_total = 90° + 90° = 180°',
    variableSymbols: [{ symbol: 'θ_i', unit: '° (deg)' }, { symbol: 'θ_r', unit: '° (deg)' }],
  },
  {
    id: 'coulomb_static_balloons',
    topic: 'electricity',
    formula: 'F_e = k · |q₁ · q₂| / r² ,  tan(θ) = F_e / (m · g)',
    variableSymbols: [{ symbol: 'F_e', unit: 'N' }, { symbol: 'k', unit: 'N·m²/C²' }, { symbol: 'q', unit: 'μC / C' }, { symbol: 'r', unit: 'm' }],
  },
  {
    id: 'sled_friction_mechanics',
    topic: 'mechanics',
    formula: 'f_s,max = μ_s · N ,  f_k = μ_k · N ,  F_net = m · a',
    variableSymbols: [{ symbol: 'f_s', unit: 'N' }, { symbol: 'f_k', unit: 'N' }, { symbol: 'μ', unit: 'ratio' }, { symbol: 'N', unit: 'N' }],
  },
  {
    id: 'fourier_heat_conduction',
    topic: 'mechanics',
    formula: 'Q / t = k · A · (T_hot - T_cold) / d',
    variableSymbols: [{ symbol: 'Q/t', unit: 'Watts (W)' }, { symbol: 'k', unit: 'W/(m·K)' }, { symbol: 'A', unit: 'm²' }, { symbol: 'd', unit: 'm' }],
  },
  {
    id: 'seesaw_rotational_torque',
    topic: 'mechanics',
    formula: 'τ = F · r = m · g · r ,  Στ = τ₁ - τ₂ = 0',
    variableSymbols: [{ symbol: 'τ', unit: 'N·m' }, { symbol: 'r', unit: 'm' }, { symbol: 'm', unit: 'kg' }],
  },
  {
    id: 'faraday_lenz_induction',
    topic: 'electricity',
    formula: 'ε = -N · (ΔΦ_B / Δt) ,  I = ε / R',
    variableSymbols: [{ symbol: 'ε', unit: 'Volts (V)' }, { symbol: 'N', unit: 'turns' }, { symbol: 'Φ_B', unit: 'Weber (Wb)' }, { symbol: 'I', unit: 'A / mA' }],
  },
  {
    id: 'stokes_viscosity_terminal_vel',
    topic: 'mechanics',
    formula: 'F_d = 6π · η · r · v ,  v_t = [2r²g(ρ_s - ρ_f)] / (9η)',
    variableSymbols: [{ symbol: 'F_d', unit: 'N' }, { symbol: 'η', unit: 'Pa·s' }, { symbol: 'v_t', unit: 'm/s / cm/s' }, { symbol: 'r', unit: 'mm / m' }],
  },
  {
    id: 'inclined_plane_simple_machine',
    topic: 'mechanics',
    formula: 'IMA = L / h ,  AMA = F_load / F_effort ,  η = (W_out / W_in) · 100%',
    variableSymbols: [{ symbol: 'IMA', unit: 'ratio' }, { symbol: 'AMA', unit: 'ratio' }, { symbol: 'η', unit: '%' }, { symbol: 'W_out', unit: 'J' }],
  },
];

export interface QuizMeta {
  id: string;
  experiment: string;
  correctIndex: number;
}

export const QUIZ_QUESTIONS: QuizMeta[] = [
  { id: 'q1', experiment: 'pendulum', correctIndex: 2 },
  { id: 'q2', experiment: 'projectile', correctIndex: 1 },
  { id: 'q3', experiment: 'circuits', correctIndex: 2 },
  { id: 'q4', experiment: 'optics', correctIndex: 1 },
  { id: 'q5', experiment: 'freefall', correctIndex: 2 },
  { id: 'q6', experiment: 'waves', correctIndex: 1 },
  { id: 'q7', experiment: 'spring', correctIndex: 1 },
  { id: 'q8', experiment: 'buoyancy', correctIndex: 1 },
  { id: 'q9', experiment: 'collision', correctIndex: 2 },
  { id: 'q10', experiment: 'thermodynamics', correctIndex: 1 },
];
