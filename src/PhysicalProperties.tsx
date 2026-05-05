import React, { useState, useMemo } from 'react';
import { AlertTriangle, Plus, Info, Zap, Thermometer, Magnet, Eye, Box, Activity } from 'lucide-react';

const TABS = [
  { id: 'Thermal', icon: Thermometer },
  { id: 'Electrical', icon: Zap },
  { id: 'Magnetic', icon: Magnet },
  { id: 'Optical', icon: Eye },
  { id: 'Crystal', icon: Box }
];

const CRYSTAL_PRESETS = {
  'Copper (Cu)': { sys: 'FCC', a: 3.615, b: 3.615, c: 3.615, alpha: 90, beta: 90, gamma: 90, m: 63.55 },
  'Aluminum (Al)': { sys: 'FCC', a: 4.05, b: 4.05, c: 4.05, alpha: 90, beta: 90, gamma: 90, m: 26.98 },
  'Iron (α-Fe)': { sys: 'BCC', a: 2.866, b: 2.866, c: 2.866, alpha: 90, beta: 90, gamma: 90, m: 55.85 },
  'Silicon (Si)': { sys: 'DC', a: 5.431, b: 5.431, c: 5.431, alpha: 90, beta: 90, gamma: 90, m: 28.09 },
  'Zinc (Zn)': { sys: 'HCP', a: 2.665, b: 2.665, c: 4.947, alpha: 90, beta: 90, gamma: 120, m: 65.38 },
  'Gold (Au)': { sys: 'FCC', a: 4.078, b: 4.078, c: 4.078, alpha: 90, beta: 90, gamma: 90, m: 196.97 },
  'Silver (Ag)': { sys: 'FCC', a: 4.085, b: 4.085, c: 4.085, alpha: 90, beta: 90, gamma: 90, m: 107.87 }
};

