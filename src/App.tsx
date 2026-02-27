/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Database, Activity, LayoutDashboard, Settings as SettingsIcon, Users, FileText, FlaskConical, Zap } from 'lucide-react';
import Dashboard from './Dashboard';
import MaterialsDatabase from './MaterialsDatabase';
import MechanicalProperties from './MechanicalProperties';
import PhysicalProperties from './PhysicalProperties';
import AnalysisCalculations from './AnalysisCalculations';
import TestingStandards from './TestingStandards';
import ReportsExport from './ReportsExport';
import UserManagement from './UserManagement';
import Settings from './Settings';

export default function App() {
  const [materials, setMaterials] = useState([]);
  const [testLogs, setTestLogs] = useState([]);
  const [currentUser, setCurrentUser] = useState({ name: 'Admin', role: 'admin' });
  const [unitSystem, setUnitSystem] = useState('metric');
  const [theme, setTheme] = useState('dark');
  const [currentModule, setCurrentModule] = useState('Dashboard');

  const NAVIGATION = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Materials Database', icon: Database },
    { name: 'Mechanical Properties', icon: Activity },
    { name: 'Physical Properties', icon: Zap },
    { name: 'Analysis & Calculations', icon: FlaskConical },
    { name: 'Testing & Standards', icon: FileText },
    { name: 'Reports', icon: FileText },
    { name: 'User Management', icon: Users },
    { name: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-[#0F1923] text-[#F1F5F9] font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#1A2634] border-r border-[#2D3F50] flex flex-col">
        <div className="p-6 border-b border-[#2D3F50]">
          <h1 className="text-xl font-bold text-[#4A9EFF] flex items-center gap-2">
            <Database className="text-[#4A9EFF]" />
            MatSci Pro
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {NAVIGATION.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.name;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => setCurrentModule(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                      isActive 
                        ? 'bg-[#4A9EFF] text-white' 
                        : 'text-[#94A3B8] hover:bg-[#2D3F50] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-[#2D3F50] text-xs text-[#94A3B8]">
          Logged in as: <span className="text-[#F1F5F9]">{currentUser.name}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentModule === 'Dashboard' && (
          <Dashboard 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule === 'Materials Database' && (
          <MaterialsDatabase 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule === 'Mechanical Properties' && (
          <MechanicalProperties 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule === 'Physical Properties' && (
          <PhysicalProperties 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule === 'Analysis & Calculations' && (
          <AnalysisCalculations 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule === 'Testing & Standards' && (
          <TestingStandards 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule === 'Reports' && (
          <ReportsExport 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule === 'User Management' && (
          <UserManagement 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule === 'Settings' && (
          <Settings 
            materials={materials}
            setMaterials={setMaterials}
            testLogs={testLogs}
            setTestLogs={setTestLogs}
            currentUser={currentUser}
            unitSystem={unitSystem}
            theme={theme}
          />
        )}
        {currentModule !== 'Dashboard' && currentModule !== 'Materials Database' && currentModule !== 'Mechanical Properties' && currentModule !== 'Physical Properties' && currentModule !== 'Analysis & Calculations' && currentModule !== 'Testing & Standards' && currentModule !== 'Reports' && currentModule !== 'User Management' && currentModule !== 'Settings' && (
          <div className="flex-1 flex items-center justify-center text-[#94A3B8]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{currentModule}</h2>
              <p>Module coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
