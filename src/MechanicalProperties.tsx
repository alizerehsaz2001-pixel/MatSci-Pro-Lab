import React, { useState, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Download, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react';

const TABS = [
  'Stress-Strain',
  'Hardness',
  'Fatigue',
  'Creep',
  'Impact & Fracture',
  'Calculators'
];

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
  const [ssInputs, setSsInputs] = useState({ E: 200, Sy: 250, UTS: 400, eu: 10, ef: 20, nu: 0.3 });
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
  const [creepInputs, setCreepInputs] = useState({ e0: 0.01, edot: 0.0005, temp: 600, time: 1000 });
  
  const creepData = useMemo(() => {
    const { e0, edot, time } = creepInputs;
    const data = [];
    for (let t = 0; t <= time; t += time / 50) {
      // Primary (logarithmic), Secondary (linear), Tertiary (exponential)
      const primary = e0 * (1 - Math.exp(-5 * t / time));
      const secondary = edot * t;
      const tertiary = 0.00001 * Math.exp(5 * t / time);
      data.push({ time: t, strain: (primary + secondary + tertiary) * 100 });
    }
    return data;
  }, [creepInputs]);

  const lmp = useMemo(() => {
    // LMP = T(C + log t) / 1000, T in Kelvin
    const T_K = creepInputs.temp + 273.15;
    return (T_K * (20 + Math.log10(creepInputs.time)) / 1000).toFixed(2);
  }, [creepInputs]);

  // --- SUB-MODULE 5: Impact ---
  const [impactLogs, setImpactLogs] = useState([]);
  const [impactInput, setImpactInput] = useState({ temp: 20, energy: 50 });
  const [kicInput, setKicInput] = useState({ load: 15, thickness: 0.02, width: 0.04, crack: 0.01 });

  const addImpactLog = () => {
    setImpactLogs(prev => [...prev, { id: Date.now(), ...impactInput }].sort((a, b) => a.temp - b.temp));
  };

  const kicResult = useMemo(() => {
    const { load, thickness, width, crack } = kicInput;
    // Simplified KIC for compact tension: K = (P / (B * W^0.5)) * f(a/W)
    const aW = crack / width;
    if (aW < 0.2 || aW > 0.8) return 'Invalid a/W';
    const f = (2 + aW) * (0.886 + 4.64*aW - 13.32*aW*aW + 14.72*Math.pow(aW, 3) - 5.6*Math.pow(aW, 4)) / Math.pow(1 - aW, 1.5);
    const K = (load / (thickness * Math.sqrt(width))) * f;
    return K.toFixed(2);
  }, [kicInput]);

  // --- SUB-MODULE 6: Calculators ---
  const [calcInput, setCalcInput] = useState({ E: 200, nu: 0.3, Sy: 250, stress: 150, Kt: 2.5 });
  
  const calcResults = useMemo(() => {
    const { E, nu, Sy, stress, Kt } = calcInput;
    return {
      G: (E / (2 * (1 + nu))).toFixed(2),
      K: (E / (3 * (1 - 2 * nu))).toFixed(2),
      SF: (Sy / stress).toFixed(2),
      MaxStress: (stress * Kt).toFixed(2)
    };
  }, [calcInput]);


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
              {Object.entries({ E: 'Young\'s Modulus (GPa)', Sy: 'Yield Strength (MPa)', UTS: 'Ultimate Tensile Strength (MPa)', eu: 'Uniform Elongation (%)', ef: 'Fracture Strain (%)', nu: 'Poisson\'s Ratio' }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                  <input 
                    type="number" 
                    value={ssInputs[key]} 
                    onChange={e => setSsInputs({...ssInputs, [key]: Number(e.target.value)})}
                    className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                  />
                </div>
              ))}
              
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
              {Object.entries({ e0: 'Initial Strain', edot: 'Steady Creep Rate (1/h)', temp: 'Temperature (°C)', time: 'Time Range (h)' }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                  <input 
                    type="number" 
                    step="any"
                    value={creepInputs[key]} 
                    onChange={e => setCreepInputs({...creepInputs, [key]: Number(e.target.value)})}
                    className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                  />
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md">
                <h3 className="text-sm text-[#94A3B8] mb-2">Larson-Miller Parameter</h3>
                <div className="flex justify-between items-center">
                  <span className="text-[#F1F5F9]">LMP (x10³):</span>
                  <span className="font-bold text-[#4A9EFF]">{lmp}</span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-2">Assuming C = 20</p>
              </div>
            </div>
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Creep Curve</h2>
                <button onClick={() => exportChart('creep-chart', 'creep-curve')} className="text-[#4A9EFF] hover:text-blue-400 flex items-center gap-2 text-sm">
                  <Download size={16} /> Export PNG
                </button>
              </div>
              <div id="creep-chart" className="flex-1 min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={creepData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Charpy Impact Test Logger</h2>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="number" 
                  placeholder="Temp (°C)" 
                  value={impactInput.temp}
                  onChange={e => setImpactInput({...impactInput, temp: Number(e.target.value)})}
                  className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Energy (J)" 
                  value={impactInput.energy}
                  onChange={e => setImpactInput({...impactInput, energy: Number(e.target.value)})}
                  className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none"
                />
                <button onClick={addImpactLog} className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2">
                  <Plus size={16} /> Add
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#0F1923] border border-[#2D3F50] rounded-md mb-4">
                {impactLogs.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8]">No tests recorded yet.</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A2634] text-[#94A3B8] sticky top-0">
                      <tr>
                        <th className="p-2">Temp (°C)</th>
                        <th className="p-2">Energy (J)</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D3F50]">
                      {impactLogs.map(log => (
                        <tr key={log.id}>
                          <td className="p-2 text-[#F1F5F9]">{log.temp}</td>
                          <td className="p-2 text-[#F1F5F9]">{log.energy}</td>
                          <td className="p-2">
                            <button onClick={() => setImpactLogs(prev => prev.filter(l => l.id !== log.id))} className="text-[#EF4444] hover:text-red-400"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="h-64" id="impact-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                    <XAxis dataKey="temp" type="number" name="Temperature" unit="°C" stroke="#94A3B8" />
                    <YAxis dataKey="energy" type="number" name="Energy" unit="J" stroke="#94A3B8" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                    <Scatter name="Impact Energy" data={impactLogs} fill="#4A9EFF" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Fracture Toughness (KIC) Calculator</h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries({ load: 'Failure Load P (kN)', thickness: 'Thickness B (m)', width: 'Width W (m)', crack: 'Crack Length a (m)' }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                    <input 
                      type="number" 
                      step="any"
                      value={kicInput[key]} 
                      onChange={e => setKicInput({...kicInput, [key]: Number(e.target.value)})}
                      className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-6 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
                <h3 className="text-sm text-[#94A3B8] mb-2">Calculated KIC (MPa·m^0.5)</h3>
                <div className={`text-4xl font-bold ${kicResult === 'Invalid a/W' ? 'text-[#EF4444] text-2xl' : 'text-[#4A9EFF]'}`}>
                  {kicResult}
                </div>
                <p className="text-xs text-[#94A3B8] mt-4">Based on Compact Tension C(T) specimen standard formula.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Calculators */}
        {activeTab === 'Calculators' && (
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg max-w-4xl mx-auto">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-6">General Mechanical Calculators</h2>
            
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
                    <div className={`text-xl font-bold ${calcResults.SF >= 1 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{calcResults.SF}</div>
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
          </div>
        )}
      </div>
    </div>
  );
}
