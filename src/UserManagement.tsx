import React, { useState, useMemo } from 'react';
import { Users, Shield, Activity, Monitor, Bell, Search, Plus, Edit, Trash2, X, Download, Filter, CheckCircle, XCircle, Clock, LogOut } from 'lucide-react';

const TABS = [
  { id: 'Directory', icon: Users },
  { id: 'Permissions', icon: Shield },
  { id: 'Activity Log', icon: Activity },
  { id: 'Sessions', icon: Monitor },
  { id: 'Notifications', icon: Bell }
];

const ROLES = ['Admin', 'Engineer', 'Technician', 'Viewer'];
const DEPARTMENTS = ['IT', 'R&D', 'QA', 'Management', 'Production', 'Sales'];

const INITIAL_USERS = [
  { id: 'U001', name: 'Admin User', email: 'admin@matsci.pro', role: 'Admin', department: 'IT', lastActive: '2026-02-26T15:30:00Z', status: 'Active' },
  { id: 'U002', name: 'Sarah Connor', email: 's.connor@matsci.pro', role: 'Engineer', department: 'R&D', lastActive: '2026-02-26T14:15:00Z', status: 'Active' },
  { id: 'U003', name: 'John Smith', email: 'j.smith@matsci.pro', role: 'Technician', department: 'QA', lastActive: '2026-02-26T10:05:00Z', status: 'Active' },
  { id: 'U004', name: 'Emily Chen', email: 'e.chen@matsci.pro', role: 'Viewer', department: 'Management', lastActive: '2026-02-25T09:20:00Z', status: 'Inactive' },
  { id: 'U005', name: 'Michael Chang', email: 'm.chang@matsci.pro', role: 'Engineer', department: 'R&D', lastActive: '2026-02-26T11:45:00Z', status: 'Active' },
  { id: 'U006', name: 'David Miller', email: 'd.miller@matsci.pro', role: 'Technician', department: 'QA', lastActive: '2026-02-26T08:30:00Z', status: 'Active' },
  { id: 'U007', name: 'Jessica Taylor', email: 'j.taylor@matsci.pro', role: 'Engineer', department: 'Production', lastActive: '2026-02-24T16:10:00Z', status: 'Inactive' },
  { id: 'U008', name: 'Robert Wilson', email: 'r.wilson@matsci.pro', role: 'Viewer', department: 'Sales', lastActive: '2026-02-26T13:20:00Z', status: 'Active' }
];

const FEATURES = [
  'View Materials', 'Add Material', 'Edit Material', 'Delete Material',
  'Run Calculations', 'Log Tests', 'Generate Reports', 'Export Data',
  'Manage Users', 'System Settings'
];

const INITIAL_PERMISSIONS = {
  'Admin': FEATURES.reduce((acc, f) => ({ ...acc, [f]: true }), {}),
  'Engineer': { 'View Materials': true, 'Add Material': true, 'Edit Material': true, 'Delete Material': false, 'Run Calculations': true, 'Log Tests': true, 'Generate Reports': true, 'Export Data': true, 'Manage Users': false, 'System Settings': false },
  'Technician': { 'View Materials': true, 'Add Material': false, 'Edit Material': false, 'Delete Material': false, 'Run Calculations': true, 'Log Tests': true, 'Generate Reports': false, 'Export Data': false, 'Manage Users': false, 'System Settings': false },
  'Viewer': { 'View Materials': true, 'Add Material': false, 'Edit Material': false, 'Delete Material': false, 'Run Calculations': false, 'Log Tests': false, 'Generate Reports': true, 'Export Data': false, 'Manage Users': false, 'System Settings': false }
};

const ACTION_TYPES = ['Create', 'Edit', 'Delete', 'Export', 'Login'];

const generateMockLogs = () => {
  const logs = [];
  const users = INITIAL_USERS.map(u => u.name);
  const targets = ['Steel 304', 'Aluminum 6061', 'Tensile Test', 'Report #102', 'System Settings'];
  for (let i = 0; i < 45; i++) {
    const type = ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)];
    const date = new Date(Date.now() - Math.random() * 10000000000);
    logs.push({
      id: `LOG-${1000 + i}`,
      timestamp: date.toISOString(),
      user: users[Math.floor(Math.random() * users.length)],
      action: type,
      target: type === 'Login' ? 'System' : targets[Math.floor(Math.random() * targets.length)],
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      result: Math.random() > 0.1 ? 'Success' : 'Failed'
    });
  }
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const INITIAL_LOGS = generateMockLogs();

