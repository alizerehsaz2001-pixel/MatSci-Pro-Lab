import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, AreaChart, Area } from 'recharts';
import { AlertTriangle, Plus, Trash2, Zap, Thermometer, Magnet, Eye, Box } from 'lucide-react';

const TABS = [
  { id: 'Thermal', icon: Thermometer },
  { id: 'Electrical', icon: Zap },
  { id: 'Magnetic', icon: Magnet },
  { id: 'Optical', icon: Eye },
  { id: 'Crystal', icon: Box }
];

export default function PhysicalProperties({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleMaterialSelect = (e) => {
    const id = e.target.value;
    setSelectedMaterialId(id);
    if (!id) return;
    
    const mat = materials.find(m => m.id === id);
    if (mat) {
      setThermalInputs(prev => ({
        ...prev,
        k: mat.thermalConductivity || prev.k,
        rho: (mat.density ? mat.density * 1000 : prev.rho), // Convert g/cm3 to kg/m3
        tm: mat.meltingPoint || prev.tm
      }));
      
      if (mat.electricalResistivity) {
        setElecInputs(prev => ({
          ...prev,
          rho: mat.electricalResistivity,
          sigma: mat.electricalResistivity === 0 ? 0 : 1 / mat.electricalResistivity
        }));
      }
      
      addToast(`Loaded properties for ${mat.name}`);
    }
  };

  // --- SUB-MODULE 1: Thermal ---
  const [thermalInputs, setThermalInputs] = useState({ k: 400, cp: 385, rho: 8960, cte: 16.5, tm: 1085, tg: 0 });
  const [kVsTData, setKVsTData] = useState([
    { id: 1, temp: 20, k: 401 },
    { id: 2, temp: 100, k: 393 },
    { id: 3, temp: 300, k: 379 }
  ]);
  const [newKPoint, setNewKPoint] = useState({ temp: '', k: '' });

  const thermalDiffusivity = useMemo(() => {
    const { k, cp, rho } = thermalInputs;
    if (!k || !cp || !rho || cp <= 0 || rho <= 0) return 'N/A';
    return (k / (rho * cp)).toExponential(2);
  }, [thermalInputs]);

  const addKPoint = () => {
    if (newKPoint.temp && newKPoint.k) {
      setKVsTData(prev => [...prev, { id: Date.now(), temp: Number(newKPoint.temp), k: Number(newKPoint.k) }].sort((a, b) => a.temp - b.temp));
      setNewKPoint({ temp: '', k: '' });
    }
  };

  // --- SUB-MODULE 2: Electrical ---
  const [elecInputs, setElecInputs] = useState({ rho: 1.68e-8, sigma: 5.96e7, r0: 100, alpha: 0.00393, t0: 20, t: 100, er: 1, vbd: 0 });
  
  const handleElecChange = (field, value) => {
    const num = Number(value);
    if (field === 'rho') {
      setElecInputs(prev => ({ ...prev, rho: num, sigma: num === 0 ? 0 : 1 / num }));
    } else if (field === 'sigma') {
      setElecInputs(prev => ({ ...prev, sigma: num, rho: num === 0 ? 0 : 1 / num }));
    } else {
      setElecInputs(prev => ({ ...prev, [field]: num }));
    }
  };

  const elecClass = useMemo(() => {
    const rho = elecInputs.rho;
    if (rho < 1e-5) return { label: 'Conductor', color: 'bg-[#22C55E]', text: 'text-[#22C55E]' };
    if (rho > 1e5) return { label: 'Insulator', color: 'bg-[#EF4444]', text: 'text-[#EF4444]' };
    return { label: 'Semiconductor', color: 'bg-[#F59E0B]', text: 'text-[#F59E0B]' };
  }, [elecInputs.rho]);

  const rtCalc = useMemo(() => {
    const { r0, alpha, t0, t } = elecInputs;
    return (r0 * (1 + alpha * (t - t0))).toFixed(2);
  }, [elecInputs]);

  // --- SUB-MODULE 3: Magnetic ---
  const [magInputs, setMagInputs] = useState({ ur: 1.00001, ms: 0, hc: 0, br: 0 });
  
  const magClass = useMemo(() => {
    const { ur, ms, hc } = magInputs;
    if (ur < 1) return { label: 'Diamagnetic', color: 'bg-[#94A3B8]' };
    if (ur > 1 && ur < 1.01) return { label: 'Paramagnetic', color: 'bg-[#4A9EFF]' };
    if (ur >= 1.01 && hc > 1000) return { label: 'Hard Ferromagnetic', color: 'bg-[#EF4444]' };
    if (ur >= 1.01 && hc <= 1000) return { label: 'Soft Ferromagnetic', color: 'bg-[#F59E0B]' };
    return { label: 'Unknown', color: 'bg-[#2D3F50]' };
  }, [magInputs]);

  const hysteresisData = useMemo(() => {
    const { ms, hc, br } = magInputs;
    if (hc === 0 || ms === 0) return [];
    const data = [];
    // Approximation of B-H curve
    for (let h = -hc * 1.5; h <= hc * 1.5; h += hc / 10) {
      // Ascending branch
      const bAsc = ms * Math.tanh((h - hc/2) / (hc/2)) + (br/2);
      // Descending branch
      const bDesc = ms * Math.tanh((h + hc/2) / (hc/2)) - (br/2);
      data.push({ h, bAsc: Math.max(-ms, Math.min(ms, bAsc)), bDesc: Math.max(-ms, Math.min(ms, bDesc)) });
    }
    return data;
  }, [magInputs]);

  // --- SUB-MODULE 4: Optical ---
  const [optInputs, setOptInputs] = useState({ n: 1.5, k: 0, r: 4, t: 92, a: 4 });
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

  const addOptPoint = () => {
    if (newOptPoint.wl && newOptPoint.r) {
      setOptData(prev => [...prev, { id: Date.now(), wl: Number(newOptPoint.wl), r: Number(newOptPoint.r) }].sort((a, b) => a.wl - b.wl));
      setNewOptPoint({ wl: '', r: '' });
    }
  };

  // --- SUB-MODULE 5: Crystal ---
  const [crystInputs, setCrystInputs] = useState({ sys: 'FCC', a: 3.61, b: 3.61, c: 3.61, alpha: 90, beta: 90, gamma: 90, m: 63.55 });
  
  const crystProps = useMemo(() => {
    const { sys, a, b, c, alpha, beta, gamma, m } = crystInputs;
    let n = 1, apf = 0;
    if (sys === 'SC') { n = 1; apf = 0.52; }
    else if (sys === 'BCC') { n = 2; apf = 0.68; }
    else if (sys === 'FCC') { n = 4; apf = 0.74; }
    else if (sys === 'HCP') { n = 6; apf = 0.74; }
    else if (sys === 'DC') { n = 8; apf = 0.34; }

    if (a <= 0 || m <= 0 || (sys === 'HCP' && c <= 0)) return { n, apf, rho: 'N/A' };

    // Volume calculation (simplified for cubic/hex)
    let v = 0;
    if (sys === 'HCP') {
      v = (3 * Math.sqrt(3) / 2) * Math.pow(a * 1e-8, 2) * (c * 1e-8);
    } else {
      v = Math.pow(a * 1e-8, 3); // Assuming cubic for others
    }

    const NA = 6.022e23;
    const rho = (n * m) / (v * NA); // g/cm^3

    return { n, apf, rho: rho.toFixed(2) };
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
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 min-w-[300px] ${t.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Physical Properties</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Thermal, electrical, magnetic, optical, and crystallographic analysis</p>
          </div>
          <div className="w-full md:w-64">
            <select 
              value={selectedMaterialId}
              onChange={handleMaterialSelect}
              className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm"
            >
              <option value="">-- Load from Database --</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
        
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
            {Object.entries({ k: 'Thermal Cond. k (W/m·K)', cp: 'Specific Heat Cp (J/kg·K)', rho: 'Density ρ (kg/m³)', cte: 'CTE (10⁻⁶/K)', tm: 'Melting Point (°C)', tg: 'Glass Transition (°C)' }).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                <input 
                  type="number" 
                  min={key === 'cp' || key === 'rho' ? "0.000001" : undefined}
                  step="any"
                  value={thermalInputs[key]} 
                  onChange={e => setThermalInputs({...thermalInputs, [key]: Number(e.target.value)})}
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                />
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md">
              <h3 className="text-sm text-[#94A3B8] mb-2">Thermal Diffusivity (α)</h3>
              <div className="flex justify-between items-center">
                <span className="text-[#F1F5F9]">α = k / (ρ × Cp)</span>
                <span className="font-bold text-[#4A9EFF]">{thermalDiffusivity} m²/s</span>
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
                <LineChart data={kVsTData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                  <XAxis dataKey="temp" type="number" domain={['auto', 'auto']} stroke="#94A3B8" label={{ value: 'Temperature (°C)', position: 'bottom', fill: '#94A3B8' }} />
                  <YAxis stroke="#94A3B8" label={{ value: 'Thermal Cond. (W/m·K)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                  <ReferenceLine y={100} stroke="#22C55E" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Good Conductor', fill: '#22C55E', fontSize: 12 }} />
                  <ReferenceLine y={1} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Insulator', fill: '#EF4444', fontSize: 12 }} />
                  <Line type="monotone" dataKey="k" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} />
                </LineChart>
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
                <input type="number" min="0" step="any" value={elecInputs.rho} onChange={e => handleElecChange('rho', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Conductivity σ (S/m)</label>
                <input type="number" min="0" step="any" value={elecInputs.sigma} onChange={e => handleElecChange('sigma', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Dielectric Constant (εr)</label>
                <input type="number" min="1" step="any" value={elecInputs.er} onChange={e => handleElecChange('er', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Breakdown Volts (kV/mm)</label>
                <input type="number" min="0" step="any" value={elecInputs.vbd} onChange={e => handleElecChange('vbd', e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
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

          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Temperature Coefficient</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries({ r0: 'Base Resistance R₀ (Ω)', alpha: 'Temp Coeff α (1/K)', t0: 'Base Temp T₀ (°C)', t: 'Target Temp T (°C)' }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                  <input type="number" step="any" value={elecInputs[key]} onChange={e => handleElecChange(key, e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="mt-6 p-6 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
              <h3 className="text-sm text-[#94A3B8] mb-2">Resistance at {elecInputs.t}°C</h3>
              <div className="text-4xl font-bold text-[#4A9EFF]">{rtCalc} Ω</div>
              <p className="text-xs text-[#94A3B8] mt-4">R(T) = R₀[1 + α(T-T₀)]</p>
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
            {Object.entries({ ur: 'Relative Permeability (μr)', ms: 'Saturation Mag. Ms (A/m)', hc: 'Coercivity Hc (A/m)', br: 'Remanence Br (T)' }).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                <input type="number" min={key === 'ur' ? "1" : "0"} step="any" value={magInputs[key]} onChange={e => setMagInputs({...magInputs, [key]: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
            ))}
            <div className="mt-6 p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md text-center">
              <h3 className="text-sm text-[#94A3B8] mb-2">Classification</h3>
              <span className={`inline-block px-4 py-2 rounded-md font-bold text-white ${magClass.color}`}>{magClass.label}</span>
            </div>
          </div>
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
            <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">B-H Hysteresis Loop Sketch</h2>
            <div className="flex-1 min-h-[300px]">
              {hysteresisData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hysteresisData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                    <XAxis dataKey="h" type="number" stroke="#94A3B8" label={{ value: 'Magnetic Field H (A/m)', position: 'bottom', fill: '#94A3B8' }} />
                    <YAxis stroke="#94A3B8" label={{ value: 'Flux Density B (T)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                    <ReferenceLine x={0} stroke="#2D3F50" />
                    <ReferenceLine y={0} stroke="#2D3F50" />
                    <Line type="monotone" dataKey="bAsc" stroke="#4A9EFF" strokeWidth={2} dot={false} name="Ascending" />
                    <Line type="monotone" dataKey="bDesc" stroke="#F59E0B" strokeWidth={2} dot={false} name="Descending" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#94A3B8]">
                  Enter Ms and Hc &gt; 0 to view hysteresis loop
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
              {Object.entries({ n: 'Refractive Index (n)', k: 'Extinction Coeff (k)' }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                  <input type="number" min="0" step="any" value={optInputs[key]} onChange={e => setOptInputs({...optInputs, [key]: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-[#2D3F50]">
              <h3 className="text-sm font-medium text-[#4A9EFF] mb-3">R + T + A = 100%</h3>
              {Object.entries({ r: 'Reflectance R (%)', t: 'Transmittance T (%)', a: 'Absorbance A (%)' }).map(([key, label]) => (
                <div key={key} className="mb-3">
                  <label className="block text-sm text-[#94A3B8] mb-1">{label}</label>
                  <input type="number" min="0" max="100" step="any" value={optInputs[key]} onChange={e => setOptInputs({...optInputs, [key]: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
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
                <AreaChart data={optData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                  <XAxis dataKey="wl" type="number" domain={['auto', 'auto']} stroke="#94A3B8" label={{ value: 'Wavelength (nm)', position: 'bottom', fill: '#94A3B8' }} />
                  <YAxis stroke="#94A3B8" domain={[0, 100]} label={{ value: 'Reflectance (%)', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                  <Area type="monotone" dataKey="r" stroke="#4A9EFF" fill="#4A9EFF" fillOpacity={0.3} />
                </AreaChart>
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
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Crystal System</label>
              <select value={crystInputs.sys} onChange={e => setCrystInputs({...crystInputs, sys: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                {['SC', 'BCC', 'FCC', 'HCP', 'DC'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries({ a: 'a (Å)', b: 'b (Å)', c: 'c (Å)', alpha: 'α (°)', beta: 'β (°)', gamma: 'γ (°)' }).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                  <input type="number" min="0.0001" step="any" value={crystInputs[key]} onChange={e => setCrystInputs({...crystInputs, [key]: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Atomic Mass M (g/mol)</label>
              <input type="number" min="0.0001" step="any" value={crystInputs.m} onChange={e => setCrystInputs({...crystInputs, m: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
            </div>
          </div>
          
          <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 w-full">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-6">Theoretical Properties</h2>
              <div className="space-y-4">
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md flex justify-between items-center">
                  <div className="text-[#94A3B8]">Atoms per Unit Cell (n)</div>
                  <div className="text-xl font-bold text-[#F1F5F9]">{crystProps.n}</div>
                </div>
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md flex justify-between items-center">
                  <div className="text-[#94A3B8]">Atomic Packing Factor (APF)</div>
                  <div className="text-xl font-bold text-[#F59E0B]">{crystProps.apf}</div>
                </div>
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-md flex justify-between items-center">
                  <div>
                    <div className="text-[#F1F5F9] font-medium">Theoretical Density (ρ)</div>
                    <div className="text-xs text-[#94A3B8]">ρ = (n × M) / (NA × Vc)</div>
                  </div>
                  <div className="text-2xl font-bold text-[#4A9EFF]">{crystProps.rho} g/cm³</div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full bg-[#0F1923] border border-[#2D3F50] rounded-md p-6 flex items-center justify-center min-h-[300px]">
              {renderUnitCell()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
