import React, { useState, useMemo, useRef } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, Download, Printer, BarChart2, FileSpreadsheet, FileJson, CheckSquare, Square, Plus, Trash2, Image as ImageIcon, Sun, Moon } from 'lucide-react';

const TABS = [
  { id: 'Single Material', icon: FileText },
  { id: 'Comparative', icon: BarChart2 },
  { id: 'Project Report', icon: FileText },
  { id: 'Chart Gallery', icon: ImageIcon },
  { id: 'Data Export', icon: Download }
];

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
  { id: '11', name: 'Tungsten', category: 'Metals & Alloys', density: 19.25, yieldStrength: 750, uts: 980, youngsModulus: 411, hardness: 343, meltingPoint: 3422, thermalConductivity: 173, electricalResistivity: 5.28e-8, poissonRatio: 0.28, elongation: 0, source: 'nist', createdAt: new Date().toISOString(), notes: 'Highest melting point metal' },
  { id: '12', name: 'PTFE (Teflon)', category: 'Polymers', density: 2.2, yieldStrength: 23, uts: 25, youngsModulus: 0.5, hardness: 50, meltingPoint: 327, thermalConductivity: 0.25, electricalResistivity: 1e18, poissonRatio: 0.46, elongation: 300, source: 'manual', createdAt: new Date().toISOString(), notes: 'Low friction polymer' },
  { id: '13', name: 'Silicon Carbide', category: 'Ceramics', density: 3.21, yieldStrength: 3440, uts: 3440, youngsModulus: 410, hardness: 2800, meltingPoint: 2730, thermalConductivity: 120, electricalResistivity: 1e2, poissonRatio: 0.14, elongation: 0, source: 'materialsproject', createdAt: new Date().toISOString(), notes: 'High temp ceramic' },
  { id: '14', name: 'Kevlar 49', category: 'Polymers', density: 1.44, yieldStrength: 3600, uts: 3600, youngsModulus: 112, hardness: 0, meltingPoint: 500, thermalConductivity: 0.04, electricalResistivity: 1e14, poissonRatio: 0.36, elongation: 2.4, source: 'manual', createdAt: new Date().toISOString(), notes: 'Aramid fiber' },
  { id: '15', name: 'Gallium Arsenide', category: 'Semiconductors', density: 5.32, yieldStrength: 0, uts: 0, youngsModulus: 85, hardness: 750, meltingPoint: 1238, thermalConductivity: 55, electricalResistivity: 1e8, poissonRatio: 0.31, elongation: 0, source: 'materialsproject', createdAt: new Date().toISOString(), notes: 'III-V semiconductor' },
  { id: '16', name: 'Hydroxyapatite', category: 'Biomaterials', density: 3.16, yieldStrength: 120, uts: 120, youngsModulus: 100, hardness: 500, meltingPoint: 1670, thermalConductivity: 1.3, electricalResistivity: 1e10, poissonRatio: 0.27, elongation: 0, source: 'nist', createdAt: new Date().toISOString(), notes: 'Bone mineral analog' },
  { id: '17', name: 'Magnesium AZ31B', category: 'Metals & Alloys', density: 1.77, yieldStrength: 200, uts: 260, youngsModulus: 45, hardness: 73, meltingPoint: 630, thermalConductivity: 96, electricalResistivity: 9.2e-8, poissonRatio: 0.35, elongation: 15, source: 'manual', createdAt: new Date().toISOString(), notes: 'Lightweight structural alloy' },
  { id: '18', name: 'Nylon 6/6', category: 'Polymers', density: 1.14, yieldStrength: 80, uts: 85, youngsModulus: 2.8, hardness: 115, meltingPoint: 265, thermalConductivity: 0.25, electricalResistivity: 1e14, poissonRatio: 0.39, elongation: 60, source: 'manual', createdAt: new Date().toISOString(), notes: 'Engineering thermoplastic' },
  { id: '19', name: 'Zirconia (YSZ)', category: 'Ceramics', density: 6.1, yieldStrength: 1200, uts: 1200, youngsModulus: 210, hardness: 1200, meltingPoint: 2700, thermalConductivity: 2.2, electricalResistivity: 1e10, poissonRatio: 0.3, elongation: 0, source: 'materialsproject', createdAt: new Date().toISOString(), notes: 'Toughened ceramic' },
  { id: '20', name: 'Brass (C26000)', category: 'Metals & Alloys', density: 8.53, yieldStrength: 110, uts: 300, youngsModulus: 110, hardness: 55, meltingPoint: 915, thermalConductivity: 120, electricalResistivity: 6.2e-8, poissonRatio: 0.33, elongation: 65, source: 'nist', createdAt: new Date().toISOString(), notes: 'Cartridge brass' }
];