const INITIAL_SESSIONS = [
  { id: 'S01', user: 'Admin User', loginTime: new Date(Date.now() - 3600000).toISOString(), duration: '1h 0m', browser: 'Chrome 122 / Windows', ip: '192.168.1.45', location: 'New York, US' },
  { id: 'S02', user: 'Sarah Connor', loginTime: new Date(Date.now() - 7200000).toISOString(), duration: '2h 0m', browser: 'Firefox 123 / macOS', ip: '192.168.1.102', location: 'San Francisco, US' },
  { id: 'S03', user: 'John Smith', loginTime: new Date(Date.now() - 1800000).toISOString(), duration: '0h 30m', browser: 'Edge 121 / Windows', ip: '192.168.1.210', location: 'Chicago, US' }
];

const INITIAL_NOTIFS = [
  { id: 'N1', type: 'Material Added', message: 'New material "Titanium Grade 5" added by Sarah Connor.', time: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: 'N2', type: 'Test Logged', message: 'Tensile test logged for Steel 304 (Result: 505 MPa).', time: new Date(Date.now() - 86400000).toISOString(), read: true },
  { id: 'N3', type: 'Calibration', message: 'Instron 5982 UTM calibration due in 5 days.', time: new Date(Date.now() - 172800000).toISOString(), read: false },
  { id: 'N4', type: 'Security', message: 'New login from unrecognized device (IP: 203.0.113.42).', time: new Date(Date.now() - 259200000).toISOString(), read: true }
];

