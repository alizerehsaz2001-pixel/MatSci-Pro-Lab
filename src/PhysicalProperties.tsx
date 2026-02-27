import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, AreaChart, Area, ComposedChart, ReferenceDot, Bar } from 'recharts';
import { AlertTriangle, Plus, Trash2, Zap, Thermometer, Magnet, Eye, Box } from 'lucide-react';

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
  const [thermalInputs, setThermalInputs] = useState({ 
    k: 400, cp: 385, rho: 8960, cte: 16.5, tm: 1085, tg: 0,
    thetaD: 343, // Debye Temp (K)
    gamma: 2.0, // Gruneisen Parameter
    E: 110, // Young's Modulus (GPa)
    nu: 0.34, // Poisson's Ratio
    sy: 200 // Yield Strength (MPa) for Thermal Shock
  });
  
  const [kVsTData, setKVsTData] = useState([
    { id: 1, temp: 20, k: 401 },
    { id: 2, temp: 100, k: 393 },
    { id: 3, temp: 300, k: 379 },
    { id: 4, temp: 500, k: 370 },
    { id: 5, temp: 800, k: 350 }
  ]);
  const [newKPoint, setNewKPoint] = useState({ temp: '', k: '' });

  const thermalAnalysis = useMemo(() => {
    const { k, cp, rho, E, nu, sy, cte } = thermalInputs;
    
    // Thermal Diffusivity: alpha = k / (rho * cp)
    const alpha = (k / (rho * cp)).toExponential(2);

    // Thermal Shock Resistance (R_TS)
    // R_TS = (sigma_f * k * (1 - nu)) / (E * alpha_cte)
    // sigma_f ~ sy (Yield Strength) for metals, or Fracture Strength for ceramics
    // E in GPa -> Pa, sy in MPa -> Pa, cte in 1e-6/K -> 1/K
    const R_TS = (sy * 1e6 * k * (1 - nu)) / (E * 1e9 * cte * 1e-6);

    // Fit k(T) = A + B/T + C*T
    // Simple least squares or just interpolation for visualization?
    // Let's do a polynomial fit k(T) = a + bT + cT^2 for simplicity in visualization
    // Or better, just sort and connect data points for now, and add a theoretical curve
    // Theoretical curve for metals: k ~ constant (above Debye)
    // Theoretical curve for dielectrics: k ~ 1/T (Umklapp)
    
    // Let's generate a "Fitted" curve based on the data points using simple regression
    // Linear regression k = m*T + c for simplicity if data is sparse
    const n = kVsTData.length;
    let sX = 0, sY = 0, sXY = 0, sXX = 0;
    kVsTData.forEach(p => {
      sX += p.temp;
      sY += p.k;
      sXY += p.temp * p.k;
      sXX += p.temp * p.temp;
    });
    const slope = (n * sXY - sX * sY) / (n * sXX - sX * sX);
    const intercept = (sY - slope * sX) / n;

    const fitData = [];
    const tMin = Math.min(...kVsTData.map(d => d.temp));
    const tMax = Math.max(...kVsTData.map(d => d.temp));
    for (let t = tMin - 50; t <= tMax + 50; t += 50) {
       if (t < 0) continue;
       fitData.push({ temp: t, kFit: slope * t + intercept });
    }

    return { alpha, R_TS: R_TS.toFixed(0), fitData };
  }, [thermalInputs, kVsTData]);

  const addKPoint = () => {
    if (newKPoint.temp && newKPoint.k) {
      setKVsTData(prev => [...prev, { id: Date.now(), temp: Number(newKPoint.temp), k: Number(newKPoint.k) }].sort((a, b) => a.temp - b.temp));
      setNewKPoint({ temp: '', k: '' });
    }
  };

  // --- SUB-MODULE 2: Electrical ---
  const [elecInputs, setElecInputs] = useState({ 
    rho: 1.68e-8, sigma: 5.96e7, 
    r0: 100, alpha: 0.00393, t0: 20, t: 100, 
    er: 1, vbd: 0,
    model: 'Metal', // 'Metal' or 'Semiconductor'
    Eg: 1.1, // Band Gap (eV)
    n: 8.5e28, // Carrier Density (1/m^3)
    mu: 0.0045 // Mobility (m^2/V·s)
  });
  
  const handleElecChange = (field, value) => {
    if (field === 'model') {
      setElecInputs(prev => ({ ...prev, [field]: value }));
      return;
    }

    const num = parseFloat(value);
    // If input is empty or invalid, we might get NaN. 
    // We store it as is if it's NaN to allow user to clear input, 
    // but we guard calculations.
    
    if (field === 'rho') {
      setElecInputs(prev => ({ 
        ...prev, 
        rho: isNaN(num) ? 0 : num, 
        sigma: (num === 0 || isNaN(num)) ? 0 : 1 / num 
      }));
    } else if (field === 'sigma') {
      setElecInputs(prev => ({ 
        ...prev, 
        sigma: isNaN(num) ? 0 : num, 
        rho: (num === 0 || isNaN(num)) ? 0 : 1 / num 
      }));
    } else {
      setElecInputs(prev => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
    }
  };

  const elecClass = useMemo(() => {
    const rho = elecInputs.rho;
    if (rho < 1e-5) return { label: 'Conductor', color: 'bg-[#22C55E]', text: 'text-[#22C55E]' };
    if (rho > 1e5) return { label: 'Insulator', color: 'bg-[#EF4444]', text: 'text-[#EF4444]' };
    return { label: 'Semiconductor', color: 'bg-[#F59E0B]', text: 'text-[#F59E0B]' };
  }, [elecInputs.rho]);

  const elecAnalysis = useMemo(() => {
    const { rho, sigma, alpha, t0, t, model, Eg, n, mu } = elecInputs;
    const q = 1.602e-19;
    const kB = 8.617e-5; // eV/K

    // Theoretical Conductivity from carriers
    // sigma = n * q * mu
    const sigma_theo = n * q * mu;

    // Generate Rho vs T data
    const data = [];
    // Range: -50 to 500 C
    for (let temp = -50; temp <= 500; temp += 10) {
      const T_K = temp + 273.15;
      const T0_K = t0 + 273.15;
      let val = 0;

      if (model === 'Metal') {
        // Linear: rho = rho0 * (1 + alpha * (T - T0))
        val = rho * (1 + alpha * (temp - t0));
      } else {
        // Semiconductor: rho ~ exp(Eg / 2kT)
        // We normalize to the input rho at t0
        // rho(T) = rho(T0) * exp(Eg/2kT) / exp(Eg/2kT0)
        // rho(T) = rho(T0) * exp( (Eg/2k) * (1/T - 1/T0) )
        if (T_K > 0) {
            const exponent = (Eg / (2 * kB)) * (1/T_K - 1/T0_K);
            val = rho * Math.exp(exponent);
        }
      }
      data.push({ temp, rho: val > 0 ? val : 0 });
    }

    // Calculate current point
    let currentRho = 0;
    const T_target_K = t + 273.15;
    const T0_K = t0 + 273.15;
    
    if (model === 'Metal') {
        currentRho = rho * (1 + alpha * (t - t0));
    } else {
        const exponent = (Eg / (2 * kB)) * (1/T_target_K - 1/T0_K);
        currentRho = rho * Math.exp(exponent);
    }

    return { data, currentRho, sigma_theo: sigma_theo.toExponential(2) };
  }, [elecInputs]);

  // --- SUB-MODULE 3: Magnetic ---
  const [magInputs, setMagInputs] = useState({ ur: 1.00001, ms: 0, hc: 0, br: 0, tc: 0 });
  
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
    const mu0 = 1.2566e-6; // T·m/A

    // Saturation Induction Bs = mu0 * Ms (approx)
    const Bs = mu0 * ms;

    // Absolute Permeability mu = ur * mu0
    const mu = ur * mu0;

    // Energy Product BHmax (Approximate)
    // Max product in 2nd quadrant. simplified as (Br * Hc) / 4 for linear demag curve
    // or more accurately finding max(B*H) on the curve.
    // Let's use a simple estimation for display:
    const BHmax = (br * hc) / 4; // J/m^3

    return { Bs, mu, BHmax };
  }, [magInputs]);

  const hysteresisData = useMemo(() => {
    const { ms, hc, br } = magInputs;
    if (hc === 0 || ms === 0) return [];
    
    const data = [];
    const steps = 50;
    const maxH = hc * 2;
    const stepSize = (maxH * 2) / steps;

    // Simple phenomenological model
    // We want loop to pass through (Hc, 0) and (0, Br)
    // M(H) = Ms * tanh( alpha * (H +/- Hc) )
    // At H=0, M = Br/mu0 (approx). 
    // Br/mu0 = Ms * tanh( alpha * Hc ) => alpha = atanh( Br/(mu0*Ms) ) / Hc
    
    const mu0 = 1.2566e-6;
    let alpha = 0;
    // Guard against physical impossibility Br > Bs
    const Bs = mu0 * ms;
    if (br < Bs * 0.99) {
        try {
            alpha = Math.atanh(br / Bs) / hc;
        } catch (e) {
            alpha = 1 / hc; // Fallback
        }
    } else {
        alpha = 5 / hc; // Steep square loop
    }

    for (let h = -maxH; h <= maxH; h += stepSize) {
      // Ascending branch (lower curve)
      // Shifted right by Hc? No, ascending from -Hmax goes through +Hc
      // M_asc = Ms * tanh( alpha * (H - Hc) )
      const M_asc = ms * Math.tanh(alpha * (h - hc));
      const B_asc = mu0 * (h + M_asc);

      // Descending branch (upper curve)
      // Descending from +Hmax goes through -Hc
      // M_desc = Ms * tanh( alpha * (H + Hc) )
      const M_desc = ms * Math.tanh(alpha * (h + hc));
      const B_desc = mu0 * (h + M_desc);

      // Initial Magnetization Curve (Virgin)
      // M_init = Ms * tanh( alpha * H )
      const M_init = ms * Math.tanh(alpha * h);
      const B_init = mu0 * (h + M_init);

      data.push({ 
          h, 
          bAsc: B_asc, 
          bDesc: B_desc,
          bInit: (h >= 0 && h <= maxH) ? B_init : null // Only show positive H part for initial
      });
    }
    return data;
  }, [magInputs]);

  // --- SUB-MODULE 4: Optical ---
  const [optInputs, setOptInputs] = useState({ 
    n: 1.5, k: 0, 
    thickness: 1000, // nm
    materialType: 'Constant', // 'Constant', 'Glass', 'Metal'
    r: 4, t: 92, a: 4 
  });
  
  const [optData, setOptData] = useState([
    { id: 1, wl: 400, r: 5 },
    { id: 2, wl: 550, r: 4 },
    { id: 3, wl: 700, r: 4 }
  ]);
  const [newOptPoint, setNewOptPoint] = useState({ wl: '', r: '' });

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

    // 2. Spectral Generation
    const spectrum = [];
    for (let wl = 300; wl <= 1000; wl += 10) {
        let n_l = n;
        let k_l = k;

        if (materialType === 'Glass') {
            // Cauchy: n = n + B/lambda^2 (lambda in um)
            // simple dispersion
            const wl_um = wl / 1000;
            n_l = n + 0.005 / (wl_um * wl_um);
            k_l = 0;
        } else if (materialType === 'Metal') {
            // Drude-like (very simplified)
            // n increases with lambda, k increases with lambda
            // This is just for visualization "flavor"
            const ratio = wl / 550;
            n_l = n * ratio;
            k_l = k * ratio;
        }

        const R_l = (Math.pow(n_l - 1, 2) + Math.pow(k_l, 2)) / (Math.pow(n_l + 1, 2) + Math.pow(k_l, 2));
        spectrum.push({ wl, rTheo: R_l * 100 });
    }

    return { 
        R: (R_val * 100).toFixed(2), 
        T: (T_val * 100).toFixed(2), 
        A: (A_val * 100).toFixed(2),
        spectrum 
    };
  }, [optInputs]);

  const addOptPoint = () => {
    if (newOptPoint.wl && newOptPoint.r) {
      setOptData(prev => [...prev, { id: Date.now(), wl: Number(newOptPoint.wl), r: Number(newOptPoint.r) }].sort((a, b) => a.wl - b.wl));
      setNewOptPoint({ wl: '', r: '' });
    }
  };

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
    }

    return { 
        V: V.toFixed(2), 
        rho: rho.toFixed(2), 
        n, 
        apf,
        peaks: peaks.sort((a,b) => Number(a.angle) - Number(b.angle))
    };
  }, [crystInputs]);

  const renderUnitCell = () => {
    const { sys } = crystInputs;
    // Simple 2D SVG representation of 3D unit cells
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full max-w-[200px] mx-auto">
        {/* Base Cube */}
        <polygon points="20,80 80,80 80,20 20,20" fill="none" stroke="#2D3F50" strokeWidth="2" />
        <polygon points="30,70 90,70 90,10 30,10" fill="none" stroke="#2D3F50" strokeWidth="2" />
        <line x1="20" y1="80" x2="30" y2="70" stroke="#2D3F50" strokeWidth="2" />
        <line x1="80" y1="80" x2="90" y2="70" stroke="#2D3F50" strokeWidth="2" />
        <line x1="80" y1="20" x2="90" y2="10" stroke="#2D3F50" strokeWidth="2" />
        <line x1="20" y1="20" x2="30" y2="10" stroke="#2D3F50" strokeWidth="2" />

        {/* Atoms */}
        {/* Corners (All systems) */}
        <circle cx="20" cy="80" r="4" fill="#4A9EFF" />
        <circle cx="80" cy="80" r="4" fill="#4A9EFF" />
        <circle cx="80" cy="20" r="4" fill="#4A9EFF" />
        <circle cx="20" cy="20" r="4" fill="#4A9EFF" />
        <circle cx="30" cy="70" r="4" fill="#4A9EFF" />
        <circle cx="90" cy="70" r="4" fill="#4A9EFF" />
        <circle cx="90" cy="10" r="4" fill="#4A9EFF" />
        <circle cx="30" cy="10" r="4" fill="#4A9EFF" />

        {/* Body Center (BCC) */}
        {sys === 'BCC' && <circle cx="55" cy="45" r="5" fill="#F59E0B" />}

        {/* Face Centers (FCC) */}
        {sys === 'FCC' && (
          <>
            <circle cx="50" cy="80" r="4" fill="#F59E0B" /> {/* Bottom */}
            <circle cx="50" cy="20" r="4" fill="#F59E0B" /> {/* Top */}
            <circle cx="20" cy="50" r="4" fill="#F59E0B" /> {/* Left */}
            <circle cx="80" cy="50" r="4" fill="#F59E0B" /> {/* Right */}
            <circle cx="55" cy="45" r="4" fill="#F59E0B" /> {/* Front/Back approx */}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Thermal Parameters</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({ k: 'Thermal Cond. k (W/m·K)', cp: 'Specific Heat Cp (J/kg·K)', rho: 'Density ρ (kg/m³)', cte: 'CTE (10⁻⁶/K)', tm: 'Melting Point (°C)', tg: 'Glass Transition (°C)' }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                  <input 
                    type="number" 
                    step="any"
                    value={thermalInputs[key]} 
                    onChange={e => setThermalInputs({...thermalInputs, [key]: Number(e.target.value)})}
                    className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#2D3F50]">
              <h3 className="text-sm font-medium text-[#4A9EFF] mb-3">Advanced Parameters</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({ thetaD: 'Debye Temp θD (K)', gamma: 'Gruneisen γ', E: 'Young\'s Mod. E (GPa)', nu: 'Poisson\'s Ratio ν', sy: 'Yield Strength (MPa)' }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                    <input 
                      type="number" 
                      step="any"
                      value={thermalInputs[key]} 
                      onChange={e => setThermalInputs({...thermalInputs, [key]: Number(e.target.value)})}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md space-y-2">
              <h3 className="text-sm text-[#94A3B8] mb-2">Calculated Properties</h3>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9] text-sm">Diffusivity (α):</span>
                <span className="font-bold text-[#4A9EFF]">{thermalAnalysis.alpha} m²/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9] text-sm">Shock Res. (R_TS):</span>
                <span className="font-bold text-[#F59E0B]">{thermalAnalysis.R_TS} W/m</span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Thermal Conductivity vs Temperature</h2>
            <div className="flex gap-2 mb-4">
              <input type="number" placeholder="Temp (°C)" value={newKPoint.temp} onChange={e => setNewKPoint({...newKPoint, temp: e.target.value})} className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              <input type="number" placeholder="k (W/m·K)" value={newKPoint.k} onChange={e => setNewKPoint({...newKPoint, k: e.target.value})} className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              <button onClick={addKPoint} className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"><Plus size={16} /> Add</button>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                  <XAxis dataKey="temp" type="number" domain={['auto', 'auto']} stroke="#94A3B8" label={{ value: 'Temperature (°C)', position: 'bottom', fill: '#94A3B8' }} />
                  <YAxis stroke="#94A3B8" label={{ value: 'Thermal Cond. (W/m·K)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                  <ReferenceLine y={100} stroke="#22C55E" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Good Conductor', fill: '#22C55E', fontSize: 12 }} />
                  <ReferenceLine y={1} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Insulator', fill: '#EF4444', fontSize: 12 }} />
                  <Line data={thermalAnalysis.fitData} type="monotone" dataKey="kFit" stroke="#4A9EFF" strokeWidth={2} dot={false} name="Fit" />
                  <Scatter data={kVsTData} dataKey="k" fill="#F59E0B" name="Data Points" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Electrical */}
      {activeTab === 'Electrical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2">
              <h2 className="text-lg font-bold text-[#F1F5F9]">Electrical Properties</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${elecClass.color} text-white`}>{elecClass.label}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Resistivity ρ (Ω·m)</label>
                <input type="number" step="any" value={elecInputs.rho} onChange={e => handleElecChange('rho', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Conductivity σ (S/m)</label>
                <input type="number" step="any" value={elecInputs.sigma} onChange={e => handleElecChange('sigma', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Dielectric Constant (εr)</label>
                <input type="number" step="any" value={elecInputs.er} onChange={e => handleElecChange('er', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Breakdown Volts (kV/mm)</label>
                <input type="number" step="any" value={elecInputs.vbd} onChange={e => handleElecChange('vbd', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
            </div>

            <div className="pt-4 border-t border-[#2D3F50]">
              <h3 className="text-sm font-medium text-[#4A9EFF] mb-3">Carrier Properties</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Carrier Density n (1/m³)</label>
                    <input type="number" step="any" value={elecInputs.n} onChange={e => handleElecChange('n', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Mobility μ (m²/V·s)</label>
                    <input type="number" step="any" value={elecInputs.mu} onChange={e => handleElecChange('mu', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                 </div>
              </div>
              <div className="mt-2 text-xs text-[#94A3B8]">
                Theoretical σ = n·q·μ = <span className="text-[#F1F5F9]">{elecAnalysis.sigma_theo} S/m</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2D3F50]">
              <h3 className="text-sm font-medium text-[#4A9EFF] mb-4">Resistivity Scale</h3>
              <div className="relative h-8 bg-gradient-to-r from-[#22C55E] via-[#F59E0B] to-[#EF4444] rounded-md overflow-hidden">
                {/* Log scale marker approximation */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_5px_rgba(0,0,0,0.5)]" 
                  style={{ left: `${Math.max(0, Math.min(100, (Math.log10(elecInputs.rho) + 8) * (100/24)))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
                <span>10⁻⁸ (Conductor)</span>
                <span>10⁴ (Semiconductor)</span>
                <span>10¹⁶ (Insulator)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4 flex flex-col">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Temperature Dependence</h2>
            
            <div className="flex gap-4 mb-2">
               <div className="flex-1">
                 <label className="block text-sm text-[#94A3B8] mb-1">Conduction Model</label>
                 <select 
                    value={elecInputs.model} 
                    onChange={e => handleElecChange('model', e.target.value)}
                    className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                 >
                    <option value="Metal">Metal (Linear)</option>
                    <option value="Semiconductor">Semiconductor (Exponential)</option>
                 </select>
               </div>
               <div className="flex-1">
                 {elecInputs.model === 'Metal' ? (
                    <>
                      <label className="block text-sm text-[#94A3B8] mb-1">Temp Coeff α (1/K)</label>
                      <input type="number" step="any" value={elecInputs.alpha} onChange={e => handleElecChange('alpha', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </>
                 ) : (
                    <>
                      <label className="block text-sm text-[#94A3B8] mb-1">Band Gap Eg (eV)</label>
                      <input type="number" step="any" value={elecInputs.Eg} onChange={e => handleElecChange('Eg', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </>
                 )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.entries({ t0: 'Ref Temp T₀ (°C)', t: 'Target Temp T (°C)' }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                  <input type="number" step="any" value={elecInputs[key]} onChange={e => handleElecChange(key, e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
              ))}
            </div>

            <div className="flex-1 min-h-[250px] mt-4">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={elecAnalysis.data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                   <XAxis dataKey="temp" type="number" stroke="#94A3B8" label={{ value: 'Temperature (°C)', position: 'bottom', fill: '#94A3B8' }} />
                   <YAxis stroke="#94A3B8" label={{ value: 'Resistivity (Ω·m)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} scale="log" domain={['auto', 'auto']} />
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} 
                      formatter={(val) => val.toExponential(2)}
                   />
                   <Line type="monotone" dataKey="rho" stroke="#4A9EFF" strokeWidth={2} dot={false} />
                   <ReferenceDot x={elecInputs.t} y={elecAnalysis.currentRho} r={5} fill="#F59E0B" stroke="none" />
                 </LineChart>
               </ResponsiveContainer>
            </div>

            <div className="mt-2 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
              <h3 className="text-sm text-[#94A3B8] mb-2">Resistivity at {elecInputs.t}°C</h3>
              <div className="text-2xl font-bold text-[#4A9EFF]">{elecAnalysis.currentRho.toExponential(2)} Ω·m</div>
              <p className="text-xs text-[#94A3B8] mt-2">
                {elecInputs.model === 'Metal' ? 'ρ(T) = ρ₀[1 + α(T-T₀)]' : 'ρ(T) ∝ exp(Eg/2kT)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Magnetic */}
      {activeTab === 'Magnetic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2">
              <h2 className="text-lg font-bold text-[#F1F5F9]">Magnetic Params</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries({ ur: 'Relative Perm. μr', ms: 'Saturation Ms (A/m)', hc: 'Coercivity Hc (A/m)', br: 'Remanence Br (T)', tc: 'Curie Temp Tc (°C)' }).map(([key, label]) => (
                <div key={key} className={key === 'ur' ? 'col-span-2' : ''}>
                  <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                  <input type="number" step="any" value={magInputs[key]} onChange={e => setMagInputs({...magInputs, [key]: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md space-y-2">
              <h3 className="text-sm text-[#94A3B8] mb-2">Calculated Properties</h3>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9] text-sm">Sat. Induction Bs:</span>
                <span className="font-bold text-[#4A9EFF]">{magAnalysis.Bs.toFixed(2)} T</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9] text-sm">Abs. Permeability μ:</span>
                <span className="font-bold text-[#4A9EFF]">{magAnalysis.mu.toExponential(2)} H/m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9] text-sm">Energy Prod. BHmax:</span>
                <span className="font-bold text-[#F59E0B]">{magAnalysis.BHmax.toExponential(2)} J/m³</span>
              </div>
            </div>

            <div className="mt-2 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
              <h3 className="text-sm text-[#94A3B8] mb-2">Classification</h3>
              <span className={`inline-block px-4 py-2 rounded-md font-bold text-white ${magClass.color}`}>{magClass.label}</span>
            </div>
          </div>
          
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">B-H Hysteresis Loop Sketch</h2>
            <div className="flex-1 min-h-[300px]">
              {hysteresisData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={hysteresisData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                    <XAxis dataKey="h" type="number" stroke="#94A3B8" label={{ value: 'Field Strength H (A/m)', position: 'bottom', fill: '#94A3B8' }} />
                    <YAxis stroke="#94A3B8" label={{ value: 'Induction B (T)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                    <Legend />
                    <ReferenceLine x={0} stroke="#94A3B8" />
                    <ReferenceLine y={0} stroke="#94A3B8" />
                    <Line type="monotone" dataKey="bAsc" stroke="#4A9EFF" strokeWidth={2} dot={false} name="Ascending" />
                    <Line type="monotone" dataKey="bDesc" stroke="#EF4444" strokeWidth={2} dot={false} name="Descending" />
                    <Line type="monotone" dataKey="bInit" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Initial" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-[#94A3B8]">
                  Enter Ms and Hc to generate loop
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Optical */}
      {activeTab === 'Optical' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 space-y-4">
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
              <h3 className="text-sm text-[#94A3B8] mb-2">Calculated Properties (at 550nm)</h3>
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
            <div className="pt-4 border-t border-[#2D3F50]">
              <h3 className="text-sm font-medium text-[#4A9EFF] mb-3">R + T + A = 100%</h3>
              {Object.entries({ r: 'Reflectance R (%)', t: 'Transmittance T (%)', a: 'Absorbance A (%)' }).map(([key, label]) => (
                <div key={key} className="mb-3">
                  <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                  <input type="number" step="any" value={optInputs[key]} onChange={e => setOptInputs({...optInputs, [key]: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
              ))}
              {!optValid && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/50 text-[#EF4444] p-3 rounded-md flex items-start gap-2 mt-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-xs">Sum is {optSum}%. Must equal 100%.</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Reflectance vs Wavelength</h2>
            <div className="flex gap-2 mb-4">
              <input type="number" placeholder="Wavelength (nm)" value={newOptPoint.wl} onChange={e => setNewOptPoint({...newOptPoint, wl: e.target.value})} className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              <input type="number" placeholder="Reflectance (%)" value={newOptPoint.r} onChange={e => setNewOptPoint({...newOptPoint, r: e.target.value})} className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              <button onClick={addOptPoint} className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"><Plus size={16} /> Add</button>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                  <XAxis dataKey="wl" type="number" domain={[300, 1000]} stroke="#94A3B8" label={{ value: 'Wavelength (nm)', position: 'bottom', fill: '#94A3B8' }} />
                  <YAxis stroke="#94A3B8" domain={[0, 100]} label={{ value: 'Reflectance (%)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                  <Legend />
                  <Area data={optAnalysis.spectrum} type="monotone" dataKey="rTheo" stroke="#4A9EFF" fill="#4A9EFF" fillOpacity={0.1} name="Theoretical" />
                  <Scatter data={optData} dataKey="r" fill="#F59E0B" name="Experimental" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Crystal */}
      {activeTab === 'Crystal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Lattice Parameters</h2>
            
            <div className="mb-4">
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
                  setCrystInputs({...crystInputs, sys: e.target.value});
                  setSelectedCrystPreset('Custom');
                }}
                className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
              >
                {['SC', 'BCC', 'FCC', 'HCP', 'DC'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
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
            <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">X-ray λ (Å)</label>
                  <input type="number" step="any" value={crystInputs.lambda} onChange={e => setCrystInputs({...crystInputs, lambda: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
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
          
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col gap-6">
             <div className="flex-1 min-h-[250px] flex flex-col">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Simulated XRD Pattern (Cu Kα)</h2>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={crystAnalysis.peaks} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                            <XAxis dataKey="angle" type="number" domain={['auto', 'auto']} stroke="#94A3B8" label={{ value: '2θ (degrees)', position: 'bottom', fill: '#94A3B8' }} />
                            <YAxis stroke="#94A3B8" label={{ value: 'Intensity (a.u.)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }}
                                labelFormatter={(label) => `2θ: ${label}°`}
                            />
                            <Bar dataKey="intensity" fill="#4A9EFF" barSize={4} name="Peak Intensity" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
             </div>

             <div className="h-[200px] w-full bg-[#0F1923] border border-[#2D3F50] rounded-md p-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-2 left-2 text-xs text-[#94A3B8]">Unit Cell Visualization (2D Projection)</div>
                {renderUnitCell()}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
