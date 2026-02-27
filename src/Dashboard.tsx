import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Database, Activity, FileText, Search, X, Medal, Clock, Plus, CheckCircle, ChevronRight, Zap, FlaskConical, AlertTriangle, ArrowUpRight, ArrowDownRight, MoreHorizontal, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];
const RADAR_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b'];

const MOCK_ACTIVITY = [
  { id: 1, type: 'add', user: 'Sarah J.', text: 'Added new material: Titanium Grade 5', time: '2h ago', icon: Plus, color: 'text-emerald-500' },
  { id: 2, type: 'test', user: 'Mike R.', text: 'Recorded tensile test for Steel 304', time: '4h ago', icon: Activity, color: 'text-blue-500' },
  { id: 3, type: 'report', user: 'Admin', text: 'Generated Q3 Materials Summary', time: '1d ago', icon: FileText, color: 'text-amber-500' },
  { id: 4, type: 'update', user: 'Sarah J.', text: 'Updated thermal properties for PEEK', time: '2d ago', icon: CheckCircle, color: 'text-purple-500' },
];

export default function Dashboard({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme }) {
  // Use provided materials or fallback to sample data if empty to ensure dashboard is populated
  const displayMaterials = materials.length > 0 ? materials : SAMPLE_MATERIALS;

  // --- CARD 1: Overview ---
  const categoryData = useMemo(() => {
    const counts = displayMaterials.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [displayMaterials]);

  // --- CARD 2: Heatmap ---
  const heatmapProps = ['density', 'yieldStrength', 'youngsModulus', 'hardness', 'meltingPoint'];
  const heatmapData = useMemo(() => {
    const top10 = displayMaterials.slice(0, 10);
    const ranges = {};
    heatmapProps.forEach(prop => {
      const values = top10.map(m => m[prop]).filter(v => v !== undefined && v !== null);
      ranges[prop] = { min: Math.min(...values), max: Math.max(...values) };
    });
    return { materials: top10, ranges };
  }, [displayMaterials]);

  const getHeatmapColor = (val, min, max) => {
    if (val === undefined || val === null || max === min) return 'bg-[#1A2634] text-[#94A3B8]';
    const normalized = (val - min) / (max - min); // 0 to 1
    
    // Blue (low) -> White (mid) -> Red (high)
    let r, g, b;
    if (normalized < 0.5) {
      // Blue to White
      const t = normalized * 2;
      r = Math.round(74 + t * (255 - 74)); // #4A9EFF (74, 158, 255) to White
      g = Math.round(158 + t * (255 - 158));
      b = 255;
    } else {
      // White to Red
      const t = (normalized - 0.5) * 2;
      r = 255;
      g = Math.round(255 - t * (255 - 68)); // White to #EF4444 (239, 68, 68)
      b = Math.round(255 - t * (255 - 68));
    }
    
    // Calculate contrast text color
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.5 ? '#0F1923' : '#F1F5F9';
    
    return { bg: `rgb(${r}, ${g}, ${b})`, text: textColor };
  };

  // --- CARD 3: Radar ---
  const [radarSelected, setRadarSelected] = useState([displayMaterials[0]?.id, displayMaterials[1]?.id].filter(Boolean));
  
  const radarData = useMemo(() => {
    const selectedMats = displayMaterials.filter(m => radarSelected.includes(m.id));
    if (selectedMats.length === 0) return [];

    // Normalize properties for radar (0-100 scale)
    const props = [
      { key: 'yieldStrength', label: 'Strength' },
      { key: 'youngsModulus', label: 'Stiffness' },
      { key: 'hardness', label: 'Hardness' },
      { key: 'thermalConductivity', label: 'Thermal' },
      { key: 'density', label: 'Density (Inv)', invert: true } // Lower density is "better" for this viz
    ];

    const maxVals = {};
    props.forEach(p => {
      const allVals = displayMaterials.map(m => m[p.key]).filter(v => v !== undefined && v !== null);
      maxVals[p.key] = Math.max(...allVals, 1); // Avoid div by 0
    });

    return props.map(p => {
      const dataPoint = { subject: p.label };
      selectedMats.forEach(m => {
        let val = m[p.key] || 0;
        let normalized = (val / maxVals[p.key]) * 100;
        if (p.invert) normalized = 100 - normalized;
        dataPoint[m.name] = Math.round(normalized);
      });
      return dataPoint;
    });
  }, [displayMaterials, radarSelected]);

  const toggleRadarMaterial = (id) => {
    setRadarSelected(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  // --- CARD 4: Leaderboard ---
  const [leaderboardProp, setLeaderboardProp] = useState('yieldStrength');
  const leaderboardData = useMemo(() => {
    return [...displayMaterials]
      .filter(m => m[leaderboardProp] !== undefined && m[leaderboardProp] !== null)
      .sort((a, b) => b[leaderboardProp] - a[leaderboardProp])
      .slice(0, 5);
  }, [displayMaterials, leaderboardProp]);

  const maxLeaderboardVal = leaderboardData[0]?.[leaderboardProp] || 1;

  // --- CARD 7: Search ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lower = searchQuery.toLowerCase();
    return displayMaterials
      .filter(m => m.name.toLowerCase().includes(lower) || m.category.toLowerCase().includes(lower))
      .slice(0, 5);
  }, [displayMaterials, searchQuery]);

  return (
    <div className="p-6 h-full overflow-y-auto bg-[#0F1923] text-[#F1F5F9]">
      
      {/* CARD 6: KPI Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Materials', value: displayMaterials.length, trend: '+12%', up: true, icon: Database, color: 'text-[#4A9EFF]' },
          { label: 'Tests This Month', value: testLogs.length || 24, trend: '+5%', up: true, icon: Activity, color: 'text-[#22C55E]' },
          { label: 'Properties Tracked', value: '15+', trend: '0%', up: true, icon: FileText, color: 'text-[#F59E0B]' },
          { label: 'Reports Generated', value: '8', trend: '-2%', up: false, icon: FileText, color: 'text-[#EF4444]' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg flex items-center justify-between group hover:border-[#4A9EFF] transition-colors">
              <div>
                <p className="text-[#94A3B8] text-sm mb-1">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{stat.value}</span>
                  <span className={`text-xs flex items-center mb-1 ${stat.up ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {stat.up ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {stat.trend}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full bg-[#0F1923] ${stat.color} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* CARD 7: Quick Search */}
      <div className="relative mb-6 z-40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
          <input 
            type="text" 
            placeholder="Quick search materials (e.g., 'Steel', 'Polymers')..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A2634] border border-[#2D3F50] rounded-lg py-3 pl-10 pr-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] shadow-lg transition-colors text-lg"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F1F5F9]">
              <X size={20} />
            </button>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl overflow-hidden">
            {searchResults.map(m => (
              <button 
                key={m.id}
                onClick={() => { setSelectedMaterial(m); setSearchQuery(''); }}
                className="w-full text-left px-4 py-3 hover:bg-[#2D3F50] border-b border-[#2D3F50] last:border-0 flex justify-between items-center group"
              >
                <div>
                  <div className="font-medium text-[#F1F5F9]">{m.name}</div>
                  <div className="text-xs text-[#94A3B8]">{m.category}</div>
                </div>
                <ChevronRight size={16} className="text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* CARD 1: Materials Overview */}
        <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#F1F5F9]">Materials Overview</h2>
              <p className="text-xs text-[#94A3B8]">Distribution by category</p>
            </div>
            <div className="bg-[#0F1923] px-3 py-1 rounded-full text-xs font-medium text-[#4A9EFF] border border-[#2D3F50]">
              {displayMaterials.length} Total
            </div>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9', borderRadius: '8px' }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#F1F5F9]">{displayMaterials.length}</div>
                <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Items</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-[#94A3B8] text-center mt-2 flex items-center justify-center gap-1">
            <Clock size={12} /> Last updated: Just now
          </div>
        </div>

        {/* CARD 2: Property Heatmap */}
        <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col overflow-hidden">
          <h2 className="text-lg font-bold text-[#F1F5F9] mb-4">Property Range Heatmap</h2>
          <div className="flex-1 overflow-auto rounded-md border border-[#2D3F50] scrollbar-hide">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#0F1923] text-[#94A3B8] sticky top-0 z-10">
                <tr>
                  <th className="p-3 font-medium border-b border-[#2D3F50]">Material</th>
                  <th className="p-3 font-medium border-b border-[#2D3F50] text-center">Density</th>
                  <th className="p-3 font-medium border-b border-[#2D3F50] text-center">Strength</th>
                  <th className="p-3 font-medium border-b border-[#2D3F50] text-center">Modulus</th>
                  <th className="p-3 font-medium border-b border-[#2D3F50] text-center">Hardness</th>
                  <th className="p-3 font-medium border-b border-[#2D3F50] text-center">Melting Pt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3F50]">
                {heatmapData.materials.map(m => (
                  <tr key={m.id} className="hover:bg-[#2D3F50]/50 transition-colors">
                    <td className="p-3 font-medium text-[#F1F5F9]">{m.name}</td>
                    {heatmapProps.map(prop => {
                      const val = m[prop];
                      const style = getHeatmapColor(val, heatmapData.ranges[prop].min, heatmapData.ranges[prop].max);
                      return (
                        <td key={prop} className="p-1">
                          <div 
                            className="w-full h-full py-2 px-1 rounded text-center font-medium transition-colors"
                            style={{ backgroundColor: style.bg, color: style.text }}
                            title={`${val}`}
                          >
                            {val !== undefined && val !== null ? val : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4 text-xs text-[#94A3B8]">
            <span>Normalized relative to top 10 materials</span>
            <div className="flex items-center gap-2">
              <span>Low</span>
              <div className="w-24 h-3 rounded bg-gradient-to-r from-[#4A9EFF] via-white to-[#EF4444]"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: Radar Comparison */}
      <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#F1F5F9]">Quick Comparison</h2>
            <p className="text-xs text-[#94A3B8]">Normalized performance footprint (0-100)</p>
          </div>
          <div className="relative group z-30">
            <button className="bg-[#0F1923] border border-[#2D3F50] text-[#F1F5F9] px-4 py-2 rounded-md text-sm flex items-center gap-2 hover:border-[#4A9EFF] transition-colors">
              Select Materials ({radarSelected.length}/3)
            </button>
            <div className="absolute right-0 mt-2 w-64 bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl hidden group-hover:block max-h-64 overflow-y-auto">
              {displayMaterials.map(m => (
                <label key={m.id} className="flex items-center gap-3 px-4 py-2 hover:bg-[#2D3F50] cursor-pointer text-sm">
                  <input 
                    type="checkbox" 
                    checked={radarSelected.includes(m.id)}
                    onChange={() => toggleRadarMaterial(m.id)}
                    disabled={!radarSelected.includes(m.id) && radarSelected.length >= 3}
                    className="rounded border-[#2D3F50] bg-[#0F1923] text-[#4A9EFF] focus:ring-[#4A9EFF]"
                  />
                  <span className={radarSelected.includes(m.id) ? 'text-[#F1F5F9]' : 'text-[#94A3B8]'}>{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          {radarSelected.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#2D3F50" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} stroke="#2D3F50" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A2634', borderColor: '#2D3F50', color: '#F1F5F9', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {displayMaterials.filter(m => radarSelected.includes(m.id)).map((m, idx) => (
                  <Radar 
                    key={m.id}
                    name={m.name} 
                    dataKey={m.name} 
                    stroke={RADAR_COLORS[idx % RADAR_COLORS.length]} 
                    fill={RADAR_COLORS[idx % RADAR_COLORS.length]} 
                    fillOpacity={0.3} 
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[#94A3B8]">
              Select materials to compare
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 4: Leaderboard */}
        <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#F1F5F9]">Top Materials</h2>
            <select 
              value={leaderboardProp}
              onChange={e => setLeaderboardProp(e.target.value)}
              className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF]"
            >
              <option value="yieldStrength">Yield Strength</option>
              <option value="youngsModulus">Stiffness (Modulus)</option>
              <option value="hardness">Hardness</option>
              <option value="meltingPoint">Melting Point</option>
              <option value="thermalConductivity">Thermal Cond.</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {leaderboardData.map((m, idx) => {
              const val = m[leaderboardProp];
              const percentage = (val / maxLeaderboardVal) * 100;
              return (
                <div key={m.id} className="group">
                  <div className="flex justify-between items-end mb-1">
                    <div className="flex items-center gap-2">
                      {idx === 0 && <Medal size={16} className="text-[#F59E0B]" />}
                      {idx === 1 && <Medal size={16} className="text-[#94A3B8]" />}
                      {idx === 2 && <Medal size={16} className="text-[#B45309]" />}
                      {idx > 2 && <span className="w-4 text-center text-xs text-[#94A3B8]">{idx + 1}</span>}
                      <span className="text-sm font-medium text-[#F1F5F9]">{m.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#4A9EFF]">{val}</span>
                  </div>
                  <div className="h-2 w-full bg-[#0F1923] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${idx === 0 ? 'bg-[#4A9EFF]' : 'bg-[#2D3F50] group-hover:bg-[#4A9EFF]/50'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 5: Activity Feed */}
        <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
          <h2 className="text-lg font-bold text-[#F1F5F9] mb-6">Recent Activity</h2>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#2D3F50] before:via-[#2D3F50] before:to-transparent">
            {MOCK_ACTIVITY.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#1A2634] bg-[#0F1923] ${act.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10`}>
                    <Icon size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0F1923] p-4 rounded-lg border border-[#2D3F50] shadow-sm group-hover:border-[#4A9EFF]/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-[#F1F5F9]">{act.user}</span>
                      <span className="text-xs text-[#94A3B8]">{act.time}</span>
                    </div>
                    <p className="text-sm text-[#94A3B8]">{act.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Material Summary Modal (from Search) */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#F1F5F9]">{selectedMaterial.name}</h2>
                <span className="inline-block mt-1 px-2 py-1 bg-[#0F1923] border border-[#2D3F50] rounded text-xs text-[#4A9EFF]">
                  {selectedMaterial.category}
                </span>
              </div>
              <button onClick={() => setSelectedMaterial(null)} className="text-[#94A3B8] hover:text-[#F1F5F9]"><X size={20} /></button>
            </div>
            
            <div className="space-y-3 mb-6">
              {[
                { label: 'Density', val: selectedMaterial.density, unit: 'g/cm³' },
                { label: 'Yield Strength', val: selectedMaterial.yieldStrength, unit: 'MPa' },
                { label: 'Young\'s Modulus', val: selectedMaterial.youngsModulus, unit: 'GPa' },
                { label: 'Hardness', val: selectedMaterial.hardness, unit: 'HV' },
              ].map(prop => (
                <div key={prop.label} className="flex justify-between items-center border-b border-[#2D3F50] pb-2 last:border-0">
                  <span className="text-sm text-[#94A3B8]">{prop.label}</span>
                  <span className="text-sm font-medium text-[#F1F5F9]">
                    {prop.val !== undefined ? `${prop.val} ${prop.unit}` : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-[#94A3B8] italic bg-[#0F1923] p-3 rounded border border-[#2D3F50]">
              {selectedMaterial.notes || 'No notes available.'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
