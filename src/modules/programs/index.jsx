import React, { useState } from 'react';
import {
    LayoutDashboard, Building2, BookOpen, Users,
    UserCheck, ClipboardList, Clock, GraduationCap, Trophy
} from 'lucide-react';
import ProviderManager from './components/ProviderManager';
import ProgramCatalog from './components/ProgramCatalog';
import ProgramOverview from './components/ProgramOverview';

const ProgramModule = () => {
    const [activeTab, setActiveTab] = useState('catalog');

    const renderContent = () => {
        switch (activeTab) {
            case 'providers':
                return <ProviderManager />;
            case 'catalog':
                return <ProgramCatalog />;
            case 'dashboard':
            default:
                return <ProgramOverview />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Banner Section */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl p-6 shadow-xl relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Program Management</h2>
                            <p className="text-indigo-100/80">Manage providers, course catalogs, and track offender enrollments.</p>
                        </div>
                    </div>

                    {/* Stats Row (Inside Banner) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        {/* 1. Offenders in Programs (Was Active Programs) */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Users size={12} /> Offenders in Programs
                            </div>
                            <div className="text-2xl font-bold">142</div>
                        </div>
                        {/* 2. Total Providers */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Building2 size={12} /> Total Providers
                            </div>
                            <div className="text-2xl font-bold">24</div>
                        </div>
                        {/* 3. Enrollments */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <UserCheck size={12} /> Enrollments
                            </div>
                            <div className="text-2xl font-bold">315</div>
                        </div>
                        {/* 4. Pending */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Clock size={12} /> Pending
                            </div>
                            <div className="text-2xl font-bold text-yellow-300">18</div>
                        </div>
                        {/* 5. Completions */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <GraduationCap size={12} /> Completions
                            </div>
                            <div className="text-2xl font-bold">89</div>
                        </div>
                        {/* 6. Success Rate */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10 flex flex-col items-center justify-center">
                            <div className="flex items-center justify-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Trophy size={12} /> Success Rate
                            </div>
                            <div className="text-2xl font-bold">78%</div>
                        </div>
                    </div>

                    {/* Physical Folder Tabs */}
                    <div className="flex gap-0.5 overflow-x-auto no-scrollbar pt-6 -mx-6 px-6 relative top-[25px]">
                        {[
                            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                            { id: 'catalog', label: 'Program Catalog', icon: BookOpen },
                            { id: 'providers', label: 'Providers', icon: Building2 },
                        ].map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        group flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all rounded-t-xl relative whitespace-nowrap
                                        ${isActive
                                            ? 'bg-white text-violet-700 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-10'
                                            : 'bg-white/10 text-indigo-100 hover:bg-white/20 hover:text-white'
                                        }
                                    `}
                                >
                                    <tab.icon size={16} className={isActive ? 'text-violet-600' : 'text-indigo-200 group-hover:text-white transition-colors'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Container - Unified White Card */}
            <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
                {/* Dynamic Content */}
                {renderContent()}
            </div>
        </div>
    );
};

export default ProgramModule;
