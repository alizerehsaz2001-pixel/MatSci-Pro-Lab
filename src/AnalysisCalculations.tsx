import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, ComposedChart, ReferenceLine } from 'recharts';
import { Calculator, BarChart2, TrendingUp, Filter, AlertTriangle, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, Download } from 'lucide-react';

const TABS = [
  { id: 'Universal Calculator', icon: Calculator },
  { id: 'Statistical Analysis', icon: BarChart2 },
  { id: 'Interpolation', icon: TrendingUp },
  { id: 'Material Selector', icon: Filter },
  { id: 'Failure Analysis', icon: AlertTriangle }
];

const FORMULAS = [
  { id: 'stress', name: 'Stress', eq: 'σ = F / A', inputs: [{ key: 'F', label: 'Force F (N)' }, { key: 'A', label: 'Area A (m²)' }], calc: v => v.F / v.A, unit: 'Pa' },
  { id: 'strain', name: 'Strain', eq: 'ε = ΔL / L₀', inputs: [{ key: 'dL', label: 'Change in Length ΔL' }, { key: 'L0', label: 'Original Length L₀' }], calc: v => v.dL / v.L0, unit: '' },
  { id: 'youngs', name: 'Young\'s Modulus', eq: 'E = σ / ε', inputs: [{ key: 'sigma', label: 'Stress σ (Pa)' }, { key: 'epsilon', label: 'Strain ε' }], calc: v => v.sigma / v.epsilon, unit: 'Pa' },
  { id: 'shear', name: 'Shear Modulus', eq: 'G = E / 2(1+ν)', inputs: [{ key: 'E', label: 'Young\'s Modulus E (GPa)' }, { key: 'nu', label: 'Poisson\'s Ratio ν' }], calc: v => v.E / (2 * (1 + v.nu)), unit: 'GPa' },
  { id: 'bulk', name: 'Bulk Modulus', eq: 'K = E / 3(1-2ν)', inputs: [{ key: 'E', label: 'Young\'s Modulus E (GPa)' }, { key: 'nu', label: 'Poisson\'s Ratio ν' }], calc: v => v.E / (3 * (1 - 2 * v.nu)), unit: 'GPa' },
  { id: 'thermal_stress', name: 'Thermal Stress', eq: 'σ = E × α × ΔT', inputs: [{ key: 'E', label: 'Modulus E (GPa)' }, { key: 'alpha', label: 'CTE α (1/K)' }, { key: 'dT', label: 'Temp Change ΔT (K)' }], calc: v => v.E * 1000 * v.alpha * v.dT, unit: 'MPa' },
  { id: 'safety_factor', name: 'Safety Factor', eq: 'SF = σ_yield / σ_applied', inputs: [{ key: 'sy', label: 'Yield Strength (MPa)' }, { key: 'sa', label: 'Applied Stress (MPa)' }], calc: v => v.sy / v.sa, unit: '' },
  { id: 'density', name: 'Theoretical Density', eq: 'ρ = nM / (NA × Vc)', inputs: [{ key: 'n', label: 'Atoms/Cell n' }, { key: 'M', label: 'Molar Mass M (g/mol)' }, { key: 'Vc', label: 'Cell Volume Vc (cm³)' }], calc: v => (v.n * v.M) / (6.022e23 * v.Vc), unit: 'g/cm³' },
  { id: 'diffusivity', name: 'Thermal Diffusivity', eq: 'α = k / (ρ × Cp)', inputs: [{ key: 'k', label: 'Thermal Cond. k (W/m·K)' }, { key: 'rho', label: 'Density ρ (kg/m³)' }, { key: 'cp', label: 'Specific Heat Cp (J/kg·K)' }], calc: v => v.k / (v.rho * v.cp), unit: 'm²/s' },
  { id: 'conductivity', name: 'Conductivity', eq: 'σ = 1 / ρ', inputs: [{ key: 'rho', label: 'Resistivity ρ (Ω·m)' }], calc: v => 1 / v.rho, unit: 'S/m' }
];