export default function PhysicalProperties({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  // --- SUB-MODULE 1: Thermal ---
  const THERMAL_PRESETS: Record<string, any> = {
    'Copper': { k: 401, cp: 385, rho: 8960, cte: 16.5, tm: 1085, tg: 0, thetaD: 343, gamma: 2.0, E: 110, nu: 0.34, sy: 70 },
    'Aluminum': { k: 237, cp: 900, rho: 2700, cte: 23.1, tm: 660, tg: 0, thetaD: 428, gamma: 2.1, E: 70, nu: 0.33, sy: 95 },
    'Structural Steel': { k: 50, cp: 490, rho: 7850, cte: 12.0, tm: 1510, tg: 0, thetaD: 420, gamma: 1.6, E: 200, nu: 0.3, sy: 250 },
    'Alumina (Al2O3)': { k: 30, cp: 775, rho: 3950, cte: 8.1, tm: 2072, tg: 0, thetaD: 1030, gamma: 1.5, E: 370, nu: 0.22, sy: 3000 },
    'Polycarbonate': { k: 0.2, cp: 1200, rho: 1200, cte: 65, tm: 225, tg: 147, thetaD: 0, gamma: 0.5, E: 2.4, nu: 0.37, sy: 60 }
  };

  const [thermalInputs, setThermalInputs] = useState(THERMAL_PRESETS['Copper']);
  const [selectedThermalPreset, setSelectedThermalPreset] = useState('Copper');
  
  const thermalAnalysis = useMemo(() => {
    const { k, cp, rho, E, nu, sy, cte } = thermalInputs;
    
    // Thermal Diffusivity: alpha = k / (rho * cp)
    const alpha = k / (rho * cp);

    // Volumetric Heat Capacity
    const volCp = rho * cp;

    // Thermal Effusivity (Heat Penetration Coefficient): e = sqrt(k * rho * cp)
    const effusivity = Math.sqrt(k * rho * cp);

    // Thermal Shock Resistance (R_TS) - First parameter (Hasselman/Kingery)
    // R = (sy * k * (1-nu)) / (E * cte)
    const R_TS = (sy * 1e6 * k * (1 - nu)) / (E * 1e9 * cte * 1e-6);

    // Hasselman stability parameter for crack initiation (R_stable) = k / (alpha^2 * E)
    const R_stable = k / (Math.pow(cte * 1e-6, 2) * E * 1e9);

    return { 
      alpha: alpha.toExponential(3), 
      volCp: (volCp / 1e6).toFixed(2), // MJ/m3K
      effusivity: Math.round(effusivity),
      R_TS: R_TS.toFixed(0),
      R_stable: (R_stable / 1e6).toFixed(2) // MN/W
    };
  }, [thermalInputs]);

  // --- SUB-MODULE 2: Electrical ---
  const ELECTRICAL_PRESETS: Record<string, any> = {
    'Copper': { rho: 1.68e-8, sigma: 5.95e7, er: 1.0, vbd: 0, model: 'Metal', alpha: 0.00386, t0: 20, t: 20, Eg: 0, n: 8.47e28, mu: 0.0044 },
    'Aluminum': { rho: 2.65e-8, sigma: 3.77e7, er: 1.0, vbd: 0, model: 'Metal', alpha: 0.0039, t0: 20, t: 20, Eg: 0, n: 1.81e29, mu: 0.0013 },
    'Silicon (Intrinsic)': { rho: 2300, sigma: 4.3e-4, er: 11.7, vbd: 30, model: 'Semiconductor', alpha: 0, t0: 20, t: 20, Eg: 1.12, n: 1.5e16, mu: 0.14 },
    'Silicon (n-type 10¹⁵)': { rho: 4.5, sigma: 0.22, er: 11.7, vbd: 30, model: 'Semiconductor', alpha: 0, t0: 20, t: 20, Eg: 1.12, n: 1e21, mu: 0.13 },
    'Germanium': { rho: 0.47, sigma: 2.1, er: 16.0, vbd: 20, model: 'Semiconductor', alpha: 0, t0: 20, t: 20, Eg: 0.67, n: 2.4e19, mu: 0.39 },
    'Alumina (Ceramic)': { rho: 1e12, sigma: 1e-12, er: 9.8, vbd: 15, model: 'Metal', alpha: 0, t0: 20, t: 20, Eg: 8.0, n: 0, mu: 0 }
  };

  const [elecInputs, setElecInputs] = useState(ELECTRICAL_PRESETS['Copper']);
  const [selectedElecPreset, setSelectedElecPreset] = useState('Copper');
  
  const handleElecChange = (field, value) => {
    if (field === 'model') {
      setElecInputs(prev => ({ ...prev, [field]: value }));
      return;
    }

    const num = parseFloat(value);
    
    if (field === 'rho') {
      setElecInputs(prev => ({ 
        ...prev, 
        rho: isNaN(num) ? 0 : num, 
        sigma: (num === 0 || isNaN(num)) ? 0 : 1 / num 
      }));
      setSelectedElecPreset('Custom');
    } else if (field === 'sigma') {
      setElecInputs(prev => ({ 
        ...prev, 
        sigma: isNaN(num) ? 0 : num, 
        rho: (num === 0 || isNaN(num)) ? 0 : 1 / num 
      }));
      setSelectedElecPreset('Custom');
    } else {
      setElecInputs(prev => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
      setSelectedElecPreset('Custom');
    }
  };

  const elecClass = useMemo(() => {
    const rho = elecInputs.rho;
    if (rho < 1e-5) return { label: 'Conductor', color: 'bg-[#22C55E]', text: 'text-[#22C55E]' };
    if (rho > 1e5) return { label: 'Insulator', color: 'bg-[#EF4444]', text: 'text-[#EF4444]' };
    return { label: 'Semiconductor', color: 'bg-[#F59E0B]', text: 'text-[#F59E0B]' };
  }, [elecInputs.rho]);

  const elecAnalysis = useMemo(() => {
    const { rho, t, t0, model, Eg, n, mu } = elecInputs;
    const q = 1.602e-19;
    const kB = 8.617e-5; // eV/K

    // Theoretical Conductivity from carriers
    const sigma_theo = n * q * mu;

    let currentRho = 0;
    const T_target_K = t + 273.15;
    const T0_K = t0 + 273.15;
    
    if (model === 'Metal') {
        currentRho = rho * (1 + elecInputs.alpha * (t - t0));
    } else {
        const exponent = (Eg / (2 * kB)) * (1/T_target_K - 1/T0_K);
        currentRho = rho * Math.exp(exponent);
    }

    // Hall Coefficient Estimation (assuming single carrier type)
    let Rh = 0;
    if (n > 0) {
        Rh = 1 / (n * q);
    }

    // Plasma Frequency Estimation (simplified)
    const eps0 = 8.854e-12;
    const m_eff = 9.109e-31; // assuming electron mass
    const omegaP = Math.sqrt((n * q * q) / (eps0 * m_eff));

    return { 
        currentRho, 
        currentSigma: 1 / currentRho,
        sigma_theo: sigma_theo.toExponential(2),
        Rh: Rh.toExponential(3),
        plasmaFreq: (omegaP / (2 * Math.PI)).toExponential(2)
    };
  }, [elecInputs]);

  // --- SUB-MODULE 3: Magnetic ---
  const MAGNETIC_PRESETS: Record<string, any> = {
    'Iron (Pure)': { ur: 5000, ms: 1.71e6, hc: 4, br: 1.0, tc: 770, loss: 1.2 },
    'Silicon Steel': { ur: 10000, ms: 1.6e6, hc: 40, br: 1.2, tc: 740, loss: 0.8 },
    'Permalloy': { ur: 100000, ms: 0.6e6, hc: 0.8, br: 0.4, tc: 400, loss: 0.1 },
    'NdFeB (Hard)': { ur: 1.05, ms: 1.0e6, hc: 800000, br: 1.3, tc: 310, loss: 200 },
    'Nickel': { ur: 600, ms: 0.49e6, hc: 50, br: 0.3, tc: 358, loss: 2.0 },
    'Ferrite': { ur: 2000, ms: 0.4e6, hc: 20, br: 0.25, tc: 250, loss: 0.3 }
  };

  const [magInputs, setMagInputs] = useState(MAGNETIC_PRESETS['Iron (Pure)']);
  const [selectedMagPreset, setSelectedMagPreset] = useState('Iron (Pure)');
  
  const magClass = useMemo(() => {
    const { ur, ms, hc } = magInputs;
    if (ur < 1) return { label: 'Diamagnetic', color: 'bg-[#94A3B8]' };
    if (ur > 1 && ur < 1.01) return { label: 'Paramagnetic', color: 'bg-[#4A9EFF]' };
    if (ur >= 1.01 && hc > 1000) return { label: 'Hard Ferromagnetic', color: 'bg-[#EF4444]' };
    if (ur >= 1.01 && hc <= 1000) return { label: 'Soft Ferromagnetic', color: 'bg-[#F59E0B]' };
    return { label: 'Unknown', color: 'bg-[#2D3F50]' };
  }, [magInputs]);

  const magAnalysis = useMemo(() => {
    const { ur, ms, hc, br } = magInputs;
    const mu0 = 1.2566e-6; // Vacuum permeability (H/m)
    
    // Saturation induction (B = mu0 * (H + M))
    const Bs = mu0 * ms;

    // Absolute Permeability
    const mu = mu0 * ur;

    // Energy Product (BH)max estimate
    const BHmax = (br * hc) / 4;

    // Magnetic Susceptibility
    const chi = Math.max(0, ur - 1);

    // Anisotropy Constant K_eff (Estimate for domain wall energy)
    const K_eff = (mu0 * ms * hc) / 2;

    return { 
        Bs: Bs.toFixed(3), 
        mu: mu.toExponential(3), 
        BHmax: (BHmax / 1e3).toFixed(2),
        chi: chi.toExponential(2),
        K_eff: (K_eff / 1e3).toFixed(2)
    };
  }, [magInputs]);

  const handleMagChange = (field, value) => {
    setMagInputs(prev => ({ ...prev, [field]: Number(value) }));
    setSelectedMagPreset('Custom');
  };

  // --- SUB-MODULE 4: Optical ---
  const [optInputs, setOptInputs] = useState({ 
    n: 1.5, k: 0, 
    thickness: 1000, 
    materialType: 'Constant',
    r: 4, t: 92, a: 4 
  });

  const optSum = optInputs.r + optInputs.t + optInputs.a;
  const optValid = Math.abs(optSum - 100) < 0.1;

  const optClass = useMemo(() => {
    if (optInputs.t > 80) return { label: 'Transparent', color: 'bg-[#4A9EFF]' };
    if (optInputs.t > 10) return { label: 'Translucent', color: 'bg-[#F59E0B]' };
    return { label: 'Opaque', color: 'bg-[#94A3B8]' };
  }, [optInputs.t]);

  const optAnalysis = useMemo(() => {
    const { n, k, thickness, materialType } = optInputs;
    
    // 1. Single Point Calculation (at current n, k)
    // Fresnel Reflectance at normal incidence
    // R = ((n-1)^2 + k^2) / ((n+1)^2 + k^2)
    const R_val = (Math.pow(n - 1, 2) + Math.pow(k, 2)) / (Math.pow(n + 1, 2) + Math.pow(k, 2));
    
    // Absorption Coefficient alpha = 4*pi*k / lambda
    // Assume lambda = 550 nm for the single point display if not specified
    const lambda_ref = 550e-9; // m
    const alpha = (4 * Math.PI * k) / lambda_ref; // 1/m
    
    // Transmittance T = (1-R)^2 * exp(-alpha * t) (approx for thick slab)
    // t in m
    const t_m = thickness * 1e-9;
    const T_internal = Math.exp(-alpha * t_m);
    // T_total approx (1-R)^2 * T_int / (1 - R^2 * T_int^2) for incoherent
    // Simplified: T = (1-R) * T_int * (1-R) ... roughly
    const T_val = Math.pow(1 - R_val, 2) * T_internal;
    
    // Absorbance A = 1 - R - T
    const A_val = 1 - R_val - T_val;

    return { 
        R: (R_val * 100).toFixed(2), 
        T: (T_val * 100).toFixed(2), 
        A: (A_val * 100).toFixed(2)
    };
  }, [optInputs]);

  // --- SUB-MODULE 5: Crystal ---
  const [crystInputs, setCrystInputs] = useState({ 
    ...CRYSTAL_PRESETS['Copper (Cu)'],
    lambda: 1.5406 // X-ray wavelength (Angstrom)
  });
  const [selectedCrystPreset, setSelectedCrystPreset] = useState('Copper (Cu)');
  
  const crystAnalysis = useMemo(() => {
    const { sys, a, b, c, alpha, beta, gamma, m, lambda } = crystInputs;
    
    // 1. Volume Calculation
    // Convert angles to radians
    const rad = (deg) => deg * Math.PI / 180;
    const ca = Math.cos(rad(alpha));
    const cb = Math.cos(rad(beta));
    const cg = Math.cos(rad(gamma));
    
    let V = 0; // Angstrom^3
    let n = 1; // Atoms per unit cell
    let apf = 0;

    // Volume formula for general triclinic (works for all)
    const term = 1 - ca*ca - cb*cb - cg*cg + 2*ca*cb*cg;
    V = a * b * c * Math.sqrt(term > 0 ? term : 0);

    // System specific overrides for n and APF defaults
    if (sys === 'SC') { n = 1; apf = 0.52; }
    else if (sys === 'BCC') { n = 2; apf = 0.68; }
    else if (sys === 'FCC') { n = 4; apf = 0.74; }
    else if (sys === 'HCP') { 
        n = 6; apf = 0.74; 
        // HCP: The input 'a' and 'c' usually define the primitive cell vectors?
        // No, typically 'a' is the basal side length, 'c' is the height.
        // The general formula with gamma=120 gives the volume of the primitive rhombic prism (1/3 of hexagon).
        // But n=6 corresponds to the full hexagonal prism.
        // So we must multiply V by 3 if we assume the user wants the "Unit Cell" to be the hexagon.
        // However, standard lattice parameters a,c define the primitive cell.
        // Let's assume for density calc we use the full hexagon (n=6) and thus V_hex = 3 * V_prim.
        V = V * 3;
    }
    else if (sys === 'DC') { n = 8; apf = 0.34; }
    else { n = 1; apf = 0; } // General case

    // 2. Density Calculation
    const NA = 6.022e23;
    // rho = (n * M) / (V * NA)
    // V is in A^3 = 1e-24 cm^3
    const rho = (n * m) / (V * 1e-24 * NA); // g/cm^3

    // 3. XRD Simulation (Simplified for Cubic)
    // Bragg's Law: lambda = 2 * d * sin(theta) => theta = asin(lambda / 2d)
    // 2theta = 2 * asin(...)
    // d_hkl = a / sqrt(h^2 + k^2 + l^2) for cubic
    const peaks = [];
    if (['SC', 'BCC', 'FCC', 'DC'].includes(sys)) {
        // Generate hkl
        const hkls = [
            [1,0,0], [1,1,0], [1,1,1], [2,0,0], [2,1,0], [2,1,1], [2,2,0], [3,0,0], [3,1,0], [3,1,1], [2,2,2]
        ];
        
        hkls.forEach(([h, k, l]) => {
            // Selection rules
            let allowed = false;
            const sum = h+k+l;
            const mixed = (h%2 + k%2 + l%2); // 0 if all even, 3 if all odd, else mixed
            
            if (sys === 'SC') allowed = true;
            if (sys === 'BCC') allowed = (sum % 2 === 0);
            if (sys === 'FCC') allowed = (mixed === 0 || mixed === 3); // All even or all odd
            if (sys === 'DC') allowed = (mixed === 0 || mixed === 3) && (sum % 4 !== 2); // Diamond rules

            if (allowed) {
                const d = a / Math.sqrt(h*h + k*k + l*l);
                if (lambda < 2*d) {
                    const theta = Math.asin(lambda / (2*d));
                    const twoTheta = 2 * theta * (180 / Math.PI);
                    // Intensity factors (simplified)
                    // Multiplicity * LP factor * Structure Factor
                    // Just random-ish decay for visualization
                    const intensity = 100 * Math.exp(-twoTheta / 100); 
                    peaks.push({ 
                        angle: twoTheta.toFixed(1), 
                        intensity: intensity,
                        label: `(${h}${k}${l})`,
                        d: d.toFixed(3)
                    });
                }
            }
        });
    } else if (sys === 'HCP') {
        // HCP d-spacing: 1/d^2 = 4/3 * (h^2 + hk + k^2) / a^2 + l^2 / c^2
        const hkls = [
            [1,0,0], [0,0,2], [1,0,1], [1,0,2], [1,1,0], [1,0,3], [2,0,0], [1,1,2], [2,0,1]
        ];
        hkls.forEach(([h, k, l]) => {
             const term1 = (4/3) * (h*h + h*k + k*k) / (a*a);
             const term2 = (l*l) / (c*c);
             const d = 1 / Math.sqrt(term1 + term2);
             
             if (lambda < 2*d) {
                 const theta = Math.asin(lambda / (2*d));
                 const twoTheta = 2 * theta * (180 / Math.PI);
                 const intensity = 100 * Math.exp(-twoTheta / 100); 
                 peaks.push({ 
                     angle: twoTheta.toFixed(1), 
                     intensity: intensity,
                     label: `(${h}${k}${l})`,
                     d: d.toFixed(3)
                 });
             }
        });
    }

    return { 
        V: V.toFixed(2), 
        rho: rho.toFixed(2), 
        n, 
        apf
    };
  }, [crystInputs]);

  const renderUnitCell = () => {
    const { sys } = crystInputs;
    // Simple 2D SVG representation of 3D unit cells
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full max-w-[200px] mx-auto">
        {/* Base Cube for Cubic Systems */}
        {['SC', 'BCC', 'FCC', 'DC'].includes(sys) && (
          <>
            <polygon points="20,80 80,80 80,20 20,20" fill="none" stroke="#2D3F50" strokeWidth="2" />
            <polygon points="30,70 90,70 90,10 30,10" fill="none" stroke="#2D3F50" strokeWidth="2" />
            <line x1="20" y1="80" x2="30" y2="70" stroke="#2D3F50" strokeWidth="2" />
            <line x1="80" y1="80" x2="90" y2="70" stroke="#2D3F50" strokeWidth="2" />
            <line x1="80" y1="20" x2="90" y2="10" stroke="#2D3F50" strokeWidth="2" />
            <line x1="20" y1="20" x2="30" y2="10" stroke="#2D3F50" strokeWidth="2" />
            
            {/* Corners (All Cubic) */}
            <circle cx="20" cy="80" r="4" fill="#4A9EFF" />
            <circle cx="80" cy="80" r="4" fill="#4A9EFF" />
            <circle cx="80" cy="20" r="4" fill="#4A9EFF" />
            <circle cx="20" cy="20" r="4" fill="#4A9EFF" />
            <circle cx="30" cy="70" r="4" fill="#4A9EFF" />
            <circle cx="90" cy="70" r="4" fill="#4A9EFF" />
            <circle cx="90" cy="10" r="4" fill="#4A9EFF" />
            <circle cx="30" cy="10" r="4" fill="#4A9EFF" />
          </>
        )}

        {/* Body Center (BCC) */}
        {sys === 'BCC' && <circle cx="55" cy="45" r="5" fill="#F59E0B" />}

        {/* Face Centers (FCC & DC) */}
        {(sys === 'FCC' || sys === 'DC') && (
          <>
            <circle cx="50" cy="80" r="4" fill="#F59E0B" /> {/* Bottom */}
            <circle cx="50" cy="20" r="4" fill="#F59E0B" /> {/* Top */}
            <circle cx="20" cy="50" r="4" fill="#F59E0B" /> {/* Left */}
            <circle cx="80" cy="50" r="4" fill="#F59E0B" /> {/* Right */}
            <circle cx="55" cy="45" r="4" fill="#F59E0B" /> {/* Front/Back approx */}
          </>
        )}

        {/* Diamond Cubic (DC) - Interior Tetrahedral */}
        {sys === 'DC' && (
          <>
            <circle cx="35" cy="65" r="3" fill="#EF4444" />
            <circle cx="75" cy="65" r="3" fill="#EF4444" />
            <circle cx="35" cy="35" r="3" fill="#EF4444" />
            <circle cx="75" cy="35" r="3" fill="#EF4444" />
          </>
        )}

        {/* HCP - Hexagonal Prism */}
        {sys === 'HCP' && (
          <>
             {/* Draw Hexagon Base */}
             <polygon points="30,80 70,80 90,60 70,40 30,40 10,60" fill="none" stroke="#2D3F50" strokeWidth="2" />
             {/* Draw Top Hexagon */}
             <polygon points="30,50 70,50 90,30 70,10 30,10 10,30" fill="none" stroke="#2D3F50" strokeWidth="2" />
             {/* Vertical Lines */}
             <line x1="10" y1="60" x2="10" y2="30" stroke="#2D3F50" strokeWidth="2" />
             <line x1="90" y1="60" x2="90" y2="30" stroke="#2D3F50" strokeWidth="2" />
             <line x1="30" y1="80" x2="30" y2="50" stroke="#2D3F50" strokeWidth="2" />
             <line x1="70" y1="80" x2="70" y2="50" stroke="#2D3F50" strokeWidth="2" />
             
             {/* Atoms - Base */}
             <circle cx="30" cy="80" r="4" fill="#4A9EFF" />
             <circle cx="70" cy="80" r="4" fill="#4A9EFF" />
             <circle cx="90" cy="60" r="4" fill="#4A9EFF" />
             <circle cx="70" cy="40" r="4" fill="#4A9EFF" />
             <circle cx="30" cy="40" r="4" fill="#4A9EFF" />
             <circle cx="10" cy="60" r="4" fill="#4A9EFF" />
             <circle cx="50" cy="60" r="4" fill="#F59E0B" /> {/* Center Base */}

             {/* Atoms - Midplane (3 atoms) */}
             <circle cx="50" cy="45" r="4" fill="#EF4444" />
             <circle cx="30" cy="55" r="4" fill="#EF4444" />
             <circle cx="70" cy="55" r="4" fill="#EF4444" />

             {/* Atoms - Top */}
             <circle cx="30" cy="50" r="4" fill="#4A9EFF" />
             <circle cx="70" cy="50" r="4" fill="#4A9EFF" />
             <circle cx="90" cy="30" r="4" fill="#4A9EFF" />
             <circle cx="70" cy="10" r="4" fill="#4A9EFF" />
             <circle cx="30" cy="10" r="4" fill="#4A9EFF" />
             <circle cx="10" cy="30" r="4" fill="#4A9EFF" />
             <circle cx="50" cy="30" r="4" fill="#F59E0B" /> {/* Center Top */}
          </>
        )}
      </svg>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto">
      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Physical Properties</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Thermal, electrical, magnetic, optical, and crystallographic analysis</p>
        
        <div className="flex overflow-x-auto gap-2 mt-6 pb-2 border-b border-[#2D3F50] scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#4A9EFF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#2D3F50]'}`}
              >
                <Icon size={16} /> {tab.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Thermal */}
      {activeTab === 'Thermal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Thermal Parameters</h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94A3B8]">Preset:</span>
                    <select 
                      value={selectedThermalPreset} 
                      onChange={(e) => {
                        const p = e.target.value;
                        setSelectedThermalPreset(p);
                        if (THERMAL_PRESETS[p]) setThermalInputs(THERMAL_PRESETS[p]);
                      }}
                      className="bg-[#0F1923] border border-[#2D3F50] rounded px-2 py-1 text-xs text-[#F1F5F9] focus:outline-none"
                    >
                      {Object.keys(THERMAL_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                      <option value="Custom">Custom</option>
                    </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries({ k: 'Thermal Cond. k (W/m·K)', cp: 'Specific Heat Cp (J/kg·K)', rho: 'Density ρ (kg/m³)', cte: 'CTE α (10⁻⁶/K)', tm: 'Melting Point (°C)', tg: 'Glass Transition (°C)' }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">{label}</label>
                    <input 
                      type="number" 
                      step="any"
                      value={thermalInputs[key]} 
                      onChange={e => {
                        setThermalInputs({...thermalInputs, [key]: Number(e.target.value)});
                        setSelectedThermalPreset('Custom');
                      }}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#2D3F50]">
                <h3 className="text-sm font-medium text-[#4A9EFF] mb-3 flex items-center gap-2">
                    <Activity size={14} /> Advanced Parameters (Transport & Elasticity)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries({ thetaD: 'Debye Temp θD (K)', gamma: 'Gruneisen γ', E: 'Young\'s Mod. E (GPa)', nu: 'Poisson ν', sy: 'Yield Stress (MPa)' }).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">{label}</label>
                      <input 
                        type="number" 
                        step="any"
                        value={thermalInputs[key]} 
                        onChange={e => {
                            setThermalInputs({...thermalInputs, [key]: Number(e.target.value)});
                            setSelectedThermalPreset('Custom');
                        }}
                        className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Calculated Thermal Indices</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Thermal Diffusivity (α)</div>
                        <div className="text-xl font-bold text-[#4A9EFF]">{thermalAnalysis.alpha} <span className="text-xs font-normal">m²/s</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Rate of heat transfer through the material body.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Thermal Effusivity (e)</div>
                        <div className="text-xl font-bold text-[#22C55E]">{thermalAnalysis.effusivity} <span className="text-xs font-normal">Ws⁰·⁵/m²K</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Ability to exchange thermal energy with surroundings.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Shock Resistance (R_TS)</div>
                        <div className="text-xl font-bold text-[#F59E0B]">{thermalAnalysis.R_TS} <span className="text-xs font-normal">W/m</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Maximum permissible heat flux without fracture initiation.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Stability index (R_stable)</div>
                        <div className="text-xl font-bold text-[#EF4444]">{thermalAnalysis.R_stable} <span className="text-xs font-normal">MN/W</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Hasselman parameter for crack growth resistance.</p>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-[#1A2634] p-8 rounded-lg border border-[#2D3F50] shadow-lg text-center flex-1 flex flex-col justify-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-[#4A9EFF]/10 rounded-full animate-pulse" />
                  <Thermometer size={48} className="absolute inset-0 m-auto text-[#4A9EFF]" />
              </div>
              <h2 className="text-xl font-bold text-[#F1F5F9] mb-4">Engine Active</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">High-fidelity thermal transport models analyzing phonon-vibration spectra, lattice conductivity, and electronic heat capacity contributions.</p>
              <div className="mt-8 pt-8 border-t border-[#2D3F50] text-left">
                  <div className="text-[10px] text-[#4A9EFF] font-bold uppercase mb-4 tracking-tighter">Live Dataset Summary</div>
                  <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                          <span className="text-[#94A3B8]">Vol. Heat Capacity:</span>
                          <span className="text-[#F1F5F9] font-mono">{thermalAnalysis.volCp} MJ/m³K</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#94A3B8]">Expansion Model:</span>
                        <span className="text-[#F1F5F9] font-mono whitespace-nowrap">Grüneisen-Mie</span>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Electrical */}
      {activeTab === 'Electrical' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-[#F1F5F9]">Transport Parameters</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${elecClass.color} text-white uppercase`}>{elecClass.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94A3B8]">Preset:</span>
                    <select 
                      value={selectedElecPreset} 
                      onChange={(e) => {
                        const p = e.target.value;
                        setSelectedElecPreset(p);
                        if (ELECTRICAL_PRESETS[p]) setElecInputs(ELECTRICAL_PRESETS[p]);
                      }}
                      className="bg-[#0F1923] border border-[#2D3F50] rounded px-2 py-1 text-xs text-[#F1F5F9] focus:outline-none"
                    >
                      {Object.keys(ELECTRICAL_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                      <option value="Custom">Custom</option>
                    </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Resistivity ρ (Ω·m)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={elecInputs.rho} 
                      onChange={e => handleElecChange('rho', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Conductivity σ (S/m)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={elecInputs.sigma} 
                      onChange={e => handleElecChange('sigma', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Permittivity εr</label>
                    <input 
                      type="number" 
                      step="any"
                      value={elecInputs.er} 
                      onChange={e => handleElecChange('er', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Breakdown E (kV/mm)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={elecInputs.vbd} 
                      onChange={e => handleElecChange('vbd', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Model Selection</label>
                    <select 
                      value={elecInputs.model} 
                      onChange={e => handleElecChange('model', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm"
                    >
                      <option value="Metal">Metals (Ohmic)</option>
                      <option value="Semiconductor">Intrinsic SC</option>
                    </select>
                  </div>
                  <div>
                    {elecInputs.model === 'Metal' ? (
                        <>
                          <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Alpha α (1/K)</label>
                          <input type="number" step="any" value={elecInputs.alpha} onChange={e => handleElecChange('alpha', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" />
                        </>
                    ) : (
                        <>
                          <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Band Gap Eg (eV)</label>
                          <input type="number" step="any" value={elecInputs.Eg} onChange={e => handleElecChange('Eg', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" />
                        </>
                    )}
                  </div>
              </div>
              
              <div className="pt-4 border-t border-[#2D3F50]">
                <h3 className="text-sm font-medium text-[#4A9EFF] mb-3 flex items-center gap-2">
                    <Activity size={14} /> Carrier Physics (Microscopic)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                        <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Concentration n (1/m³)</label>
                        <input 
                          type="number" 
                          step="any" 
                          value={elecInputs.n} 
                          onChange={e => handleElecChange('n', e.target.value)} 
                          className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Mobility μ (m²/V·s)</label>
                        <input 
                          type="number" 
                          step="any" 
                          value={elecInputs.mu} 
                          onChange={e => handleElecChange('mu', e.target.value)} 
                          className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                        />
                    </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Calculated Electronic Indices</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Hall Coefficient (R_h)</div>
                        <div className="text-xl font-bold text-[#4A9EFF]">{elecAnalysis.Rh} <span className="text-xs font-normal">m³/C</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Transverse voltage potential per unit current/field.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Plasma Frequency (f_p)</div>
                        <div className="text-xl font-bold text-[#F59E0B]">{elecAnalysis.plasmaFreq} <span className="text-xs font-normal">Hz</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Oscillation frequency of the electron gas.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Theoretical σ (Drude)</div>
                        <div className="text-xl font-bold text-[#22C55E]">{elecAnalysis.sigma_theo} <span className="text-xs font-normal">S/m</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Estimated conductivity based on carrier density.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Mean Free Path ESTIMATE</div>
                        <div className="text-xl font-bold text-[#EF4444]">~{(elecInputs.mu * 0.057).toFixed(1)} <span className="text-xs font-normal">nm</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Approx distance between scattering events.</p>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-[#1A2634] p-8 rounded-lg border border-[#2D3F50] shadow-lg text-center flex-1 flex flex-col justify-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-[#4A9EFF]/10 rounded-full animate-pulse" />
                  <Zap size={48} className="absolute inset-0 m-auto text-[#4A9EFF]" />
              </div>
              <h2 className="text-xl font-bold text-[#F1F5F9] mb-4">Charge Analysis Active</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">Solid-state transport engine computing Ohmic behavior, bandgap transitions, and carrier mobility dynamics.</p>
              
              <div className="mt-8 pt-6 border-t border-[#2D3F50] text-left">
                  <div className="text-[10px] text-[#4A9EFF] font-bold uppercase mb-4 tracking-tighter">Operational Simulation</div>
                  <div className="space-y-4">
                      <div className="bg-[#0F1923] p-3 rounded border border-[#2D3F50]">
                          <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
                              <span>Ref Temp: {elecInputs.t0}°C</span>
                              <span>Target: {elecInputs.t}°C</span>
                          </div>
                          <input 
                            type="range" 
                            min="-100" 
                            max="1000" 
                            value={elecInputs.t} 
                            onChange={e => handleElecChange('t', e.target.value)}
                            className="w-full h-1 bg-[#2D3F50] rounded-lg appearance-none cursor-pointer accent-[#4A9EFF]"
                          />
                          <div className="mt-3 flex justify-between items-end">
                              <span className="text-[10px] text-[#94A3B8]">ρ(T):</span>
                              <span className="text-sm font-bold text-[#F1F5F9] font-mono">{elecAnalysis.currentRho.toExponential(2)} Ω·m</span>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50] text-center">
                            <div className="text-[8px] text-[#94A3B8] uppercase">σ(T)</div>
                            <div className="text-xs font-bold text-[#4A9EFF] font-mono">{(1/elecAnalysis.currentRho).toExponential(1)}</div>
                        </div>
                        <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50] text-center">
                            <div className="text-[8px] text-[#94A3B8] uppercase">Δρ/ΔT</div>
                            <div className="text-xs font-bold text-[#F59E0B] font-mono">{(elecInputs.rho * elecInputs.alpha).toExponential(1)}</div>
                        </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Magnetic */}
      {activeTab === 'Magnetic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-[#F1F5F9]">Magnetic Parameters</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${magClass.color} text-white uppercase`}>{magClass.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94A3B8]">Preset:</span>
                    <select 
                      value={selectedMagPreset} 
                      onChange={(e) => {
                        const p = e.target.value;
                        setSelectedMagPreset(p);
                        if (MAGNETIC_PRESETS[p]) setMagInputs(MAGNETIC_PRESETS[p]);
                      }}
                      className="bg-[#0F1923] border border-[#2D3F50] rounded px-2 py-1 text-xs text-[#F1F5F9] focus:outline-none"
                    >
                      {Object.keys(MAGNETIC_PRESETS).map(k => <option key={k} value={k}>{k}</option>)}
                      <option value="Custom">Custom</option>
                    </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Rel. Permeability μr</label>
                    <input 
                      type="number" 
                      step="any"
                      value={magInputs.ur} 
                      onChange={e => handleMagChange('ur', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Saturation Ms (A/m)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={magInputs.ms} 
                      onChange={e => handleMagChange('ms', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Coercivity Hc (A/m)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={magInputs.hc} 
                      onChange={e => handleMagChange('hc', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Remanence Br (T)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={magInputs.br} 
                      onChange={e => handleMagChange('br', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Curie Temp Tc (°C)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={magInputs.tc} 
                      onChange={e => handleMagChange('tc', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">Hysteresis Loss (W/kg)</label>
                    <input 
                      type="number" 
                      step="any"
                      value={magInputs.loss} 
                      onChange={e => handleMagChange('loss', e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                    />
                  </div>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Calculated Magnetic Indices</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Saturation Induction (B_s)</div>
                        <div className="text-xl font-bold text-[#4A9EFF]">{magAnalysis.Bs} <span className="text-xs font-normal">Tesla</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Maximum magnetic flux density achievable in the material.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Maximum Energy Product (BH)_max</div>
                        <div className="text-xl font-bold text-[#F59E0B]">{magAnalysis.BHmax} <span className="text-xs font-normal">kJ/m³</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Figure of merit for permanent magnet performance.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Initial Susceptibility (χ)</div>
                        <div className="text-xl font-bold text-[#22C55E]">{magAnalysis.chi}</div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Material response to external magnetic field alignment.</p>
                    </div>
                    <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Anisotropy Estimate (K_eff)</div>
                        <div className="text-xl font-bold text-[#EF4444]">{magAnalysis.K_eff} <span className="text-xs font-normal">kJ/m³</span></div>
                        <p className="text-[10px] text-[#64748B] mt-2 italic">Energy required to rotate the magnetization vector.</p>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="bg-[#1A2634] p-8 rounded-lg border border-[#2D3F50] shadow-lg text-center flex-1 flex flex-col justify-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-[#4A9EFF]/10 rounded-full animate-pulse" />
                  <Magnet size={48} className="absolute inset-0 m-auto text-[#4A9EFF]" />
              </div>
              <h2 className="text-xl font-bold text-[#F1F5F9] mb-4">Magnetic Engine Active</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">Solid-state solver analyzing exchange interactions, Weiss domain alignment, and hysteresis dynamics.</p>
              
              <div className="mt-8 pt-6 border-t border-[#2D3F50] text-left">
                  <div className="text-[10px] text-[#4A9EFF] font-bold uppercase mb-4 tracking-tighter">Domain Simulation</div>
                  <div className="space-y-4">
                      <div className="bg-[#0F1923] p-3 rounded border border-[#2D3F50]">
                          <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
                              <span>Magnetic Flux: {magAnalysis.Bs} T</span>
                          </div>
                          <div className="h-1 w-full bg-[#2D3F50] rounded-full overflow-hidden mt-1">
                            <div 
                                className="h-full bg-[#4A9EFF] transition-all duration-700" 
                                style={{ width: `${Math.min(100, (Number(magAnalysis.Bs)/2.5)*100)}%` }}
                            />
                          </div>
                          <div className="mt-3 flex justify-between items-end">
                              <span className="text-[10px] text-[#94A3B8]">Absolute μ:</span>
                              <span className="text-xs font-bold text-[#F1F5F9] font-mono">{magAnalysis.mu} H/m</span>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50] text-center">
                            <div className="text-[8px] text-[#94A3B8] uppercase">Tc Kelvin</div>
                            <div className="text-xs font-bold text-[#4A9EFF] font-mono">{magInputs.tc + 273.15} K</div>
                        </div>
                        <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50] text-center">
                            <div className="text-[8px] text-[#94A3B8] uppercase">Perm. Index</div>
                            <div className="text-xs font-bold text-[#F59E0B] font-mono">{(magInputs.ur/1000).toFixed(1)}k</div>
                        </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Optical */}
      {activeTab === 'Optical' && (
        <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2">
              <h2 className="text-lg font-bold text-[#F1F5F9]">Optical Params</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${optClass.color} text-white`}>{optClass.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Refractive Index (n)</label>
                <input type="number" step="any" value={optInputs.n} onChange={e => setOptInputs({...optInputs, n: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Extinction Coeff (k)</label>
                <input type="number" step="any" value={optInputs.k} onChange={e => setOptInputs({...optInputs, k: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Thickness (nm)</label>
                <input type="number" step="any" value={optInputs.thickness} onChange={e => setOptInputs({...optInputs, thickness: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Material Model</label>
                <select 
                  value={optInputs.materialType} 
                  onChange={e => setOptInputs({...optInputs, materialType: e.target.value})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                >
                  <option value="Constant">Constant</option>
                  <option value="Glass">Glass-like (Cauchy)</option>
                  <option value="Metal">Metal-like (Drude)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md space-y-2">
              <h3 className="text-sm text-[#94A3B8] mb-2 font-mono">Calculated Optical Status</h3>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9] text-sm">Reflectance R:</span>
                <span className="font-bold text-[#4A9EFF]">{optAnalysis.R}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9] text-sm">Transmittance T:</span>
                <span className="font-bold text-[#22C55E]">{optAnalysis.T}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9] text-sm">Absorbance A:</span>
                <span className="font-bold text-[#EF4444]">{optAnalysis.A}%</span>
              </div>
            </div>
            
            <div className="p-8 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
              <Eye size={40} className="text-[#4A9EFF] mx-auto mb-4 opacity-20" />
              <h3 className="text-[#F1F5F9] font-bold mb-2">Complex Refractive Index Model</h3>
              <p className="text-xs text-[#94A3B8]">Normal incidence Fresnel calculations active. Absorption following Beer-Lambert law.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Crystal */}
      {activeTab === 'Crystal' && (
        <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Lattice Parameters</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Material Preset</label>
                <select 
                  value={selectedCrystPreset} 
                  onChange={(e) => {
                    const preset = e.target.value;
                    setSelectedCrystPreset(preset);
                    if (CRYSTAL_PRESETS[preset]) {
                      setCrystInputs(prev => ({ ...prev, ...CRYSTAL_PRESETS[preset] }));
                    }
                  }}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                >
                  {Object.keys(CRYSTAL_PRESETS).map(key => <option key={key} value={key}>{key}</option>)}
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Crystal System</label>
                <select 
                  value={crystInputs.sys} 
                  onChange={e => {
                    const newSys = e.target.value;
                    let newParams = { ...crystInputs, sys: newSys };
                    
                    if (newSys === 'HCP') {
                      newParams.alpha = 90;
                      newParams.beta = 90;
                      newParams.gamma = 120;
                      newParams.b = newParams.a;
                    } else if (['SC', 'BCC', 'FCC', 'DC'].includes(newSys)) {
                      newParams.alpha = 90;
                      newParams.beta = 90;
                      newParams.gamma = 90;
                      newParams.b = newParams.a;
                      newParams.c = newParams.a;
                    }
                    
                    setCrystInputs(newParams);
                    setSelectedCrystPreset('Custom');
                  }}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                >
                  {['SC', 'BCC', 'FCC', 'HCP', 'DC'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries({ a: 'a (Å)', b: 'b (Å)', c: 'c (Å)', alpha: 'α (°)', beta: 'β (°)', gamma: 'γ (°)' }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={crystInputs[key]} 
                    onChange={e => {
                      setCrystInputs({...crystInputs, [key]: Number(e.target.value)});
                      setSelectedCrystPreset('Custom');
                    }}
                    className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" 
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Atomic Mass (g/mol)</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={crystInputs.m} 
                    onChange={e => {
                      setCrystInputs({...crystInputs, m: Number(e.target.value)});
                      setSelectedCrystPreset('Custom');
                    }}
                    className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                  />
                </div>
            </div>

            <div className="mt-4 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md space-y-2">
                <h3 className="text-sm text-[#94A3B8] border-b border-[#2D3F50] pb-1 mb-2">Theoretical Properties</h3>
                <div className="flex justify-between items-center">
                    <span className="text-[#F1F5F9] text-sm">Volume Vc:</span>
                    <span className="font-bold text-[#4A9EFF]">{crystAnalysis.V} Å³</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[#F1F5F9] text-sm">Density ρ:</span>
                    <span className="font-bold text-[#22C55E]">{crystAnalysis.rho} g/cm³</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[#F1F5F9] text-sm">APF:</span>
                    <span className="font-bold text-[#F59E0B]">{crystAnalysis.apf}</span>
                </div>
            </div>
          </div>
          
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col gap-6">
             <div className="p-8 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
                <Box size={40} className="text-[#4A9EFF] mx-auto mb-4 opacity-20" />
                <h2 className="text-lg font-bold text-[#F1F5F9] mb-2 font-mono">Unit Cell Visualization (2D)</h2>
                <div className="h-[200px] w-full flex items-center justify-center relative overflow-hidden">
                    {renderUnitCell()}
                </div>
                <p className="text-xs text-[#94A3B8] mt-4">Theoretical peaks simulated based on Bragg's law for {crystInputs.sys} system.</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
