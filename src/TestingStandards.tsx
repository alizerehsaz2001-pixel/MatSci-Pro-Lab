import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, ClipboardList, Ruler, Wrench, Printer, Search, Plus, Trash2, Edit, X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const TABS = [
  { id: 'Standards', icon: BookOpen },
  { id: 'Test Logger', icon: ClipboardList },
  { id: 'Specimen Calc', icon: Ruler },
  { id: 'Calibration', icon: Wrench },
  { id: 'Report Gen', icon: Printer }
];

const STANDARDS = [
  // Tensile
  { id: 'astm-e8', code: 'ASTM E8/E8M', org: 'ASTM', prop: 'Tensile', title: 'Standard Test Methods for Tension Testing of Metallic Materials', scope: 'Yield strength, ultimate tensile strength (UTS), elongation, and reduction of area at room temperature.', specimen: 'Dogbone (flat or round), various sizes.', params: 'Strain rate control, temperature (room)', procedure: ['1. Measure original cross-sectional area and gage length.', '2. Grip specimen securely in testing machine.', '3. Apply load at specified strain rate.', '4. Record load-extension curve.', '5. Measure final dimensions after fracture.', '6. Calculate stress and strain.'] },
  { id: 'astm-e21', code: 'ASTM E21', org: 'ASTM', prop: 'Tensile', title: 'Standard Test Methods for Elevated Temperature Tension Tests of Metallic Materials', scope: 'Tensile properties at elevated temperatures.', specimen: 'Standard round or flat.', params: 'Temperature control, strain rate.', procedure: ['1. Heat specimen to test temperature.', '2. Soak to ensure uniform temperature.', '3. Perform tension test.', '4. Record load and extension.'] },
  { id: 'iso-6892-1', code: 'ISO 6892-1', org: 'ISO', prop: 'Tensile', title: 'Metallic materials — Tensile testing — Part 1: Method of test at room temperature', scope: 'Room temperature tensile properties.', specimen: 'Proportional or non-proportional', params: 'Strain rate control (Method A/B)', procedure: ['1. Determine original cross-section', '2. Set strain rate', '3. Execute test to fracture', '4. Calculate Rp0.2 and Rm'] },
  
  // Hardness
  { id: 'astm-e18', code: 'ASTM E18', org: 'ASTM', prop: 'Hardness', title: 'Standard Test Methods for Rockwell Hardness of Metallic Materials', scope: 'Macro-hardness using diamond cone or steel ball indenters.', specimen: 'Flat, smooth, min thickness 10x indentation depth.', params: 'Scale (HRC, HRB, etc.), minor/major load.', procedure: ['1. Prepare flat, clean surface.', '2. Apply preliminary (minor) load.', '3. Zero indicator.', '4. Apply total (major) load.', '5. Remove major load, read hardness value.'] },
  { id: 'astm-e92', code: 'ASTM E92', org: 'ASTM', prop: 'Hardness', title: 'Standard Test Methods for Vickers Hardness and Knoop Hardness of Metallic Materials', scope: 'Microindentation and macroindentation hardness.', specimen: 'Polished surface, flat.', params: 'Test force (gf to kgf), dwell time (10-15s).', procedure: ['1. Polish specimen surface.', '2. Apply force for specified dwell time.', '3. Measure diagonals of indentation.', '4. Calculate hardness value.'] },
  { id: 'astm-e10', code: 'ASTM E10', org: 'ASTM', prop: 'Hardness', title: 'Standard Test Method for Brinell Hardness of Metallic Materials', scope: 'Macro-hardness using a hard carbide ball.', specimen: 'Flat, smooth, relatively large area.', params: 'Ball diameter (10mm typical), load (3000kgf typical).', procedure: ['1. Prepare surface.', '2. Apply load for specified time.', '3. Measure diameter of indentation.', '4. Calculate HBW.'] },
  
  // Impact
  { id: 'astm-e23', code: 'ASTM E23', org: 'ASTM', prop: 'Impact', title: 'Standard Test Methods for Notched Bar Impact Testing of Metallic Materials', scope: 'Absorbed energy (Charpy and Izod).', specimen: '10x10x55mm, V-notch or U-notch.', params: 'Temperature, pendulum energy.', procedure: ['1. Machine notch precisely.', '2. Condition to test temperature.', '3. Place on anvils (Charpy) or clamp (Izod).', '4. Release pendulum.', '5. Record absorbed energy.'] },
  { id: 'iso-148-1', code: 'ISO 148-1', org: 'ISO', prop: 'Impact', title: 'Metallic materials — Charpy pendulum impact test — Part 1: Test method', scope: 'Impact energy determination.', specimen: '10x10x55mm V-notch', params: 'Striker radius (2mm or 8mm)', procedure: ['1. Prepare specimen', '2. Temperature condition', '3. Test within 5s of removal'] },
  
  // Fracture & Fatigue
  { id: 'astm-e399', code: 'ASTM E399', org: 'ASTM', prop: 'Fracture', title: 'Standard Test Method for Linear-Elastic Plane-Strain Fracture Toughness KIc of Metallic Materials', scope: 'KIc determination.', specimen: 'Compact Tension C(T) or Single-Edge Bend SE(B).', params: 'Crack length, load rate.', procedure: ['1. Fatigue precrack specimen.', '2. Load to failure at specified rate.', '3. Record Load-displacement curve.', '4. Calculate PQ, validate for KIc.'] },
  { id: 'astm-e1820', code: 'ASTM E1820', org: 'ASTM', prop: 'Fracture', title: 'Standard Test Method for Measurement of Fracture Toughness', scope: 'J-integral and crack-tip opening displacement (CTOD).', specimen: 'C(T), SE(B), or Disk-Shaped Compact.', params: 'Unloading compliance, crack growth.', procedure: ['1. Fatigue precrack.', '2. Load and unload to measure compliance.', '3. Calculate J or CTOD vs. crack extension (R-curve).'] },
  { id: 'astm-e466', code: 'ASTM E466', org: 'ASTM', prop: 'Fatigue', title: 'Standard Practice for Conducting Force Controlled Constant Amplitude Axial Fatigue Tests of Metallic Materials', scope: 'S-N curve generation.', specimen: 'Smooth, polished gage section.', params: 'Stress ratio (R), frequency, waveform.', procedure: ['1. Polish gage section to <0.2um Ra.', '2. Align carefully in grips.', '3. Apply cyclic load.', '4. Record cycles to failure.'] },
  { id: 'astm-e606', code: 'ASTM E606', org: 'ASTM', prop: 'Fatigue', title: 'Standard Test Method for Strain-Controlled Fatigue Testing', scope: 'Low-cycle fatigue (LCF) properties.', specimen: 'Uniform gage section, polished.', params: 'Strain amplitude, strain rate, temperature.', procedure: ['1. Attach extensometer.', '2. Apply cyclic strain.', '3. Record hysteresis loops.', '4. Determine cycles to failure.'] },
  
  // Creep
  { id: 'astm-e139', code: 'ASTM E139', org: 'ASTM', prop: 'Creep', title: 'Standard Test Methods for Conducting Creep, Creep-Rupture, and Stress-Rupture Tests of Metallic Materials', scope: 'Time-dependent deformation under constant load and temperature.', specimen: 'Standard tensile type.', params: 'Constant load, constant elevated temperature.', procedure: ['1. Heat to test temperature.', '2. Apply constant load.', '3. Measure extension over time.', '4. Record time to rupture (if applicable).'] }
];

