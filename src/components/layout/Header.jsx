import React, { useState } from 'react';
import { Bell, Search, ChevronDown, User, LogOut } from 'lucide-react';

const Header = ({ onLogout }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4 w-96">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search offenders, case numbers..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-2 border-b border-slate-50">
                                <h3 className="font-semibold text-slate-800">Notifications</h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">UA Failure: John Doe</p>
                                            <p className="text-xs text-slate-500 mt-0.5">2 hours ago • High Risk</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500 shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">Overdue Assessment</p>
                                            <p className="text-xs text-slate-500 mt-0.5">5 hours ago • Sarah Smith</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-2 text-center border-t border-slate-50">
                                <button className="text-xs font-medium text-blue-600 hover:text-blue-700">Mark all as read</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-lg transition-colors group"
                    >
                        <div className="w-8 h-8 bg-navy-100 text-navy-700 rounded-full flex items-center justify-center border border-navy-200">
                            <User size={16} />
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-semibold text-slate-700 group-hover:text-navy-700">Officer Anderson</p>
                            <p className="text-xs text-slate-500">Badge #4922</p>
                        </div>
                        <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
                    </button>

                    {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
