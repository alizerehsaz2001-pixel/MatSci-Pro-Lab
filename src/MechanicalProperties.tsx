import React, { useState, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, ScatterChart, Scatter, ZAxis, ComposedChart } from 'recharts';
import { Download, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';

const TABS = [
  'Stress-Strain',
  'Hardness',
  'Fatigue',
  'Creep',
  'Impact & Fracture',
  'Calculators'
];

const MATERIAL_PRESETS = {
  'Structural Steel': { E: 200, Sy: 250, UTS: 400, eu: 10, ef: 20, nu: 0.3 },
  'Aluminum 6061-T6': { E: 69, Sy: 276, UTS: 310, eu: 12, ef: 17, nu: 0.33 },
  'Titanium Ti-6Al-4V': { E: 114, Sy: 880, UTS: 950, eu: 14, ef: 14, nu: 0.34 },
  'Copper (Annealed)': { E: 110, Sy: 70, UTS: 220, eu: 45, ef: 50, nu: 0.34 }
};

export default function MechanicalProperties({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const exportChart = (chartId, filename) => {
    const svg = document.querySelector(`#${chartId} svg`);
    if (!svg) {
      addToast('Chart not found for export', 'error');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = svg.clientWidth || 800;
      canvas.height = svg.clientHeight || 400;
      ctx.fillStyle = "#1A2634";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `${filename}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      addToast('Chart exported successfully');
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // --- SUB-MODULE 1: Stress-Strain ---
  const [ssInputs, setSsInputs] = useState(MATERIAL_PRESETS['Structural Steel']);
  const [selectedPreset, setSelectedPreset] = useState('Structural Steel');
  const [ssType, setSsType] = useState('engineering'); // 'engineering' or 'true'

  const ssData = useMemo(() => {
    const { E, Sy, UTS, eu, ef } = ssInputs;
    const data = [];
    const yieldStrainAbs = Sy / (E * 1000); // E in GPa, Sy in MPa
    const yieldStrain = yieldStrainAbs * 100; // %
    
    // Validate inputs to prevent chart errors
    const safeEu = Math.max(eu, yieldStrain + 0.1);
    const safeEf = Math.max(ef, safeEu + 0.1);

    // Generate points
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let strain = t * safeEf; // %
      let strainAbs = strain / 100;
      let stress = 0;
      
      if (strainAbs <= yieldStrainAbs) {
        // Elastic Region: Hooke's Law
        stress = strainAbs * (E * 1000);
      } else if (strain <= safeEu) {
        // Plastic Region (Yield to UTS): Parabolic fit with vertex at (eu, UTS)
        // Sigma = UTS - A * (eu - e)^2
        // Match at yield: Sy = UTS - A * (eu - ey)^2  => A = (UTS - Sy) / (eu - ey)^2
        const A = (UTS - Sy) / Math.pow(safeEu - yieldStrain, 2);
        stress = UTS - A * Math.pow(safeEu - strain, 2);
      } else {
        // Necking Region (UTS to Fracture): Parabolic drop
        // Assume stress drops to fracture stress. Let's estimate fracture stress or use a fixed drop.
        // Using the previous logic of ~15% drop, or just a smooth continuation.
        // Let's model a simple drop: Sigma = UTS - B * (e - eu)^2
        // Let's assume fracture stress is roughly (Sy + UTS)/2 for ductility, or just 0.85 * UTS as before.
        const fractureStress = UTS * 0.85; 
        const B = (UTS - fractureStress) / Math.pow(safeEf - safeEu, 2);
        stress = UTS - B * Math.pow(strain - safeEu, 2);
      }

      const trueStrain = Math.log(1 + strainAbs);
      const trueStress = stress * (1 + strainAbs);

      data.push({
        strain: strain,
        stress: stress,
        trueStrain: trueStrain * 100,
        trueStress: trueStress
      });
    }
    return data;
  }, [ssInputs]);

  const ssResults = useMemo(() => {
    const { E, Sy, UTS, eu, ef } = ssInputs;
    const yieldStrainAbs = Sy / (E * 1000);
    
    // Modulus of Resilience: Area under elastic region (1/2 * stress * strain)
    // Units: MPa * (mm/mm) = MJ/m^3
    const Ur = 0.5 * Sy * yieldStrainAbs;

    // Modulus of Toughness: Area under the entire curve
    // Approximate using trapezoidal rule on the generated data
    let toughness = 0;
    for (let i = 0; i < ssData.length - 1; i++) {
      const p1 = ssData[i];
      const p2 = ssData[i+1];
      const avgStress = (p1.stress + p2.stress) / 2;
      const dStrain = (p2.strain - p1.strain) / 100; // Convert % back to absolute
      toughness += avgStress * dStrain;
    }

    return {
      Ur: Ur.toFixed(4),
      Toughness: toughness.toFixed(2),
      YieldStrain: (yieldStrainAbs * 100).toFixed(3)
    };
  }, [ssInputs, ssData]);

  // --- SUB-MODULE 2: Hardness ---
  const [hardInput, setHardInput] = useState({ value: 200, scale: 'HV', materialClass: 'Steel' });
  
  const hardnessConversions = useMemo(() => {
    let hv = 0;
    const { value, scale, materialClass } = hardInput;
    
    // 1. Normalize input to Vickers (HV) as the base unit
    // Note: These are approximate base conversions. ASTM E140 is non-linear.
    if (scale === 'HV') hv = value;
    else if (scale === 'HB') hv = value; // HB is roughly equal to HV < 400, diverges slightly above.
    else if (scale === 'HRC') {
      // HRC to HV (Steel)
      if (value < 20) hv = 240; 
      else hv = 115 * Math.exp(0.024 * value); // Exponential fit for HRC 20-65
    }
    else if (scale === 'HRB') hv = 2.6 * value - 110; // Rough linear fit for HRB 40-100
    else if (scale === 'HK') hv = value; // Knoop is similar to Vickers
    
    // Refine HV based on material class if needed (simplified for this demo)
    
    const isPolymer = scale === 'Shore A' || scale === 'Shore D';
    if (isPolymer) {
      return {
        HV: 'N/A', HB: 'N/A', HRC: 'N/A', HRB: 'N/A', HK: 'N/A',
        ShoreA: scale === 'Shore A' ? value : 'N/A',
        ShoreD: scale === 'Shore D' ? value : 'N/A',
        UTS_Est: 'N/A',
        warning: 'Shore scales do not convert to metal hardness scales.'
      };
    }

    // 2. Convert HV to other scales using ASTM E140 approximations
    // Steel is the default standard for most HRC/HRB conversions
    let hb = hv; // HB ≈ HV
    let hrc = 0;
    let hrb = 0;
    let uts = 0;

    if (materialClass === 'Steel') {
      // HV to HRC (Steel)
      if (hv >= 240) hrc = 41.6 * Math.log(hv) - 228; // Logarithmic fit
      // HV to HRB (Steel)
      if (hv >= 85 && hv <= 240) hrb = 0.38 * hv + 42;
      
      // UTS Estimation (Steel): UTS (MPa) ≈ 3.2 to 3.45 * HB
      uts = 3.45 * hb;
    } else if (materialClass === 'Aluminum') {
      // Aluminum conversions are different
      // UTS (MPa) ≈ 0.25 * HB (kg/mm2) * 9.81 ?? No, typically UTS (MPa) ~ 3.5 * HB is for steel.
      // For Al-6061: HB 95 -> UTS 310 (Ratio ~3.26)
      uts = 3.3 * hb;
      // Aluminum rarely uses HRC, mostly HRB or HRF.
      if (hv > 40) hrb = 0.45 * hv + 10; 
    } else if (materialClass === 'Copper') {
      uts = 3.5 * hb; // Rough approx
      if (hv > 40) hrb = 0.4 * hv + 20;
    }

    // Clamping and formatting
    return {
      HV: Math.round(hv),
      HB: Math.round(hb),
      HRC: hrc > 0 && hrc < 70 ? Math.round(hrc) : (hrc >= 70 ? '> 70' : '< 20'),
      HRB: hrb > 0 && hrb < 100 ? Math.round(hrb) : (hrb >= 100 ? '> 100' : '< 0'),
      HK: Math.round(hv * 1.05), // Knoop usually slightly higher
      ShoreA: 'N/A',
      ShoreD: 'N/A',
      UTS_Est: Math.round(uts),
      warning: (hv < 50 || hv > 1000) ? 'Value is outside typical reliable conversion ranges.' : null
    };
  }, [hardInput]);

  // --- SUB-MODULE 3: Fatigue ---
  const [fatigueInputs, setFatigueInputs] = useState({ UTS: 600, Sy: 450, Se: 300, b: -0.08, appliedAmp: 200, appliedMean: 50 });
  const [meanStressModel, setMeanStressModel] = useState('Goodman'); // 'Goodman', 'Gerber', 'Soderberg'

  const fatigueData = useMemo(() => {
    const { UTS, Se, b } = fatigueInputs;
    const data = [];
    const a = Math.pow(0.9 * UTS, 2) / Se; // Basquin coefficient approx
    
    for (let i = 3; i <= 8; i += 0.2) {
      const N = Math.pow(10, i);
      // S = a * N^b
      let S = a * Math.pow(N, b);
      if (S < Se) S = Se; // Endurance limit
      if (S > UTS) S = UTS;
      data.push({ cycles: N, stress: S });
    }
    return data;
  }, [fatigueInputs]);

  const fatigueResult = useMemo(() => {
    const { UTS, Sy, Se, b, appliedAmp, appliedMean } = fatigueInputs;
    
    // 1. Calculate Equivalent Alternating Stress (Seq) based on Mean Stress Correction
    let Seq = appliedAmp;
    
    if (appliedMean > 0) {
      if (meanStressModel === 'Goodman') {
        // Goodman: Sa / Se + Sm / UTS = 1/n
        // Equivalent fully reversed stress: Seq = Sa / (1 - Sm/UTS)
        Seq = appliedAmp / (1 - (appliedMean / UTS));
      } else if (meanStressModel === 'Gerber') {
        // Gerber: Sa / Se + (Sm / UTS)^2 = 1/n
        // Seq = Sa / (1 - (Sm/UTS)^2)
        Seq = appliedAmp / (1 - Math.pow(appliedMean / UTS, 2));
      } else if (meanStressModel === 'Soderberg') {
        // Soderberg: Sa / Se + Sm / Sy = 1/n
        // Seq = Sa / (1 - Sm/Sy)
        Seq = appliedAmp / (1 - (appliedMean / Sy));
      }
    }

    // Safety Factor (Infinite Life)
    // n = Se / Seq
    const safety = Se / Seq;

    // Life Estimation (if finite)
    // Seq = a * N^b  => N = (Seq / a)^(1/b)
    let cycles = 'Infinite';
    if (Seq > Se) {
      const a = Math.pow(0.9 * UTS, 2) / Se;
      const N = Math.pow(Seq / a, 1 / b);
      cycles = N.toExponential(2);
    }

    return { 
      cycles, 
      safety: Math.max(0, safety), // Prevent negative safety factors if mean stress > UTS
      Seq: Seq.toFixed(1)
    };
  }, [fatigueInputs, meanStressModel]);

  // --- SUB-MODULE 4: Creep ---
  const [creepInputs, setCreepInputs] = useState({ 
    stress: 150, 
    temp: 600, 
    time: 10000, 
    A: 1.5e-10, // Material constant (1/h/MPa^n)
    n: 4.5, // Stress exponent
    Q: 280000, // Activation Energy (J/mol)
    C: 20 // Larson-Miller Constant
  });
  
  const creepData = useMemo(() => {
    const { stress, temp, time, A, n, Q } = creepInputs;
    const data = [];
    const R = 8.314; // Gas constant J/(mol*K)
    const T_K = temp + 273.15;
    
    // Norton Power Law for Secondary Creep Rate: edot = A * sigma^n * exp(-Q/RT)
    const edot = A * Math.pow(stress, n) * Math.exp(-Q / (R * T_K));
    
    // Primary Creep Approximation (Transient)
    // e_primary = e0 * (1 - exp(-k*t))
    // Let's assume primary strain is roughly 10% of secondary strain at 1000h for visualization
    const e0 = edot * 500; 
    
    for (let t = 0; t <= time; t += time / 50) {
      // Primary + Secondary
      const primary = e0 * (1 - Math.exp(-0.005 * t));
      const secondary = edot * t;
      
      // Tertiary (Exponential rise near rupture) - simplified model
      // Only show tertiary if strain gets very high (>10%)
      let tertiary = 0;
      if (secondary > 0.08) {
         tertiary = 0.0001 * Math.exp(10 * (secondary - 0.08));
      }

      data.push({ time: t, strain: (primary + secondary + tertiary) * 100 });
    }
    return { data, rate: edot };
  }, [creepInputs]);

  const creepResults = useMemo(() => {
    const { temp, stress, C } = creepInputs;
    const T_K = temp + 273.15;
    
    // Larson-Miller Parameter (LMP) Calculation
    // LMP = T(C + log tr) / 1000
    // We need to estimate Rupture Time (tr) first or calculate LMP from Stress?
    // Usually LMP is a function of Stress. Let's use a simple correlation for a generic alloy (e.g., steel)
    // LMP = 25 - 0.03 * Stress (Very rough approx for visualization)
    // Or better: log(tr) = LMP*1000/T - C
    
    // Let's use a generic LMP vs Stress correlation: LMP = 22000 - 40 * Stress
    const LMP_calc = 22000 - 20 * stress; 
    
    // Calculate Rupture Time
    // LMP = T * (C + log10(tr))
    // log10(tr) = LMP / T - C
    const log_tr = LMP_calc / T_K - C;
    const tr = Math.pow(10, log_tr);

    return {
      rate: (creepData.rate * 100).toExponential(2), // %/h
      ruptureTime: tr > 1e6 ? '> 1,000,000' : Math.round(tr).toLocaleString(),
      LMP: (LMP_calc / 1000).toFixed(2)
    };
  }, [creepInputs, creepData]);

  // --- SUB-MODULE 5: Impact & Fracture ---
  const [impactLogs, setImpactLogs] = useState([
    { id: 1, temp: -196, energy: 5 },
    { id: 2, temp: -100, energy: 12 },
    { id: 3, temp: -40, energy: 25 },
    { id: 4, temp: 0, energy: 80 },
    { id: 5, temp: 25, energy: 110 },
    { id: 6, temp: 100, energy: 120 }
  ]);
  const [impactInput, setImpactInput] = useState({ temp: 0, energy: 0 });
  
  // Fracture States
  const [fractureMode, setFractureMode] = useState('calculator'); // 'calculator' (KIC) or 'critical' (ac)
  const [kicInput, setKicInput] = useState({ load: 25, thickness: 0.025, width: 0.05, crack: 0.025, span: 0.2 }); // Added span for SENB
  const [specimenType, setSpecimenType] = useState('CT'); // 'CT' or 'SENB'
  const [critCrackInput, setCritCrackInput] = useState({ KIC: 50, stress: 300, Y: 1.12 });

  const addImpactLog = () => {
    if (impactInput.energy < 0) return;
    setImpactLogs(prev => [...prev, { id: Date.now(), ...impactInput }].sort((a, b) => a.temp - b.temp));
    setImpactInput({ temp: 0, energy: 0 });
  };

  const impactAnalysis = useMemo(() => {
    if (impactLogs.length < 3) return { dbtt: 'N/A', curve: [] };

    const energies = impactLogs.map(l => l.energy);
    const temps = impactLogs.map(l => l.temp);
    const minE = Math.min(...energies);
    const maxE = Math.max(...energies);
    const avgE = (minE + maxE) / 2;

    // Estimate DBTT: Find temp where energy crosses avgE
    // Simple linear interpolation between the two points straddling avgE
    let dbtt = null;
    for (let i = 0; i < impactLogs.length - 1; i++) {
      if ((impactLogs[i].energy <= avgE && impactLogs[i+1].energy >= avgE) || 
          (impactLogs[i].energy >= avgE && impactLogs[i+1].energy <= avgE)) {
        const t1 = impactLogs[i].temp;
        const t2 = impactLogs[i+1].temp;
        const e1 = impactLogs[i].energy;
        const e2 = impactLogs[i+1].energy;
        dbtt = t1 + (avgE - e1) * (t2 - t1) / (e2 - e1);
        break;
      }
    }

    // Generate Sigmoid Curve for visualization
    // E = Lower + (Upper - Lower) / (1 + exp((DBTT - T) / k))
    // We estimate 'k' (transition width) roughly from data spread
    const k = 20; // heuristic width factor
    const curve = [];
    const tMin = Math.min(...temps) - 50;
    const tMax = Math.max(...temps) + 50;
    
    if (dbtt !== null) {
      for (let t = tMin; t <= tMax; t += 5) {
        const fitEnergy = minE + (maxE - minE) / (1 + Math.exp((dbtt - t) / k));
        curve.push({ temp: t, fitEnergy });
      }
    }

    return { 
      dbtt: dbtt !== null ? Math.round(dbtt) : 'N/A', 
      upperShelf: maxE,
      lowerShelf: minE,
      curve 
    };
  }, [impactLogs]);

  const kicResult = useMemo(() => {
    const { load, thickness, width, crack, span } = kicInput;
    const aW = crack / width;
    if (aW < 0.1 || aW > 0.9) return 'Invalid a/W';

    // Load P in kN -> N
    const P = load * 1000;
    // Dimensions in m
    
    let K = 0; // MPa*m^0.5

    if (specimenType === 'CT') {
      // Compact Tension
      // K = (P / (B * W^0.5)) * f(a/W)
      const f = (2 + aW) * (0.886 + 4.64*aW - 13.32*aW*aW + 14.72*Math.pow(aW, 3) - 5.6*Math.pow(aW, 4)) / Math.pow(1 - aW, 1.5);
      K = (P / (thickness * Math.sqrt(width))) * f;
    } else {
      // SENB (Single Edge Notch Bend)
      // K = (P * S / (B * W^1.5)) * f(a/W)
      // f(x) = 3x^0.5 [1.99 - x(1-x)(2.15 - 3.93x + 2.7x^2)] / [2(1+2x)(1-x)^1.5]
      const x = aW;
      const f = (3 * Math.sqrt(x) * (1.99 - x*(1-x)*(2.15 - 3.93*x + 2.7*x*x))) / (2 * (1 + 2*x) * Math.pow(1-x, 1.5));
      K = (P * span / (thickness * Math.pow(width, 1.5))) * f;
    }

    // Convert Pa*m^0.5 to MPa*m^0.5
    return (K / 1e6).toFixed(2);
  }, [kicInput, specimenType]);

  const critCrackResult = useMemo(() => {
    const { KIC, stress, Y } = critCrackInput;
    // ac = (1/pi) * (KIC / (Y * stress))^2
    // KIC in MPa m^0.5, Stress in MPa -> ac in meters
    if (stress <= 0 || Y <= 0) return 0;
    const ac = (1 / Math.PI) * Math.pow(KIC / (Y * stress), 2);
    return (ac * 1000).toFixed(2); // Convert to mm
  }, [critCrackInput]);

  // --- SUB-MODULE 6: Calculators ---
  const [calcMode, setCalcMode] = useState('Elastic'); // 'Elastic', 'Mohr', 'Thermal'
  const [calcInput, setCalcInput] = useState({ E: 200, nu: 0.3, Sy: 250, stress: 150, Kt: 2.5 });
  const [mohrInput, setMohrInput] = useState({ sigX: 50, sigY: 10, tauXY: 20 });
  const [thermStressInput, setThermStressInput] = useState({ E: 200, alpha: 23, dT: 50, constraint: 100 });

  const calcResults = useMemo(() => {
    const { E, nu, Sy, stress, Kt } = calcInput;
    return {
      G: (E / (2 * (1 + nu))).toFixed(2),
      K: (E / (3 * (1 - 2 * nu))).toFixed(2),
      SF: (Sy / stress).toFixed(2),
      MaxStress: (stress * Kt).toFixed(2)
    };
  }, [calcInput]);

  const mohrResults = useMemo(() => {
    const { sigX, sigY, tauXY } = mohrInput;
    const avg = (sigX + sigY) / 2;
    const R = Math.sqrt(Math.pow((sigX - sigY)/2, 2) + Math.pow(tauXY, 2));
    return {
      sig1: (avg + R).toFixed(2),
      sig2: (avg - R).toFixed(2),
      tauMax: R.toFixed(2),
      thetaP: ((Math.atan2(2 * tauXY, sigX - sigY) * 180 / Math.PI) / 2).toFixed(2)
    };
  }, [mohrInput]);

  const thermResults = useMemo(() => {
    const { E, alpha, dT, constraint } = thermStressInput;
    // sigma = E * alpha * dT * (constraint/100)
    // E in GPa -> MPa (*1000), alpha in 1e-6
    const stress = (E * 1000) * (alpha * 1e-6) * dT * (constraint / 100);
    return stress.toFixed(2);
  }, [thermStressInput]);


  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 min-w-[300px] ${t.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Mechanical Properties Analysis</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Advanced calculators and visualizations for materials engineering</p>
        
        <div className="flex overflow-x-auto gap-2 mt-6 pb-2 border-b border-[#2D3F50] scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-[#4A9EFF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#2D3F50]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* TAB 1: Stress-Strain */}
        {activeTab === 'Stress-Strain' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Material Parameters</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-[#94A3B8] mb-1">Material Preset</label>
                <select 
                  value={selectedPreset} 
                  onChange={(e) => {
                    const preset = e.target.value;
                    setSelectedPreset(preset);
                    if (MATERIAL_PRESETS[preset]) {
                      setSsInputs(MATERIAL_PRESETS[preset]);
                    }
                  }}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                >
                  {Object.keys(MATERIAL_PRESETS).map(key => <option key={key} value={key}>{key}</option>)}
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries({ E: 'Young\'s Modulus (GPa)', Sy: 'Yield Strength (MPa)', UTS: 'Ultimate Tensile Strength (MPa)', eu: 'Uniform Elongation (%)', ef: 'Fracture Strain (%)', nu: 'Poisson\'s Ratio' }).map(([key, label]) => (
                  <div key={key} className={key === 'UTS' || key === 'nu' ? '' : ''}>
                    <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                    <input 
                      type="number" 
                      value={ssInputs[key]} 
                      onChange={e => {
                        setSsInputs({...ssInputs, [key]: Number(e.target.value)});
                        setSelectedPreset('Custom');
                      }}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md space-y-2">
                <h3 className="text-sm text-[#94A3B8] font-medium border-b border-[#2D3F50] pb-1 mb-2">Calculated Properties</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#F1F5F9]">Yield Strain:</span>
                  <span className="font-mono text-[#4A9EFF]">{ssResults.YieldStrain}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#F1F5F9]">Modulus of Resilience:</span>
                  <span className="font-mono text-[#4A9EFF]">{ssResults.Ur} MJ/m³</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#F1F5F9]">Modulus of Toughness:</span>
                  <span className="font-mono text-[#4A9EFF]">{ssResults.Toughness} MJ/m³</span>
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button onClick={() => setSsType('engineering')} className={`flex-1 py-2 rounded-md text-sm transition-colors ${ssType === 'engineering' ? 'bg-[#4A9EFF] text-white' : 'bg-[#0F1923] text-[#94A3B8] border border-[#2D3F50]'}`}>Engineering</button>
                <button onClick={() => setSsType('true')} className={`flex-1 py-2 rounded-md text-sm transition-colors ${ssType === 'true' ? 'bg-[#4A9EFF] text-white' : 'bg-[#0F1923] text-[#94A3B8] border border-[#2D3F50]'}`}>True</button>
              </div>
            </div>
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Stress-Strain Curve</h2>
                <button onClick={() => exportChart('ss-chart', 'stress-strain')} className="text-[#4A9EFF] hover:text-blue-400 flex items-center gap-2 text-sm">
                  <Download size={16} /> Export PNG
                </button>
              </div>
              <div id="ss-chart" className="flex-1 min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ssData} margin={{ top: 30, right: 30, left: 60, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                    <XAxis dataKey={ssType === 'engineering' ? 'strain' : 'trueStrain'} type="number" stroke="#94A3B8" label={{ value: 'Strain (%)', position: 'bottom', offset: 0, fill: '#94A3B8' }} />
                    <YAxis stroke="#94A3B8" label={{ value: 'Stress (MPa)', angle: -90, position: 'insideLeft', offset: -10, fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} formatter={(value) => value.toFixed(2)} />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey={ssType === 'engineering' ? 'stress' : 'trueStress'} name={`${ssType === 'engineering' ? 'Eng.' : 'True'} Stress`} stroke="#4A9EFF" strokeWidth={3} dot={false} />
                    
                    {/* Reference Dots */}
                    {ssType === 'engineering' ? (
                      <>
                        <ReferenceDot x={Number(ssResults.YieldStrain)} y={ssInputs.Sy} r={5} fill="#F59E0B" stroke="none" label={{ value: 'Yield', position: 'top', fill: '#F59E0B', fontSize: 12 }} />
                        <ReferenceDot x={ssInputs.eu} y={ssInputs.UTS} r={5} fill="#EF4444" stroke="none" label={{ value: 'UTS', position: 'top', fill: '#EF4444', fontSize: 12 }} />
                      </>
                    ) : (
                      <>
                        <ReferenceDot 
                          x={Math.log(1 + Number(ssResults.YieldStrain)/100) * 100} 
                          y={ssInputs.Sy * (1 + Number(ssResults.YieldStrain)/100)} 
                          r={5} fill="#F59E0B" stroke="none" label={{ value: 'Yield', position: 'top', fill: '#F59E0B', fontSize: 12 }} 
                        />
                        <ReferenceDot 
                          x={Math.log(1 + ssInputs.eu/100) * 100} 
                          y={ssInputs.UTS * (1 + ssInputs.eu/100)} 
                          r={5} fill="#EF4444" stroke="none" label={{ value: 'UTS', position: 'top', fill: '#EF4444', fontSize: 12 }} 
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Hardness */}
        {activeTab === 'Hardness' && (
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-6">Hardness Converter</h2>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <label className="block text-sm text-[#94A3B8] mb-1">Value</label>
                <input 
                  type="number" 
                  value={hardInput.value} 
                  onChange={e => setHardInput({...hardInput, value: Number(e.target.value)})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-lg" 
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-[#94A3B8] mb-1">Scale</label>
                <select 
                  value={hardInput.scale} 
                  onChange={e => setHardInput({...hardInput, scale: e.target.value})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-lg"
                >
                  {['HV', 'HB', 'HRC', 'HRB', 'HK', 'Shore A', 'Shore D'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-[#94A3B8] mb-1">Material Class</label>
                <select 
                  value={hardInput.materialClass} 
                  onChange={e => setHardInput({...hardInput, materialClass: e.target.value})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-lg"
                >
                  {['Steel', 'Aluminum', 'Copper'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {hardnessConversions.warning && (
              <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/50 text-[#F59E0B] p-4 rounded-md flex items-start gap-3 mb-6">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">{hardnessConversions.warning}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(hardnessConversions).filter(([k]) => k !== 'warning' && k !== 'UTS_Est').map(([scale, val]) => (
                <div key={scale} className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md text-center">
                  <div className="text-[#94A3B8] text-sm mb-1">{scale}</div>
                  <div className={`text-xl font-bold ${typeof val === 'string' && val.includes('Out') ? 'text-[#EF4444] text-sm' : 'text-[#F1F5F9]'}`}>{val}</div>
                </div>
              ))}
              
              {/* Estimated UTS Card */}
              <div className="col-span-2 sm:col-span-4 bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md flex items-center justify-between px-8 mt-2">
                <div>
                  <div className="text-[#4A9EFF] font-medium">Estimated Tensile Strength (UTS)</div>
                  <div className="text-xs text-[#94A3B8]">Approximate correlation based on {hardInput.materialClass}</div>
                </div>
                <div className="text-2xl font-bold text-[#F1F5F9]">{hardnessConversions.UTS_Est} <span className="text-sm font-normal text-[#94A3B8]">MPa</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Fatigue */}
        {activeTab === 'Fatigue' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Fatigue Parameters</h2>
              
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Ultimate Tensile Strength (UTS) [MPa]</label>
                <input type="number" value={fatigueInputs.UTS} onChange={e => setFatigueInputs({...fatigueInputs, UTS: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Yield Strength (Sy) [MPa]</label>
                <input type="number" value={fatigueInputs.Sy} onChange={e => setFatigueInputs({...fatigueInputs, Sy: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Endurance Limit (Se) [MPa]</label>
                <input type="number" value={fatigueInputs.Se} onChange={e => setFatigueInputs({...fatigueInputs, Se: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Basquin Exponent (b)</label>
                <input type="number" step="0.01" value={fatigueInputs.b} onChange={e => setFatigueInputs({...fatigueInputs, b: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>

              <div className="pt-4 border-t border-[#2D3F50]">
                <h3 className="text-sm font-medium text-[#4A9EFF] mb-3">Loading Conditions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Alternating Stress (σa)</label>
                    <input type="number" value={fatigueInputs.appliedAmp} onChange={e => setFatigueInputs({...fatigueInputs, appliedAmp: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Mean Stress (σm)</label>
                    <input type="number" value={fatigueInputs.appliedMean} onChange={e => setFatigueInputs({...fatigueInputs, appliedMean: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Mean Stress Correction Model</label>
                <select 
                  value={meanStressModel} 
                  onChange={e => setMeanStressModel(e.target.value)}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                >
                  <option value="Goodman">Goodman (Brittle/Conservative)</option>
                  <option value="Gerber">Gerber (Ductile)</option>
                  <option value="Soderberg">Soderberg (Yield-based)</option>
                </select>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg h-80">
                 <h3 className="text-sm font-medium text-[#94A3B8] mb-4 text-center">S-N Curve (Stress vs Cycles)</h3>
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={fatigueData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                     <XAxis 
                       dataKey="cycles" 
                       scale="log" 
                       domain={['auto', 'auto']} 
                       type="number" 
                       tickFormatter={(tick) => tick.toExponential(0)} 
                       stroke="#94A3B8"
                       label={{ value: 'Cycles to Failure (N)', position: 'bottom', offset: 0, fill: '#94A3B8' }}
                     />
                     <YAxis stroke="#94A3B8" label={{ value: 'Stress Amplitude (MPa)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }}
                       labelFormatter={(label) => `Cycles: ${Number(label).toExponential(2)}`} 
                     />
                     <Legend verticalAlign="top" height={36}/>
                     <Line type="monotone" dataKey="stress" stroke="#F59E0B" strokeWidth={2} dot={false} name="Fatigue Strength" />
                   </LineChart>
                 </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md text-center">
                  <div className="text-[#94A3B8] text-sm mb-1">Equivalent Stress (Seq)</div>
                  <div className="text-2xl font-bold text-[#F1F5F9]">{fatigueResult.Seq} <span className="text-sm font-normal text-[#94A3B8]">MPa</span></div>
                  <div className="text-xs text-[#94A3B8] mt-1">Corrected for Mean Stress</div>
                </div>
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md text-center">
                  <div className="text-[#94A3B8] text-sm mb-1">Predicted Life</div>
                  <div className="text-2xl font-bold text-[#4A9EFF]">{fatigueResult.cycles}</div>
                  <div className="text-xs text-[#94A3B8] mt-1">Cycles</div>
                </div>
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md text-center">
                  <div className="text-[#94A3B8] text-sm mb-1">Safety Factor</div>
                  <div className={`text-2xl font-bold ${fatigueResult.safety > 1 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {fatigueResult.safety.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-1">Based on Endurance Limit</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Creep */}
        {activeTab === 'Creep' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Creep Parameters</h2>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#4A9EFF]">Test Conditions</h3>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Applied Stress (σ) [MPa]</label>
                  <input type="number" value={creepInputs.stress} onChange={e => setCreepInputs({...creepInputs, stress: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Temperature (T) [°C]</label>
                  <input type="number" value={creepInputs.temp} onChange={e => setCreepInputs({...creepInputs, temp: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Time Range (t) [h]</label>
                  <input type="number" value={creepInputs.time} onChange={e => setCreepInputs({...creepInputs, time: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#2D3F50]">
                <h3 className="text-sm font-medium text-[#4A9EFF]">Material Constants (Norton Law)</h3>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Coeff A (1/h/MPa^n)</label>
                  <input type="number" step="any" value={creepInputs.A} onChange={e => setCreepInputs({...creepInputs, A: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Exponent (n)</label>
                    <input type="number" step="0.1" value={creepInputs.n} onChange={e => setCreepInputs({...creepInputs, n: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Q (J/mol)</label>
                    <input type="number" value={creepInputs.Q} onChange={e => setCreepInputs({...creepInputs, Q: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md space-y-2">
                <h3 className="text-sm text-[#94A3B8] mb-2">Results</h3>
                <div className="flex justify-between items-center">
                  <span className="text-[#F1F5F9] text-sm">Creep Rate:</span>
                  <span className="font-bold text-[#4A9EFF]">{creepResults.rate} %/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#F1F5F9] text-sm">Est. Rupture Time:</span>
                  <span className="font-bold text-[#F59E0B]">{creepResults.ruptureTime} h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#F1F5F9] text-sm">LMP (x10³):</span>
                  <span className="font-bold text-[#22C55E]">{creepResults.LMP}</span>
                </div>
              </div>
            </div>
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Creep Curve (Strain vs Time)</h2>
                <button onClick={() => exportChart('creep-chart', 'creep-curve')} className="text-[#4A9EFF] hover:text-blue-400 flex items-center gap-2 text-sm">
                  <Download size={16} /> Export PNG
                </button>
              </div>
              <div id="creep-chart" className="flex-1 min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={creepData.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                    <XAxis dataKey="time" type="number" stroke="#94A3B8" label={{ value: 'Time (h)', position: 'bottom', fill: '#94A3B8' }} />
                    <YAxis stroke="#94A3B8" label={{ value: 'Strain (%)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} formatter={(val) => val.toFixed(4)} />
                    <Line type="monotone" dataKey="strain" stroke="#22C55E" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Impact & Fracture */}
        {activeTab === 'Impact & Fracture' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Impact Section */}
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Charpy Impact Test</h2>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="number" 
                  placeholder="Temp (°C)" 
                  value={impactInput.temp} 
                  onChange={e => setImpactInput({...impactInput, temp: Number(e.target.value)})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                />
                <input 
                  type="number" 
                  placeholder="Energy (J)" 
                  value={impactInput.energy} 
                  onChange={e => setImpactInput({...impactInput, energy: Number(e.target.value)})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                />
                <button onClick={addImpactLog} className="bg-[#4A9EFF] text-white px-4 rounded-md hover:bg-blue-600 transition-colors">
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex-1 min-h-[300px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                    <XAxis dataKey="temp" type="number" stroke="#94A3B8" label={{ value: 'Temperature (°C)', position: 'bottom', fill: '#94A3B8' }} domain={['auto', 'auto']} />
                    <YAxis stroke="#94A3B8" label={{ value: 'Impact Energy (J)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                    <Legend verticalAlign="top" height={36}/>
                    {/* Fitted Curve */}
                    <Line data={impactAnalysis.curve} type="monotone" dataKey="fitEnergy" stroke="#4A9EFF" strokeWidth={2} dot={false} name="Sigmoid Fit" />
                    {/* Data Points */}
                    <Scatter data={impactLogs} dataKey="energy" fill="#F59E0B" name="Test Data" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                 <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]">
                    <div className="text-[#94A3B8]">Lower Shelf</div>
                    <div className="font-bold text-[#F1F5F9]">{impactAnalysis.lowerShelf} J</div>
                 </div>
                 <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]">
                    <div className="text-[#94A3B8]">DBTT (Est)</div>
                    <div className="font-bold text-[#F59E0B]">{impactAnalysis.dbtt} °C</div>
                 </div>
                 <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]">
                    <div className="text-[#94A3B8]">Upper Shelf</div>
                    <div className="font-bold text-[#F1F5F9]">{impactAnalysis.upperShelf} J</div>
                 </div>
              </div>
            </div>

            {/* Fracture Section */}
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col">
              <div className="flex items-center justify-between border-b border-[#2D3F50] pb-2 mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Fracture Mechanics</h2>
                <div className="flex bg-[#0F1923] rounded-md p-1">
                  <button 
                    onClick={() => setFractureMode('calculator')}
                    className={`px-3 py-1 text-xs rounded-sm transition-colors ${fractureMode === 'calculator' ? 'bg-[#4A9EFF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'}`}
                  >
                    KIC Calc
                  </button>
                  <button 
                    onClick={() => setFractureMode('critical')}
                    className={`px-3 py-1 text-xs rounded-sm transition-colors ${fractureMode === 'critical' ? 'bg-[#4A9EFF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'}`}
                  >
                    Crit. Flaw
                  </button>
                </div>
              </div>

              {fractureMode === 'calculator' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Specimen Geometry</label>
                    <select 
                      value={specimenType} 
                      onChange={e => setSpecimenType(e.target.value)}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                    >
                      <option value="CT">Compact Tension C(T)</option>
                      <option value="SENB">Single Edge Notch Bend (SENB)</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">Fracture Load P (kN)</label>
                      <input type="number" value={kicInput.load} onChange={e => setKicInput({...kicInput, load: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">Thickness B (m)</label>
                      <input type="number" step="0.001" value={kicInput.thickness} onChange={e => setKicInput({...kicInput, thickness: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">Width W (m)</label>
                      <input type="number" step="0.001" value={kicInput.width} onChange={e => setKicInput({...kicInput, width: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">Crack Length a (m)</label>
                      <input type="number" step="0.001" value={kicInput.crack} onChange={e => setKicInput({...kicInput, crack: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </div>
                    {specimenType === 'SENB' && (
                      <div className="col-span-2">
                        <label className="block text-xs text-[#94A3B8] mb-1">Support Span S (m)</label>
                        <input type="number" step="0.001" value={kicInput.span} onChange={e => setKicInput({...kicInput, span: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
                    <div className="text-[#94A3B8] text-sm mb-1">Fracture Toughness (KIC)</div>
                    <div className="text-3xl font-bold text-[#22C55E]">{kicResult} <span className="text-lg font-normal text-[#94A3B8]">MPa√m</span></div>
                    <div className="text-xs text-[#94A3B8] mt-2">
                      Validity check: B, a &ge; 2.5(KIC/Sy)² required
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#94A3B8] italic mb-2">
                    Calculate the critical crack size that leads to failure for a given stress and toughness.
                  </p>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Fracture Toughness (KIC) [MPa√m]</label>
                    <input type="number" value={critCrackInput.KIC} onChange={e => setCritCrackInput({...critCrackInput, KIC: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Applied Stress (σ) [MPa]</label>
                    <input type="number" value={critCrackInput.stress} onChange={e => setCritCrackInput({...critCrackInput, stress: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Geometry Factor (Y)</label>
                    <input type="number" step="0.01" value={critCrackInput.Y} onChange={e => setCritCrackInput({...critCrackInput, Y: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    <p className="text-xs text-[#94A3B8] mt-1">Typically 1.0 for center crack, 1.12 for edge crack.</p>
                  </div>

                  <div className="mt-6 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
                    <div className="text-[#94A3B8] text-sm mb-1">Critical Crack Length (ac)</div>
                    <div className="text-3xl font-bold text-[#EF4444]">{critCrackResult} <span className="text-lg font-normal text-[#94A3B8]">mm</span></div>
                    <div className="text-xs text-[#94A3B8] mt-2">
                      Cracks larger than this will propagate unstably.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: Calculators */}
        {activeTab === 'Calculators' && (
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Engineering Calculators</h2>
            
            <div className="flex gap-2 mb-6 border-b border-[#2D3F50] pb-2">
              {['Elastic', 'Mohr', 'Thermal'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setCalcMode(mode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${calcMode === mode ? 'bg-[#4A9EFF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#2D3F50]'}`}
                >
                  {mode === 'Elastic' ? 'Elastic Constants' : mode === 'Mohr' ? 'Stress Transformation' : 'Thermal Stress'}
                </button>
              ))}
            </div>

            {calcMode === 'Elastic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[#4A9EFF] font-medium">Inputs</h3>
                  {Object.entries({ E: 'Young\'s Modulus E (GPa)', nu: 'Poisson\'s Ratio ν', Sy: 'Yield Strength (MPa)', stress: 'Applied Stress (MPa)', Kt: 'Stress Concentration Factor Kt' }).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                      <input 
                        type="number" 
                        step="any"
                        value={calcInput[key]} 
                        onChange={e => setCalcInput({...calcInput, [key]: Number(e.target.value)})}
                        className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-[#4A9EFF] font-medium">Results</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md flex justify-between items-center">
                      <div>
                        <div className="text-[#F1F5F9] font-medium">Shear Modulus (G)</div>
                        <div className="text-xs text-[#94A3B8]">G = E / 2(1+ν)</div>
                      </div>
                      <div className="text-xl font-bold text-[#4A9EFF]">{calcResults.G} GPa</div>
                    </div>
                    
                    <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md flex justify-between items-center">
                      <div>
                        <div className="text-[#F1F5F9] font-medium">Bulk Modulus (K)</div>
                        <div className="text-xs text-[#94A3B8]">K = E / 3(1-2ν)</div>
                      </div>
                      <div className="text-xl font-bold text-[#4A9EFF]">{calcResults.K} GPa</div>
                    </div>

                    <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md flex justify-between items-center">
                      <div>
                        <div className="text-[#F1F5F9] font-medium">Safety Factor</div>
                        <div className="text-xs text-[#94A3B8]">SF = Sy / Stress</div>
                      </div>
                      <div className={`text-xl font-bold ${Number(calcResults.SF) >= 1 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{calcResults.SF}</div>
                    </div>

                    <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md flex justify-between items-center">
                      <div>
                        <div className="text-[#F1F5F9] font-medium">Max Local Stress</div>
                        <div className="text-xs text-[#94A3B8]">σ_max = Kt * Stress</div>
                      </div>
                      <div className="text-xl font-bold text-[#F59E0B]">{calcResults.MaxStress} MPa</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {calcMode === 'Mohr' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[#4A9EFF] font-medium">Stress State Inputs (MPa)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#94A3B8] mb-1">Normal Stress X (σx)</label>
                      <input type="number" value={mohrInput.sigX} onChange={e => setMohrInput({...mohrInput, sigX: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm text-[#94A3B8] mb-1">Normal Stress Y (σy)</label>
                      <input type="number" value={mohrInput.sigY} onChange={e => setMohrInput({...mohrInput, sigY: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-[#94A3B8] mb-1">Shear Stress XY (τxy)</label>
                      <input type="number" value={mohrInput.tauXY} onChange={e => setMohrInput({...mohrInput, tauXY: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[#4A9EFF] font-medium">Principal Stresses</h3>
                  <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Principal Stress σ1</span>
                      <span className="text-[#F1F5F9] font-bold">{mohrResults.sig1} MPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Principal Stress σ2</span>
                      <span className="text-[#F1F5F9] font-bold">{mohrResults.sig2} MPa</span>
                    </div>
                    <div className="flex justify-between border-t border-[#2D3F50] pt-2">
                      <span className="text-[#94A3B8]">Max Shear Stress τmax</span>
                      <span className="text-[#F59E0B] font-bold">{mohrResults.tauMax} MPa</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Principal Angle θp</span>
                      <span className="text-[#4A9EFF] font-bold">{mohrResults.thetaP}°</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {calcMode === 'Thermal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[#4A9EFF] font-medium">Thermal Inputs</h3>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Young's Modulus E (GPa)</label>
                    <input type="number" value={thermStressInput.E} onChange={e => setThermStressInput({...thermStressInput, E: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">CTE α (10⁻⁶/K)</label>
                    <input type="number" value={thermStressInput.alpha} onChange={e => setThermStressInput({...thermStressInput, alpha: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Temp Change ΔT (°C)</label>
                    <input type="number" value={thermStressInput.dT} onChange={e => setThermStressInput({...thermStressInput, dT: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Constraint (%)</label>
                    <input type="number" value={thermStressInput.constraint} onChange={e => setThermStressInput({...thermStressInput, constraint: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                    <p className="text-xs text-[#94A3B8] mt-1">100% = Fully Fixed, 0% = Free Expansion</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-[#4A9EFF] font-medium">Thermal Stress</h3>
                  <div className="bg-[#0F1923] border border-[#2D3F50] p-6 rounded-md text-center flex flex-col items-center justify-center h-48">
                    <div className="text-sm text-[#94A3B8] mb-2">Induced Thermal Stress</div>
                    <div className="text-4xl font-bold text-[#EF4444] mb-2">{thermResults} <span className="text-lg text-[#94A3B8]">MPa</span></div>
                    <div className="text-xs text-[#94A3B8]">σ = E · α · ΔT · Constraint</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
