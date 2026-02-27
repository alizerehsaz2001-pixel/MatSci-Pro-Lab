import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Ruler, Palette, Database, Building2, Bell, Save, RotateCcw, Download, Upload, Trash2, AlertTriangle, CheckCircle, RefreshCw, UploadCloud, MonitorSmartphone } from 'lucide-react';

const TABS = [
  { id: 'Units', icon: Ruler },
  { id: 'Appearance', icon: Palette },
  { id: 'Data & Backup', icon: Database },
  { id: 'Lab Config', icon: Building2 },
  { id: 'System', icon: Bell }
];

const UNIT_OPTIONS = {
  Stress: ['MPa', 'GPa', 'Pa', 'psi', 'ksi'],
  Length: ['mm', 'cm', 'm', 'inch', 'ft'],
  Temperature: ['°C', '°F', 'K'],
  Pressure: ['MPa', 'Pa', 'psi', 'bar', 'atm'],
  Density: ['g/cm³', 'kg/m³', 'lb/in³', 'lb/ft³'],
  Energy: ['J', 'kJ', 'cal', 'BTU', 'ft·lbf']
};

const SI_DEFAULTS = { Stress: 'MPa', Length: 'mm', Temperature: '°C', Pressure: 'MPa', Density: 'g/cm³', Energy: 'J' };
const IMPERIAL_DEFAULTS = { Stress: 'ksi', Length: 'inch', Temperature: '°F', Pressure: 'psi', Density: 'lb/in³', Energy: 'ft·lbf' };

const THEMES = [
  { id: 'dark', name: 'Dark (Default)', bg: '#0F1923', card: '#1A2634', text: '#F1F5F9', border: '#2D3F50' },
  { id: 'light', name: 'Light', bg: '#F8FAFC', card: '#FFFFFF', text: '#0F172A', border: '#E2E8F0' },
  { id: 'high-contrast', name: 'High Contrast', bg: '#000000', card: '#000000', text: '#FFFFFF', border: '#FFFFFF' },
  { id: 'material-blue', name: 'Material Blue', bg: '#E3F2FD', card: '#FFFFFF', text: '#0D47A1', border: '#90CAF9' },
  { id: 'engineering-gray', name: 'Engineering Gray', bg: '#2D3748', card: '#4A5568', text: '#F7FAFC', border: '#718096' }
];

const ACCENTS = [
  { id: 'blue', color: '#4A9EFF' },
  { id: 'green', color: '#22C55E' },
  { id: 'orange', color: '#F59E0B' },
  { id: 'red', color: '#EF4444' },
  { id: 'purple', color: '#8B5CF6' },
  { id: 'pink', color: '#EC4899' }
];

const TRANSLATIONS = {
  en: { title: 'Settings & Configuration', save: 'Save Changes', preview: 'Live Preview' },
  fa: { title: 'تنظیمات و پیکربندی', save: 'ذخیره تغییرات', preview: 'پیش‌نمایش زنده' },
  de: { title: 'Einstellungen & Konfiguration', save: 'Änderungen speichern', preview: 'Live-Vorschau' },
  zh: { title: '设置与配置', save: '保存更改', preview: '实时预览' }
};

