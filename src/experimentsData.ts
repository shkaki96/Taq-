/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Experiment catalog data — language-independent.
// All titles/inputs/outputs now live in public/locales/{lng}/translation.json
// under catalog.<expKey>.{title,inputs,outputs}. Look them up with:
//   t(`catalog.${exp.expKey}.title`)
//
// NOTE: experiment #52 originally shared expKey 'rotational_dynamics' with #20,
// which meant the two catalog entries collided (one silently overwrote the
// other whenever code looked an experiment up by expKey). It has been renamed
// here to 'rotational_dynamics_torque'. Update any direct string reference to
// the old key (e.g. in activeExperimentKey checks / sim component routing).

import type { ReactNode } from 'react';
import type { CategoryFilter } from './App';
import type { ExperimentType } from './types';

export interface ExperimentMeta {
  id: number;
  expKey: ExperimentType;
  category: CategoryFilter;
  physical_law: string;
}

export const experimentsList: ExperimentMeta[] = [
  {
    id: 1,
    expKey: 'work_heat',
    category: 'fluids_thermo_optics',
    physical_law: 'ΔU = Q - W',
  },
  {
    id: 2,
    expKey: 'prescription_glasses',
    category: 'fluids_thermo_optics',
    physical_law: 'P = 1/f',
  },
  {
    id: 3,
    expKey: 'periscope',
    category: 'fluids_thermo_optics',
    physical_law: 'θ_i = θ_r',
  },
  {
    id: 4,
    expKey: 'static_balloons',
    category: 'em_atomic',
    physical_law: 'F = k_e · |q₁·q₂| / r²',
  },
  {
    id: 5,
    expKey: 'sled_friction',
    category: 'mechanics',
    physical_law: 'f_k = μ_k · N',
  },
  {
    id: 6,
    expKey: 'heat_conduction',
    category: 'fluids_thermo_optics',
    physical_law: 'q = -k · A · (ΔT / L)',
  },
  {
    id: 7,
    expKey: 'seesaw_torque',
    category: 'mechanics',
    physical_law: 'τ = r · F · sin(θ),  Στ = 0',
  },
  {
    id: 8,
    expKey: 'electromagnetic_induction',
    category: 'em_atomic',
    physical_law: 'ε = -N · (ΔΦ / Δt)',
  },
  {
    id: 9,
    expKey: 'viscosity_stokes',
    category: 'fluids_thermo_optics',
    physical_law: 'F_d = 6π · η · r · v_t',
  },
  {
    id: 10,
    expKey: 'ramp_machine',
    category: 'mechanics',
    physical_law: 'MA = 1 / sin(θ) = L / h',
  },
  {
    id: 11,
    expKey: 'metric_prefixes',
    category: 'mechanics',
    physical_law: 'Value × 10^{\\\\pm n}',
  },
  {
    id: 12,
    expKey: 'stress_strain',
    category: 'mechanics',
    physical_law: 'E = σ / ε = (F/A) / (ΔL/L₀)',
  },
  {
    id: 13,
    expKey: 'bernoulli',
    category: 'fluids_thermo_optics',
    physical_law: 'P + ½ρv² + ρgh = Const',
  },
  {
    id: 14,
    expKey: 'angled_mirrors',
    category: 'fluids_thermo_optics',
    physical_law: 'N = (360° / θ) - 1',
  },
  {
    id: 15,
    expKey: 'curved_mirrors',
    category: 'fluids_thermo_optics',
    physical_law: '1/f = 1/d_o + 1/d_i',
  },
  {
    id: 16,
    expKey: 'thin_lenses',
    category: 'fluids_thermo_optics',
    physical_law: '1/f = 1/d_o + 1/d_i,  M = -d_i/d_o',
  },
  {
    id: 17,
    expKey: 'polarization',
    category: 'fluids_thermo_optics',
    physical_law: 'I = I₀ · cos²(θ)',
  },
  {
    id: 18,
    expKey: 'light_scattering',
    category: 'fluids_thermo_optics',
    physical_law: 'I ∝ 1 / λ⁴',
  },
  {
    id: 19,
    expKey: 'arc_length',
    category: 'mechanics',
    physical_law: 's = r · θ,  v = r · ω',
  },
  {
    id: 20,
    expKey: 'rotational_dynamics',
    category: 'mechanics',
    physical_law: 'τ = I · α',
  },
  {
    id: 21,
    expKey: 'center_of_mass',
    category: 'mechanics',
    physical_law: 'X_cm = Σ(m_i · x_i) / Σm_i',
  },
  {
    id: 22,
    expKey: 'pendulum_energy',
    category: 'mechanics',
    physical_law: 'E_tot = K + U = ½mv² + mgh = Const',
  },
  {
    id: 23,
    expKey: 'pendulum',
    category: 'mechanics',
    physical_law: 'T = 2π · √(L / g)',
  },
  {
    id: 24,
    expKey: 'projectile',
    category: 'mechanics',
    physical_law: 'R = (v₀² · sin(2θ)) / g,  H = (v₀² sin²θ) / 2g',
  },
  {
    id: 25,
    expKey: 'spring',
    category: 'mechanics',
    physical_law: 'F = -k · x,  T = 2π · √(m / k)',
  },
  {
    id: 26,
    expKey: 'collision',
    category: 'mechanics',
    physical_law: 'm₁·v₁ᵢ + m₂·v₂ᵢ = m₁·v₁_f + m₂·v₂_f',
  },
  {
    id: 27,
    expKey: 'freefall',
    category: 'mechanics',
    physical_law: 'v = g · t,  y = ½ · g · t²',
  },
  {
    id: 28,
    expKey: 'acoustic_resonance',
    category: 'waves_sound',
    physical_law: 'f_n = (n · v) / (4L)  (Closed)  |  (n · v) / (2L)  (Open)',
  },
  {
    id: 29,
    expKey: 'sound_speed',
    category: 'waves_sound',
    physical_law: 'v = f · λ = 2f · (L₂ - L₁)',
  },
  {
    id: 30,
    expKey: 'waves',
    category: 'waves_sound',
    physical_law: 'd · sin(θ) = m · λ,  y_m = (m · λ · L) / d',
  },
  {
    id: 31,
    expKey: 'magnetic_field',
    category: 'em_atomic',
    physical_law: 'F = q · v · B · sin(θ),  r = (m·v) / (q·B)',
  },
  {
    id: 32,
    expKey: 'atomic_spectra',
    category: 'em_atomic',
    physical_law: 'ΔE = E_final - E_initial = (h · c) / λ',
  },
  {
    id: 33,
    expKey: 'circuits',
    category: 'em_atomic',
    physical_law: 'V = I · R,  P = V · I = I² · R',
  },
  {
    id: 34,
    expKey: 'buoyancy',
    category: 'fluids_thermo_optics',
    physical_law: 'F_B = ρ_fluid · V_disp · g',
  },
  {
    id: 35,
    expKey: 'thermodynamics',
    category: 'fluids_thermo_optics',
    physical_law: 'P · V = n · R · T',
  },
  {
    id: 36,
    expKey: 'optics',
    category: 'fluids_thermo_optics',
    physical_law: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)',
  },
  {
    id: 37,
    expKey: 'build_atom',
    category: 'em_atomic',
    physical_law: 'Z = p,  A = p + n,  Net Charge = p - e',
  },
  {
    id: 38,
    expKey: 'build_nucleus',
    category: 'em_atomic',
    physical_law: 'E_b = Δm · c²',
  },
  {
    id: 39,
    expKey: 'rutherford_scattering',
    category: 'em_atomic',
    physical_law: 'F = (k · q_α · q_nucleus) / r²',
  },
  {
    id: 40,
    expKey: 'molecules_and_light',
    category: 'em_atomic',
    physical_law: 'E = h · f,  E_rot < E_vib < E_elec',
  },
  {
    id: 41,
    expKey: 'color_vision',
    category: 'fluids_thermo_optics',
    physical_law: 'Color = R(λ) + G(λ) + B(λ)',
  },
  {
    id: 42,
    expKey: 'capacitor_lab',
    category: 'em_atomic',
    physical_law: 'C = (ε · A) / d,  Q = C · V,  U = ½ · C · V²',
  },
  {
    id: 43,
    expKey: 'charges_and_fields',
    category: 'em_atomic',
    physical_law: 'E = (k · Q) / r²,  V = (k · Q) / r',
  },
  {
    id: 44,
    expKey: 'resistance_in_wire',
    category: 'em_atomic',
    physical_law: 'R = (ρ · L) / A',
  },
  {
    id: 45,
    expKey: 'gravity_and_orbits',
    category: 'gravity_astrophysics',
    physical_law: 'F = (G · M · m) / r²,  v_orb = √(G·M / r)',
  },
  {
    id: 46,
    expKey: 'keplers_laws',
    category: 'gravity_astrophysics',
    physical_law: 'T² / a³ = (4π²) / (G · M)',
  },
  {
    id: 47,
    expKey: 'energy_skate_park',
    category: 'mechanics',
    physical_law: 'E_mech = K + U_g + E_thermal',
  },
  {
    id: 48,
    expKey: 'fourier_making_waves',
    category: 'waves_sound',
    physical_law: 'f(x) = Σ [A_n · sin(n·ω·t)]',
  },
  {
    id: 49,
    expKey: 'wave_on_a_string',
    category: 'waves_sound',
    physical_law: 'v = √(T / μ),  y(x,t) = A · sin(kx - ωt)',
  },
  {
    id: 50,
    expKey: 'states_of_matter',
    category: 'fluids_thermo_optics',
    physical_law: 'Q = m · c · ΔT,  Q = m · L',
  },
  {
    id: 51,
    expKey: 'gas_diffusion',
    category: 'fluids_thermo_optics',
    physical_law: 'r₁ / r₂ = √(M₂ / M₁)',
  },
  {
    id: 52,
    expKey: 'rotational_dynamics_torque',
    category: 'mechanics',
    physical_law: 'Στ = I · α,  L = I · ω',
  },
  {
    id: 53,
    expKey: 'models_h_atom',
    category: 'em_atomic',
    physical_law: 'E_n = -13.6 / n² eV,  ΔE = 13.6 · (1/n₁² - 1/n₂²)',
  },
  {
    id: 54,
    expKey: 'circuit_construction_kit',
    category: 'em_atomic',
    physical_law: 'Σ I_in = Σ I_out (KCL),  Σ V_loop = 0 (KVL)',
  },
  {
    id: 55,
    expKey: 'generator',
    category: 'em_atomic',
    physical_law: 'ε = -N · (ΔΦ / Δt) = N · B · A · ω · sin(ωt)',
  },
  {
    id: 56,
    expKey: 'magnet_compass',
    category: 'em_atomic',
    physical_law: 'tan(θ) = B_ext / B_earth',
  },
  {
    id: 57,
    expKey: 'magnets_electromagnets',
    category: 'em_atomic',
    physical_law: 'B = μ₀ · μ_r · n · I',
  },
  {
    id: 58,
    expKey: 'gravity_force_lab',
    category: 'gravity_astrophysics',
    physical_law: 'F = G · (m₁ · m₂) / r²  (قانون الجذب العام لنيوتن)',
  },
  {
    id: 59,
    expKey: 'solar_system',
    category: 'gravity_astrophysics',
    physical_law: 'ميكانيكا الأجسام المتعددة: d²r_i/dt² = Σ G · m_j · (r_j - r_i) / |r_j - r_i|³',
  },
  {
    id: 60,
    expKey: 'energy_forms',
    category: 'fluids_thermo_optics',
    physical_law: 'E_in = E_stored + E_out',
  },
  {
    id: 61,
    expKey: 'normal_modes',
    category: 'waves_sound',
    physical_law: 'f_n = (n · v) / (2L) = (n / 2L) · √(T / μ)',
  },
  {
    id: 62,
    expKey: 'forces_motion',
    category: 'mechanics',
    physical_law: 'قانون نيوتن الثاني: F_net = Σ F = m · a',
  },
  {
    id: 63,
    expKey: 'gas_properties',
    category: 'fluids_thermo_optics',
    physical_law: 'P · V = N · k_B · T = n · R · T,  <E_k> = (3/2) · k_B · T',
  },
  {
    id: 64,
    expKey: 'diffusion',
    category: 'fluids_thermo_optics',
    physical_law: 'J = -D · (dC / dx)',
  },
  {
    id: 65,
    expKey: 'blackbody_spectrum',
    category: 'fluids_thermo_optics',
    physical_law: 'λ_max · T = b = 2.898 × 10⁻³ m·K,  E = h · f,  I = σ · T⁴',
  },
  {
    id: 66,
    expKey: 'doppler_effect',
    category: 'waves_sound',
    physical_law: 'f\' = f · (v ± vₒ) / (v ∓ vₛ),  λ\' = (v ∓ vₛ) / f,  M = vₛ / v',
  },
  {
    id: 67,
    expKey: 'electrical_transformer',
    category: 'em_atomic',
    physical_law: 'Vₛ / Vₚ = Nₛ / Nₚ,  Vₚ · Iₚ · η = Vₛ · Iₛ',
  },
  {
    id: 68,
    expKey: 'photoelectric_effect',
    category: 'em_atomic',
    physical_law: 'E_k = h · f - Φ,  e · V_stop = K_max,  λ₀ = h · c / Φ',
  },
  {
    id: 69,
    expKey: 'radioactive_decay',
    category: 'em_atomic',
    physical_law: 'N(t) = N₀ · (1/2)^(t / T₁/₂),  λ = ln(2) / T₁/₂',
  },
  {
    id: 70,
    expKey: 'calorimetry_equilibrium',
    category: 'fluids_thermo_optics',
    physical_law: 'Q_lost = Q_gained => m₁ · c₁ · (T₁ - T_f) = m₂ · c₂ · (T_f - T₂)',
  },
];
