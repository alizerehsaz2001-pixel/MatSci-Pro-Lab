import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calculator, BarChart2, TrendingUp, Filter, AlertTriangle, Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, Download, Upload, X, Brain, Send, Sparkles, Loader2, Info, Sigma, Activity } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import Markdown from 'react-markdown';

const TABS = [
  { id: 'Universal Calculator', icon: Calculator },
  { id: 'Statistical Analysis', icon: BarChart2 },
  { id: 'Interpolation', icon: TrendingUp },
  { id: 'Material Selector', icon: Filter },
  { id: 'Failure Analysis', icon: AlertTriangle }
];

const FORMULA_CATEGORIES = [
  'All',
  'Mechanical',
  'Thermal',
  'Crystal & Structural',
  'Electrical & Magnetic',
  'Failure & Degradation'
];

const FORMULAS = [
  // Mechanical
  { id: 'stress', category: 'Mechanical', name: 'True Stress', eq: 'σ_t = F / A_i', inputs: [{ key: 'F', label: 'Force F (N)' }, { key: 'Ai', label: 'Inst. Area A_i (m²)' }], calc: v => v.F / v.Ai, unit: 'Pa' },
  { id: 'strain', category: 'Mechanical', name: 'True Strain', eq: 'ε_t = ln(L_i / L_0)', inputs: [{ key: 'Li', label: 'Inst. Length L_i' }, { key: 'L0', label: 'Orig. Length L_0' }], calc: v => Math.log(v.Li / v.L0), unit: '' },
  { id: 'youngs', category: 'Mechanical', name: 'Young\'s Modulus', eq: 'E = σ / ε', inputs: [{ key: 'sigma', label: 'Stress σ (Pa)' }, { key: 'epsilon', label: 'Strain ε' }], calc: v => v.sigma / v.epsilon, unit: 'Pa' },
  { id: 'shear', category: 'Mechanical', name: 'Shear Modulus', eq: 'G = E / 2(1+ν)', inputs: [{ key: 'E', label: 'Young\'s Modulus E (GPa)' }, { key: 'nu', label: 'Poisson\'s Ratio ν' }], calc: v => v.E / (2 * (1 + v.nu)), unit: 'GPa' },
  { id: 'bulk', category: 'Mechanical', name: 'Bulk Modulus', eq: 'K = E / 3(1-2ν)', inputs: [{ key: 'E', label: 'Young\'s Modulus E (GPa)' }, { key: 'nu', label: 'Poisson\'s Ratio ν' }], calc: v => v.E / (3 * (1 - 2 * v.nu)), unit: 'GPa' },
  { id: 'hooks_spring', category: 'Mechanical', name: 'Spring Force', eq: 'F = -k x', inputs: [{ key: 'k', label: 'Stiffness k (N/m)' }, { key: 'x', label: 'Displacement x (m)' }], calc: v => -(v.k * v.x), unit: 'N' },
  { id: 'bending_stress', category: 'Mechanical', name: 'Bending Stress', eq: 'σ = M y / I', inputs: [{ key: 'M', label: 'Moment M (N·m)' }, { key: 'y', label: 'Dist. from neutral y (m)' }, { key: 'I', label: 'Moment of Inertia I (m⁴)' }], calc: v => (v.M * v.y) / v.I, unit: 'Pa' },
  
  // Thermal
  { id: 'thermal_stress', category: 'Thermal', name: 'Thermal Stress', eq: 'σ = E × α × ΔT', inputs: [{ key: 'E', label: 'Modulus E (GPa)' }, { key: 'alpha', label: 'CTE α (1/K)' }, { key: 'dT', label: 'Temp Diff ΔT (K)' }], calc: v => v.E * 1000 * v.alpha * v.dT, unit: 'MPa' },
  { id: 'diffusivity', category: 'Thermal', name: 'Thermal Diffusivity', eq: 'α = k / (ρ × Cp)', inputs: [{ key: 'k', label: 'Thermal Cond. k (W/m·K)' }, { key: 'rho', label: 'Density ρ (kg/m³)' }, { key: 'cp', label: 'Specific Heat Cp (J/kg·K)' }], calc: v => v.k / (v.rho * v.cp), unit: 'm²/s' },
  { id: 'thermal_expansion', category: 'Thermal', name: 'Linear Expansion', eq: 'ΔL = L₀ × α × ΔT', inputs: [{ key: 'L0', label: 'Orig. Length L₀ (m)' }, { key: 'alpha', label: 'CTE α (1/K)' }, { key: 'dT', label: 'Temp Diff ΔT (K)' }], calc: v => v.L0 * v.alpha * v.dT, unit: 'm' },
  { id: 'fourier', category: 'Thermal', name: 'Steady Heat Conduction', eq: 'q = -k A (ΔT/Δx)', inputs: [{ key: 'k', label: 'Thermal Cond k (W/m·K)' }, { key: 'A', label: 'Area A (m²)' }, { key: 'dT', label: 'Temp Diff ΔT (K)' }, { key: 'dx', label: 'Thickness Δx (m)' }], calc: v => -(v.k * v.A * (v.dT / v.dx)), unit: 'W' },
  
  // Crystal
  { id: 'density', category: 'Crystal & Structural', name: 'Theoretical Density', eq: 'ρ = nM / (NA × Vc)', inputs: [{ key: 'n', label: 'Atoms/Cell n' }, { key: 'M', label: 'Molar Mass M (g/mol)' }, { key: 'Vc', label: 'Cell Volume Vc (cm³)' }], calc: v => (v.n * v.M) / (6.022e23 * v.Vc), unit: 'g/cm³' },
  { id: 'bragg', category: 'Crystal & Structural', name: 'Bragg\'s Law (Solve d)', eq: 'd = (nλ) / (2sinθ)', inputs: [{ key: 'n', label: 'Order n' }, { key: 'lambda', label: 'Wavelength λ (nm)' }, { key: 'theta', label: 'Angle θ (deg)' }], calc: v => (v.n * v.lambda) / (2 * Math.sin(v.theta * Math.PI / 180)), unit: 'nm' },
  { id: 'scherrer', category: 'Crystal & Structural', name: 'Scherrer Equation', eq: 'τ = Kλ / (β cosθ)', inputs: [{ key: 'K', label: 'Shape Factor K (0.9)' }, { key: 'lambda', label: 'Wavelength λ (nm)' }, { key: 'beta', label: 'FWHM β (radians)' }, { key: 'theta', label: 'Bragg Angle θ (deg)' }], calc: v => (v.K * v.lambda) / (v.beta * Math.cos(v.theta * Math.PI / 180)), unit: 'nm' },
  { id: 'planar_density', category: 'Crystal & Structural', name: 'Planar Density', eq: 'PD = n / A', inputs: [{ key: 'n', label: 'Atoms on Plane n' }, { key: 'A', label: 'Area of Plane A (nm²)' }], calc: v => v.n / v.A, unit: 'atoms/nm²' },

  // Elec Mag
  { id: 'conductivity', category: 'Electrical & Magnetic', name: 'Conductivity', eq: 'σ = 1 / ρ', inputs: [{ key: 'rho', label: 'Resistivity ρ (Ω·m)' }], calc: v => 1 / v.rho, unit: 'S/m' },
  { id: 'hall', category: 'Electrical & Magnetic', name: 'Hall Temp Coeff', eq: 'R_H = 1 / (n q)', inputs: [{ key: 'n', label: 'Carrier Density n (m⁻³)' }, { key: 'q', label: 'Charge q (C)' }], calc: v => 1 / (v.n * v.q), unit: 'm³/C' },
  { id: 'drift_velocity', category: 'Electrical & Magnetic', name: 'Drift Velocity', eq: 'v_d = μ E', inputs: [{ key: 'mu', label: 'Mobility μ (m²/V·s)' }, { key: 'E', label: 'Electric Field E (V/m)' }], calc: v => v.mu * v.E, unit: 'm/s' },
  { id: 'magnetic_induction', category: 'Electrical & Magnetic', name: 'Magnetic Induction', eq: 'B = μ (H + M)', inputs: [{ key: 'mu', label: 'Permeability μ (H/m)' }, { key: 'H', label: 'Mag. Field H (A/m)' }, { key: 'M', label: 'Magnetization M (A/m)' }], calc: v => v.mu * (v.H + v.M), unit: 'T' },
  { id: 'skin_depth', category: 'Electrical & Magnetic', name: 'Skin Depth', eq: 'δ = √(2 / ωμσ)', inputs: [{ key: 'f', label: 'Frequency f (Hz)' }, { key: 'mu', label: 'Permeability μ (H/m)' }, { key: 'sigma', label: 'Conductivity σ (S/m)' }], calc: v => Math.sqrt(2 / ((2 * Math.PI * v.f) * v.mu * v.sigma)), unit: 'm' },

  // Failure
  { id: 'safety_factor', category: 'Failure & Degradation', name: 'Safety Factor', eq: 'SF = σ_y / σ_app', inputs: [{ key: 'sy', label: 'Yield Strength (MPa)' }, { key: 'sa', label: 'Applied Stress (MPa)' }], calc: v => v.sy / v.sa, unit: '' },
  { id: 'fracture_toughness', category: 'Failure & Degradation', name: 'Fracture Toughness', eq: 'K_Ic = Y σ √(π a)', inputs: [{ key: 'Y', label: 'Geometry Factor Y' }, { key: 'sigma', label: 'Stress σ (MPa)' }, { key: 'a', label: 'Flaw Size a (m)' }], calc: v => v.Y * v.sigma * Math.sqrt(Math.PI * v.a), unit: 'MPa·m^0.5' },
  { id: 'vickers', category: 'Failure & Degradation', name: 'Vickers Hardness', eq: 'HV = 1.8544 F / d²', inputs: [{ key: 'F', label: 'Force F (kgf)' }, { key: 'd', label: 'Diagonal d (mm)' }], calc: v => (1.8544 * v.F) / (v.d * v.d), unit: 'HV' },
  { id: 'paris_law', category: 'Failure & Degradation', name: 'Paris Law (Fatigue)', eq: 'da/dN = C (ΔK)ᵐ', inputs: [{ key: 'C', label: 'Constant C' }, { key: 'dK', label: 'Stress Int. Range ΔK' }, { key: 'm', label: 'Exponent m' }], calc: v => v.C * Math.pow(v.dK, v.m), unit: 'm/cycle' },
  { id: 'weibull_survival', category: 'Failure & Degradation', name: 'Weibull Reliability', eq: 'R(t) = exp(-(t/η)ᵐ)', inputs: [{ key: 't', label: 'Time/Cycles t' }, { key: 'eta', label: 'Char. Life η' }, { key: 'm', label: 'Shape Param m' }], calc: v => Math.exp(-Math.pow(v.t / v.eta, v.m)), unit: '' }
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
      const newInputs = { ...calcInputs };
      
      // Smart mapping of material properties to calculator inputs
      FORMULAS.forEach(formula => {
        formula.inputs.forEach(input => {
          if (input.key === 'sy' && mat.yieldStrength) {
            newInputs[formula.id] = { ...newInputs[formula.id], [input.key]: mat.yieldStrength };
          }
          if (input.key === 'E' && mat.youngsModulus) {
            newInputs[formula.id] = { ...newInputs[formula.id], [input.key]: mat.youngsModulus };
          }
          if (input.key === 'nu' && mat.poissonRatio) {
            newInputs[formula.id] = { ...newInputs[formula.id], [input.key]: mat.poissonRatio };
          }
          if (input.key === 'rho' && mat.density) {
            // Note: density in g/cm3 vs kg/m3. Formula 'diffusivity' uses kg/m3
            const val = formula.id === 'diffusivity' ? mat.density * 1000 : mat.density;
            newInputs[formula.id] = { ...newInputs[formula.id], [input.key]: val };
          }
          if (input.key === 'k' && mat.thermalConductivity) {
            newInputs[formula.id] = { ...newInputs[formula.id], [input.key]: mat.thermalConductivity };
          }
          if (input.key === 'alpha' && mat.cte) {
            newInputs[formula.id] = { ...newInputs[formula.id], [input.key]: mat.cte / 1e6 }; // Convert from µm/m·K to 1/K
          }
          if (input.key === 'sigma' && mat.yieldStrength) {
            // Default stress to yield strength for safety factor or youngs
            newInputs[formula.id] = { ...newInputs[formula.id], [input.key]: mat.yieldStrength * 1e6 }; // MPa to Pa
          }
        });
      });
      
      setCalcInputs(newInputs);
      addToast(`Smart-populated properties for ${mat.name} across relevant calculators.`);
    }
  };

  // --- AI Assistant Sub-module ---
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const askAssistant = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const context = {
        activeTab,
        selectedMaterial: materials.find(m => m.id === selectedMaterialId),
        stats: activeTab === 'Statistical Analysis' && statsData ? {
          mean: statsData.mean,
          stdDev: statsData.stdDev,
          outliers: statsData.outliers.length,
          skewness: statsData.skewness
        } : null,
        interpolation: activeTab === 'Interpolation' && interpResult ? {
          equation: interpResult.equation,
          r2: interpResult.r2,
          rmse: interpResult.rmse
        } : null,
        selector: activeTab === 'Material Selector' ? {
          criteria: selCriteria,
          topMatches: rankedMaterials.slice(0, 3).map(m => m.name)
        } : null
      };

      const prompt = `You are an Advanced Materials Science Analysis Assistant.
      Current App State: ${JSON.stringify(context)}
      User Question: ${aiQuery}
      
      Provide a highly technical, accurate, and insightful response. 
      Use the context provided to give specific advice. 
      If analyzing data, explain trends and physical implications (e.g., why a high Weibull modulus is good).
      If recommending materials, justify based on the properties in the database.
      Format your response in clear Markdown.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      setAiResponse(result.text);
    } catch (err) {
      console.error(err);
      setAiResponse("### Error\nFailed to connect to the analysis engine. Please ensure your API key is configured correctly.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- SUB-MODULE 1: Calculators ---
  const [calcInputs, setCalcInputs] = useState({});
  const [calcResults, setCalcResults] = useState({});
  const [calcCategory, setCalcCategory] = useState('All');

  const handleCalcInput = (calcId, key, value) => {
    setCalcInputs(prev => ({ ...prev, [calcId]: { ...prev[calcId], [key]: Number(value) } }));
    
    // Auto-calculate if all inputs are present
    const formula = FORMULAS.find(f => f.id === calcId);
    if (formula) {
      const inputs = { ...(calcInputs[calcId] || {}), [key]: Number(value) };
      const allPresent = formula.inputs.every(inp => inputs[inp.key] !== undefined && !isNaN(inputs[inp.key]));
      if (allPresent) {
        try {
          const res = formula.calc(inputs);
          setCalcResults(prev => ({ 
            ...prev, 
            [calcId]: isNaN(res) || !isFinite(res) ? 'Error' : 
              Math.abs(res) > 1e6 || (Math.abs(res) < 1e-4 && Math.abs(res) > 0) ? res.toExponential(4).replace(/e\+?0?(\d+)/, ' x 10^$1').replace(/e-0?(\d+)/, ' x 10^-$1') : parseFloat(res.toFixed(4))
          }));
        } catch (e) {
          setCalcResults(prev => ({ ...prev, [calcId]: 'Error' }));
        }
      }
    }
  };

  const runCalc = (calcId, calcFn) => {
    try {
      const inputs = calcInputs[calcId] || {};
      const res = calcFn(inputs);
      setCalcResults(prev => ({ 
        ...prev, 
        [calcId]: isNaN(res) || !isFinite(res) ? 'Error' : 
          Math.abs(res) > 1e6 || (Math.abs(res) < 1e-4 && Math.abs(res) > 0) ? res.toExponential(4).replace(/e\+?0?(\d+)/, ' x 10^$1').replace(/e-0?(\d+)/, ' x 10^-$1') : parseFloat(res.toFixed(4))
      }));
    } catch (e) {
      setCalcResults(prev => ({ ...prev, [calcId]: 'Error' }));
    }
  };

  // --- SUB-MODULE 2: Statistics ---
  const [statsText, setStatsText] = useState('450, 460, 445, 455, 470, 440, 465, 452, 458, 448, 520');
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result as string;
      // Try to parse CSV or simple list
      const cleanText = text.replace(/[\r\n]+/g, ',').replace(/\s+/g, ',');
      setStatsText(cleanText);
    };
    reader.readAsText(file);
  };

  const statsData = useMemo(() => {
    // Split by comma, newline, or space
    const vals = statsText.split(/[\n, ]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v)).sort((a, b) => a - b);
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
    const iqr = q3 - q1;

    // Skewness & Kurtosis
    const m3 = vals.reduce((a, b) => a + Math.pow(b - mean, 3), 0) / n;
    const m4 = vals.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
    const skewness = m3 / Math.pow(stdDev, 3); // Fisher-Pearson
    const kurtosis = (m4 / Math.pow(stdDev, 4)) - 3; // Excess Kurtosis

    // Outliers (IQR Method)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = vals.filter(v => v < lowerBound || v > upperBound);

    // Histogram bins (Freedman-Diaconis rule or fallback)
    const binWidth = (2 * iqr) / Math.pow(n, 1/3) || (max - min) / Math.sqrt(n) || 1;
    const binCount = Math.max(5, Math.ceil((max - min) / binWidth));
    const bins = Array.from({ length: binCount }, (_, i) => ({
      x0: min + i * binWidth,
      x1: min + (i + 1) * binWidth,
      mid: min + (i + 0.5) * binWidth,
      count: 0
    }));

    vals.forEach(v => {
      const binIdx = Math.min(binCount - 1, Math.floor((v - min) / binWidth));
      if (bins[binIdx]) bins[binIdx].count++;
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

    return { n, mean, median, stdDev, cov, min, max, range: max - min, q1, q3, iqr, skewness, kurtosis, outliers, lowerBound, upperBound, chartData, vals, m };
  }, [statsText]);

  // --- SUB-MODULE 3: Interpolation ---
  const [interpText, setInterpText] = useState('10, 100\n20, 150\n30, 180\n40, 190');
  const [interpMethod, setInterpMethod] = useState('poly2');
  const [queryX, setQueryX] = useState('');

  const handleInterpFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result as string;
      setInterpText(text);
    };
    reader.readAsText(file);
  };

  const interpResult = useMemo(() => {
    // Parse text input
    const pts = interpText.split('\n').map(line => {
      const parts = line.split(/[,\s]+/).filter(p => p.trim() !== '');
      if (parts.length >= 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        return (!isNaN(x) && !isNaN(y)) ? { x, y } : null;
      }
      return null;
    }).filter(p => p !== null).sort((a, b) => a.x - b.x);

    if (pts.length < 2) return null;

    let coeffs = [];
    let predict = (x) => 0;
    let equation = '';

    // Helper for linear regression on transformed data
    const linearFit = (X, Y) => {
      const n = X.length;
      const sumX = X.reduce((a, b) => a + b, 0);
      const sumY = Y.reduce((a, b) => a + b, 0);
      const sumXY = X.reduce((a, b, i) => a + b * Y[i], 0);
      const sumXX = X.reduce((a, b) => a + b * b, 0);
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      return { slope, intercept };
    };

    if (interpMethod.startsWith('poly') || interpMethod === 'linear') {
      let degree = 1;
      if (interpMethod === 'linear') degree = 1;
      else if (interpMethod === 'poly2') degree = Math.min(2, pts.length - 1);
      else if (interpMethod === 'poly3') degree = Math.min(3, pts.length - 1);
      else if (interpMethod === 'poly4') degree = Math.min(4, pts.length - 1);

      coeffs = polyFit(pts, degree);
      predict = (x) => coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);
      
      equation = 'y = ' + coeffs.map((c, i) => {
        if (Math.abs(c) < 1e-6) return '';
        const sign = c >= 0 ? (i === 0 ? '' : ' + ') : ' - ';
        const term = i === 0 ? '' : (i === 1 ? 'x' : `x^${i}`);
        return `${sign}${Math.abs(c).toExponential(3)}${term}`;
      }).reverse().join('');
    } 
    else if (interpMethod === 'exp') {
      // y = a * e^(bx)  => ln(y) = ln(a) + bx
      // Filter y > 0
      const validPts = pts.filter(p => p.y > 0);
      if (validPts.length < 2) return null;
      const { slope, intercept } = linearFit(validPts.map(p => p.x), validPts.map(p => Math.log(p.y)));
      const a = Math.exp(intercept);
      const b = slope;
      predict = (x) => a * Math.exp(b * x);
      equation = `y = ${a.toExponential(3)} * e^(${b.toExponential(3)}x)`;
    }
    else if (interpMethod === 'power') {
      // y = a * x^b => ln(y) = ln(a) + b*ln(x)
      // Filter x > 0, y > 0
      const validPts = pts.filter(p => p.x > 0 && p.y > 0);
      if (validPts.length < 2) return null;
      const { slope, intercept } = linearFit(validPts.map(p => Math.log(p.x)), validPts.map(p => Math.log(p.y)));
      const a = Math.exp(intercept);
      const b = slope;
      predict = (x) => a * Math.pow(x, b);
      equation = `y = ${a.toExponential(3)} * x^(${b.toExponential(3)})`;
    }
    else if (interpMethod === 'log') {
      // y = a + b*ln(x)
      // Filter x > 0
      const validPts = pts.filter(p => p.x > 0);
      if (validPts.length < 2) return null;
      const { slope, intercept } = linearFit(validPts.map(p => Math.log(p.x)), validPts.map(p => p.y));
      const a = intercept;
      const b = slope;
      predict = (x) => a + b * Math.log(x);
      equation = `y = ${a.toExponential(3)} + ${b.toExponential(3)} * ln(x)`;
    }

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
    const range = maxX - minX;
    const padding = range * 0.1; // Add 10% padding to graph
    const startX = minX - padding;
    const endX = maxX + padding;
    const step = (endX - startX) / 100;
    
    for (let x = startX; x <= endX; x += step) {
      curveData.push({ x, curveY: predict(x) });
    }

    // Combine points and curve for Recharts
    const chartData = [...curveData];
    pts.forEach(p => {
      // Find closest curve point to insert/update for tooltip alignment (optional, but good for scatter)
      // Actually, Recharts ComposedChart handles scatter independent of line data if we pass separate data props or unified.
      // Unified is easier for X-axis domain.
      // We'll just push the points as separate objects with 'pointY'
      chartData.push({ x: p.x, pointY: p.y });
    });
    chartData.sort((a, b) => a.x - b.x);

    const qY = queryX !== '' ? predict(Number(queryX)) : null;

    return { equation, r2, rmse, chartData, qY, pts };
  }, [interpText, interpMethod, queryX]);

  // --- SUB-MODULE 4: Material Selector ---
  const [selCriteria, setSelCriteria] = useState({ 
    minYield: 0, 
    maxDensity: 20, 
    minYoungs: 0, 
    minMeltingPoint: 0, 
    minThermalCond: 0, 
    electrical: 'any',
    sortBy: 'match'
  });

  const rankedMaterials = useMemo(() => {
    if (!materials || materials.length === 0) return [];
    
    const ranked = materials.map(m => {
      let score = 0;
      let maxScore = 6; // Increased max score for new criteria
      
      // Yield Strength
      if (m.yieldStrength >= selCriteria.minYield) score += 1;
      else if (selCriteria.minYield > 0) score += Math.max(0, m.yieldStrength / selCriteria.minYield);
      
      // Density
      if (m.density <= selCriteria.maxDensity) score += 1;
      else if (m.density > 0) score += Math.max(0, selCriteria.maxDensity / m.density);
      
      // Young's Modulus
      if (m.youngsModulus >= selCriteria.minYoungs) score += 1;
      else if (selCriteria.minYoungs > 0) score += Math.max(0, m.youngsModulus / selCriteria.minYoungs);

      // Melting Point
      if (m.meltingPoint >= selCriteria.minMeltingPoint) score += 1;
      else if (selCriteria.minMeltingPoint > 0) score += Math.max(0, m.meltingPoint / selCriteria.minMeltingPoint);

      // Thermal Conductivity
      if (m.thermalConductivity >= selCriteria.minThermalCond) score += 1;
      else if (selCriteria.minThermalCond > 0) score += Math.max(0, m.thermalConductivity / selCriteria.minThermalCond);

      // Electrical
      if (selCriteria.electrical !== 'any') {
        const isCond = m.electricalResistivity < 1e-5;
        const isIns = m.electricalResistivity > 1e5;
        if ((selCriteria.electrical === 'conductor' && isCond) || (selCriteria.electrical === 'insulator' && isIns)) score += 1;
      } else {
        score += 1; // Free point if 'any'
      }

      const matchPct = Math.round((score / maxScore) * 100);
      const specificStrength = m.density > 0 ? (m.yieldStrength / m.density) : 0;
      
      return { ...m, matchPct, specificStrength };
    });

    // Sort based on selected criteria
    return ranked.sort((a, b) => {
      if (selCriteria.sortBy === 'match') return b.matchPct - a.matchPct;
      if (selCriteria.sortBy === 'specificStrength') return b.specificStrength - a.specificStrength;
      if (selCriteria.sortBy === 'yieldStrength') return b.yieldStrength - a.yieldStrength;
      if (selCriteria.sortBy === 'density') return a.density - b.density; // Lower density is "better" for sorting
      return b.matchPct - a.matchPct;
    });
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

      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Analysis & Calculations</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Advanced engineering tools and data analysis</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-64">
            <label className="block text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1 font-bold">Smart Reference Material</label>
            <select 
              value={selectedMaterialId} 
              onChange={handleMaterialSelect}
              className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm"
            >
              <option value="">Select Material to Auto-Fill...</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`p-2 rounded-full transition-all ${isAssistantOpen ? 'bg-[#4A9EFF] text-white' : 'bg-[#2D3F50] text-[#4A9EFF] hover:bg-[#4A9EFF] hover:text-white'} shadow-lg group relative`}
            title="Smart Analysis Assistant"
          >
            <Brain size={24} />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A9EFF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4A9EFF]"></span>
            </span>
          </button>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {isAssistantOpen && (
        <div className="bg-[#1A2634] border border-[#4A9EFF]/30 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="bg-[#4A9EFF]/10 p-4 border-b border-[#4A9EFF]/20 flex justify-between items-center">
            <div className="flex items-center gap-2 text-[#4A9EFF]">
              <Sparkles size={20} />
              <span className="font-bold uppercase tracking-widest text-xs">Advanced Analysis Assistant</span>
            </div>
            <button onClick={() => setIsAssistantOpen(false)} className="text-[#94A3B8] hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && askAssistant()}
                placeholder={`Ask about ${activeTab.toLowerCase()}...`}
                className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-4 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm"
              />
              <button 
                onClick={askAssistant}
                disabled={aiLoading}
                className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            {aiResponse && (
              <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50] max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown>{aiResponse}</Markdown>
                </div>
              </div>
            )}
            {!aiResponse && !aiLoading && (
              <div className="text-center py-8 text-[#94A3B8]">
                <Brain size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">Ask me to analyze your current data, recommend materials, or explain complex phenomena.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Analyze outliers', 'Explain R²', 'Recommend for stiffness', 'Physical significance'].map(suggestion => (
                    <button 
                      key={suggestion}
                      onClick={() => { setAiQuery(suggestion); }}
                      className="text-[10px] bg-[#2D3F50] hover:bg-[#4A9EFF] text-[#F1F5F9] px-2 py-1 rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#1A2634] p-2 rounded-lg border border-[#2D3F50] shadow-lg shrink-0">
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#4A9EFF] text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#2D3F50]'}`}
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
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {FORMULA_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCalcCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${calcCategory === cat ? 'bg-[#4A9EFF] text-white' : 'bg-[#2D3F50] text-[#94A3B8] hover:bg-[#3E5C76]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {FORMULAS.filter(f => calcCategory === 'All' || f.category === calcCategory).map(form => (
                <div key={form.id} className="bg-[#1A2634] p-5 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col hover:border-[#4A9EFF]/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-[#F1F5F9]">{form.name}</h3>
                        <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">{form.category}</span>
                    </div>
                    <span className="text-xs font-mono bg-[#0F1923] px-2 py-1 rounded text-[#4A9EFF] border border-[#2D3F50]">{form.eq}</span>
                  </div>
                  <div className="space-y-3 flex-1 mb-4">
                    {form.inputs.map(inp => (
                      <div key={inp.key}>
                        <label className="block text-[10px] uppercase text-[#94A3B8] mb-1">{inp.label}</label>
                        <input 
                          type="number" 
                          step="any"
                          value={calcInputs[form.id]?.[inp.key] === undefined ? '' : calcInputs[form.id]?.[inp.key]}
                          onChange={e => handleCalcInput(form.id, inp.key, e.target.value)}
                          className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm font-mono" 
                          placeholder="0.00"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-4 border-t border-[#2D3F50] flex items-center justify-between">
                    <button 
                      onClick={() => runCalc(form.id, form.calc)}
                      className="text-xs bg-[#2D3F50] hover:bg-[#4A9EFF] text-white px-3 py-1.5 rounded transition-colors"
                    >
                      Compute
                    </button>
                    <div className="text-right">
                      <div className="text-[10px] text-[#94A3B8] uppercase">Result</div>
                      <div className={`font-bold font-mono text-lg ${calcResults[form.id] === 'Error' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                        {calcResults[form.id] !== undefined ? (
                          calcResults[form.id] === 'Error' ? 'Error' : 
                          <>{calcResults[form.id]} <span className="text-xs text-[#94A3B8] font-sans">{form.unit}</span></>
                        ) : '--'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Statistical Analysis */}
        {activeTab === 'Statistical Analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Data Input</h2>
              <p className="text-xs text-[#94A3B8] mb-2">Enter values (comma, space, or newline separated):</p>
              <textarea 
                value={statsText}
                onChange={e => setStatsText(e.target.value)}
                className="w-full flex-1 min-h-[150px] bg-[#0F1923] border border-[#2D3F50] rounded-md p-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm resize-none mb-4"
              />
              <div className="flex gap-2 mb-4">
                <label className="flex-1 bg-[#2D3F50] hover:bg-[#4A9EFF] text-white px-3 py-2 rounded-md text-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <Upload size={16} /> Import CSV/TXT
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
                <button 
                  onClick={() => setStatsText('')}
                  className="bg-[#EF4444]/20 hover:bg-[#EF4444]/40 text-[#EF4444] px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Clear
                </button>
              </div>
              {statsData && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Count (n):</span> <span className="float-right font-bold">{statsData.n}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Mean:</span> <span className="float-right font-bold text-[#4A9EFF]">{statsData.mean.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Median:</span> <span className="float-right font-bold">{statsData.median.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Std Dev:</span> <span className="float-right font-bold text-[#F59E0B]">{statsData.stdDev.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Skewness:</span> <span className="float-right font-bold">{statsData.skewness.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Kurtosis:</span> <span className="float-right font-bold">{statsData.kurtosis.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">IQR:</span> <span className="float-right font-bold">{statsData.iqr.toFixed(2)}</span></div>
                  <div className="bg-[#0F1923] p-2 rounded border border-[#2D3F50]"><span className="text-[#94A3B8]">Weibull m:</span> <span className="float-right font-bold text-[#22C55E]">{statsData.m.toFixed(2)}</span></div>
                </div>
              )}
            </div>
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Statistical Analysis Results</h2>
              {statsData ? (
                <>
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0F1923] border border-[#2D3F50] rounded-md mb-6">
                    <Sigma size={48} className="text-[#4A9EFF] mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-[#F1F5F9] mb-2 font-mono">Statistical Engine Active</h3>
                    <p className="text-sm text-[#94A3B8] max-w-md">The Pro statistical engine has processed {statsData.n} values, calculating skewness, kurtosis, and Weibull moduli for reliability estimation.</p>
                  </div>
                  <div className="bg-[#0F1923] p-4 rounded-md border border-[#2D3F50]">
                    <h3 className="text-sm font-medium text-[#F1F5F9] mb-2 flex justify-between">
                      <span>Outlier Detection (IQR Method)</span>
                      <span className="text-xs text-[#94A3B8] font-normal font-mono">Bounds: [{statsData.lowerBound.toFixed(2)}, {statsData.upperBound.toFixed(2)}]</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {statsData.vals.map((v, i) => {
                        const isOutlier = v < statsData.lowerBound || v > statsData.upperBound;
                        return (
                          <span key={i} className={`px-2 py-1 rounded text-xs font-medium font-mono ${isOutlier ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50' : 'bg-[#1A2634] text-[#94A3B8] border border-[#2D3F50]'}`}>
                            {v}
                          </span>
                        );
                      })}
                    </div>
                    {statsData.outliers.length > 0 && (
                      <div className="mt-2 text-xs text-[#EF4444] font-medium italic">
                        Found {statsData.outliers.length} potential outliers in the dataset.
                      </div>
                    )}
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
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Data Points</h2>
              <p className="text-xs text-[#94A3B8] mb-2">Enter X, Y pairs (one per line or comma separated):</p>
              <textarea 
                value={interpText}
                onChange={e => setInterpText(e.target.value)}
                className="w-full flex-1 min-h-[150px] bg-[#0F1923] border border-[#2D3F50] rounded-md p-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm resize-none mb-4 font-mono"
                placeholder="10, 100&#10;20, 150"
              />
              <div className="flex gap-2 mb-6">
                <label className="flex-1 bg-[#2D3F50] hover:bg-[#4A9EFF] text-white px-3 py-2 rounded-md text-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
                  <Upload size={16} /> Import CSV
                  <input type="file" accept=".csv,.txt" onChange={handleInterpFileUpload} className="hidden" />
                </label>
                <button 
                  onClick={() => setInterpText('')}
                  className="bg-[#EF4444]/20 hover:bg-[#EF4444]/40 text-[#EF4444] px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Clear
                </button>
              </div>
              
              <h3 className="text-sm font-medium text-[#F1F5F9] mb-2">Method & Prediction</h3>
              <select value={interpMethod} onChange={e => setInterpMethod(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm mb-4">
                <option value="linear">Linear Regression (y = mx + c)</option>
                <option value="poly2">Polynomial (Degree 2)</option>
                <option value="poly3">Polynomial (Degree 3)</option>
                <option value="poly4">Polynomial (Degree 4)</option>
                <option value="exp">Exponential (y = ae^bx)</option>
                <option value="power">Power Law (y = ax^b)</option>
                <option value="log">Logarithmic (y = a + b ln(x))</option>
              </select>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-[#94A3B8] mb-1">Query X</label>
                  <input type="number" value={queryX} onChange={e => setQueryX(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                </div>
                <div className="flex-1 bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-center">
                  <div className="text-xs text-[#94A3B8] mb-1">Predicted Y</div>
                  <div className="font-bold text-[#4A9EFF] text-sm">{interpResult?.qY !== null && interpResult?.qY !== undefined ? interpResult.qY.toFixed(4) : '--'}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2 mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Curve Fit Analysis</h2>
                {interpResult && (
                  <div className="flex gap-4 text-sm items-center">
                    <span className="text-[#94A3B8] hidden md:inline font-mono text-xs bg-[#0F1923] px-2 py-1 rounded border border-[#2D3F50]">{interpResult.equation}</span>
                    <span className="text-[#94A3B8]">R²: <span className="text-[#22C55E] font-medium">{interpResult.r2.toFixed(4)}</span></span>
                    <span className="text-[#94A3B8]">RMSE: <span className="text-[#F1F5F9] font-medium">{interpResult.rmse.toFixed(4)}</span></span>
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col items-center justify-center bg-[#0F1923] border border-[#2D3F50] rounded-md p-8 text-center scrollbar-hide">
                {interpResult ? (
                   <div className="max-w-md">
                      <TrendingUp size={48} className="text-[#4A9EFF] mx-auto mb-4 opacity-20" />
                      <h3 className="text-xl font-bold text-[#F1F5F9] mb-4 font-mono">Regression Model Calibrated</h3>
                      <div className="bg-[#1A2634] p-4 rounded border border-[#2D3F50] mb-6">
                        <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">Optimized Equation</div>
                        <div className="text-[#4A9EFF] font-bold font-mono text-sm break-all">{interpResult.equation}</div>
                      </div>
                      <p className="text-sm text-[#94A3B8]">Calculated prediction engine for {interpMethod} method. R² correlation established at {interpResult.r2.toFixed(4)} based on {interpResult.pts.length} primary data nodes.</p>
                   </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#94A3B8]">Need at least 2 valid data points (X, Y).</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Material Selector */}
        {activeTab === 'Material Selector' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 space-y-5">
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
                  <label className="text-[#94A3B8]">Min Young's Modulus</label>
                  <span className="text-[#F1F5F9] font-medium">{selCriteria.minYoungs} GPa</span>
                </div>
                <input type="range" min="0" max="500" step="10" value={selCriteria.minYoungs} onChange={e => setSelCriteria({...selCriteria, minYoungs: Number(e.target.value)})} className="w-full accent-[#4A9EFF]" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-[#94A3B8]">Min Operating Temp</label>
                  <span className="text-[#F1F5F9] font-medium">{selCriteria.minMeltingPoint} °C</span>
                </div>
                <input type="range" min="0" max="3000" step="100" value={selCriteria.minMeltingPoint} onChange={e => setSelCriteria({...selCriteria, minMeltingPoint: Number(e.target.value)})} className="w-full accent-[#4A9EFF]" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-[#94A3B8]">Min Thermal Cond.</label>
                  <span className="text-[#F1F5F9] font-medium">{selCriteria.minThermalCond} W/m·K</span>
                </div>
                <input type="range" min="0" max="500" step="10" value={selCriteria.minThermalCond} onChange={e => setSelCriteria({...selCriteria, minThermalCond: Number(e.target.value)})} className="w-full accent-[#4A9EFF]" />
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

              <div className="pt-4 border-t border-[#2D3F50]">
                <button 
                  onClick={() => {
                    const mat = materials.find(m => m.id === selectedMaterialId);
                    if (mat) {
                      setSelCriteria({
                        ...selCriteria,
                        minYield: mat.yieldStrength || 0,
                        maxDensity: mat.density || 20,
                        minYoungs: mat.youngsModulus || 0,
                        minMeltingPoint: mat.meltingPoint || 0,
                        minThermalCond: mat.thermalConductivity || 0,
                        electrical: mat.electricalResistivity < 1e-5 ? 'conductor' : mat.electricalResistivity > 1e5 ? 'insulator' : 'any'
                      });
                      addToast(`Criteria synced with ${mat.name}.`);
                    } else {
                      addToast('Select a reference material first.', 'error');
                    }
                  }}
                  className="w-full bg-[#4A9EFF]/10 hover:bg-[#4A9EFF]/20 text-[#4A9EFF] border border-[#4A9EFF]/30 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles size={14} /> Sync with Reference
                </button>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2 mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Recommended Materials</h2>
                <div className="flex items-center gap-4">
                  <select 
                    value={selCriteria.sortBy}
                    onChange={e => setSelCriteria({...selCriteria, sortBy: e.target.value})}
                    className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-1 px-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm"
                  >
                    <option value="match">Sort by Match %</option>
                    <option value="specificStrength">Sort by Specific Strength</option>
                    <option value="yieldStrength">Sort by Yield Strength</option>
                    <option value="density">Sort by Density (Low to High)</option>
                  </select>
                  <button className="text-[#4A9EFF] hover:text-blue-400 flex items-center gap-2 text-sm">
                    <Download size={16} /> Export
                  </button>
                </div>
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
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#F1F5F9]">{m.name}</span>
                            <button 
                              onClick={() => {
                                setSelectedMaterialId(m.id);
                                handleMaterialSelect({ target: { value: m.id } });
                              }}
                              className="text-[10px] bg-[#2D3F50] hover:bg-[#4A9EFF] text-white px-2 py-0.5 rounded transition-colors"
                            >
                              Set as Reference
                            </button>
                          </div>
                          <span className={`text-sm font-bold ${m.matchPct >= 80 ? 'text-[#22C55E]' : m.matchPct >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>{m.matchPct}% Match</span>
                        </div>
                        <div className="h-2 w-full bg-[#1A2634] rounded-full overflow-hidden mb-3">
                          <div className={`h-full rounded-full ${m.matchPct >= 80 ? 'bg-[#22C55E]' : m.matchPct >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`} style={{ width: `${m.matchPct}%` }}></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-[#94A3B8]">
                          <div className="bg-[#1A2634] p-2 rounded border border-[#2D3F50]">
                            <div className="text-[#F1F5F9] font-medium">{m.yieldStrength} MPa</div>
                            <div>Yield Strength</div>
                          </div>
                          <div className="bg-[#1A2634] p-2 rounded border border-[#2D3F50]">
                            <div className="text-[#F1F5F9] font-medium">{m.density} g/cm³</div>
                            <div>Density</div>
                          </div>
                          <div className="bg-[#1A2634] p-2 rounded border border-[#2D3F50]">
                            <div className="text-[#F1F5F9] font-medium">{m.specificStrength.toFixed(1)}</div>
                            <div>Spec. Strength</div>
                          </div>
                          <div className="bg-[#1A2634] p-2 rounded border border-[#2D3F50]">
                            <div className="text-[#F1F5F9] font-medium">{m.youngsModulus} GPa</div>
                            <div>Stiffness (E)</div>
                          </div>
                          <div className="bg-[#1A2634] p-2 rounded border border-[#2D3F50]">
                            <div className="text-[#F1F5F9] font-medium">{m.meltingPoint} °C</div>
                            <div>Max Temp</div>
                          </div>
                          <div className="bg-[#1A2634] p-2 rounded border border-[#2D3F50]">
                            <div className="text-[#F1F5F9] font-medium">{m.thermalConductivity} W/mK</div>
                            <div>Thermal Cond.</div>
                          </div>
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
