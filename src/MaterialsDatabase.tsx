import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Plus, Download, Upload, SlidersHorizontal, Trash2, Edit, X, AlertTriangle, ChevronLeft, ChevronRight, BarChart2, CheckSquare, Square, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

const CATEGORIES = ["Metals & Alloys", "Polymers", "Ceramics", "Composites", "Semiconductors", "Biomaterials"];

const SAMPLE_MATERIALS = [
  { id: '1', name: 'Steel 304', category: 'Metals & Alloys', density: 8.0, yieldStrength: 215, uts: 505, youngsModulus: 193, hardness: 129, meltingPoint: 1400, thermalConductivity: 16.2, electricalResistivity: 7.2e-7, poissonRatio: 0.29, elongation: 70, source: 'nist', createdAt: new Date().toISOString(), notes: 'Common austenitic stainless steel' },
  { id: '2', name: 'Aluminum 6061', category: 'Metals & Alloys', density: 2.7, yieldStrength: 276, uts: 310, youngsModulus: 68.9, hardness: 95, meltingPoint: 582, thermalConductivity: 167, electricalResistivity: 3.99e-8, poissonRatio: 0.33, elongation: 12, source: 'materialsproject', createdAt: new Date().toISOString(), notes: 'Aerospace grade aluminum' },
  { id: '3', name: 'Ti-6Al-4V', category: 'Metals & Alloys', density: 4.43, yieldStrength: 880, uts: 950, youngsModulus: 113.8, hardness: 334, meltingPoint: 1604, thermalConductivity: 6.7, electricalResistivity: 1.7e-6, poissonRatio: 0.34, elongation: 14, source: 'nist', createdAt: new Date().toISOString(), notes: 'Titanium alloy for medical/aerospace' },
  { id: '4', name: 'PEEK', category: 'Polymers', density: 1.32, yieldStrength: 100, uts: 100, youngsModulus: 3.6, hardness: 85, meltingPoint: 343, thermalConductivity: 0.25, electricalResistivity: 1e16, poissonRatio: 0.38, elongation: 20, source: 'manual', createdAt: new Date().toISOString(), notes: 'High performance engineering plastic' },
  { id: '5', name: 'Alumina Al2O3', category: 'Ceramics', density: 3.95, yieldStrength: 250, uts: 300, youngsModulus: 370, hardness: 1500, meltingPoint: 2072, thermalConductivity: 30, electricalResistivity: 1e14, poissonRatio: 0.22, elongation: 0, source: 'materialsproject', createdAt: new Date().toISOString(), notes: 'Technical ceramic' },
  { id: '6', name: 'Carbon Fiber Composite', category: 'Composites', density: 1.6, yieldStrength: 600, uts: 1500, youngsModulus: 150, hardness: 0, meltingPoint: 3500, thermalConductivity: 24, electricalResistivity: 1e-3, poissonRatio: 0.1, elongation: 1.5, source: 'manual', createdAt: new Date().toISOString(), notes: 'Epoxy matrix' },
  { id: '7', name: 'Silicon', category: 'Semiconductors', density: 2.33, yieldStrength: 7000, uts: 7000, youngsModulus: 130, hardness: 1000, meltingPoint: 1414, thermalConductivity: 149, electricalResistivity: 2.3e3, poissonRatio: 0.28, elongation: 0, source: 'materialsproject', createdAt: new Date().toISOString(), notes: 'Monocrystalline' },
  { id: '8', name: 'Copper', category: 'Metals & Alloys', density: 8.96, yieldStrength: 33, uts: 210, youngsModulus: 110, hardness: 369, meltingPoint: 1085, thermalConductivity: 401, electricalResistivity: 1.68e-8, poissonRatio: 0.34, elongation: 51, source: 'nist', createdAt: new Date().toISOString(), notes: 'Pure copper' },
  { id: '9', name: 'Inconel 718', category: 'Metals & Alloys', density: 8.19, yieldStrength: 1034, uts: 1240, youngsModulus: 200, hardness: 360, meltingPoint: 1336, thermalConductivity: 11.4, electricalResistivity: 1.25e-6, poissonRatio: 0.29, elongation: 12, source: 'materialsproject', createdAt: new Date().toISOString(), notes: 'Nickel-based superalloy' },
  { id: '10', name: 'HDPE', category: 'Polymers', density: 0.95, yieldStrength: 26, uts: 31, youngsModulus: 0.8, hardness: 60, meltingPoint: 130, thermalConductivity: 0.45, electricalResistivity: 1e15, poissonRatio: 0.46, elongation: 500, source: 'manual', createdAt: new Date().toISOString(), notes: 'High density polyethylene' },
];