const TEST_TYPES = ['Tensile', 'Hardness', 'Impact', 'Fatigue', 'Fracture', 'Creep'];

export default function TestingStandards({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme, onNavigate }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- SUB-MODULE 1: Standards ---
  const [stdSearch, setStdSearch] = useState('');
  const [stdOrgFilter, setStdOrgFilter] = useState('');
  const [stdPropFilter, setStdPropFilter] = useState('');
  const [expandedStd, setExpandedStd] = useState(null);

  const filteredStds = useMemo(() => {
    return STANDARDS.filter(s => {
      const matchSearch = s.code.toLowerCase().includes(stdSearch.toLowerCase()) || s.title.toLowerCase().includes(stdSearch.toLowerCase());
      const matchOrg = stdOrgFilter ? s.org.includes(stdOrgFilter) : true;
      const matchProp = stdPropFilter ? s.prop === stdPropFilter : true;
      return matchSearch && matchOrg && matchProp;
    });
  }, [stdSearch, stdOrgFilter, stdPropFilter]);

  // --- SUB-MODULE 2: Test Logger ---
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({ 
    materialName: '', 
    testType: 'Tensile', 
    standard: '', 
    date: new Date().toISOString().split('T')[0], 
    operator: currentUser.name, 
    specimenId: '', 
    result: '', 
    unit: '', 
    status: 'Pending', 
    notes: '',
    temperature: '25',
    humidity: '50'
  });
  const [logSearch, setLogSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const saveLog = () => {
    if (!logForm.materialName || !logForm.result) {
      addToast('Material and Result are required', 'error');
      return;
    }
    const newLog = { ...logForm, id: `TEST-${Date.now().toString().slice(-6)}`, result: Number(logForm.result) };
    setTestLogs(prev => [newLog, ...prev]);
    setIsLogModalOpen(false);
    // Reset form after save
    setLogForm({
      materialName: '', 
      testType: 'Tensile', 
      standard: '', 
      date: new Date().toISOString().split('T')[0], 
      operator: currentUser.name, 
      specimenId: '', 
      result: '', 
      unit: '', 
      status: 'Pending', 
      notes: '',
      temperature: '25',
      humidity: '50'
    });
    addToast('Test logged successfully');
  };

  const deleteLog = (id) => {
    setTestLogs(prev => prev.filter(l => l.id !== id));
    addToast('Test log deleted');
  };

  const filteredLogs = useMemo(() => {
    return testLogs.filter(l => {
      const matchSearch = l.materialName.toLowerCase().includes(logSearch.toLowerCase()) || l.id.toLowerCase().includes(logSearch.toLowerCase());
      const matchStatus = statusFilter === 'All' ? true : l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [testLogs, logSearch, statusFilter]);

  // --- SUB-MODULE 3: Specimen Calc ---
  const [specType, setSpecType] = useState('Tensile');
  const [specInputs, setSpecInputs] = useState({ w: 12.5, t: 3, l0: 50, hv: 200, load: 10, notch: 2, length: 55, d: 10, D: 12, r: 1 });

  const specResults = useMemo(() => {
    const { w, t, l0, hv, load, notch, length, d, D, r } = specInputs;
    if (specType === 'Tensile') {
      const area = w * t;
      return { area: area.toFixed(2), validL0: Math.abs(l0 - 5.65 * Math.sqrt(area)) < 2 ? 'Valid (Proportional)' : 'Non-proportional' };
    }
    if (specType === 'Hardness') {
      // Min thickness approx 10x indent depth. Depth = diagonal / 7. d = sqrt(1.8544*F/HV)
      const validHv = hv > 0 ? hv : 1;
      const diag = Math.sqrt((1.8544 * load) / validHv);
      const minT = 10 * (diag / 7);
      return { minThickness: minT.toFixed(3) + ' mm' };
    }
    if (specType === 'Charpy') {
      return { ligament: (10 - notch).toFixed(2) + ' mm', span: '40 mm (Standard)' };
    }
    if (specType === 'Fatigue') {
      // Kt approx for stepped shaft (simplified)
      const validD = d > 0 ? d : 1;
      const ratio = D/validD;
      const r_d = r/validD;
      let kt = 1.0;
      if (ratio > 1 && r_d > 0) kt = 1 + Math.sqrt(0.25 / r_d); // Very rough approx
      return { kt: kt.toFixed(2) };
    }
    return {};
  }, [specType, specInputs]);

  // --- SUB-MODULE 4: Calibration ---
  const [equipments, setEquipments] = useState([
    { id: 'EQ-001', name: 'Instron 5982 UTM', lastCal: '2025-01-15', nextCal: '2026-01-15', resp: 'Admin' },
    { id: 'EQ-002', name: 'Wilson Rockwell Tester', lastCal: '2025-10-01', nextCal: '2026-04-01', resp: 'Admin' },
    { id: 'EQ-003', name: 'Charpy Pendulum', lastCal: '2024-02-10', nextCal: '2025-02-10', resp: 'Admin' } // Overdue example
  ]);
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [eqForm, setEqForm] = useState({ name: '', id: '', lastCal: '', nextCal: '', resp: currentUser.name });

  const getEqStatus = (nextCal) => {
    const today = new Date();
    const next = new Date(nextCal);
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Overdue', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/20' };
    if (diffDays <= 30) return { label: `Due in ${diffDays}d`, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/20' };
    return { label: 'Valid', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/20' };
  };

  const hasOverdue = equipments.some(eq => getEqStatus(eq.nextCal).label === 'Overdue');

  const saveEq = () => {
    if (!eqForm.name || !eqForm.id) return;
    setEquipments(prev => [...prev, eqForm]);
    setIsEqModalOpen(false);
    addToast('Equipment added');
  };

  // --- SUB-MODULE 5: Reports ---
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [reportNotes, setReportNotes] = useState('');

  const toggleLogSelect = (id) => {
    setSelectedLogs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto bg-[#0F1923] text-[#F1F5F9]">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 print:hidden">
        {toasts.map(t => (
          <div key={t.id} className={`text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 min-w-[300px] ${t.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg shrink-0 print:hidden">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Testing & Standards</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Manage test protocols, log results, and generate reports</p>
        
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
        {/* TAB 1: Standards */}
        {activeTab === 'Standards' && (
          <div className="space-y-6 print:hidden">
            <div className="flex flex-col md:flex-row gap-4 bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                <input type="text" placeholder="Search standards..." value={stdSearch} onChange={e => setStdSearch(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 pl-10 pr-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF]" />
              </div>
              <select value={stdOrgFilter} onChange={e => setStdOrgFilter(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF]">
                <option value="">All Organizations</option>
                <option value="ASTM">ASTM</option>
                <option value="ISO">ISO</option>
                <option value="DIN">DIN/EN</option>
              </select>
              <select value={stdPropFilter} onChange={e => setStdPropFilter(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF]">
                <option value="">All Properties</option>
                {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStds.map(std => (
                <div key={std.id} className="bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-[#2D3F50] flex justify-between items-start bg-[#0F1923]">
                    <div>
                      <h3 className="font-bold text-[#4A9EFF] text-lg">{std.code}</h3>
                      <p className="text-xs text-[#94A3B8] mt-1">{std.title}</p>
                    </div>
                    <span className="px-2 py-1 bg-[#2D3F50] text-[#F1F5F9] text-xs rounded font-medium">{std.prop}</span>
                  </div>
                  <div className="p-4 space-y-3 flex-1 text-sm">
                    <div><span className="text-[#94A3B8] block text-xs">Scope</span><span className="text-[#F1F5F9]">{std.scope}</span></div>
                    <div><span className="text-[#94A3B8] block text-xs">Specimen</span><span className="text-[#F1F5F9]">{std.specimen}</span></div>
                    <div><span className="text-[#94A3B8] block text-xs">Key Params</span><span className="text-[#F1F5F9]">{std.params}</span></div>
                  </div>
                  <div className="p-4 border-t border-[#2D3F50] bg-[#0F1923]">
                    <button 
                      onClick={() => setExpandedStd(expandedStd === std.id ? null : std.id)}
                      className="text-[#4A9EFF] hover:text-blue-400 text-sm font-medium w-full text-left flex justify-between items-center"
                    >
                      {expandedStd === std.id ? 'Hide Procedure' : 'View Full Procedure'}
                      <span className="text-lg">{expandedStd === std.id ? '−' : '+'}</span>
                    </button>
                    {expandedStd === std.id && (
                      <div className="mt-4 pt-4 border-t border-[#2D3F50] space-y-2 animate-in slide-in-from-top-2">
                        {std.procedure.map((step, i) => (
                          <div key={i} className="text-sm text-[#F1F5F9] pl-2 border-l-2 border-[#4A9EFF]">{step}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Test Logger */}
        {activeTab === 'Test Logger' && (
          <div className="bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg flex flex-col h-full print:hidden">
            <div className="p-4 border-b border-[#2D3F50] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                  <input type="text" placeholder="Search logs..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 pl-10 pr-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                  <option value="All">All Statuses</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <button onClick={() => setIsLogModalOpen(true)} className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                <Plus size={16} /> Log Test
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0F1923] text-[#94A3B8] sticky top-0">
                  <tr>
                    <th className="p-3 font-medium">ID</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Material</th>
                    <th className="p-3 font-medium">Test Type</th>
                    <th className="p-3 font-medium">Standard</th>
                    <th className="p-3 font-medium">Result</th>
                    <th className="p-3 font-medium">Conditions</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3F50]">
                  {testLogs.length === 0 ? (
                    <tr><td colSpan={9} className="p-8 text-center text-[#94A3B8]">No tests recorded yet.</td></tr>
                  ) : filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#2D3F50]/50">
                      <td className="p-3 text-[#94A3B8]">{log.id}</td>
                      <td className="p-3 text-[#F1F5F9]">{log.date}</td>
                      <td className="p-3 font-medium text-[#F1F5F9]">{log.materialName}</td>
                      <td className="p-3 text-[#94A3B8]">{log.testType}</td>
                      <td className="p-3 text-[#94A3B8]">{log.standard}</td>
                      <td className="p-3 font-bold text-[#F1F5F9]">{log.result} {log.unit}</td>
                      <td className="p-3 text-[#94A3B8] text-xs">{log.temperature}°C, {log.humidity}%RH</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${log.status === 'Pass' ? 'bg-[#22C55E]/20 text-[#22C55E]' : log.status === 'Fail' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button onClick={() => deleteLog(log.id)} className="text-[#EF4444] hover:text-red-400"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Specimen Calc */}
        {activeTab === 'Specimen Calc' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-6">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Specimen Calculator</h2>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Test Type</label>
                <select value={specType} onChange={e => setSpecType(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                  {['Tensile', 'Hardness', 'Charpy', 'Fatigue'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {specType === 'Tensile' && (
                  <>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Width W (mm)</label><input type="number" min="0" step="any" value={specInputs.w} onChange={e => setSpecInputs({...specInputs, w: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Thickness T (mm)</label><input type="number" min="0" step="any" value={specInputs.t} onChange={e => setSpecInputs({...specInputs, t: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Gage Length L0 (mm)</label><input type="number" min="0" step="any" value={specInputs.l0} onChange={e => setSpecInputs({...specInputs, l0: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                  </>
                )}
                {specType === 'Hardness' && (
                  <>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Expected HV</label><input type="number" min="1" step="any" value={specInputs.hv} onChange={e => setSpecInputs({...specInputs, hv: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Test Load (kgf)</label><input type="number" min="0" step="any" value={specInputs.load} onChange={e => setSpecInputs({...specInputs, load: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                  </>
                )}
                {specType === 'Charpy' && (
                  <>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Notch Depth (mm)</label><input type="number" min="0" step="any" value={specInputs.notch} onChange={e => setSpecInputs({...specInputs, notch: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Total Length (mm)</label><input type="number" min="0" step="any" value={specInputs.length} onChange={e => setSpecInputs({...specInputs, length: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                  </>
                )}
                {specType === 'Fatigue' && (
                  <>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Major Dia D (mm)</label><input type="number" min="0" step="any" value={specInputs.D} onChange={e => setSpecInputs({...specInputs, D: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Minor Dia d (mm)</label><input type="number" min="0.1" step="any" value={specInputs.d} onChange={e => setSpecInputs({...specInputs, d: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                    <div><label className="block text-xs text-[#94A3B8] mb-1">Fillet Radius r (mm)</label><input type="number" min="0" step="any" value={specInputs.r} onChange={e => setSpecInputs({...specInputs, r: Number(e.target.value)})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] text-sm" /></div>
                  </>
                )}
              </div>

              <div className="p-4 bg-[#0F1923] border border-[#2D3F50] rounded-md">
                <h3 className="text-sm font-medium text-[#4A9EFF] mb-3">Calculated Requirements</h3>
                {Object.entries(specResults).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center mb-2 last:mb-0">
                    <span className="text-sm text-[#94A3B8] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-bold text-[#F1F5F9]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col items-center justify-center">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 w-full mb-8">Schematic</h2>
              <div className="w-full max-w-[300px] aspect-video bg-[#0F1923] border border-[#2D3F50] rounded-lg flex items-center justify-center p-4">
                {specType === 'Tensile' && (
                  <svg viewBox="0 0 200 60" className="w-full h-full">
                    <path d="M10,10 L40,10 C50,10 60,20 70,20 L130,20 C140,20 150,10 160,10 L190,10 L190,50 L160,50 C150,50 140,40 130,40 L70,40 C60,40 50,50 40,50 L10,50 Z" fill="none" stroke="#4A9EFF" strokeWidth="2"/>
                    <line x1="70" y1="30" x2="130" y2="30" stroke="#94A3B8" strokeDasharray="4 4" />
                    <text x="100" y="25" fill="#94A3B8" fontSize="10" textAnchor="middle">L0</text>
                  </svg>
                )}
                {specType === 'Charpy' && (
                  <svg viewBox="0 0 200 40" className="w-full h-full">
                    <rect x="20" y="10" width="160" height="20" fill="none" stroke="#4A9EFF" strokeWidth="2" />
                    <path d="M95,10 L100,20 L105,10" fill="#0F1923" stroke="#4A9EFF" strokeWidth="2" />
                    <line x1="100" y1="20" x2="100" y2="30" stroke="#EF4444" strokeDasharray="2 2" />
                  </svg>
                )}
                {specType === 'Hardness' && (
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="10" y="40" width="80" height="40" fill="none" stroke="#4A9EFF" strokeWidth="2" />
                    <path d="M50,10 L40,40 L60,40 Z" fill="none" stroke="#F59E0B" strokeWidth="2" />
                    <line x1="50" y1="40" x2="50" y2="80" stroke="#EF4444" strokeDasharray="2 2" />
                    <text x="60" y="65" fill="#94A3B8" fontSize="10">Min T</text>
                  </svg>
                )}
                {specType === 'Fatigue' && (
                  <svg viewBox="0 0 200 60" className="w-full h-full">
                    <path d="M20,10 L70,10 Q80,10 80,20 L120,20 Q120,10 130,10 L180,10 L180,50 L130,50 Q120,50 120,40 L80,40 Q80,50 70,50 L20,50 Z" fill="none" stroke="#4A9EFF" strokeWidth="2"/>
                    <text x="100" y="33" fill="#94A3B8" fontSize="10" textAnchor="middle">d</text>
                    <text x="45" y="33" fill="#94A3B8" fontSize="10" textAnchor="middle">D</text>
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Calibration */}
        {activeTab === 'Calibration' && (
          <div className="bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg flex flex-col h-full print:hidden">
            {hasOverdue && (
              <div className="bg-[#EF4444]/10 border-b border-[#EF4444]/50 p-4 flex items-center gap-3 text-[#EF4444]">
                <AlertTriangle size={20} />
                <span className="font-medium">Warning: One or more pieces of equipment are overdue for calibration.</span>
              </div>
            )}
            <div className="p-4 border-b border-[#2D3F50] flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#F1F5F9]">Equipment Registry</h2>
              <button onClick={() => setIsEqModalOpen(true)} className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-medium">
                <Plus size={16} /> Add Equipment
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {equipments.map(eq => {
                  const status = getEqStatus(eq.nextCal);
                  return (
                    <div key={eq.id} className="bg-[#0F1923] border border-[#2D3F50] rounded-lg p-4 relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${status.bg.replace('/20', '')}`}></div>
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <div>
                          <h3 className="font-bold text-[#F1F5F9]">{eq.name}</h3>
                          <p className="text-xs text-[#94A3B8]">{eq.id}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${status.bg} ${status.color}`}>{status.label}</span>
                      </div>
                      <div className="space-y-1 mt-4 pl-2 text-sm">
                        <div className="flex justify-between"><span className="text-[#94A3B8]">Last Cal:</span><span className="text-[#F1F5F9]">{eq.lastCal}</span></div>
                        <div className="flex justify-between"><span className="text-[#94A3B8]">Next Due:</span><span className="text-[#F1F5F9] font-medium">{eq.nextCal}</span></div>
                        <div className="flex justify-between"><span className="text-[#94A3B8]">Resp:</span><span className="text-[#F1F5F9]">{eq.resp}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Report Gen */}
        {activeTab === 'Report Gen' && (
          <div className="h-full flex flex-col lg:flex-row gap-6">
            {/* Left Panel - Controls (Hidden on print) */}
            <div className="w-full lg:w-1/3 bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col print:hidden">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Report Configuration</h2>
              
              <div className="mb-4">
                <label className="block text-sm text-[#94A3B8] mb-2">Select Tests to Include</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {testLogs.length === 0 ? (
                    <div className="text-sm text-[#94A3B8] italic">No tests available.</div>
                  ) : testLogs.map(log => (
                    <label key={log.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#0F1923] cursor-pointer border border-transparent hover:border-[#2D3F50]">
                      <input type="checkbox" checked={selectedLogs.includes(log.id)} onChange={() => toggleLogSelect(log.id)} className="rounded border-[#2D3F50] bg-[#0F1923] text-[#4A9EFF] focus:ring-[#4A9EFF]" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#F1F5F9]">{log.materialName}</div>
                        <div className="text-xs text-[#94A3B8]">{log.testType} - {log.date}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6 flex-1">
                <label className="block text-sm text-[#94A3B8] mb-2">Observations / Notes</label>
                <textarea value={reportNotes} onChange={e => setReportNotes(e.target.value)} className="w-full h-32 bg-[#0F1923] border border-[#2D3F50] rounded-md p-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm resize-none" placeholder="Enter report conclusions..." />
              </div>

              <button onClick={() => setShowReport(true)} disabled={selectedLogs.length === 0} className="w-full bg-[#4A9EFF] text-white px-4 py-3 rounded-md hover:bg-blue-600 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                Generate Preview
              </button>
            </div>

            {/* Right Panel - Preview / Print Area */}
            <div className={`w-full lg:w-2/3 bg-white text-black p-8 rounded-lg shadow-lg overflow-y-auto ${showReport ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'} print:block print:w-full print:m-0 print:shadow-none print:p-0`}>
              {!showReport ? (
                <div className="text-gray-400 text-center print:hidden">Select tests and click Generate Preview</div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  {/* Report Header */}
                  <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-end">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">TEST REPORT</h1>
                      <p className="text-gray-600 font-medium">MatSci Pro Laboratory</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>Report ID: REP-{Date.now().toString().slice(-6)}</p>
                      <p>Date: {new Date().toLocaleDateString()}</p>
                      <p>Generated by: {currentUser.name}</p>
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 mb-3 uppercase tracking-wider">Test Results</h2>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 p-2 text-left">Material</th>
                          <th className="border border-gray-300 p-2 text-left">Test</th>
                          <th className="border border-gray-300 p-2 text-left">Standard</th>
                          <th className="border border-gray-300 p-2 text-right">Result</th>
                          <th className="border border-gray-300 p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {testLogs.filter(l => selectedLogs.includes(l.id)).map(log => (
                          <tr key={log.id}>
                            <td className="border border-gray-300 p-2 font-medium">{log.materialName}</td>
                            <td className="border border-gray-300 p-2">{log.testType}</td>
                            <td className="border border-gray-300 p-2">{log.standard}</td>
                            <td className="border border-gray-300 p-2 text-right font-bold">{log.result} {log.unit}</td>
                            <td className="border border-gray-300 p-2 text-center">
                              <span className={`font-bold ${log.status === 'Pass' ? 'text-green-600' : log.status === 'Fail' ? 'text-red-600' : 'text-yellow-600'}`}>{log.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Observations */}
                  <div className="mb-12">
                    <h2 className="text-lg font-bold text-gray-800 border-b border-gray-300 mb-3 uppercase tracking-wider">Observations & Conclusions</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[100px]">{reportNotes || 'No specific observations recorded.'}</p>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-16 pt-8 border-t border-gray-300">
                    <div className="w-64 text-center">
                      <div className="border-b border-gray-800 mb-2 h-8"></div>
                      <p className="text-sm font-bold text-gray-800">Tested By</p>
                      <p className="text-xs text-gray-600">{currentUser.name}</p>
                    </div>
                    <div className="w-64 text-center">
                      <div className="border-b border-gray-800 mb-2 h-8"></div>
                      <p className="text-sm font-bold text-gray-800">Approved By</p>
                      <p className="text-xs text-gray-600">Lab Manager</p>
                    </div>
                  </div>

                  {/* Print Button */}
                  <div className="mt-8 text-center print:hidden">
                    <button onClick={handlePrint} className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto">
                      <Printer size={18} /> Print / Save as PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl w-full max-w-2xl p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#F1F5F9]">Log New Test</h2>
              <button onClick={() => setIsLogModalOpen(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]"><X size={24} /></button>
            </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Material Name *</label>
                <input 
                  type="text" 
                  list="material-options"
                  value={logForm.materialName} 
                  onChange={e => setLogForm({...logForm, materialName: e.target.value})} 
                  className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" 
                  placeholder="Select or type material..."
                />
                <datalist id="material-options">
                  {materials.map(m => (
                    <option key={m.id} value={m.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Test Type</label>
                <select value={logForm.testType} onChange={e => setLogForm({...logForm, testType: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                  {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Standard Used</label>
                <input type="text" value={logForm.standard} onChange={e => setLogForm({...logForm, standard: e.target.value})} placeholder="e.g. ASTM E8" className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Specimen ID</label>
                <input type="text" value={logForm.specimenId} onChange={e => setLogForm({...logForm, specimenId: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Result Value *</label>
                <input type="number" step="any" value={logForm.result} onChange={e => setLogForm({...logForm, result: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Unit</label>
                <input type="text" value={logForm.unit} onChange={e => setLogForm({...logForm, unit: e.target.value})} placeholder="e.g. MPa" className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Status</label>
                <select value={logForm.status} onChange={e => setLogForm({...logForm, status: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                  <option value="Pending">Pending</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Date</label>
                <input type="date" value={logForm.date} onChange={e => setLogForm({...logForm, date: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Temperature (°C)</label>
                <input type="number" step="any" value={logForm.temperature} onChange={e => setLogForm({...logForm, temperature: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Humidity (%RH)</label>
                <input type="number" step="any" value={logForm.humidity} onChange={e => setLogForm({...logForm, humidity: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm text-[#94A3B8] mb-1">Notes</label>
              <textarea value={logForm.notes} onChange={e => setLogForm({...logForm, notes: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none min-h-[80px] resize-none" placeholder="Any specific observations..."></textarea>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsLogModalOpen(false)} className="px-4 py-2 rounded-md text-[#94A3B8] hover:text-[#F1F5F9]">Cancel</button>
              <button onClick={saveLog} className="bg-[#4A9EFF] text-white px-6 py-2 rounded-md hover:bg-blue-600 font-medium">Save Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {isEqModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#F1F5F9]">Add Equipment</h2>
              <button onClick={() => setIsEqModalOpen(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]"><X size={24} /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Equipment Name *</label>
                <input type="text" value={eqForm.name} onChange={e => setEqForm({...eqForm, name: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Equipment ID *</label>
                <input type="text" value={eqForm.id} onChange={e => setEqForm({...eqForm, id: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Last Calibration Date</label>
                <input type="date" value={eqForm.lastCal} onChange={e => setEqForm({...eqForm, lastCal: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Next Due Date</label>
                <input type="date" value={eqForm.nextCal} onChange={e => setEqForm({...eqForm, nextCal: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEqModalOpen(false)} className="px-4 py-2 rounded-md text-[#94A3B8] hover:text-[#F1F5F9]">Cancel</button>
              <button onClick={saveEq} className="bg-[#4A9EFF] text-white px-6 py-2 rounded-md hover:bg-blue-600 font-medium">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
