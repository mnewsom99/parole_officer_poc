import React from 'react';
import { Users, Calendar, FileText, Settings, Shield, CheckSquare, Briefcase, LayoutDashboard } from 'lucide-react';

import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();
    const navItems = [
        { id: 'caseload', label: 'My Caseload', path: '/caseload', icon: Users },
        { id: 'tasks', label: 'Tasks', path: '/tasks', icon: CheckSquare },
        { id: 'calendar', label: 'Calendar', path: '/calendar', icon: Calendar },
        { id: 'office', label: 'Office Module', path: '/office', icon: Briefcase },
        { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { id: 'workflows', label: 'Workflows', path: '/workflows', icon: FileText },
        { id: 'reports', label: 'Reports', path: '/reports', icon: FileText },
        { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-navy-900 text-white flex flex-col h-screen fixed left-0 top-0 z-20 shadow-xl">
            <div className="p-6 flex items-center gap-3 border-b border-navy-800">
                <Shield className="w-8 h-8 text-blue-400" />
                <div>
                    <h1 className="font-bold text-lg tracking-wide">PAROLE<span className="text-blue-400">OS</span></h1>
                    <p className="text-xs text-navy-300">Field Officer Dashboard</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-navy-100 hover:bg-navy-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-navy-800">
                <div className="bg-navy-800 rounded-lg p-4">
                    <p className="text-xs text-navy-400 uppercase font-bold mb-2">System Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-navy-200">Online & Synced</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
