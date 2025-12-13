import React from 'react';
import { Users, Calendar, FileText, Settings, Shield, CheckSquare, Briefcase, LayoutDashboard, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();
    const [systemStatus, setSystemStatus] = React.useState('checking'); // checking, online, offline

    // Check health every 30 seconds
    React.useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch('http://localhost:8000/health');
                if (res.ok) {
                    setSystemStatus('online');
                } else {
                    setSystemStatus('offline');
                }
            } catch (e) {
                setSystemStatus('offline');
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { id: 'caseload', label: 'My Caseload', path: '/caseload', icon: Users },
        { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare },
        { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar },
        { id: 'office', label: 'Office Module', path: '/office', icon: Briefcase },
        { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { id: 'automations', label: 'Automations', path: '/automations', icon: FileText },
        { id: 'assessments', label: 'Assessments (Admin)', path: '/assessments', icon: Shield },
        { id: 'programs', label: 'Programs', path: '/programs', icon: BookOpen },
        { id: 'reports', label: 'Reports', path: '/reports', icon: FileText },
        { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
        { id: 'field-mode', label: 'Field Mode (Mobile)', path: '/field-mode', icon: Briefcase },
    ];

    return (
        <aside className="w-64 bg-white/70 backdrop-blur-xl border-r border-white/50 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-xl transition-all duration-300">
            <div className="p-6 flex items-center gap-3 border-b border-indigo-100/50">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-lg shadow-indigo-200">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="font-bold font-display text-lg tracking-wide text-slate-800">PAROLE<span className="text-indigo-600">OS</span></h1>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Field Officer</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${isActive
                                ? 'text-white shadow-lg shadow-indigo-200 scale-[1.02]'
                                : 'text-slate-500 hover:bg-white/60 hover:text-indigo-600'
                                }`}
                        >
                            {/* Active Gradient Background */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 z-0"></div>
                            )}

                            {/* Hover Gradient Border Effect (Optional, simulated with box-shadow or inset) */}

                            <Icon size={20} className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                            <span className={`font-medium relative z-10 ${isActive ? 'text-white' : ''}`}>{item.label}</span>

                            {/* Active Indicator Dot */}
                            {isActive && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-sm z-10 animate-pulse"></div>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-indigo-100/30">
                <div className="bg-white/40 rounded-xl p-4 border border-white/40 shadow-sm backdrop-blur-md">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-wider">System Status</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm animate-pulse ${systemStatus === 'online' ? 'bg-emerald-500' :
                            systemStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
                            }`}></div>
                        <span className="text-xs font-medium text-slate-600">
                            {systemStatus === 'online' ? 'Online & Synced' :
                                systemStatus === 'offline' ? 'System Offline' : 'Checking...'}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