export default function Settings({ materials, setMaterials, testLogs, setTestLogs, currentUser, unitSystem, theme: globalTheme }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- SUB-MODULE 1: Units ---
  const [globalSystem, setGlobalSystem] = useState('SI');
  const [customUnits, setCustomUnits] = useState(SI_DEFAULTS);

  const handleSystemChange = (sys) => {
    setGlobalSystem(sys);
    setCustomUnits(sys === 'SI' ? SI_DEFAULTS : IMPERIAL_DEFAULTS);
    addToast(`Switched to ${sys} defaults`);
  };

  // --- SUB-MODULE 2: Appearance ---
  const [appTheme, setAppTheme] = useState('dark');
  const [appAccent, setAppAccent] = useState('blue');
  const [fontSize, setFontSize] = useState('Medium');
  const [density, setDensity] = useState('Comfortable');
  const [lang, setLang] = useState('en');

  const activeThemeObj = THEMES.find(t => t.id === appTheme) || THEMES[0];
  const activeAccentColor = ACCENTS.find(a => a.id === appAccent)?.color || '#4A9EFF';
  const t = TRANSLATIONS[lang];

  // --- SUB-MODULE 3: Data & Backup ---
  const [backupFreq, setBackupFreq] = useState('Weekly');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const fileInputRef = useRef(null);

  const exportData = () => {
    const data = { materials, testLogs, settings: { customUnits, appTheme, lang } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matsci_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Backup exported successfully');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.materials) setMaterials(data.materials);
        if (data.testLogs) setTestLogs(data.testLogs);
        addToast('Backup restored successfully');
      } catch (err) {
        addToast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (deleteConfirmText === 'DELETE') {
      setMaterials([]);
      setTestLogs([]);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText('');
      addToast('All data cleared', 'warning');
    }
  };

  // --- SUB-MODULE 4: Lab Config ---
  const [labInfo, setLabInfo] = useState({ name: 'MatSci Pro Lab', institution: 'University of Engineering', address: '123 Tech Blvd', contact: 'lab@matsci.pro' });
  const [labDefaults, setLabDefaults] = useState({ std: 'ASTM', temp: '°C', sigFigs: '3' });
  const [instConfig, setInstConfig] = useState({ type: 'UTM', port: 'COM3', baud: '9600' });
  const [instStatus, setInstStatus] = useState(null);
  const [reportTpl, setReportTpl] = useState({ title: 'Official Test Report', logoPos: 'Left', footer: 'Confidential', watermark: 'DRAFT' });

  const testConnection = () => {
    setInstStatus('testing');
    setTimeout(() => {
      setInstStatus(Math.random() > 0.3 ? 'success' : 'fail');
    }, 1500);
  };

  // --- SUB-MODULE 5: System ---
  const [smtp, setSmtp] = useState({ server: 'smtp.example.com', port: '587', user: 'alerts@matsci.pro', pass: '********' });
  const [alerts, setAlerts] = useState([{ id: 1, prop: 'Yield Strength', op: '<', val: '200', group: 'Steel' }]);
  const [privacy, setPrivacy] = useState({ telemetry: true, crashReports: true });
  const [updateStatus, setUpdateStatus] = useState(null);

  const checkForUpdates = () => {
    setUpdateStatus('checking');
    setTimeout(() => {
      setUpdateStatus('up-to-date');
      addToast('System is up to date');
    }, 2000);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto bg-[#0F1923] text-[#F1F5F9]" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 min-w-[300px] ${toast.type === 'error' ? 'bg-[#EF4444]' : toast.type === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg shrink-0">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">{t.title}</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Manage application preferences, data, and laboratory settings</p>
        
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
        {/* TAB 1: Units */}
        {activeTab === 'Units' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Global System</h2>
              <div className="flex gap-2 mb-6">
                <button onClick={() => handleSystemChange('SI')} className={`flex-1 py-2 rounded-md font-bold transition-colors ${globalSystem === 'SI' ? 'bg-[#4A9EFF] text-white' : 'bg-[#0F1923] text-[#94A3B8] border border-[#2D3F50]'}`}>SI (Metric)</button>
                <button onClick={() => handleSystemChange('Imperial')} className={`flex-1 py-2 rounded-md font-bold transition-colors ${globalSystem === 'Imperial' ? 'bg-[#4A9EFF] text-white' : 'bg-[#0F1923] text-[#94A3B8] border border-[#2D3F50]'}`}>Imperial</button>
              </div>
              <button onClick={() => handleSystemChange('SI')} className="w-full bg-[#0F1923] text-[#F1F5F9] border border-[#2D3F50] px-4 py-2 rounded-md hover:bg-[#2D3F50] transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                <RotateCcw size={16} /> Reset to SI Defaults
              </button>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Custom Unit Mapping</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {Object.entries(UNIT_OPTIONS).map(([prop, options]) => (
                  <div key={prop} className="flex items-center justify-between bg-[#0F1923] p-3 rounded border border-[#2D3F50]">
                    <span className="text-[#F1F5F9] font-medium">{prop}</span>
                    <select 
                      value={customUnits[prop]} 
                      onChange={e => setCustomUnits({...customUnits, [prop]: e.target.value})}
                      className="bg-[#1A2634] border border-[#2D3F50] rounded py-1 px-2 text-[#4A9EFF] font-bold focus:outline-none focus:border-[#4A9EFF]"
                    >
                      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={() => addToast('Units applied to all modules')} className="bg-[#4A9EFF] text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium">
                  <Save size={18} /> Apply to All Modules
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Appearance */}
        {activeTab === 'Appearance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-8">
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Theme</h2>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(t => (
                    <button 
                      key={t.id} 
                      onClick={() => setAppTheme(t.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${appTheme === t.id ? 'border-[#4A9EFF] ring-1 ring-[#4A9EFF]' : 'border-[#2D3F50] hover:border-[#94A3B8]'}`}
                      style={{ backgroundColor: t.bg, color: t.text }}
                    >
                      <div className="font-bold text-sm">{t.name}</div>
                      <div className="flex gap-1 mt-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.card, border: `1px solid ${t.border}` }}></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeAccentColor }}></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Accent Color</h2>
                <div className="flex gap-3">
                  {ACCENTS.map(a => (
                    <button 
                      key={a.id} 
                      onClick={() => setAppAccent(a.id)}
                      className={`w-8 h-8 rounded-full transition-transform ${appAccent === a.id ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#1A2634]' : 'hover:scale-110'}`}
                      style={{ backgroundColor: a.color }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Typography</h2>
                  <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF]">
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Layout Density</h2>
                  <select value={density} onChange={e => setDensity(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF]">
                    <option>Compact</option>
                    <option>Comfortable</option>
                  </select>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Language</h2>
                <select value={lang} onChange={e => setLang(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF]">
                  <option value="en">English</option>
                  <option value="fa">Persian (فارسی)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="zh">Chinese (中文)</option>
                </select>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">{t.preview}</h2>
              <div 
                className="flex-1 rounded-lg border p-6 transition-colors duration-300"
                style={{ backgroundColor: activeThemeObj.bg, borderColor: activeThemeObj.border, color: activeThemeObj.text }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-xl" style={{ fontSize: fontSize === 'Large' ? '1.5rem' : fontSize === 'Small' ? '1.125rem' : '1.25rem' }}>Dashboard</h3>
                  <button className="px-4 py-2 rounded text-white font-medium transition-colors" style={{ backgroundColor: activeAccentColor }}>{t.save}</button>
                </div>
                <div className={`grid grid-cols-2 gap-4 ${density === 'Compact' ? 'gap-2' : 'gap-6'}`}>
                  <div className="rounded-lg p-4 shadow" style={{ backgroundColor: activeThemeObj.card, border: `1px solid ${activeThemeObj.border}` }}>
                    <div className="text-sm opacity-70 mb-1">Total Materials</div>
                    <div className="text-3xl font-bold" style={{ color: activeAccentColor }}>1,245</div>
                  </div>
                  <div className="rounded-lg p-4 shadow" style={{ backgroundColor: activeThemeObj.card, border: `1px solid ${activeThemeObj.border}` }}>
                    <div className="text-sm opacity-70 mb-1">Recent Tests</div>
                    <div className="text-3xl font-bold" style={{ color: activeAccentColor }}>89</div>
                  </div>
                </div>
                <div className="mt-6 rounded-lg p-4 shadow" style={{ backgroundColor: activeThemeObj.card, border: `1px solid ${activeThemeObj.border}` }}>
                  <div className="h-4 w-3/4 rounded mb-2 opacity-20" style={{ backgroundColor: activeThemeObj.text }}></div>
                  <div className="h-4 w-1/2 rounded opacity-20" style={{ backgroundColor: activeThemeObj.text }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Data & Backup */}
        {activeTab === 'Data & Backup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-8">
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Backup & Restore</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={exportData} className="flex-1 bg-[#4A9EFF] text-white px-4 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-bold">
                    <Download size={18} /> Export All Data
                  </button>
                  <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-[#0F1923] text-[#F1F5F9] border border-[#2D3F50] px-4 py-3 rounded-md hover:bg-[#2D3F50] transition-colors flex items-center justify-center gap-2 font-bold">
                    <Upload size={18} /> Import Backup
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Auto-Backup</h2>
                <select value={backupFreq} onChange={e => setBackupFreq(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF]">
                  <option>Manual Only</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
                <p className="text-xs text-[#94A3B8] mt-2">Backups are saved to the local downloads folder.</p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#EF4444] border-b border-[#EF4444]/30 pb-2 mb-4">Danger Zone</h2>
                <button onClick={() => setIsDeleteModalOpen(true)} className="w-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/50 px-4 py-3 rounded-md hover:bg-[#EF4444] hover:text-white transition-colors flex items-center justify-center gap-2 font-bold">
                  <Trash2 size={18} /> Clear All Data
                </button>
              </div>
            </div>

            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg h-fit">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Database Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-[#4A9EFF] mb-1">{materials.length || 20}</div>
                  <div className="text-xs text-[#94A3B8] uppercase tracking-wider">Materials</div>
                </div>
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-[#22C55E] mb-1">{testLogs.length || 145}</div>
                  <div className="text-xs text-[#94A3B8] uppercase tracking-wider">Tests Logged</div>
                </div>
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-[#F59E0B] mb-1">32</div>
                  <div className="text-xs text-[#94A3B8] uppercase tracking-wider">Reports Saved</div>
                </div>
                <div className="bg-[#0F1923] border border-[#2D3F50] p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-[#8B5CF6] mb-1">14.2 MB</div>
                  <div className="text-xs text-[#94A3B8] uppercase tracking-wider">Storage Used</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Lab Config */}
        {activeTab === 'Lab Config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg space-y-6">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2">Laboratory Information</h2>
              <div className="space-y-4">
                {Object.entries({ name: 'Lab Name', institution: 'Institution', address: 'Address', contact: 'Contact Email' }).map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                    <input type="text" value={labInfo[key]} onChange={e => setLabInfo({...labInfo, [key]: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Lab Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#0F1923] border border-[#2D3F50] rounded flex items-center justify-center text-[#94A3B8]">
                      <UploadCloud size={24} />
                    </div>
                    <button className="bg-[#2D3F50] text-white px-3 py-1.5 rounded text-sm hover:bg-[#4A9EFF] transition-colors">Upload Image</button>
                  </div>
                </div>
              </div>

              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mt-8">Default Values</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Default Standard</label>
                  <select value={labDefaults.std} onChange={e => setLabDefaults({...labDefaults, std: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                    <option>ASTM</option><option>ISO</option><option>DIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1">Significant Figures</label>
                  <select value={labDefaults.sigFigs} onChange={e => setLabDefaults({...labDefaults, sigFigs: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                    <option>2</option><option>3</option><option>4</option><option>5</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Instrument Connection</h2>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Instrument Type</label>
                    <select value={instConfig.type} onChange={e => setInstConfig({...instConfig, type: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                      <option>Universal Testing Machine (UTM)</option>
                      <option>Hardness Tester</option>
                      <option>Impact Tester</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">COM Port</label>
                      <input type="text" value={instConfig.port} onChange={e => setInstConfig({...instConfig, port: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#94A3B8] mb-1">Baud Rate</label>
                      <select value={instConfig.baud} onChange={e => setInstConfig({...instConfig, baud: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                        <option>4800</option><option>9600</option><option>19200</option><option>115200</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={testConnection} className="bg-[#2D3F50] text-white px-4 py-2 rounded-md hover:bg-[#4A9EFF] transition-colors text-sm font-medium flex items-center gap-2">
                    <MonitorSmartphone size={16} /> Test Connection
                  </button>
                  {instStatus === 'testing' && <span className="text-[#F59E0B] text-sm flex items-center gap-1"><RefreshCw size={14} className="animate-spin" /> Testing...</span>}
                  {instStatus === 'success' && <span className="text-[#22C55E] text-sm flex items-center gap-1"><CheckCircle size={14} /> Connection Successful</span>}
                  {instStatus === 'fail' && <span className="text-[#EF4444] text-sm flex items-center gap-1"><XCircle size={14} /> Connection Failed</span>}
                </div>
              </div>

              <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Report Template</h2>
                <div className="space-y-4">
                  {Object.entries({ title: 'Report Title', footer: 'Footer Text', watermark: 'Watermark' }).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-[#94A3B8] mb-1">{label}</label>
                      <input type="text" value={reportTpl[key]} onChange={e => setReportTpl({...reportTpl, [key]: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: System */}
        {activeTab === 'System' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Email Notifications (SMTP)</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-[#94A3B8] mb-1">SMTP Server</label>
                    <input type="text" value={smtp.server} onChange={e => setSmtp({...smtp, server: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Port</label>
                    <input type="text" value={smtp.port} onChange={e => setSmtp({...smtp, port: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#94A3B8] mb-1">Username</label>
                    <input type="text" value={smtp.user} onChange={e => setSmtp({...smtp, user: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none text-sm" />
                  </div>
                </div>
                <button onClick={() => addToast('SMTP Settings Saved')} className="bg-[#2D3F50] text-white px-4 py-2 rounded-md hover:bg-[#4A9EFF] transition-colors text-sm font-medium">Save SMTP Config</button>
              </div>

              <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <div className="flex justify-between items-center border-b border-[#2D3F50] pb-2 mb-4">
                  <h2 className="text-lg font-bold text-[#F1F5F9]">Alert Thresholds</h2>
                  <button onClick={() => setAlerts([...alerts, { id: Date.now(), prop: 'Density', op: '>', val: '0', group: 'All' }])} className="text-[#4A9EFF] hover:text-blue-400 text-sm font-medium">+ Add Alert</button>
                </div>
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center gap-2 bg-[#0F1923] p-2 rounded border border-[#2D3F50]">
                      <span className="text-xs text-[#94A3B8]">If</span>
                      <select value={alert.prop} onChange={e => setAlerts(alerts.map(a => a.id === alert.id ? {...a, prop: e.target.value} : a))} className="bg-transparent text-[#F1F5F9] text-sm focus:outline-none w-24">
                        <option>Yield Strength</option><option>Density</option><option>Hardness</option>
                      </select>
                      <select value={alert.op} onChange={e => setAlerts(alerts.map(a => a.id === alert.id ? {...a, op: e.target.value} : a))} className="bg-transparent text-[#4A9EFF] font-bold text-sm focus:outline-none">
                        <option>&lt;</option><option>&gt;</option><option>=</option>
                      </select>
                      <input type="number" value={alert.val} onChange={e => setAlerts(alerts.map(a => a.id === alert.id ? {...a, val: e.target.value} : a))} className="bg-transparent text-[#F1F5F9] text-sm w-16 focus:outline-none border-b border-[#2D3F50]" />
                      <span className="text-xs text-[#94A3B8]">for</span>
                      <input type="text" value={alert.group} onChange={e => setAlerts(alerts.map(a => a.id === alert.id ? {...a, group: e.target.value} : a))} className="bg-transparent text-[#F1F5F9] text-sm w-20 focus:outline-none border-b border-[#2D3F50]" />
                      <button onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))} className="ml-auto text-[#EF4444] hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">System Information</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-[#94A3B8]">App Version</span><span className="text-[#F1F5F9] font-medium">v2.4.0-beta</span></div>
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Build Number</span><span className="text-[#F1F5F9] font-mono">b-8492a1</span></div>
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Last Updated</span><span className="text-[#F1F5F9]">2026-02-20</span></div>
                  <div className="flex justify-between"><span className="text-[#94A3B8]">License</span><span className="text-[#22C55E]">Active (Enterprise)</span></div>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2D3F50]">
                  <button onClick={checkForUpdates} className="w-full bg-[#0F1923] text-[#4A9EFF] border border-[#4A9EFF]/50 px-4 py-2 rounded-md hover:bg-[#4A9EFF]/10 transition-colors flex items-center justify-center gap-2 font-medium">
                    {updateStatus === 'checking' ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                    {updateStatus === 'checking' ? 'Checking...' : 'Check for Updates'}
                  </button>
                </div>
              </div>

              <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg">
                <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Privacy & Telemetry</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-[#F1F5F9]">Share Usage Data</div>
                      <div className="text-xs text-[#94A3B8]">Help improve the app by sending anonymous usage stats.</div>
                    </div>
                    <button onClick={() => setPrivacy({...privacy, telemetry: !privacy.telemetry})} className={`w-10 h-5 rounded-full relative transition-colors ${privacy.telemetry ? 'bg-[#4A9EFF]' : 'bg-[#2D3F50]'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${privacy.telemetry ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-[#F1F5F9]">Send Crash Reports</div>
                      <div className="text-xs text-[#94A3B8]">Automatically send error logs when the app crashes.</div>
                    </div>
                    <button onClick={() => setPrivacy({...privacy, crashReports: !privacy.crashReports})} className={`w-10 h-5 rounded-full relative transition-colors ${privacy.crashReports ? 'bg-[#4A9EFF]' : 'bg-[#2D3F50]'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${privacy.crashReports ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A2634] border border-[#EF4444] rounded-lg shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-[#EF4444] mb-4">
              <AlertTriangle size={28} />
              <h2 className="text-xl font-bold">Clear All Data</h2>
            </div>
            <p className="text-[#F1F5F9] mb-4">This action cannot be undone. This will permanently delete all materials, test logs, and reports from the database.</p>
            <p className="text-sm text-[#94A3B8] mb-2">Please type <strong className="text-white">DELETE</strong> to confirm.</p>
            <input 
              type="text" 
              value={deleteConfirmText} 
              onChange={e => setDeleteConfirmText(e.target.value)} 
              className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#EF4444] focus:outline-none mb-6" 
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); }} className="px-4 py-2 rounded-md text-[#94A3B8] hover:text-[#F1F5F9]">Cancel</button>
              <button onClick={clearAllData} disabled={deleteConfirmText !== 'DELETE'} className="bg-[#EF4444] text-white px-6 py-2 rounded-md hover:bg-red-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