const SourceBadge = ({ source }) => {
  if (source === 'materialsproject') return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-900/50 text-blue-200 border border-blue-800">📦 Materials Project</span>;
  if (source === 'nist') return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-900/50 text-purple-200 border border-purple-800">🏛️ NIST</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-800 text-gray-300 border border-gray-700">✏️ Manual</span>;
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = type === 'success' ? 'bg-[#22C55E]' : type === 'error' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]';
  
  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 mb-2 min-w-[300px]`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:opacity-75"><X size={16} /></button>
    </div>
  );
};

const ExternalImportModal = ({ isOpen, onClose, onImport, addToast }) => {
  const [provider, setProvider] = useState('materialsproject');
  const [apiKey, setApiKey] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query) {
      addToast('Please enter a search query (e.g., formula)', 'error');
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      let data = [];
      
      // Group AI-based search providers
      if (['google_search', 'nist', 'aflow', 'optimade'].includes(provider)) {
        // Initialize Gemini with the API Key from environment variables
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        let sourcePrompt = "";
        if (provider === 'nist') sourcePrompt = "specifically from the NIST (National Institute of Standards and Technology) or JARVIS databases";
        else if (provider === 'aflow') sourcePrompt = "specifically from the AFLOW database";
        else if (provider === 'optimade') sourcePrompt = "specifically from OPTIMADE-compatible databases";
        
        const prompt = `Find the material properties for "${query}" ${sourcePrompt}. 
        Return a JSON object with the following fields: 
        - name (string)
        - category (one of 'Metals & Alloys', 'Polymers', 'Ceramics', 'Composites', 'Semiconductors', 'Biomaterials')
        - density (number in g/cm³)
        - yieldStrength (number in MPa)
        - uts (number in MPa)
        - youngsModulus (number in GPa)
        - hardness (number in HV)
        - meltingPoint (number in °C)
        - thermalConductivity (number in W/m·K)
        - electricalResistivity (number in Ω·m)
        - poissonRatio (number)
        - elongation (number in %)
        
        If a value is not found, use 0 or null. 
        Also include a 'notes' field with the source URL if available.
        Return ONLY the JSON object, no markdown code blocks.`;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                density: { type: Type.NUMBER },
                yieldStrength: { type: Type.NUMBER },
                uts: { type: Type.NUMBER },
                youngsModulus: { type: Type.NUMBER },
                hardness: { type: Type.NUMBER },
                meltingPoint: { type: Type.NUMBER },
                thermalConductivity: { type: Type.NUMBER },
                electricalResistivity: { type: Type.NUMBER },
                poissonRatio: { type: Type.NUMBER },
                elongation: { type: Type.NUMBER },
                notes: { type: Type.STRING }
              }
            }
          }
        });

        const text = response.text;
        if (text) {
          try {
            const item = JSON.parse(text);
            data = [{
              ...item,
              source: provider === 'google_search' ? 'manual' : provider, // Map google_search to manual or keep as is? The badge logic handles 'nist' and 'materialsproject'. Let's use the provider name.
              // Ensure defaults if AI returns null
              density: item.density || 0,
              yieldStrength: item.yieldStrength || 0,
              uts: item.uts || 0,
              youngsModulus: item.youngsModulus || 0,
              hardness: item.hardness || 0,
              meltingPoint: item.meltingPoint || 0,
              thermalConductivity: item.thermalConductivity || 0,
              electricalResistivity: item.electricalResistivity || 0,
              poissonRatio: item.poissonRatio || 0,
              elongation: item.elongation || 0,
            }];
          } catch (e) {
            console.error("Failed to parse AI response", e);
            throw new Error("Failed to parse AI response");
          }
        }

      } else if (provider === 'materialsproject') {
        if (!apiKey) throw new Error('API Key is required for Materials Project');
        const response = await fetch(`https://api.materialsproject.org/materials/summary/?formula=${query}&_limit=5&fields=material_id,formula_pretty,density,elasticity`, {
          headers: { 'X-API-KEY': apiKey }
        });
        if (!response.ok) throw new Error('Failed to fetch from Materials Project. Check API Key.');
        const json = await response.json();
        data = json.data.map(item => ({
          name: item.formula_pretty,
          category: 'Metals & Alloys',
          density: item.density,
          yieldStrength: 0,
          uts: 0,
          youngsModulus: item.elasticity ? item.elasticity.k_vrh : 0,
          hardness: 0,
          meltingPoint: 0,
          thermalConductivity: 0,
          electricalResistivity: 0,
          poissonRatio: item.elasticity ? item.elasticity.poisson_ratio : 0,
          elongation: 0,
          source: 'materialsproject',
          notes: `Imported from MP ID: ${item.material_id}`
        }));
      }
      
      if (data.length === 0) addToast('No results found', 'warning');
      setResults(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-[#2D3F50]">
          <h2 className="text-xl font-bold text-[#F1F5F9] flex items-center gap-2">
            <Globe className="text-[#4A9EFF]" /> Import from External Database
          </h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#F1F5F9]"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Database Provider</label>
              <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                <option value="google_search">Google Search (AI)</option>
                <option value="materialsproject">Materials Project</option>
                <option value="nist">NIST / JARVIS</option>
                <option value="aflow">AFLOW</option>
                <option value="optimade">OPTIMADE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">Search Query (Formula)</label>
              <input type="text" placeholder="e.g. Fe2O3" value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
            </div>
          </div>
          
          {provider === 'materialsproject' && (
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1">API Key (Required)</label>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter your Materials Project API Key" className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              <p className="text-xs text-[#94A3B8] mt-1">Get your key from <a href="https://next-gen.materialsproject.org/api" target="_blank" rel="noreferrer" className="text-[#4A9EFF] hover:underline">materialsproject.org/api</a></p>
            </div>
          )}

          <button onClick={handleSearch} disabled={loading} className="w-full bg-[#4A9EFF] text-white py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            {loading ? 'Searching...' : <><Search size={16} /> Search Database</>}
          </button>

          {results.length > 0 && (
            <div className="mt-4 border-t border-[#2D3F50] pt-4">
              <h3 className="text-sm font-medium text-[#F1F5F9] mb-2">Results</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((item, idx) => (
                  <div key={idx} className="bg-[#0F1923] p-3 rounded-md border border-[#2D3F50] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-[#F1F5F9]">{item.name}</div>
                      <div className="text-xs text-[#94A3B8]">Density: {item.density?.toFixed(2)} g/cm³</div>
                    </div>
                    <button onClick={() => { onImport(item); onClose(); }} className="bg-[#22C55E] text-white px-3 py-1 rounded text-xs hover:bg-green-600">Import</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MaterialsDatabase({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter ? m.category === categoryFilter : true;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [materials, search, categoryFilter, sortConfig]);

  const paginatedMaterials = useMemo(() => {
    const start = (page - 1) * 20;
    return filteredMaterials.slice(start, start + 20);
  }, [filteredMaterials, page]);

  const totalPages = Math.ceil(filteredMaterials.length / 20) || 1;

  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 4) {
        addToast('You can only compare up to 4 materials', 'warning');
        return prev;
      }
      return [...prev, id];
    });
  };

  const openModal = (material = null) => {
    if (material) {
      setEditingId(material.id);
      setFormData({ ...material });
    } else {
      setEditingId(null);
      setFormData({
        name: '', category: CATEGORIES[0], density: 0, yieldStrength: 0, uts: 0,
        youngsModulus: 0, hardness: 0, meltingPoint: 0, thermalConductivity: 0,
        electricalResistivity: 0, poissonRatio: 0, elongation: 0, source: 'manual', notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const saveMaterial = () => {
    if (!formData.name || !formData.category) {
      addToast('Name and Category are required', 'error');
      return;
    }

    const nonNegativeFields = [
      { key: 'density', label: 'Density' },
      { key: 'yieldStrength', label: 'Yield Strength' },
      { key: 'uts', label: 'UTS' },
      { key: 'youngsModulus', label: 'Young\'s Modulus' },
      { key: 'hardness', label: 'Hardness' },
      { key: 'thermalConductivity', label: 'Thermal Conductivity' },
      { key: 'electricalResistivity', label: 'Electrical Resistivity' },
      { key: 'elongation', label: 'Elongation' }
    ];

    for (const field of nonNegativeFields) {
      if (Number(formData[field.key]) < 0) {
        addToast(`${field.label} cannot be negative`, 'error');
        return;
      }
    }
    
    if (editingId) {
      setMaterials(prev => prev.map(m => m.id === editingId ? { ...formData, id: editingId } : m));
      addToast('Material updated successfully');
    } else {
      const newMaterial = {
        ...formData,
        id: `MAT-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString()
      };
      setMaterials(prev => [...prev, newMaterial]);
      addToast('Material added successfully');
    }
    setIsModalOpen(false);
  };

  const deleteMaterial = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    setCompareIds(prev => prev.filter(i => i !== id));
    setDeleteConfirmId(null);
    addToast('Material deleted successfully');
  };

  const handleExportCSV = () => {
    if (materials.length === 0) return;
    const headers = Object.keys(materials[0]).join(',');
    const rows = materials.map(m => Object.values(m).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'materials_export.csv';
    a.click();
  };

  const handleExportJSON = () => {
    if (materials.length === 0) return;
    const blob = new Blob([JSON.stringify(materials, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'materials_export.json';
    a.click();
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) throw new Error('Invalid CSV');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        const newMaterials = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
          });
          if (!obj.id) obj.id = `MAT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;
          if (!obj.createdAt) obj.createdAt = new Date().toISOString();
          return obj;
        });
        setMaterials(prev => [...prev, ...newMaterials]);
        addToast(`Imported ${newMaterials.length} materials successfully`);
      } catch (err) {
        addToast('Failed to parse CSV', 'error');
      }
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    setMaterials(SAMPLE_MATERIALS);
    addToast('Sample data loaded successfully');
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Materials Database</h1>
          <p className="text-[#94A3B8] text-sm">Manage and compare material properties</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer bg-[#1A2634] border border-[#2D3F50] text-[#F1F5F9] px-3 py-2 rounded-md hover:bg-[#2D3F50] transition-colors flex items-center gap-2 text-sm">
            <Upload size={16} /> Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button onClick={handleExportCSV} className="bg-[#1A2634] border border-[#2D3F50] text-[#F1F5F9] px-3 py-2 rounded-md hover:bg-[#2D3F50] transition-colors flex items-center gap-2 text-sm">
            <Download size={16} /> CSV
          </button>
          <button onClick={handleExportJSON} className="bg-[#1A2634] border border-[#2D3F50] text-[#F1F5F9] px-3 py-2 rounded-md hover:bg-[#2D3F50] transition-colors flex items-center gap-2 text-sm">
            <Download size={16} /> JSON
          </button>
          <button onClick={() => setIsImportModalOpen(true)} className="bg-[#1A2634] border border-[#2D3F50] text-[#F1F5F9] px-3 py-2 rounded-md hover:bg-[#2D3F50] transition-colors flex items-center gap-2 text-sm">
            <Globe size={16} /> Import from External DB
          </button>
          <button onClick={() => openModal()} className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg">
            <Plus size={16} /> Add Material
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
          <input 
            type="text" 
            placeholder="Search materials by name or ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 pl-10 pr-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] transition-colors"
          />
        </div>
        <select 
          value={categoryFilter} 
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] w-full md:w-48"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-md border transition-colors flex items-center gap-2 text-sm ${showFilters ? 'bg-[#4A9EFF] border-[#4A9EFF] text-white' : 'bg-[#1A2634] border-[#2D3F50] text-[#F1F5F9] hover:bg-[#2D3F50]'}`}
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
        {compareIds.length > 0 && (
          <button 
            onClick={() => setShowCompare(true)}
            className="bg-[#22C55E] text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-lg"
          >
            <BarChart2 size={16} /> Compare ({compareIds.length})
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
          <div className="text-sm text-[#94A3B8] flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#F59E0B]" /> Advanced property filters coming soon.
          </div>
        </div>
      )}

      <div className="flex-1 bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0F1923] text-[#94A3B8] sticky top-0 z-10 border-b border-[#2D3F50]">
              <tr>
                <th className="p-3 font-medium">Compare</th>
                {['ID', 'Name', 'Category', 'Density (g/cm³)', 'Yield Strength (MPa)', 'UTS (MPa)', 'Young\'s Modulus (GPa)', 'Hardness (HV)', 'Melting Point (°C)', 'Thermal Cond. (W/m·K)', 'Elec. Res. (Ω·m)', 'Source', 'Actions'].map(col => {
                  const key = col.split(' ')[0].toLowerCase();
                  return (
                    <th key={col} className="p-3 font-medium cursor-pointer hover:text-[#F1F5F9]" onClick={() => handleSort(key)}>
                      {col} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D3F50]">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-[#94A3B8] mb-4 text-lg">No materials added yet. Click 'Add Material' to get started.</p>
                      <button onClick={loadSampleData} className="text-[#4A9EFF] hover:underline text-sm">Or load sample data</button>
                    </div>
                  </td>
                </tr>
              ) : paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-12 text-center text-[#94A3B8]">No materials match your search criteria.</td>
                </tr>
              ) : (
                paginatedMaterials.map(m => (
                  <tr key={m.id} className="hover:bg-[#2D3F50]/50 transition-colors group">
                    <td className="p-3">
                      <button onClick={() => toggleCompare(m.id)} className="text-[#94A3B8] hover:text-[#4A9EFF]">
                        {compareIds.includes(m.id) ? <CheckSquare size={18} className="text-[#4A9EFF]" /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="p-3 text-[#94A3B8]">{m.id}</td>
                    <td className="p-3 font-medium text-[#F1F5F9]">{m.name}</td>
                    <td className="p-3 text-[#94A3B8]">{m.category}</td>
                    <td className="p-3 text-[#94A3B8]">{m.density}</td>
                    <td className="p-3 text-[#94A3B8]">{m.yieldStrength}</td>
                    <td className="p-3 text-[#94A3B8]">{m.uts}</td>
                    <td className="p-3 text-[#94A3B8]">{m.youngsModulus}</td>
                    <td className="p-3 text-[#94A3B8]">{m.hardness}</td>
                    <td className="p-3 text-[#94A3B8]">{m.meltingPoint}</td>
                    <td className="p-3 text-[#94A3B8]">{m.thermalConductivity}</td>
                    <td className="p-3 text-[#94A3B8]">{m.electricalResistivity?.toExponential(2)}</td>
                    <td className="p-3"><SourceBadge source={m.source} /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(m)} className="text-[#4A9EFF] hover:text-blue-400"><Edit size={16} /></button>
                        <button onClick={() => setDeleteConfirmId(m.id)} className="text-[#EF4444] hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {materials.length > 0 && (
          <div className="p-4 border-t border-[#2D3F50] flex items-center justify-between text-sm text-[#94A3B8] bg-[#0F1923]">
            <div>Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, filteredMaterials.length)} of {filteredMaterials.length} entries</div>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded hover:bg-[#2D3F50] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-2">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded hover:bg-[#2D3F50] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showCompare && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-[#2D3F50]">
              <h2 className="text-xl font-bold text-[#F1F5F9] flex items-center gap-2">
                <BarChart2 className="text-[#4A9EFF]" /> Material Comparison
              </h2>
              <button onClick={() => setShowCompare(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="h-64 bg-[#0F1923] p-4 rounded-lg border border-[#2D3F50]">
                  <h3 className="text-sm font-medium text-[#94A3B8] mb-4 text-center">Yield Strength (MPa)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materials.filter(m => compareIds.includes(m.id))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                      <Bar dataKey="yieldStrength" fill="#4A9EFF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64 bg-[#0F1923] p-4 rounded-lg border border-[#2D3F50]">
                  <h3 className="text-sm font-medium text-[#94A3B8] mb-4 text-center">Density (g/cm³)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materials.filter(m => compareIds.includes(m.id))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                      <Bar dataKey="density" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 border border-[#2D3F50] bg-[#0F1923] text-[#94A3B8] font-medium">Property</th>
                      {materials.filter(m => compareIds.includes(m.id)).map(m => (
                        <th key={m.id} className="p-3 border border-[#2D3F50] bg-[#0F1923] text-[#F1F5F9] font-medium">{m.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'density', label: 'Density (g/cm³)', lowerIsBetter: true },
                      { key: 'yieldStrength', label: 'Yield Strength (MPa)', lowerIsBetter: false },
                      { key: 'uts', label: 'UTS (MPa)', lowerIsBetter: false },
                      { key: 'youngsModulus', label: 'Young\'s Modulus (GPa)', lowerIsBetter: false },
                      { key: 'hardness', label: 'Hardness (HV)', lowerIsBetter: false },
                      { key: 'meltingPoint', label: 'Melting Point (°C)', lowerIsBetter: false },
                    ].map(prop => {
                      const values = materials.filter(m => compareIds.includes(m.id)).map(m => m[prop.key]);
                      const max = Math.max(...values);
                      const min = Math.min(...values);
                      
                      return (
                        <tr key={prop.key}>
                          <td className="p-3 border border-[#2D3F50] text-[#94A3B8] font-medium bg-[#0F1923]">{prop.label}</td>
                          {materials.filter(m => compareIds.includes(m.id)).map(m => {
                            const val = m[prop.key];
                            const isBest = prop.lowerIsBetter ? val === min : val === max;
                            const isWorst = prop.lowerIsBetter ? val === max : val === min;
                            const colorClass = isBest && val !== isWorst ? 'text-[#22C55E] font-bold' : isWorst && val !== isBest ? 'text-[#EF4444]' : 'text-[#F1F5F9]';
                            return (
                              <td key={m.id} className={`p-3 border border-[#2D3F50] ${colorClass}`}>
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External Import Modal */}
      <ExternalImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={(material) => {
          setMaterials(prev => [...prev, { ...material, id: `MAT-${Date.now()}`, createdAt: new Date().toISOString() }]);
          addToast('Material imported successfully');
        }}
        addToast={addToast}
      />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-[#2D3F50]">
              <h2 className="text-xl font-bold text-[#F1F5F9]">{editingId ? 'Edit Material' : 'Add New Material'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#4A9EFF] border-b border-[#2D3F50] pb-2">Basic Info</h3>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Name *</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Category *</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Source</label>
                    <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                      <option value="manual">Manual</option>
                      <option value="materialsproject">Materials Project</option>
                      <option value="nist">NIST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#94A3B8] mb-1">Notes</label>
                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none h-24 resize-none" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#4A9EFF] border-b border-[#2D3F50] pb-2">Properties</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'density', label: 'Density (g/cm³)' },
                      { key: 'yieldStrength', label: 'Yield Strength (MPa)' },
                      { key: 'uts', label: 'UTS (MPa)' },
                      { key: 'youngsModulus', label: 'Young\'s Modulus (GPa)' },
                      { key: 'hardness', label: 'Hardness (HV)' },
                      { key: 'meltingPoint', label: 'Melting Point (°C)' },
                      { key: 'thermalConductivity', label: 'Thermal Cond. (W/m·K)' },
                      { key: 'electricalResistivity', label: 'Elec. Res. (Ω·m)' },
                      { key: 'poissonRatio', label: 'Poisson Ratio' },
                      { key: 'elongation', label: 'Elongation (%)' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs text-[#94A3B8] mb-1">{field.label}</label>
                        <input type="number" step="any" value={formData[field.key]} onChange={e => setFormData({...formData, [field.key]: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#2D3F50] flex justify-end gap-3 bg-[#0F1923]">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">Cancel</button>
              <button onClick={saveMaterial} className="bg-[#4A9EFF] text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors font-medium shadow-lg">Save Material</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-[#EF4444] mb-4">
              <AlertTriangle size={24} />
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
            </div>
            <p className="text-[#F1F5F9] mb-6">Are you sure you want to delete this material? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-md text-[#94A3B8] hover:text-[#F1F5F9] transition-colors">Cancel</button>
              <button onClick={() => deleteMaterial(deleteConfirmId)} className="bg-[#EF4444] text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors font-medium shadow-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