const ALL_PROPS = [
  { key: 'density', label: 'Density (g/cm³)', lowerIsBetter: true },
  { key: 'yieldStrength', label: 'Yield Strength (MPa)', lowerIsBetter: false },
  { key: 'uts', label: 'UTS (MPa)', lowerIsBetter: false },
  { key: 'youngsModulus', label: 'Young\'s Modulus (GPa)', lowerIsBetter: false },
  { key: 'hardness', label: 'Hardness (HV)', lowerIsBetter: false },
  { key: 'meltingPoint', label: 'Melting Point (°C)', lowerIsBetter: false },
  { key: 'thermalConductivity', label: 'Thermal Cond. (W/m·K)', lowerIsBetter: false },
  { key: 'electricalResistivity', label: 'Elec. Res. (Ω·m)', lowerIsBetter: true },
  { key: 'elongation', label: 'Elongation (%)', lowerIsBetter: false }
];

const CHART_COLORS = ['#4A9EFF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ReportsExport({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme, onNavigate }) {
  const displayMaterials = materials.length > 0 ? materials : [];
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const downloadBlob = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${filename}`);
  };

  const exportChartToPNG = (chartId, filename, lightTheme = false) => {
    const svg = document.querySelector(`#${chartId} svg`);
    if (!svg) {
      addToast('Chart not found', 'error');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = svg.clientWidth || 800;
      canvas.height = svg.clientHeight || 400;
      ctx.fillStyle = lightTheme ? "#FFFFFF" : "#1A2634";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = `${filename}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      addToast('Chart exported as PNG');
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // --- SUB-MODULE 1: Single Material Report ---
  const [singleMatId, setSingleMatId] = useState(displayMaterials[0]?.id || '');
  
  const singleMat = useMemo(() => displayMaterials.find(m => m.id === singleMatId), [displayMaterials, singleMatId]);
  
  const singleRadarData = useMemo(() => {
    if (!singleMat) return [];
    const props = ['yieldStrength', 'youngsModulus', 'hardness', 'meltingPoint', 'thermalConductivity'];
    const maxVals = {};
    props.forEach(p => {
      maxVals[p] = Math.max(...displayMaterials.map(m => m[p] || 0), 1);
    });
    return props.map(p => ({
      subject: p.replace(/([A-Z])/g, ' $1').trim(),
      value: Math.round(((singleMat[p] || 0) / maxVals[p]) * 100)
    }));
  }, [singleMat, displayMaterials]);

  const categoryAvgData = useMemo(() => {
    if (!singleMat) return [];
    const catMats = displayMaterials.filter(m => m.category === singleMat.category);
    const props = ['density', 'yieldStrength', 'youngsModulus'];
    return props.map(p => {
      const avg = catMats.reduce((sum, m) => sum + (m[p] || 0), 0) / catMats.length;
      return {
        name: p.replace(/([A-Z])/g, ' $1').trim(),
        [singleMat.name]: singleMat[p] || 0,
        [`${singleMat.category} Avg`]: avg
      };
    });
  }, [singleMat, displayMaterials]);

  // --- SUB-MODULE 2: Comparative Report ---
  const [compIds, setCompIds] = useState([displayMaterials[0]?.id, displayMaterials[1]?.id].filter(Boolean));
  const [compProps, setCompProps] = useState(['density', 'yieldStrength', 'youngsModulus', 'hardness']);

  const toggleCompId = (id) => {
    setCompIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 6) { addToast('Max 6 materials', 'warning'); return prev; }
      return [...prev, id];
    });
  };

  const toggleCompProp = (key) => {
    setCompProps(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const compData = useMemo(() => displayMaterials.filter(m => compIds.includes(m.id)), [displayMaterials, compIds]);

  const compChartData = useMemo(() => {
    return compProps.map(propKey => {
      const propDef = ALL_PROPS.find(p => p.key === propKey);
      const dataPoint = { name: propDef.label.split(' ')[0] };
      compData.forEach(m => { dataPoint[m.name] = m[propKey] || 0; });
      return dataPoint;
    });
  }, [compProps, compData]);

  const exportCompCSV = () => {
    if (compData.length === 0 || compProps.length === 0) return;
    const headers = ['Property', ...compData.map(m => m.name)].join(',');
    const rows = compProps.map(propKey => {
      const propDef = ALL_PROPS.find(p => p.key === propKey);
      return [propDef.label, ...compData.map(m => m[propKey] || '')].join(',');
    }).join('\n');
    downloadBlob(`${headers}\n${rows}`, 'comparative_report.csv', 'text/csv');
  };

  // --- SUB-MODULE 3: Project Report ---
  const [projMeta, setProjMeta] = useState({ name: 'New Project', client: '', engineer: currentUser.name, date: new Date().toISOString().split('T')[0], objective: '' });
  const [projSections, setProjSections] = useState([
    { id: 1, title: 'Introduction', content: 'Describe the project background here...' },
    { id: 2, title: 'Materials Tested', content: 'List materials and testing methodology...' }
  ]);

  const exportProjHTML = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${projMeta.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 800px; margin: 0 auto; padding: 40px; }
          h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
          h2 { color: #2563eb; margin-top: 30px; }
          .meta { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .meta p { margin: 5px 0; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .content { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>${projMeta.name}</h1>
        <div class="meta">
          <p><strong>Client:</strong> ${projMeta.client || 'N/A'}</p>
          <p><strong>Engineer:</strong> ${projMeta.engineer}</p>
          <p><strong>Date:</strong> ${projMeta.date}</p>
          <p><strong>Objective:</strong> ${projMeta.objective}</p>
        </div>
        ${projSections.map(s => `
          <div class="section">
            <h2>${s.title}</h2>
            <div class="content">${s.content}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    downloadBlob(html, `${projMeta.name.replace(/\s+/g, '_')}_Report.html`, 'text/html');
  };

  // --- SUB-MODULE 4: Chart Gallery ---
  const [galleryTheme, setGalleryTheme] = useState('dark');
  const [chartTitles, setChartTitles] = useState({
    ss: 'Typical Stress-Strain Curves',
    sn: 'S-N Fatigue Life Comparison',
    bar: 'Yield Strength by Category'
  });

  const ssMockData = [
    { strain: 0, s1: 0, s2: 0 }, { strain: 2, s1: 200, s2: 70 }, { strain: 5, s1: 400, s2: 150 },
    { strain: 10, s1: 450, s2: 250 }, { strain: 15, s1: 480, s2: 280 }, { strain: 20, s1: 500, s2: 300 },
    { strain: 25, s1: 490, s2: 310 }, { strain: 30, s1: 460, s2: 315 }, { strain: 35, s1: null, s2: 310 }
  ];

  // --- SUB-MODULE 5: Data Export ---
  const [exportFields, setExportFields] = useState(ALL_PROPS.map(p => p.key));
  const [exportFormat, setExportFormat] = useState('csv');

  const toggleExportField = (key) => {
    setExportFields(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleDataExport = () => {
    if (exportFields.length === 0) return;
    
    const dataToExport = displayMaterials.map(m => {
      const obj = { id: m.id, name: m.name, category: m.category };
      exportFields.forEach(f => obj[f] = m[f]);
      return obj;
    });

    if (exportFormat === 'json') {
      downloadBlob(JSON.stringify(dataToExport, null, 2), 'materials_data.json', 'application/json');
    } else if (exportFormat === 'csv') {
      const headers = ['id', 'name', 'category', ...exportFields].join(',');
      const rows = dataToExport.map(m => Object.values(m).map(v => `"${v !== undefined && v !== null ? v : ''}"`).join(',')).join('\n');
      downloadBlob(`${headers}\n${rows}`, 'materials_data.csv', 'text/csv');
    } else if (exportFormat === 'html') {
      const headers = ['ID', 'Name', 'Category', ...exportFields.map(f => ALL_PROPS.find(p => p.key === f)?.label || f)];
      const html = `
        <table border="1" style="border-collapse: collapse; font-family: sans-serif;">
          <tr style="background-color: #f3f4f6;">${headers.map(h => `<th style="padding:8px;">${h}</th>`).join('')}</tr>
          ${dataToExport.map(m => `<tr>${Object.values(m).map(v => `<td style="padding:8px;">${v !== undefined && v !== null ? v : ''}</td>`).join('')}</tr>`).join('')}
        </table>
      `;
      downloadBlob(html, 'materials_data.html', 'text/html');
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto bg-[#0F1923] text-[#F1F5F9] print:bg-white print:text-black print:p-0">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 print:hidden">
        {toasts.map(t => (
          <div key={t.id} className={`text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 min-w-[300px] ${t.type === 'error' ? 'bg-[#EF4444]' : t.type === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg shrink-0 print:hidden">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Reports & Export</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Generate comprehensive reports, compare materials, and export data</p>
        
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

      <div className="flex-1 print:m-0 print:p-0">
        {/* TAB 1: Single Material Report */}
        {activeTab === 'Single Material' && (
          <div className="flex flex-col gap-6 h-full">
            <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] flex justify-between items-center print:hidden">
              <div className="flex items-center gap-4">
                <label className="text-sm text-[#94A3B8]">Select Material:</label>
                <select value={singleMatId} onChange={e => setSingleMatId(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] w-64">
                  {displayMaterials.length > 0 ? (
                    displayMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                  ) : (
                    <option value="">No materials available</option>
                  )}
                </select>
              </div>
              <button onClick={() => window.print()} disabled={!singleMat} className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                <Printer size={16} /> Print / PDF
              </button>
            </div>

            {singleMat ? (
              <div className="bg-[#1A2634] p-8 rounded-lg border border-[#2D3F50] shadow-lg print:bg-white print:border-none print:shadow-none print:text-black">
                {/* Report Header */}
                <div className="border-b-2 border-[#2D3F50] print:border-gray-800 pb-6 mb-8 flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold text-[#F1F5F9] print:text-black">{singleMat.name}</h1>
                    <p className="text-[#4A9EFF] print:text-gray-600 font-medium text-lg mt-1">{singleMat.category}</p>
                  </div>
                  <div className="text-right text-sm text-[#94A3B8] print:text-gray-600">
                    <p>ID: {singleMat.id}</p>
                    <p>Source: <span className="uppercase">{singleMat.source}</span></p>
                    <p>Report Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Properties Table */}
                  <div>
                    <h2 className="text-xl font-bold text-[#F1F5F9] print:text-black border-b border-[#2D3F50] print:border-gray-300 pb-2 mb-4">Properties Summary</h2>
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-[#2D3F50] print:divide-gray-300">
                        {ALL_PROPS.map(prop => (
                          <tr key={prop.key}>
                            <td className="py-2 text-[#94A3B8] print:text-gray-600">{prop.label}</td>
                            <td className="py-2 font-medium text-[#F1F5F9] print:text-black text-right">
                              {singleMat[prop.key] !== undefined && singleMat[prop.key] !== null ? singleMat[prop.key] : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Radar Chart */}
                  <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold text-[#F1F5F9] print:text-black border-b border-[#2D3F50] print:border-gray-300 pb-2 mb-4 w-full">Performance Footprint</h2>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={singleRadarData}>
                          <PolarGrid stroke="#2D3F50" className="print:stroke-gray-300" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} className="print:fill-gray-600" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name={singleMat.name} dataKey="value" stroke="#4A9EFF" fill="#4A9EFF" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-[#94A3B8] print:text-gray-500 mt-2">Normalized 0-100 scale relative to database max</p>
                  </div>
                </div>

                {/* Bar Chart Comparison */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-[#F1F5F9] print:text-black border-b border-[#2D3F50] print:border-gray-300 pb-2 mb-4">Comparison vs Category Average</h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryAvgData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" className="print:stroke-gray-200" />
                        <XAxis dataKey="name" stroke="#94A3B8" className="print:stroke-gray-600" />
                        <YAxis stroke="#94A3B8" className="print:stroke-gray-600" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                        <Legend />
                        <Bar dataKey={singleMat.name} fill="#4A9EFF" radius={[4, 4, 0, 0]} />
                        <Bar dataKey={`${singleMat.category} Avg`} fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h2 className="text-xl font-bold text-[#F1F5F9] print:text-black border-b border-[#2D3F50] print:border-gray-300 pb-2 mb-4">Notes</h2>
                  <p className="text-sm text-[#94A3B8] print:text-gray-700 bg-[#0F1923] print:bg-gray-50 p-4 rounded border border-[#2D3F50] print:border-gray-300">
                    {singleMat.notes || 'No notes available for this material.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#1A2634] p-8 rounded-lg border border-[#2D3F50] shadow-lg flex items-center justify-center text-[#94A3B8] h-64">
                No materials available in the database.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Comparative Report */}
        {activeTab === 'Comparative' && (
          <div className="flex flex-col lg:flex-row gap-6 h-full">
            <div className="w-full lg:w-1/4 bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Builder</h2>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[#4A9EFF] mb-2">Materials ({compIds.length}/6)</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                  {displayMaterials.length > 0 ? (
                    displayMaterials.map(m => (
                      <label key={m.id} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer">
                        <input type="checkbox" checked={compIds.includes(m.id)} onChange={() => toggleCompId(m.id)} disabled={!compIds.includes(m.id) && compIds.length >= 6} className="rounded border-[#2D3F50] bg-[#0F1923] text-[#4A9EFF]" />
                        <span className="truncate">{m.name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-[#94A3B8] italic">No materials available.</div>
                  )}
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="text-sm font-medium text-[#4A9EFF] mb-2">Properties</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                  {ALL_PROPS.map(p => (
                    <label key={p.key} className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer">
                      <input type="checkbox" checked={compProps.includes(p.key)} onChange={() => toggleCompProp(p.key)} className="rounded border-[#2D3F50] bg-[#0F1923] text-[#4A9EFF]" />
                      <span className="truncate">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={exportCompCSV} disabled={compIds.length === 0 || compProps.length === 0} className="w-full bg-[#22C55E] text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50">
                <FileSpreadsheet size={16} /> Export CSV
              </button>
            </div>

            <div className="w-full lg:w-3/4 bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg overflow-y-auto">
              {compIds.length === 0 || compProps.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[#94A3B8]">Select materials and properties to compare.</div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-[#F1F5F9] mb-6">Comparison Table</h2>
                  <div className="overflow-x-auto mb-8">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="p-3 border border-[#2D3F50] bg-[#0F1923] text-[#94A3B8] font-medium sticky left-0 z-10">Property</th>
                          {compData.map(m => <th key={m.id} className="p-3 border border-[#2D3F50] bg-[#0F1923] text-[#F1F5F9] font-medium">{m.name}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {compProps.map(propKey => {
                          const propDef = ALL_PROPS.find(p => p.key === propKey);
                          const values = compData.map(m => m[propKey]).filter(v => v !== undefined && v !== null);
                          const max = Math.max(...values);
                          const min = Math.min(...values);
                          
                          return (
                            <tr key={propKey}>
                              <td className="p-3 border border-[#2D3F50] text-[#94A3B8] font-medium bg-[#0F1923] sticky left-0 z-10">{propDef.label}</td>
                              {compData.map(m => {
                                const val = m[propKey];
                                if (val === undefined || val === null) return <td key={m.id} className="p-3 border border-[#2D3F50] text-[#94A3B8]">-</td>;
                                const isBest = propDef.lowerIsBetter ? val === min : val === max;
                                const isWorst = propDef.lowerIsBetter ? val === max : val === min;
                                const colorClass = isBest && val !== isWorst ? 'text-[#22C55E] font-bold bg-[#22C55E]/10' : isWorst && val !== isBest ? 'text-[#EF4444] bg-[#EF4444]/10' : 'text-[#F1F5F9]';
                                return <td key={m.id} className={`p-3 border border-[#2D3F50] ${colorClass}`}>{val}</td>;
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <h2 className="text-xl font-bold text-[#F1F5F9] mb-4">Visual Comparison</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={compChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2D3F50" />
                        <XAxis dataKey="name" stroke="#94A3B8" />
                        <YAxis stroke="#94A3B8" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9' }} />
                        <Legend />
                        {compData.map((m, idx) => (
                          <Bar key={m.id} dataKey={m.name} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Project Report */}
        {activeTab === 'Project Report' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 overflow-y-auto">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Metadata</h2>
              <div className="space-y-4 mb-8">
                {Object.entries({ name: 'Project Name', client: 'Client', engineer: 'Engineer', date: 'Date' }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                    <input type={key === 'date' ? 'date' : 'text'} value={projMeta[key]} onChange={e => setProjMeta({...projMeta, [key]: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Objective</label>
                  <textarea value={projMeta.objective} onChange={e => setProjMeta({...projMeta, objective: e.target.value})} className="w-full h-20 bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm resize-none" />
                </div>
              </div>

              <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2 mb-4">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Sections</h2>
                <button onClick={() => setProjSections([...projSections, { id: Date.now(), title: 'New Section', content: '' }])} className="text-[#4A9EFF] hover:text-blue-400 flex items-center gap-1 text-sm"><Plus size={16} /> Add</button>
              </div>
              <div className="space-y-4 mb-8">
                {projSections.map((sec, i) => (
                  <div key={sec.id} className="bg-[#0F1923] p-3 rounded border border-[#2D3F50]">
                    <div className="flex justify-between items-center mb-2">
                      <input type="text" value={sec.title} onChange={e => setProjSections(prev => prev.map(s => s.id === sec.id ? {...s, title: e.target.value} : s))} className="bg-transparent border-none text-[#F1F5F9] font-medium focus:outline-none w-full" />
                      <button onClick={() => setProjSections(prev => prev.filter(s => s.id !== sec.id))} className="text-[#EF4444] hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                    <textarea value={sec.content} onChange={e => setProjSections(prev => prev.map(s => s.id === sec.id ? {...s, content: e.target.value} : s))} className="w-full h-24 bg-[#1A2634] border border-[#2D3F50] rounded p-2 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-xs resize-none" />
                  </div>
                ))}
              </div>

              <button onClick={exportProjHTML} className="w-full bg-[#4A9EFF] text-white px-4 py-3 rounded-md hover:bg-blue-600 transition-colors font-bold flex items-center justify-center gap-2">
                <Download size={18} /> Export HTML
              </button>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg lg:col-span-2 overflow-y-auto text-black">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-blue-900 border-b-2 border-blue-900 pb-2 mb-6">{projMeta.name}</h1>
                <div className="bg-gray-100 p-4 rounded-lg mb-8 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>Client:</strong> {projMeta.client || 'N/A'}</p>
                    <p><strong>Engineer:</strong> {projMeta.engineer}</p>
                    <p><strong>Date:</strong> {projMeta.date}</p>
                  </div>
                  <div className="mt-4">
                    <p><strong>Objective:</strong> {projMeta.objective}</p>
                  </div>
                </div>
                
                {projSections.map(sec => (
                  <div key={sec.id} className="mb-8 break-inside-avoid">
                    <h2 className="text-xl font-bold text-blue-700 mb-3">{sec.title}</h2>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{sec.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Chart Gallery */}
        {activeTab === 'Chart Gallery' && (
          <div className="flex flex-col h-full">
            <div className="flex justify-end mb-4 gap-4">
              <button onClick={() => setGalleryTheme(t => t === 'dark' ? 'light' : 'dark')} className="bg-[#1A2634] border border-[#2D3F50] text-[#F1F5F9] px-4 py-2 rounded-md hover:bg-[#2D3F50] transition-colors flex items-center gap-2 text-sm">
                {galleryTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {galleryTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
            
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-lg ${galleryTheme === 'dark' ? 'bg-[#1A2634]' : 'bg-white'}`}>
              
              {/* Chart 1 */}
              <div className={`p-4 rounded-lg border ${galleryTheme === 'dark' ? 'border-[#2D3F50] bg-[#0F1923]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-4">
                  <input type="text" value={chartTitles.ss} onChange={e => setChartTitles({...chartTitles, ss: e.target.value})} className={`font-bold bg-transparent border-none focus:outline-none ${galleryTheme === 'dark' ? 'text-[#F1F5F9]' : 'text-gray-900'}`} />
                  <button onClick={() => exportChartToPNG('gallery-ss', 'stress_strain', galleryTheme === 'light')} className="text-[#4A9EFF] hover:text-blue-500"><Download size={18} /></button>
                </div>
                <div id="gallery-ss" className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ssMockData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={galleryTheme === 'dark' ? "#2D3F50" : "#e5e7eb"} />
                      <XAxis dataKey="strain" stroke={galleryTheme === 'dark' ? "#94A3B8" : "#4b5563"} label={{ value: 'Strain (%)', position: 'bottom', fill: galleryTheme === 'dark' ? "#94A3B8" : "#4b5563" }} />
                      <YAxis stroke={galleryTheme === 'dark' ? "#94A3B8" : "#4b5563"} label={{ value: 'Stress (MPa)', angle: -90, position: 'insideLeft', fill: galleryTheme === 'dark' ? "#94A3B8" : "#4b5563" }} />
                      <Legend />
                      <Line type="monotone" dataKey="s1" name="Steel 304" stroke="#4A9EFF" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="s2" name="Aluminum 6061" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2 */}
              <div className={`p-4 rounded-lg border ${galleryTheme === 'dark' ? 'border-[#2D3F50] bg-[#0F1923]' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-4">
                  <input type="text" value={chartTitles.bar} onChange={e => setChartTitles({...chartTitles, bar: e.target.value})} className={`font-bold bg-transparent border-none focus:outline-none ${galleryTheme === 'dark' ? 'text-[#F1F5F9]' : 'text-gray-900'}`} />
                  <button onClick={() => exportChartToPNG('gallery-bar', 'yield_strength', galleryTheme === 'light')} className="text-[#4A9EFF] hover:text-blue-500"><Download size={18} /></button>
                </div>
                <div id="gallery-bar" className="h-64">
                  {displayMaterials.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={displayMaterials.slice(0, 5)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={galleryTheme === 'dark' ? "#2D3F50" : "#e5e7eb"} />
                        <XAxis dataKey="name" stroke={galleryTheme === 'dark' ? "#94A3B8" : "#4b5563"} tick={{fontSize: 10}} />
                        <YAxis stroke={galleryTheme === 'dark' ? "#94A3B8" : "#4b5563"} />
                        <Bar dataKey="yieldStrength" name="Yield Strength (MPa)" fill="#22C55E" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#94A3B8]">No materials available</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: Data Export */}
        {activeTab === 'Data Export' && (
          <div className="bg-[#1A2634] p-8 rounded-lg border border-[#2D3F50] shadow-lg max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-4 mb-6">Data Export Center</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-[#4A9EFF] font-bold mb-4">1. Select Fields</h3>
                <div className="bg-[#0F1923] border border-[#2D3F50] rounded-lg p-4 h-64 overflow-y-auto space-y-2">
                  <label className="flex items-center gap-3 p-2 hover:bg-[#1A2634] rounded cursor-pointer border-b border-[#2D3F50] pb-3 mb-2">
                    <input type="checkbox" checked={exportFields.length === ALL_PROPS.length} onChange={() => setExportFields(exportFields.length === ALL_PROPS.length ? [] : ALL_PROPS.map(p => p.key))} className="rounded border-[#2D3F50] bg-[#0F1923] text-[#4A9EFF]" />
                    <span className="font-bold text-[#F1F5F9]">Select All</span>
                  </label>
                  {ALL_PROPS.map(p => (
                    <label key={p.key} className="flex items-center gap-3 p-1 hover:bg-[#1A2634] rounded cursor-pointer">
                      <input type="checkbox" checked={exportFields.includes(p.key)} onChange={() => toggleExportField(p.key)} className="rounded border-[#2D3F50] bg-[#0F1923] text-[#4A9EFF]" />
                      <span className="text-sm text-[#94A3B8]">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[#4A9EFF] font-bold mb-4">2. Select Format</h3>
                <div className="space-y-4 mb-8">
                  {[
                    { id: 'csv', label: 'CSV (Comma Separated Values)', icon: FileSpreadsheet, desc: 'Best for importing into Excel or Python/R.' },
                    { id: 'json', label: 'JSON (JavaScript Object Notation)', icon: FileJson, desc: 'Best for API integration and web development.' },
                    { id: 'html', label: 'HTML Table', icon: FileText, desc: 'Best for viewing directly in a browser.' }
                  ].map(fmt => {
                    const Icon = fmt.icon;
                    return (
                      <div 
                        key={fmt.id} 
                        onClick={() => setExportFormat(fmt.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors flex items-start gap-4 ${exportFormat === fmt.id ? 'bg-[#4A9EFF]/10 border-[#4A9EFF]' : 'bg-[#0F1923] border-[#2D3F50] hover:border-[#94A3B8]'}`}
                      >
                        <div className={`p-2 rounded-full ${exportFormat === fmt.id ? 'bg-[#4A9EFF] text-white' : 'bg-[#1A2634] text-[#94A3B8]'}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className={`font-bold ${exportFormat === fmt.id ? 'text-[#F1F5F9]' : 'text-[#94A3B8]'}`}>{fmt.label}</div>
                          <div className="text-xs text-[#94A3B8] mt-1">{fmt.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={handleDataExport} disabled={exportFields.length === 0} className="w-full bg-[#22C55E] text-white px-4 py-4 rounded-lg hover:bg-green-600 transition-colors font-bold flex items-center justify-center gap-2 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  <Download size={24} /> Download {displayMaterials.length} Records
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