export default function UserManagement({ currentUser }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // --- SUB-MODULE 1: Directory ---
  const [users, setUsers] = useState(INITIAL_USERS);
  const [dirSearch, setDirSearch] = useState('');
  const [dirRoleFilter, setDirRoleFilter] = useState('');
  const [dirDeptFilter, setDirDeptFilter] = useState('');
  const [dirStatusFilter, setDirStatusFilter] = useState('');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Viewer', department: 'IT', status: 'Active' });

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(dirSearch.toLowerCase()) || u.email.toLowerCase().includes(dirSearch.toLowerCase());
      const matchRole = dirRoleFilter ? u.role === dirRoleFilter : true;
      const matchDept = dirDeptFilter ? u.department === dirDeptFilter : true;
      const matchStatus = dirStatusFilter ? u.status === dirStatusFilter : true;
      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [users, dirSearch, dirRoleFilter, dirDeptFilter, dirStatusFilter]);

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ name: user.name, email: user.email, role: user.role, department: user.department, status: user.status });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: 'Viewer', department: 'IT', status: 'Active' });
    }
    setIsUserModalOpen(true);
  };

  const saveUser = () => {
    if (!userForm.name || !userForm.email) {
      addToast('Name and Email are required', 'error');
      return;
    }
    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userForm } : u));
      addToast('User updated');
    } else {
      setUsers(prev => [...prev, { id: `U00${prev.length + 1}`, ...userForm, lastActive: 'Never' }]);
      addToast('User added');
    }
    setIsUserModalOpen(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50';
      case 'Engineer': return 'bg-[#4A9EFF]/20 text-[#4A9EFF] border-[#4A9EFF]/50';
      case 'Technician': return 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/50';
      default: return 'bg-[#94A3B8]/20 text-[#94A3B8] border-[#94A3B8]/50';
    }
  };

  // --- SUB-MODULE 2: Permissions ---
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
  const [selectedPermUser, setSelectedPermUser] = useState('');

  const togglePermission = (role, feature) => {
    if (role === 'Admin') {
      addToast('Admin permissions cannot be modified', 'warning');
      return;
    }
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [feature]: !prev[role][feature] }
    }));
    addToast(`Updated ${role} permission for ${feature}`);
  };

  const effectivePerms = useMemo(() => {
    if (!selectedPermUser) return null;
    const user = users.find(u => u.id === selectedPermUser);
    return user ? permissions[user.role] : null;
  }, [selectedPermUser, users, permissions]);

  // --- SUB-MODULE 3: Activity Log ---
  const [logs] = useState(INITIAL_LOGS);
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [logResultFilter, setLogResultFilter] = useState('');
  const [logPage, setLogPage] = useState(1);
  const LOGS_PER_PAGE = 15;

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = l.user.toLowerCase().includes(logSearch.toLowerCase()) || l.target.toLowerCase().includes(logSearch.toLowerCase());
      const matchType = logTypeFilter ? l.action === logTypeFilter : true;
      const matchResult = logResultFilter ? l.result === logResultFilter : true;
      return matchSearch && matchType && matchResult;
    });
  }, [logs, logSearch, logTypeFilter, logResultFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(start, start + LOGS_PER_PAGE);
  }, [filteredLogs, logPage]);

  const totalLogPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);

  const getActionColor = (action) => {
    switch (action) {
      case 'Create': return 'text-[#22C55E]';
      case 'Edit': return 'text-[#4A9EFF]';
      case 'Delete': return 'text-[#EF4444]';
      case 'Export': return 'text-[#8B5CF6]';
      default: return 'text-[#94A3B8]';
    }
  };

  const exportLogsCSV = () => {
    const headers = 'ID,Timestamp,User,Action,Target,IP,Result\n';
    const rows = filteredLogs.map(l => `${l.id},${l.timestamp},${l.user},${l.action},"${l.target}",${l.ip},${l.result}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Logs exported to CSV');
  };

  // --- SUB-MODULE 4: Sessions ---
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);

  const terminateSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    addToast('Session terminated');
  };

  const terminateAll = () => {
    setSessions([]);
    addToast('All sessions terminated');
  };

  // --- SUB-MODULE 5: Notifications ---
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const [notifPrefs, setNotifPrefs] = useState({
    newMaterial: true,
    testLogged: false,
    calibrationDue: true,
    reportGen: false,
    newDevice: true
  });

  const toggleNotifPref = (key) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    addToast('Notification preferences updated');
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-y-auto bg-[#0F1923] text-[#F1F5F9]">
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between gap-4 min-w-[300px] ${t.type === 'error' ? 'bg-[#EF4444]' : t.type === 'warning' ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1A2634] p-4 rounded-lg border border-[#2D3F50] shadow-lg shrink-0">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">User Management & Access Control</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Manage users, roles, permissions, and system activity</p>
        
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
        {/* TAB 1: Directory */}
        {activeTab === 'Directory' && (
          <div className="bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg flex flex-col h-full">
            <div className="p-4 border-b border-[#2D3F50] flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4 w-full md:w-auto flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                  <input type="text" placeholder="Search users..." value={dirSearch} onChange={e => setDirSearch(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 pl-10 pr-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm" />
                </div>
                <select value={dirRoleFilter} onChange={e => setDirRoleFilter(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                  <option value="">All Roles</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={dirDeptFilter} onChange={e => setDirDeptFilter(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                  <option value="">All Depts</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={dirStatusFilter} onChange={e => setDirStatusFilter(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <button onClick={() => openUserModal()} className="bg-[#4A9EFF] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                <Plus size={16} /> Add User
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0F1923] text-[#94A3B8] sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Department</th>
                    <th className="p-4 font-medium">Last Active</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3F50]">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-[#94A3B8]">No users found.</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-[#2D3F50]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2D3F50] flex items-center justify-center text-[#F1F5F9] font-bold text-xs">
                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-[#F1F5F9]">{user.name}</div>
                            <div className="text-xs text-[#94A3B8]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getRoleColor(user.role)}`}>{user.role}</span>
                      </td>
                      <td className="p-4 text-[#F1F5F9]">{user.department}</td>
                      <td className="p-4 text-[#94A3B8]">{new Date(user.lastActive).toLocaleString() !== 'Invalid Date' ? new Date(user.lastActive).toLocaleString() : user.lastActive}</td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1 text-xs font-medium ${user.status === 'Active' ? 'text-[#22C55E]' : 'text-[#94A3B8]'}`}>
                          <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-[#22C55E]' : 'bg-[#94A3B8]'}`}></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => openUserModal(user)} className="text-[#4A9EFF] hover:text-blue-400 p-1"><Edit size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Permissions */}
        {activeTab === 'Permissions' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
            <div className="xl:col-span-3 bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#2D3F50]">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Role & Permissions Matrix</h2>
                <p className="text-sm text-[#94A3B8]">Configure what each role can access and perform.</p>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0F1923] text-[#94A3B8] sticky top-0 z-10">
                    <tr>
                      <th className="p-4 font-medium border-r border-[#2D3F50]">Feature / Action</th>
                      {ROLES.map(role => (
                        <th key={role} className="p-4 font-medium text-center border-r border-[#2D3F50] last:border-0">
                          <span className={`px-2 py-1 rounded text-xs font-bold border ${getRoleColor(role)}`}>{role}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D3F50]">
                    {FEATURES.map(feature => (
                      <tr key={feature} className="hover:bg-[#2D3F50]/30">
                        <td className="p-4 text-[#F1F5F9] font-medium border-r border-[#2D3F50]">{feature}</td>
                        {ROLES.map(role => {
                          const hasPerm = permissions[role][feature];
                          return (
                            <td key={`${role}-${feature}`} className="p-4 text-center border-r border-[#2D3F50] last:border-0">
                              <button 
                                onClick={() => togglePermission(role, feature)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${hasPerm ? 'bg-[#22C55E]' : 'bg-[#2D3F50]'}`}
                                disabled={role === 'Admin'}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${hasPerm ? 'translate-x-5' : 'translate-x-0'}`}></span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg p-6 flex flex-col">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-4">Effective Permissions</h2>
              <label className="block text-sm text-[#94A3B8] mb-2">Select User to Check</label>
              <select value={selectedPermUser} onChange={e => setSelectedPermUser(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] mb-6">
                <option value="">-- Select User --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>

              {effectivePerms ? (
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {FEATURES.map(f => (
                    <div key={f} className="flex justify-between items-center p-2 bg-[#0F1923] rounded border border-[#2D3F50]">
                      <span className="text-sm text-[#F1F5F9]">{f}</span>
                      {effectivePerms[f] ? <CheckCircle size={16} className="text-[#22C55E]" /> : <XCircle size={16} className="text-[#EF4444]" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#94A3B8] text-sm text-center">
                  Select a user to view their effective permissions based on their role.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Activity Log */}
        {activeTab === 'Activity Log' && (
          <div className="bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg flex flex-col h-full">
            <div className="p-4 border-b border-[#2D3F50] flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4 w-full md:w-auto flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                  <input type="text" placeholder="Search user or target..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 pl-10 pr-4 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm" />
                </div>
                <select value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                  <option value="">All Actions</option>
                  {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={logResultFilter} onChange={e => setLogResultFilter(e.target.value)} className="bg-[#0F1923] border border-[#2D3F50] rounded-md py-1.5 px-3 text-[#F1F5F9] focus:outline-none focus:border-[#4A9EFF] text-sm">
                  <option value="">All Results</option>
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <button onClick={exportLogsCSV} className="bg-[#2D3F50] text-white px-4 py-2 rounded-md hover:bg-[#4A9EFF] transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                <Download size={16} /> Export CSV
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#0F1923] text-[#94A3B8] sticky top-0 z-10">
                  <tr>
                    <th className="p-4 font-medium">Timestamp</th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Action</th>
                    <th className="p-4 font-medium">Target</th>
                    <th className="p-4 font-medium">IP Address</th>
                    <th className="p-4 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3F50]">
                  {paginatedLogs.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-[#94A3B8]">No logs found.</td></tr>
                  ) : paginatedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#2D3F50]/30 font-mono text-xs">
                      <td className="p-4 text-[#94A3B8]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="p-4 text-[#F1F5F9] font-sans font-medium">{log.user}</td>
                      <td className={`p-4 font-bold ${getActionColor(log.action)}`}>{log.action}</td>
                      <td className="p-4 text-[#F1F5F9]">{log.target}</td>
                      <td className="p-4 text-[#94A3B8]">{log.ip}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded font-sans font-bold ${log.result === 'Success' ? 'text-[#22C55E] bg-[#22C55E]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
                          {log.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-[#2D3F50] flex justify-between items-center bg-[#0F1923]">
              <span className="text-sm text-[#94A3B8]">Showing {(logPage - 1) * LOGS_PER_PAGE + 1} to {Math.min(logPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} entries</span>
              <div className="flex gap-2">
                <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} className="px-3 py-1 rounded bg-[#1A2634] border border-[#2D3F50] text-[#F1F5F9] disabled:opacity-50">Prev</button>
                <button onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))} disabled={logPage === totalLogPages || totalLogPages === 0} className="px-3 py-1 rounded bg-[#1A2634] border border-[#2D3F50] text-[#F1F5F9] disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Sessions */}
        {activeTab === 'Sessions' && (
          <div className="bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg flex flex-col h-full">
            <div className="p-4 border-b border-[#2D3F50] flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#F1F5F9]">Active Sessions</h2>
              <button onClick={terminateAll} className="bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/50 px-4 py-2 rounded-md hover:bg-[#EF4444] hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                <LogOut size={16} /> Force Logout All
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 gap-4">
                {sessions.length === 0 ? (
                  <div className="text-center text-[#94A3B8] py-8">No active sessions.</div>
                ) : sessions.map(session => (
                  <div key={session.id} className="bg-[#0F1923] border border-[#2D3F50] rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-10 h-10 rounded-full bg-[#4A9EFF]/20 text-[#4A9EFF] flex items-center justify-center">
                        <Monitor size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-[#F1F5F9]">{session.user}</div>
                        <div className="text-xs text-[#94A3B8] flex gap-3 mt-1">
                          <span>{session.browser}</span>
                          <span>•</span>
                          <span>{session.ip}</span>
                          <span>•</span>
                          <span>{session.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <div className="text-xs text-[#94A3B8]">Login Time</div>
                        <div className="text-sm text-[#F1F5F9]">{new Date(session.loginTime).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#94A3B8]">Duration</div>
                        <div className="text-sm text-[#22C55E] font-medium">{session.duration}</div>
                      </div>
                      <button onClick={() => terminateSession(session.id)} className="text-[#EF4444] hover:text-red-400 p-2 bg-[#1A2634] rounded border border-[#2D3F50] hover:border-[#EF4444]/50 transition-colors">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Notifications */}
        {activeTab === 'Notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="bg-[#1A2634] p-6 rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-1 h-fit">
              <h2 className="text-lg font-bold text-[#F1F5F9] border-b border-[#2D3F50] pb-2 mb-6">Alert Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'newMaterial', label: 'New Material Added' },
                  { key: 'testLogged', label: 'Test Result Logged' },
                  { key: 'calibrationDue', label: 'Equipment Calibration Due' },
                  { key: 'reportGen', label: 'Report Generated' },
                  { key: 'newDevice', label: 'Login from New Device' }
                ].map(pref => (
                  <div key={pref.key} className="flex justify-between items-center">
                    <span className="text-sm text-[#F1F5F9]">{pref.label}</span>
                    <button 
                      onClick={() => toggleNotifPref(pref.key)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${notifPrefs[pref.key] ? 'bg-[#4A9EFF]' : 'bg-[#2D3F50]'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${notifPrefs[pref.key] ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A2634] rounded-lg border border-[#2D3F50] shadow-lg lg:col-span-2 flex flex-col h-full">
              <div className="p-4 border-b border-[#2D3F50] flex justify-between items-center">
                <h2 className="text-lg font-bold text-[#F1F5F9]">Notification History</h2>
                <button onClick={markAllRead} className="text-[#4A9EFF] hover:text-blue-400 text-sm font-medium">Mark all as read</button>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {notifs.map(n => (
                  <div key={n.id} className={`p-4 rounded-lg border ${n.read ? 'bg-[#0F1923] border-[#2D3F50]' : 'bg-[#4A9EFF]/10 border-[#4A9EFF]/50'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-bold ${n.read ? 'text-[#94A3B8]' : 'text-[#4A9EFF]'}`}>{n.type}</span>
                      <span className="text-xs text-[#94A3B8] flex items-center gap-1"><Clock size={12} /> {new Date(n.time).toLocaleString()}</span>
                    </div>
                    <p className={`text-sm ${n.read ? 'text-[#94A3B8]' : 'text-[#F1F5F9]'}`}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A2634] border border-[#2D3F50] rounded-lg shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#F1F5F9]">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-[#94A3B8] hover:text-[#F1F5F9]"><X size={24} /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Full Name *</label>
                <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Email Address *</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Role</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#94A3B8] mb-1">Department</label>
                  <select value={userForm.department} onChange={e => setUserForm({...userForm, department: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1">Status</label>
                <select value={userForm.status} onChange={e => setUserForm({...userForm, status: e.target.value})} className="w-full bg-[#0F1923] border border-[#2D3F50] rounded-md py-2 px-3 text-[#F1F5F9] focus:border-[#4A9EFF] focus:outline-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 rounded-md text-[#94A3B8] hover:text-[#F1F5F9]">Cancel</button>
              <button onClick={saveUser} className="bg-[#4A9EFF] text-white px-6 py-2 rounded-md hover:bg-blue-600 font-medium">Save User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