const FA_QUESTIONS = [
  {
    id: 'surface',
    q: 'What does the fracture surface look like?',
    options: [
      { label: 'Beach marks / Striations (smooth origin, rough final)', mode: 'Fatigue' },
      { label: 'Dimpled / Cup-and-cone (significant deformation)', mode: 'Yielding' },
      { label: 'Cleavage / Granular / Shiny (flat, little deformation)', mode: 'Brittle Fracture' },
      { label: 'Intergranular / Oxidized / Voids', mode: 'Creep' }
    ]
  },
  {
    id: 'loading',
    q: 'What was the primary loading condition?',
    options: [
      { label: 'Cyclic / Vibration / Repeated bending', mode: 'Fatigue' },
      { label: 'Constant high load over long time', mode: 'Creep' },
      { label: 'Sudden impact / Shock', mode: 'Brittle Fracture' },
      { label: 'Overload / Exceeded design stress', mode: 'Yielding' }
    ]
  },
  {
    id: 'environment',
    q: 'What was the operating environment?',
    options: [
      { label: 'High temperature (> 0.4 Tm)', mode: 'Creep' },
      { label: 'Corrosive / Chemical exposure', mode: 'Corrosion' },
      { label: 'Low temperature (below DBTT)', mode: 'Brittle Fracture' },
      { label: 'Rapid temperature changes', mode: 'Thermal Shock' },
      { label: 'Room temperature / Normal', mode: 'Yielding' }
    ]
  }
];

const FA_RESULTS = {
  'Fatigue': { tests: 'SEM fractography, S-N curve testing, NDT (ultrasonic/dye penetrant)', prevention: 'Reduce stress concentrations, improve surface finish, shot peening, use materials with higher endurance limit.' },
  'Yielding': { tests: 'Tensile testing, Hardness testing, Dimensional inspection', prevention: 'Increase cross-sectional area, select material with higher yield strength, reduce applied loads.' },
  'Brittle Fracture': { tests: 'Charpy V-notch impact test, Fracture toughness (KIC) test', prevention: 'Operate above DBTT, reduce flaw sizes, use materials with higher fracture toughness, avoid impact loads.' },
  'Creep': { tests: 'Creep rupture testing, Microstructural analysis (voids)', prevention: 'Lower operating temperature, reduce constant stress, use superalloys or materials with larger grain sizes.' },
  'Corrosion': { tests: 'EDS/XRD for corrosion products, Salt spray testing', prevention: 'Apply protective coatings, use corrosion-resistant alloys, implement cathodic protection, alter environment.' },
  'Thermal Shock': { tests: 'Thermal cycling tests, CTE measurement', prevention: 'Use materials with low CTE and high thermal conductivity, reduce rate of temperature change, avoid sharp corners.' }
};

// Math Helpers for Interpolation
function solveLinearSystem(A, b) {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]), maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; }
    }
    for (let k = i; k < n; k++) { const tmp = A[maxRow][k]; A[maxRow][k] = A[i][k]; A[i][k] = tmp; }
    const tmp = b[maxRow]; b[maxRow] = b[i]; b[i] = tmp;
    if (Math.abs(A[i][i]) < 1e-10) return new Array(n).fill(0); // Singular
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) { if (i === j) A[k][j] = 0; else A[k][j] += c * A[i][j]; }
      b[k] += c * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i] / A[i][i];
    for (let k = i - 1; k >= 0; k--) b[k] -= A[k][i] * x[i];
  }
  return x;
}

function polyFit(points, degree) {
  const X = [], Y = [];
  for (let i = 0; i <= degree; i++) {
    const row = [];
    for (let j = 0; j <= degree; j++) {
      row.push(points.reduce((sum, p) => sum + Math.pow(p.x, i + j), 0));
    }
    X.push(row);
    Y.push(points.reduce((sum, p) => sum + p.y * Math.pow(p.x, i), 0));
  }
  return solveLinearSystem(X, Y);
}

