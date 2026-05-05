import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Download, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';

const TABS = [
  'Stress-Strain',
  'Hardness',
  'Fatigue',
  'Creep',
  'Impact & Fracture',
  'Calculators'
];

const MATERIAL_PRESETS: Record<string, any> = {
  'Structural Steel': { E: 200, Sy: 250, UTS: 400, eu: 15, ef: 25, nu: 0.3, K: 606, n: 0.14 },
  'Aluminum 6061-T6': { E: 69, Sy: 276, UTS: 310, eu: 10, ef: 17, nu: 0.33, K: 419, n: 0.095 },
  'Titanium Ti-6Al-4V': { E: 114, Sy: 880, UTS: 950, eu: 10, ef: 14, nu: 0.34, K: 1210, n: 0.095 },
  'Copper (Annealed)': { E: 110, Sy: 70, UTS: 220, eu: 30, ef: 45, nu: 0.34, K: 420, n: 0.26 }
};

export default function MechanicalProperties({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- SUB-MODULE 1: Stress-Strain ---
  const [ssInputs, setSsInputs] = useState(MATERIAL_PRESETS['Structural Steel']);
  const [selectedPreset, setSelectedPreset] = useState('Structural Steel');
  const [ssType, setSsType] = useState('engineering'); // 'engineering' or 'true'
  const [ssModel, setSsModel] = useState('standard'); // 'standard' or 'hollomon'

  const { markers } = useMemo(() => {
    const { E, Sy, UTS, eu, ef, K, n } = ssInputs;
    const E_MPa = E * 1000;
    const yieldStrainAbs = Sy / E_MPa; 
    const yieldStrain = yieldStrainAbs * 100; // %
    
    // Validate inputs
    const safeEu = Math.max(eu, yieldStrain + 0.1);
    const safeEf = Math.max(ef, safeEu + 0.1);

    let calcUtsS = UTS;
    let calcUtsE = safeEu;
    let fracS = UTS * 0.75; // Approx fracture stress

    if (ssModel === 'hollomon') {
        const trueStrainUts = n;
        const engStrainUtsAbs = Math.exp(trueStrainUts) - 1;
        calcUtsE = engStrainUtsAbs * 100;
        const trueStressUts = K * Math.pow(trueStrainUts, n);
        calcUtsS = trueStressUts / (1 + engStrainUtsAbs);
    }

    return { 
        markers: { yieldE: yieldStrain, yieldS: Sy, utsE: calcUtsE, utsS: calcUtsS, fracE: safeEf, fracS }
    };
  }, [ssInputs, ssModel]);

  const ssResults = useMemo(() => {
    const { E, Sy, UTS } = ssInputs;
    const yieldStrainAbs = Sy / (E * 1000);
    
    // Modulus of Resilience: MJ/m^3
    const Ur = 0.5 * Sy * yieldStrainAbs;

    // Simplified Toughness approximation for calc-only mode
    // (Sy + UTS)/2 * (plastic strain) + elastic portion
    const plasticStrain = (ssInputs.ef - (yieldStrainAbs * 100)) / 100;
    const toughness = (Ur + ((Sy + UTS) / 2) * Math.max(0, plasticStrain)).toFixed(2);

    return {
      Ur: Ur.toFixed(4),
      Toughness: toughness,
      YieldStrain: (yieldStrainAbs * 100).toFixed(3)
    };
  }, [ssInputs]);

  // --- SUB-MODULE 2: Hardness ---
  const [hardInput, setHardInput] = useState({ 
    value: 200, 
    scale: 'HV', 
    materialClass: 'Steel',
    customK: 3.45 // Proportionality constant for UTS = K * HB
  });
  
  const hardnessConversions = useMemo(() => {
    let hv = 0;
    const { value, scale, materialClass, customK } = hardInput;
    
    // 1. Normalize input to Vickers (HV) as the base unit
    if (scale === 'HV') hv = value;
    else if (scale === 'HB') hv = value; 
    else if (scale === 'HRC') {
      if (value < 20) hv = 115 * Math.exp(0.024 * 20) * (value / 20); 
      else hv = 115 * Math.exp(0.024 * value); 
    }
    else if (scale === 'HRB') hv = 2.6 * value - 110; 
    else if (scale === 'HK') hv = value; 
    
    const isPolymer = scale === 'Shore A' || scale === 'Shore D';
    if (isPolymer) {
      return {
        HV: 'N/A', HB: 'N/A', HRC: 'N/A', HRB: 'N/A', HK: 'N/A',
        ShoreA: scale === 'Shore A' ? value : 'N/A',
        ShoreD: scale === 'Shore D' ? value : 'N/A',
        UTS_Est: 'N/A',
        warning: 'Shore scales do not convert to metal hardness scales efficiently.'
      };
    }

    let hb = hv; 
    let hrc = 0;
    let hrb = 0;
    let uts = 0;

    // Proportionality Constants (k) for UTS (MPa) ≈ k * HB
    const K_MAP: Record<string, number> = {
      'Steel': 3.45,
      'Stainless Steel': 3.35,
      'Aluminum': 3.3,
      'Copper/Brass': 3.5,
      'Titanium': 3.6,
      'Nickel Alloy': 3.4,
      'Cast Iron': 2.8,
      'Custom': customK
    };

    const k = K_MAP[materialClass] || 3.45;
    uts = k * hb;

    if (materialClass === 'Steel' || materialClass === 'Stainless Steel' || materialClass === 'Nickel Alloy') {
      if (hv >= 240) hrc = 41.6 * Math.log(hv) - 228;
      if (hv >= 85 && hv <= 240) hrb = 0.38 * hv + 42;
    } else if (materialClass === 'Aluminum' || materialClass === 'Copper/Brass') {
      if (hv > 40) hrb = 0.45 * hv + 10; 
    } else if (materialClass === 'Titanium') {
      if (hv >= 300) hrc = 38 * Math.log(hv) - 200;
      if (hv > 150) hrb = 0.42 * hv + 30;
    }

    return {
      HV: Math.round(hv),
      HB: Math.round(hb),
      HRC: hrc > 0 && hrc < 70 ? Math.round(hrc) : (hrc >= 70 ? '> 70' : (hrc > 0 ? '< 20' : 'N/A')),
      HRB: hrb > 0 && hrb < 120 ? Math.round(hrb) : (hrb >= 120 ? '> 120' : (hrb > 0 ? '< 0' : 'N/A')),
      HK: Math.round(hv * 1.05),
      ShoreA: 'N/A',
      ShoreD: 'N/A',
      UTS_Est: Math.round(uts),
      warning: (hv < 30 || hv > 1200) ? 'Value is outside verified ASTM/ISO conversion standard ranges.' : null
    };
  }, [hardInput]);

  // --- SUB-MODULE 3: Fatigue ---
  const [fatigueInputs, setFatigueInputs] = useState({ 
    UTS: 600, 
    Sy: 450, 
    Se_base: 300, 
    b: -0.08, 
    appliedAmp: 200, 
    appliedMean: 50,
    ka: 0.9, 
    kb: 0.9, 
    kc: 1.0, 
    kd: 1.0, 
    ke: 0.897, 
    sigmaF: 945 
  });
  const [meanStressModel, setMeanStressModel] = useState('Goodman'); 

  const Se = useMemo(() => {
    const { Se_base, ka, kb, kc, kd, ke } = fatigueInputs;
    return Se_base * ka * kb * kc * kd * ke;
  }, [fatigueInputs]);

  const fatigueResult = useMemo(() => {
    const { UTS, Sy, b, appliedAmp, appliedMean, sigmaF } = fatigueInputs;
    
    let Seq = appliedAmp;
    
    if (Math.abs(appliedMean) > 0.1) {
      switch(meanStressModel) {
        case 'Goodman':
          Seq = appliedAmp / (1 - (appliedMean / UTS));
          break;
        case 'Gerber':
          Seq = appliedAmp / (1 - Math.pow(appliedMean / UTS, 2));
          break;
        case 'Soderberg':
          Seq = appliedAmp / (1 - (appliedMean / Sy));
          break;
        case 'Morrow':
          Seq = appliedAmp / (1 - (appliedMean / sigmaF));
          break;
        case 'ASME':
          Seq = appliedAmp / Math.sqrt(Math.max(0.001, 1 - Math.pow(appliedMean / Sy, 2)));
          break;
      }
    }

    const safety = Se / Seq;
    let cyclesDisplay = 'Infinite';
    if (Seq > Se) {
      const a = Math.pow(0.9 * UTS, 2) / Se;
      const N = Math.pow(Seq / a, 1 / b);
      cyclesDisplay = N > 1e9 ? 'Infinite' : (N < 10 ? '< 10' : N.toExponential(2));
    }

    return { 
      cycles: cyclesDisplay, 
      safety: Math.max(0, safety),
      Seq: Seq.toFixed(1),
      modifiedSe: Se.toFixed(1)
    };
  }, [fatigueInputs, meanStressModel, Se]);

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
  
  const creepResults = useMemo(() => {
    const { temp, stress, C, A, n, Q } = creepInputs;
    const R = 8.314;
    const T_K = temp + 273.15;
    
    // Norton Power Law for Secondary Creep Rate: edot = A * sigma^n * exp(-Q/RT)
    const edot = A * Math.pow(stress, n) * Math.exp(-Q / (R * T_K));
    
    const LMP_calc = 22000 - 20 * stress; 
    const log_tr = LMP_calc / T_K - C;
    const tr = Math.pow(10, log_tr);

    return {
      rate: (edot * 100).toExponential(2), // %/h
      ruptureTime: tr > 1e6 ? '> 1,000,000' : Math.round(tr).toLocaleString(),
      LMP: (LMP_calc / 1000).toFixed(2)
    };
  }, [creepInputs]);

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
    if (impactLogs.length < 3) return { dbtt: 'N/A' };

    const energies = impactLogs.map(l => l.energy);
    const minE = Math.min(...energies);
    const maxE = Math.max(...energies);
    const avgE = (minE + maxE) / 2;

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

    return { 
      dbtt: dbtt !== null ? Math.round(dbtt) : 'N/A', 
      upperShelf: maxE,
      lowerShelf: minE
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
          <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Material Parameters</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-[#94A3B8] mb-1">Curve Model</label>
                <div className="flex bg-[#0F1923] p-1 rounded-md border border-[#2D3F50] mb-4">
                  <button 
                    onClick={() => setSsModel('standard')}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${ssModel === 'standard' ? 'bg-[#4A9EFF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'}`}
                  >
                    Polynomial (Fits Points)
                  </button>
                  <button 
                    onClick={() => setSsModel('hollomon')}
                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${ssModel === 'hollomon' ? 'bg-[#4A9EFF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'}`}
                  >
                    Hollomon (Physical)
                  </button>
                </div>
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

              <div className="grid grid-cols-2 gap-3 mb-4">
                {Object.entries({ E: 'Young\'s Modulus (GPa)', Sy: 'Yield Strength (MPa)', UTS: 'Ultimate Tensile Strength (MPa)', eu: 'Uniform Elongation (%)', ef: 'Fracture Strain (%)', nu: 'Poisson\'s Ratio' }).map(([key, label]) => (
                  <div key={key}>
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

              <div className="pt-4 border-t border-[#2D3F50]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-[#4A9EFF]">Plasticity Parameters</h3>
                  <button 
                    onClick={() => {
                        const trueStrainUTS = Math.log(1 + ssInputs.eu / 100);
                        const trueStressUTS = ssInputs.UTS * (1 + ssInputs.eu / 100);
                        const n = trueStrainUTS;
                        const K = trueStressUTS / Math.pow(n, n);
                        setSsInputs(prev => ({...prev, n: Number(n.toFixed(3)), K: Math.round(K)}));
                        setSelectedPreset('Custom');
                        addToast('Auto-estimated K and n from UTS and Uniform Elongation');
                    }}
                    className="text-xs text-[#F59E0B] hover:underline"
                  >
                    Auto-Estimate
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries({ K: 'Strength Coeff K (MPa)', n: 'Hardening Exp n' }).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                      <input 
                        type="number" 
                        step="any"
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
                <div className="mt-2 text-xs text-[#94A3B8]">
                   Hollomon's Equation: <span className="font-mono">σ_true = K·(ε_true)ⁿ</span>
                </div>
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
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col items-center justify-center min-h-[200px]">
              <div className="text-center px-8">
                <Info size={32} className="text-[#4A9EFF] mx-auto mb-4 opacity-20" />
                <h3 className="text-[#F1F5F9] font-bold mb-2">Calculation Model Active</h3>
                <p className="text-sm text-[#94A3B8]">Pro results based on validated materials standards.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Hardness */}
        {activeTab === 'Hardness' && (
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg max-w-3xl mx-auto">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-6">Hardness Converter & Estimator</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Scale</label>
                <select 
                  value={hardInput.scale} 
                  onChange={e => setHardInput({...hardInput, scale: e.target.value})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-lg"
                >
                  {['HV', 'HB', 'HRC', 'HRB', 'HK', 'Shore A', 'Shore D'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Value</label>
                <input 
                  type="number" 
                  value={hardInput.value} 
                  onChange={e => setHardInput({...hardInput, value: Number(e.target.value)})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-lg" 
                  placeholder="Enter hardness..."
                />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Material Class</label>
                <select 
                  value={hardInput.materialClass} 
                  onChange={e => setHardInput({...hardInput, materialClass: e.target.value})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-lg"
                >
                  {['Steel', 'Stainless Steel', 'Aluminum', 'Copper/Brass', 'Titanium', 'Nickel Alloy', 'Cast Iron', 'Custom'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {hardInput.materialClass === 'Custom' && (
              <div className="bg-[#0F1923] p-4 rounded-md border border-[#4A9EFF]/30 mb-8 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3 justify-between">
                  <div className="shrink-0">
                    <div className="text-[#4A9EFF] font-bold text-sm">Advanced: UTS Proportionality Factor</div>
                    <div className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Ratio of UTS (MPa) to HB (kg/mm²)</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1.0" 
                      max="6.0" 
                      step="0.05"
                      value={hardInput.customK}
                      onChange={e => setHardInput({...hardInput, customK: parseFloat(e.target.value)})}
                      className="w-24 h-1.5 bg-[#1A2634] rounded-lg appearance-none cursor-pointer accent-[#4A9EFF]"
                    />
                    <input 
                      type="number"
                      step="0.01"
                      value={hardInput.customK}
                      onChange={e => setHardInput({...hardInput, customK: parseFloat(e.target.value)})}
                      className="w-20 bg-[#1A2634] border border-[#2D3F50] rounded px-2 py-1 text-[#F1F5F9] text-sm text-center font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {hardnessConversions.warning && (
              <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/50 text-[#F59E0B] p-4 rounded-md flex items-start gap-3 mb-6">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm">{hardnessConversions.warning}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(hardnessConversions).filter(([k]) => k !== 'warning' && k !== 'UTS_Est').map(([scale, val]) => {
                const getScaleRange = (s: string) => {
                  switch (s) {
                    case 'HV': return { min: 50, max: 1000 };
                    case 'HB': return { min: 50, max: 800 };
                    case 'HRC': return { min: 20, max: 70 };
                    case 'HRB': return { min: 40, max: 100 };
                    case 'HK': return { min: 50, max: 1000 };
                    case 'ShoreA': return { min: 0, max: 100 };
                    case 'ShoreD': return { min: 0, max: 100 };
                    default: return { min: 0, max: 100 };
                  }
                };
                const range = getScaleRange(scale);
                const isNum = typeof val === 'number';
                let percent = 0;
                if (isNum) {
                  percent = ((val - range.min) / (range.max - range.min)) * 100;
                  percent = Math.max(0, Math.min(100, percent));
                }

                return (
                  <div key={scale} className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md text-center group hover:border-[#4A9EFF] transition-colors relative overflow-hidden flex flex-col justify-center min-h-[100px]">
                    <div className="text-[#A3B8CC] text-sm mb-1 font-medium">{scale}</div>
                    <div className={`text-2xl font-bold ${typeof val === 'string' && (val.includes('<') || val.includes('>')) ? 'text-[#F59E0B]' : typeof val === 'string' ? 'text-[#64748B] text-lg' : 'text-[#F1F5F9]'}`}>
                      {val}
                    </div>
                    {isNum && (
                      <div className="absolute bottom-0 left-0 w-full">
                        <div className="flex justify-between px-2 text-[9px] text-[#4F627A] mb-[2px]">
                          <span>{range.min}</span>
                          <span>{range.max}</span>
                        </div>
                        <div className="h-[3px] bg-[#1A2634] w-full">
                          <div className="h-full bg-gradient-to-r from-[#4A9EFF] to-[#3b82f6]" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Estimated UTS Card */}
              <div className="col-span-2 sm:col-span-4 bg-gradient-to-r from-[#0F1923] to-[#1A2634] border border-[#2D3F50] p-5 rounded-md flex items-center justify-between mt-2 shadow-inner">
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
          <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#1A2634] p-5 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Fatigue & Mean Stress</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-[#94A3B8] mb-1 font-medium bg-[#0F1923] p-1 px-2 rounded-t">Material Properties</label>
                </div>
                <div>
                  <label className="block text-[10px] text-[#64748B] mb-1">UTS [MPa]</label>
                  <input type="number" value={fatigueInputs.UTS} onChange={e => setFatigueInputs({...fatigueInputs, UTS: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#64748B] mb-1">Sy [MPa]</label>
                  <input type="number" value={fatigueInputs.Sy} onChange={e => setFatigueInputs({...fatigueInputs, Sy: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#64748B] mb-1">Se (Unmodified)</label>
                  <input type="number" value={fatigueInputs.Se_base} onChange={e => setFatigueInputs({...fatigueInputs, Se_base: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#64748B] mb-1">Basquin b</label>
                  <input type="number" step="0.01" value={fatigueInputs.b} onChange={e => setFatigueInputs({...fatigueInputs, b: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                </div>
              </div>

              <div className="pt-3 border-t border-[#2D3F50]">
                <h3 className="text-xs font-bold text-[#4A9EFF] mb-3 uppercase tracking-wider">Marin Factors (Modification)</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    { label: 'Surface (ka)', key: 'ka' },
                    { label: 'Size (kb)', key: 'kb' },
                    { label: 'Load (kc)', key: 'kc' },
                    { label: 'Temp (kd)', key: 'kd' },
                    { label: 'Reliab. (ke)', key: 'ke' }
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] text-[#94A3B8] mb-0.5">{f.label}</label>
                      <input 
                        type="number" step="0.01" min="0.01" max="1.0"
                        value={fatigueInputs[f.key]} 
                        onChange={e => setFatigueInputs({...fatigueInputs, [f.key]: Number(e.target.value)})} 
                        className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1 px-2 text-[#F1F5F9] text-xs focus:border-[#4A9EFF] focus:outline-none" 
                      />
                    </div>
                  ))}
                  <div className="col-span-2 pt-2">
                    <div className="flex justify-between items-center bg-[#0F1923] p-2 rounded-md border border-dashed border-[#2D3F50]">
                      <span className="text-[10px] text-[#64748B]">Modified Se:</span>
                      <span className="text-sm font-bold text-[#22C55E]">{fatigueResult.modifiedSe} <span className="text-[10px] font-normal">MPa</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2D3F50]">
                <h3 className="text-xs font-bold text-[#4A9EFF] mb-3 uppercase tracking-wider">Mean Stress Model</h3>
                <select 
                  value={meanStressModel} 
                  onChange={e => setMeanStressModel(e.target.value)}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm mb-3"
                >
                  <option value="Goodman">Goodman (Conservative)</option>
                  <option value="Gerber">Gerber (Ductile)</option>
                  <option value="Soderberg">Soderberg (Yielding check)</option>
                  <option value="Morrow">Morrow (Fatigue Strength based)</option>
                  <option value="ASME">ASME-Elliptic</option>
                </select>
                
                {meanStressModel === 'Morrow' && (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-[10px] text-[#94A3B8] mb-1">Fatigue Strength Coeff. (σ'f)</label>
                    <input type="number" value={fatigueInputs.sigmaF} onChange={e => setFatigueInputs({...fatigueInputs, sigmaF: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#4A9EFF]/30 rounded-md py-1.5 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-xs" />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#2D3F50]">
                <h3 className="text-xs font-bold text-[#4A9EFF] mb-3 uppercase tracking-wider">Applied Load</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] mb-1">Amplitude (σa)</label>
                    <input type="number" value={fatigueInputs.appliedAmp} onChange={e => setFatigueInputs({...fatigueInputs, appliedAmp: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#94A3B8] mb-1">Mean (σm)</label>
                    <input type="number" value={fatigueInputs.appliedMean} onChange={e => setFatigueInputs({...fatigueInputs, appliedMean: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg text-center py-12">
                 <div className="text-[#4A9EFF] text-sm font-bold uppercase tracking-widest mb-2">Steady State & Fatigue Life Analysis</div>
                 <div className="text-[#94A3B8] text-xs max-w-md mx-auto">The Pro fatigue engine calculates equivalent stress cycles and infinite life safety factors using high-fidelity Marin modification factors.</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2634] border border-[#2D3F50] p-5 rounded-xl text-center shadow-lg group hover:border-[#4A9EFF] transition-all">
                  <div className="text-[#64748B] text-[10px] mb-1 uppercase tracking-widest font-bold">Equivalent Stress (Seq)</div>
                  <div className="text-3xl font-black text-[#F1F5F9]">{fatigueResult.Seq} <span className="text-sm font-normal text-[#94A3B8]">MPa</span></div>
                  <div className="text-[10px] text-[#4A9EFF] mt-2 font-medium">Corrected index for Fully Reversed</div>
                </div>
                <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2634] border border-[#2D3F50] p-5 rounded-xl text-center shadow-lg group hover:border-[#F59E0B] transition-all">
                  <div className="text-[#64748B] text-[10px] mb-1 uppercase tracking-widest font-bold">Fatigue Life Prediction</div>
                  <div className="text-3xl font-black text-[#F59E0B]">{fatigueResult.cycles}</div>
                  <div className="text-[10px] text-[#94A3B8] mt-2 font-medium">Estimated loading cycles</div>
                </div>
                <div className="bg-gradient-to-br from-[#0F1923] to-[#1A2634] border border-[#2D3F50] p-5 rounded-xl text-center shadow-lg group hover:border-[#22C55E] transition-all">
                  <div className="text-[#64748B] text-[10px] mb-1 uppercase tracking-widest font-bold">Safety Factor (n)</div>
                  <div className={`text-3xl font-black transition-colors ${fatigueResult.safety > 1.2 ? 'text-[#22C55E]' : fatigueResult.safety > 1.0 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                    {fatigueResult.safety.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] mt-2 font-medium">Factor relative to Se</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Creep */}
        {activeTab === 'Creep' && (
          <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
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
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col items-center justify-center py-12">
                <div className="text-[#22C55E] text-sm font-bold uppercase tracking-widest mb-2">Steady State Creep Analysis</div>
                <div className="text-[#94A3B8] text-xs max-w-md mx-auto text-center font-mono">
                  Strain Rate: {creepResults.rate} %/h
                </div>
            </div>
          </div>
        )}

        {/* TAB 5: Impact & Fracture */}
        {activeTab === 'Impact & Fracture' && (
          <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
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

              <div className="bg-[#0F1923] p-6 rounded border border-[#2D3F50] text-center mb-6">
                  <div className="text-[#94A3B8] text-xs mb-2">Ductile-to-Brittle Transition Analysis</div>
                  <div className="text-[#22C55E] font-bold">PRO CALC ACTIVE</div>
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