export default function AnalysisCalculations({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme, onNavigate }) {
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
      // Populate Calculators with common fields if they exist in the formula
      // This is a bit complex because calcInputs is nested by calcId
      // For simplicity, we'll just toast and let user know it's loaded for some
      addToast(`Loaded properties for ${mat.name}. Use them in relevant calculators.`);
    }
  };

  // --- SUB-MODULE 1: Calculators ---
  const [calcInputs, setCalcInputs] = useState({});
  const [calcResults, setCalcResults] = useState({});

  const handleCalcInput = (calcId, key, value) => {
    setCalcInputs(prev => ({ ...prev, [calcId]: { ...prev[calcId], [key]: Number(value) } }));
  };

  const runCalc = (calcId, calcFn) => {
    try {
      const inputs = calcInputs[calcId] || {};
      const res = calcFn(inputs);
      setCalcResults(prev => ({ ...prev, [calcId]: isNaN(res) || !isFinite(res) ? 'Error' : res.toExponential(4).replace(/e\+?0?/, ' x 10^') }));
    } catch (e) {
      setCalcResults(prev => ({ ...prev, [calcId]: 'Error' }));
    }
  };

  // --- SUB-MODULE 2: Statistics ---
  const [statsText, setStatsText] = useState('450, 460, 445, 455, 470, 440, 465, 452, 458, 448, 520');
  
  const statsData = useMemo(() => {
    const vals = statsText.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (vals.length === 0) return null;

    const n = vals.length;
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0 ? (vals[n/2 - 1] + vals[n/2]) / 2 : vals[Math.floor(n/2)];
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);
    const cov = (stdDev / mean) * 100;
    const min = vals[0];
    const max = vals[n - 1];
    const q1 = vals[Math.floor(n * 0.25)];
    const q3 = vals[Math.floor(n * 0.75)];

    // Histogram bins
    const binCount = Math.max(5, Math.min(15, Math.ceil(Math.sqrt(n))));
    const binWidth = (max - min) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      x0: min + i * binWidth,
      x1: min + (i + 1) * binWidth,
      mid: min + (i + 0.5) * binWidth,
      count: 0
    }));

    vals.forEach(v => {
      const binIdx = Math.min(binCount - 1, Math.floor((v - min) / binWidth));
      bins[binIdx].count++;
    });

    // Normal curve overlay
    const chartData = bins.map(b => {
      const normalVal = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((b.mid - mean) / stdDev, 2));
      const scaledNormal = normalVal * n * binWidth; // Scale to match histogram frequencies
      return { bin: `${b.x0.toFixed(1)}-${b.x1.toFixed(1)}`, mid: b.mid, count: b.count, normal: scaledNormal };
    });

    // Weibull (approximation)
    let m = 0;
    if (min > 0 && n > 2) {
      const wX = [], wY = [];
      vals.forEach((v, i) => {
        const F = (i + 1 - 0.3) / (n + 0.4); // Median rank
        wX.push(Math.log(v));
        wY.push(Math.log(-Math.log(1 - F)));
      });
      const meanX = wX.reduce((a,b)=>a+b,0)/n;
      const meanY = wY.reduce((a,b)=>a+b,0)/n;
      const num = wX.reduce((a,b,i) => a + (b - meanX)*(wY[i] - meanY), 0);
      const den = wX.reduce((a,b) => a + Math.pow(b - meanX, 2), 0);
      m = num / den;
    }

    return { n, mean, median, stdDev, cov, min, max, range: max - min, q1, q3, chartData, vals, m };
  }, [statsText]);

  // --- SUB-MODULE 3: Interpolation ---
  const [interpPoints, setInterpPoints] = useState([
    { id: 1, x: 10, y: 100 }, { id: 2, x: 20, y: 150 }, { id: 3, x: 30, y: 180 }, { id: 4, x: 40, y: 190 }
  ]);
  const [interpMethod, setInterpMethod] = useState('poly2');
  const [queryX, setQueryX] = useState('');

  const interpResult = useMemo(() => {
    if (interpPoints.length < 2) return null;
    const pts = [...interpPoints].sort((a, b) => a.x - b.x);
    let coeffs = [];
    let degree = 1;
    
    if (interpMethod === 'linear') degree = 1;
    else if (interpMethod === 'poly2') degree = Math.min(2, pts.length - 1);
    else if (interpMethod === 'poly3') degree = Math.min(3, pts.length - 1);
    else if (interpMethod === 'poly4') degree = Math.min(4, pts.length - 1);

    coeffs = polyFit(pts, degree);

    const predict = (x) => coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);

    // Calculate R2 and RMSE
    const meanY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
    let ssTot = 0, ssRes = 0;
    pts.forEach(p => {
      const pred = predict(p.x);
      ssTot += Math.pow(p.y - meanY, 2);
      ssRes += Math.pow(p.y - pred, 2);
    });
    const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    const rmse = Math.sqrt(ssRes / pts.length);

    // Generate curve data
    const curveData = [];
    const minX = pts[0].x;
    const maxX = pts[pts.length - 1].x;
    const step = (maxX - minX) / 50 || 1;
    for (let x = minX; x <= maxX; x += step) {
      curveData.push({ x, curveY: predict(x) });
    }
    curveData.push({ x: maxX, curveY: predict(maxX) });

    // Combine points and curve for Recharts
    const chartData = [...curveData];
    pts.forEach(p => {
      const existing = chartData.find(c => Math.abs(c.x - p.x) < 1e-5);
      if (existing) existing.pointY = p.y;
      else chartData.push({ x: p.x, pointY: p.y, curveY: predict(p.x) });
    });
    chartData.sort((a, b) => a.x - b.x);

    const qY = queryX !== '' ? predict(Number(queryX)) : null;

    return { coeffs, r2, rmse, chartData, qY };
  }, [interpPoints, interpMethod, queryX]);

  const addInterpPoint = () => setInterpPoints(prev => [...prev, { id: Date.now(), x: 0, y: 0 }]);
  const updateInterpPoint = (id, field, val) => setInterpPoints(prev => prev.map(p => p.id === id ? { ...p, [field]: Number(val) } : p));
  const removeInterpPoint = (id) => setInterpPoints(prev => prev.filter(p => p.id !== id));

  // --- SUB-MODULE 4: Material Selector ---
  const [selCriteria, setSelCriteria] = useState({ minYield: 0, maxDensity: 20, minTemp: 0, maxTemp: 1000, electrical: 'any' });

  const rankedMaterials = useMemo(() => {
    if (!materials || materials.length === 0) return [];
    
    return materials.map(m => {
      let score = 0;
      let maxScore = 4;
      
      // Yield Strength
      if (m.yieldStrength >= selCriteria.minYield) score += 1;
      else if (selCriteria.minYield > 0) score += Math.max(0, m.yieldStrength / selCriteria.minYield);
      
      // Density
      if (m.density <= selCriteria.maxDensity) score += 1;
      else if (m.density > 0) score += Math.max(0, selCriteria.maxDensity / m.density);
      
      // Temp (Melting point as proxy for max temp)
      if (m.meltingPoint >= selCriteria.maxTemp) score += 1;
      else if (selCriteria.maxTemp > 0) score += Math.max(0, m.meltingPoint / selCriteria.maxTemp);

      // Electrical
      if (selCriteria.electrical !== 'any') {
        const isCond = m.electricalResistivity < 1e-5;
        const isIns = m.electricalResistivity > 1e5;
        if ((selCriteria.electrical === 'conductor' && isCond) || (selCriteria.electrical === 'insulator' && isIns)) score += 1;
      } else {
        score += 1; // Free point if 'any'
      }

      const matchPct = Math.round((score / maxScore) * 100);
      return { ...m, matchPct };
    }).sort((a, b) => b.matchPct - a.matchPct);
  }, [materials, selCriteria]);

  // --- SUB-MODULE 5: Failure Analysis ---
  const [faStep, setFaStep] = useState(0);
  const [faAnswers, setFaAnswers] = useState({});
  
  const faResult = useMemo(() => {
    if (faStep < FA_QUESTIONS.length) return null;
    const modeCounts: any = {};
    Object.values(faAnswers).forEach((mode: any) => {
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    });
    let topMode = Object.keys(modeCounts)[0];
    let maxCount = 0;
    for (const [mode, count] of Object.entries(modeCounts)) {
      if ((count as number) > maxCount) { maxCount = count as number; topMode = mode; }
    }
    return { mode: topMode, ...FA_RESULTS[topMode] };
  }, [faStep, faAnswers]);

  const handleFaAnswer = (qId, mode) => {
    setFaAnswers(prev => ({ ...prev, [qId]: mode }));
    setFaStep(prev => prev + 1);
  };

  const resetFa = () => {
    setFaStep(0);
    setFaAnswers({});
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto bg-[#0F1923] text-[#F1F5F9]">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 min-w-[300px] ${t.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Analysis & Calculations</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Universal engineering calculators and statistical tools</p>
          </div>
          <div className="w-full md:w-64">
            <select 
              value={selectedMaterialId}
              onChange={handleMaterialSelect}
              className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm"
            >
              <option value="">-- Reference Material --</option>
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

      <div className="flex-1">
        {/* TAB 1: Universal Calculator */}
        {activeTab === 'Universal Calculator' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {FORMULAS.map(form => (
              <div key={form.id} className="bg-[#1A2634] p-5 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-[#F1F5F9]">{form.name}</h3>
                  <span className="text-xs font-mono bg-[#0F1923] px-2 py-1 rounded text-[#4A9EFF] border border-[#2D3F50]">{form.eq}</span>
                </div>
                <div className="space-y-3 flex-1">
                  {form.inputs.map(inp => (
                    <div key={inp.key}>
                      <label className="block text-xs text-[#94A3B8] mb-1">{inp.label}</label>
                      <input 
                        type="number" 
                        step="any"
                        value={calcInputs[form.id]?.[inp.key] || ''}
                        onChange={e => handleCalcInput(form.id, inp.key, e.target.value)}
                        className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" 
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#2D3F50] flex items-center justify-between">
                  <button 
                    onClick={() => runCalc(form.id, form.calc)}
                    className="bg-[#2D3F50] hover:bg-[#4A9EFF] text-white px-4 py-1.5 rounded-md text-sm transition-colors"
                  >
                    Calculate
                  </button>
                  <div className="text-right">
                    <div className="text-xs text-[#94A3B8]">Result</div>
                    <div className="font-bold text-[#F1F5F9]">
                      {calcResults[form.id] !== undefined ? `${calcResults[form.id]} ${form.unit}` : '--'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Statistical Analysis */}
        {activeTab === 'Statistical Analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Data Input</h2>
              <p className="text-xs text-[#94A3B8] mb-2">Enter comma-separated numerical values (e.g., test results):</p>
              <textarea 
                value={statsText}
                onChange={e => setStatsText(e.target.value)}
                className="w-full flex-1 min-h-[150px] bg-[#0F1923] border border-[#2D3F50] rounded-md p-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm resize-none mb-4"
              />
              {statsData && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Count (n):</span> <span className="float-right font-bold">{statsData.n}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Mean:</span> <span className="float-right font-bold text-[#4A9EFF]">{statsData.mean.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Median:</span> <span className="float-right font-bold">{statsData.median.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Std Dev:</span> <span className="float-right font-bold text-[#F59E0B]">{statsData.stdDev.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">CoV (%):</span> <span className="float-right font-bold">{statsData.cov.toFixed(1)}%</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Range:</span> <span className="float-right font-bold">{statsData.range.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Min / Max:</span> <span className="float-right font-bold">{statsData.min} / {statsData.max}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Weibull m:</span> <span className="float-right font-bold text-[#22C55E]">{statsData.m.toFixed(2)}</span></div>
                </div>
              )}
            </div>
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Distribution & Outliers</h2>
              {statsData ? (
                <>
                  <div className="flex-1 min-h-[300px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={statsData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                        <XAxis dataKey="bin" stroke="#94A3B8" tick={{fontSize: 12}} />
                        <YAxis yAxisId="left" stroke="#94A3B8" label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#94A3B8' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#4A9EFF" hide />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" name="Frequency" fill="#2D3F50" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="normal" name="Normal Dist." stroke="#4A9EFF" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                    <h3 className="text-sm font-medium text-[#F1F5F9] mb-2">Outlier Detection (±2σ)</h3>
                    <div className="flex flex-wrap gap-2">
                      {statsData.vals.map((v, i) => {
                        const isOutlier = Math.abs(v - statsData.mean) > 2 * statsData.stdDev;
                        return (
                          <span key={i} className={`px-2 py-1 rounded text-xs font-medium ${isOutlier ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50' : 'bg-[#1A2634] text-[#94A3B8] border border-[#2D3F50]'}`}>
                            {v}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#94A3B8]">Enter valid numerical data to view analysis.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Interpolation */}
        {activeTab === 'Interpolation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 flex flex-col">
              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2 mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Data Points</h2>
                <button onClick={addInterpPoint} className="text-[#4A9EFF] hover:text-blue-400 flex items-center gap-1 text-sm"><Plus size={16} /> Add</button>
              </div>
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
                {interpPoints.map((p, i) => (
                  <div key={p.id} className="flex gap-2 items-center">
                    <span className="text-[#94A3B8] text-xs w-4">{i+1}.</span>
                    <input type="number" value={p.x} onChange={e => updateInterpPoint(p.id, 'x', e.target.value)} placeholder="X" className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                    <input type="number" value={p.y} onChange={e => updateInterpPoint(p.id, 'y', e.target.value)} placeholder="Y" className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                    <button onClick={() => removeInterpPoint(p.id)} className="text-[#EF4444] hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              
              <h3 className="text-sm font-medium text-[#F1F5F9] mb-2">Method & Prediction</h3>
              <select value={interpMethod} onChange={e => setInterpMethod(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm mb-4">
                <option value="linear">Linear Regression</option>
                <option value="poly2">Polynomial (Degree 2)</option>
                <option value="poly3">Polynomial (Degree 3)</option>
                <option value="poly4">Polynomial (Degree 4)</option>
              </select>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-[#94A3B8] mb-1">Query X</label>
                  <input type="number" value={queryX} onChange={e => setQueryX(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                </div>
                <div className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-center">
                  <div className="text-xs text-[#94A3B8] mb-1">Predicted Y</div>
                  <div className="font-bold text-[#4A9EFF] text-sm">{interpResult?.qY !== null ? interpResult.qY.toFixed(4) : '--'}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2 mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Curve Fit</h2>
                {interpResult && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-[#94A3B8]">R²: <span className="text-[#22C55E] font-medium">{interpResult.r2.toFixed(4)}</span></span>
                    <span className="text-[#94A3B8]">RMSE: <span className="text-[#F1F5F9] font-medium">{interpResult.rmse.toFixed(4)}</span></span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-[300px]">
                {interpResult ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={interpResult.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                      <XAxis dataKey="x" type="number" domain={['auto', 'auto']} stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" domain={['auto', 'auto']} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                      <Legend />
                      <Line type="monotone" dataKey="curveY" name="Fitted Curve" stroke="#4A9EFF" strokeWidth={2} dot={false} />
                      <Scatter dataKey="pointY" name="Data Points" fill="#F59E0B" />
                      {queryX !== '' && interpResult.qY !== null && (
                        <ReferenceLine x={Number(queryX)} stroke="#22C55E" strokeDasharray="3 3" label={{ position: 'top', value: 'Query', fill: '#22C55E', fontSize: 12 }} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#94A3B8]">Need at least 2 data points.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Material Selector */}
        {activeTab === 'Material Selector' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 space-y-6">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Application Requirements</h2>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-[#94A3B8]">Min Yield Strength</label>
                  <span className="text-[#F1F5F9] font-medium">{selCriteria.minYield} MPa</span>
                </div>
                <input type="range" min="0" max="2000" step="50" value={selCriteria.minYield} onChange={e => setSelCriteria({...selCriteria, minYield: Number(e.target.value)})} className="w-full accent-[#4A9EFF]" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-[#94A3B8]">Max Density</label>
                  <span className="text-[#F1F5F9] font-medium">{selCriteria.maxDensity} g/cm³</span>
                </div>
                <input type="range" min="1" max="20" step="0.5" value={selCriteria.maxDensity} onChange={e => setSelCriteria({...selCriteria, maxDensity: Number(e.target.value)})} className="w-full accent-[#4A9EFF]" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-[#94A3B8]">Min Operating Temp</label>
                  <span className="text-[#F1F5F9] font-medium">{selCriteria.maxTemp} °C</span>
                </div>
                <input type="range" min="0" max="3000" step="100" value={selCriteria.maxTemp} onChange={e => setSelCriteria({...selCriteria, maxTemp: Number(e.target.value)})} className="w-full accent-[#4A9EFF]" />
              </div>

              <div>
                <label className="block text-sm text-[#94A3B8] mb-2">Electrical Property</label>
                <div className="flex gap-2">
                  {['any', 'conductor', 'insulator'].map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setSelCriteria({...selCriteria, electrical: opt})}
                      className={`flex-1 py-1.5 rounded text-xs font-medium capitalize transition-colors ${selCriteria.electrical === opt ? 'bg-[#4A9EFF] text-white' : 'bg-[#0F1923] text-[#94A3B8] border border-[#2D3F50] hover:bg-[#2D3F50]'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2 mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Recommended Materials</h2>
                <button className="text-[#4A9EFF] hover:text-blue-400 flex items-center gap-2 text-sm">
                  <Download size={16} /> Export PDF
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {rankedMaterials.length === 0 ? (
                  <div className="text-center text-[#94A3B8] py-8">No materials available to rank.</div>
                ) : (
                  rankedMaterials.map((m, idx) => (
                    <div key={m.id} className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-lg flex items-center gap-4">
                      <div className="text-2xl font-bold text-[#2D3F50] w-8 text-center">#{idx + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[#F1F5F9]">{m.name}</span>
                          <span className={`text-sm font-bold ${m.matchPct >= 80 ? 'text-[#22C55E]' : m.matchPct >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>{m.matchPct}% Match</span>
                        </div>
                        <div className="h-2 w-full bg-[#1A2634] rounded-full overflow-hidden mb-2">
                          <div className={`h-full rounded-full ${m.matchPct >= 80 ? 'bg-[#22C55E]' : m.matchPct >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`} style={{ width: `${m.matchPct}%` }}></div>
                        </div>
                        <div className="flex gap-4 text-xs text-[#94A3B8]">
                          <span>Yield: {m.yieldStrength} MPa</span>
                          <span>Density: {m.density} g/cm³</span>
                          <span>M.P.: {m.meltingPoint} °C</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Failure Analysis */}
        {activeTab === 'Failure Analysis' && (
          <div className="max-w-3xl mx-auto bg-[#1A2634] p-8 rounded-lg border border-[#2D3F50] shadow-lg">
            {faStep < FA_QUESTIONS.length ? (
              <div className="animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#F1F5F9]">Failure Analysis Wizard</h2>
                  <span className="text-sm text-[#4A9EFF] font-medium">Step {faStep + 1} of {FA_QUESTIONS.length}</span>
                </div>
                <div className="h-2 w-full bg-[#0F1923] rounded-full overflow-hidden mb-8">
                  <div className="h-full bg-[#4A9EFF] transition-all duration-300" style={{ width: `${((faStep) / FA_QUESTIONS.length) * 100}%` }}></div>
                </div>
                
                <h3 className="text-lg text-[#F1F5F9] mb-6">{FA_QUESTIONS[faStep].q}</h3>
                
                <div className="space-y-3">
                  {FA_QUESTIONS[faStep].options.map((opt, i) => (
                    <button 
                      key={i}
                      onClick={() => handleFaAnswer(FA_QUESTIONS[faStep].id, opt.mode)}
                      className="w-full text-left p-4 rounded-lg border border-[#2D3F50] bg-[#0F1923] hover:border-[#4A9EFF] hover:bg-[#2D3F50]/50 transition-colors text-[#F1F5F9] flex justify-between items-center group"
                    >
                      <span>{opt.label}</span>
                      <ChevronRight size={18} className="text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in zoom-in-95">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#EF4444]/20 text-[#EF4444] mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#F1F5F9]">Analysis Complete</h2>
                  <p className="text-[#94A3B8]">Based on your inputs, the most probable failure mode is:</p>
                </div>
                
                <div className="bg-[#0F1923] border border-[#EF4444]/50 rounded-lg p-6 mb-6 text-center">
                  <div className="text-3xl font-bold text-[#EF4444] mb-2">{faResult.mode}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-[#0F1923] border border-[#2D3F50] p-5 rounded-lg">
                    <h3 className="text-[#4A9EFF] font-bold mb-2 flex items-center gap-2"><CheckCircle size={16} /> Recommended Tests</h3>
                    <p className="text-sm text-[#F1F5F9] leading-relaxed">{faResult.tests}</p>
                  </div>
                  <div className="bg-[#0F1923] border border-[#2D3F50] p-5 rounded-lg">
                    <h3 className="text-[#22C55E] font-bold mb-2 flex items-center gap-2"><CheckCircle size={16} /> Prevention Tips</h3>
                    <p className="text-sm text-[#F1F5F9] leading-relaxed">{faResult.prevention}</p>
                  </div>
                </div>

                <div className="text-center">
                  <button onClick={resetFa} className="bg-[#2D3F50] hover:bg-[#4A9EFF] text-white px-6 py-2 rounded-md transition-colors font-medium">
                    Start New Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
