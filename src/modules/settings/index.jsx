import React, { useState } from 'react';
import { User, Shield, Database, FileText, List, Home, Calendar, Building, Map, Flag, Settings } from 'lucide-react';
import SchemaViewer from './components/SchemaViewer';
import SystemConfiguration from './components/SystemConfiguration';
import UserManagement from './components/UserManagement';
import TerritoryManagement from './components/TerritoryManagement';
import TaskCategorySettings from './components/TaskCategorySettings';
import RiskSettings from '../../components/admin/RiskSettings';
import { useUser } from '../../core/context/UserContext';

// New Sub-Components
import ProfileSettings from './components/ProfileSettings';
import SecuritySettings from './components/SecuritySettings';
import LocationSettings from './components/LocationSettings';
import AppointmentSettings from './components/AppointmentSettings';
import OffenderFlagSettings from './components/OffenderFlagSettings';
import CaseNoteSettings from './components/CaseNoteSettings';
import HousingTypeSettings from './components/HousingTypeSettings';

const SettingsModule = () => {
    const { hasPermission, currentUser } = useUser();
    const [activeView, setActiveView] = useState('profile');

    const renderContent = () => {
        switch (activeView) {
            case 'data':
                return <SchemaViewer />;
            case 'users':
                return <UserManagement />;
            case 'system':
                return <SystemConfiguration />;
            case 'risk':
                return <RiskSettings />;
            case 'tasks':
                return <TaskCategorySettings />;
            case 'housing':
                return <HousingTypeSettings />;
            case 'security':
                return <SecuritySettings />;
            case 'territory':
                return <TerritoryManagement />;
            case 'locations':
                return <LocationSettings />;
            case 'appointments':
                return <AppointmentSettings />;
            case 'flags':
                return <OffenderFlagSettings />;
            case 'notes':
                return <CaseNoteSettings />;
            case 'profile':
            default:
                return <ProfileSettings currentUser={currentUser} hasPermission={hasPermission} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sidebar Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                    <div className="p-4 border-b border-slate-100 font-medium text-slate-800">General</div>
                    <nav className="p-2 space-y-1">
                        <button
                            onClick={() => setActiveView('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <User className="w-4 h-4" />
                            My Profile
                        </button>
                        <button
                            onClick={() => setActiveView('security')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'security' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Shield className="w-4 h-4" />
                            Security
                        </button>

                        {hasPermission('manage_users') && (
                            <button
                                onClick={() => setActiveView('users')}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'users' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <User className="w-4 h-4" />
                                Users Management
                            </button>
                        )}

                        {hasPermission('manage_settings') && (
                            <button
                                onClick={() => setActiveView('system')}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'system' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Settings className="w-4 h-4" />
                                System Configuration
                            </button>
                        )}

                        {hasPermission('manage_settings') && (
                            <button
                                onClick={() => setActiveView('data')}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'data' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Database className="w-4 h-4" />
                                Database Schema
                            </button>
                        )}

                        {hasPermission('manage_settings') && (
                            <button
                                onClick={() => setActiveView('risk')}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'risk' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Shield className="w-4 h-4" />
                                Risk Assessment
                            </button>
                        )}

                        {hasPermission('manage_settings') && (
                            <button
                                onClick={() => setActiveView('tasks')}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'tasks' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <List className="w-4 h-4" />
                                Task Configuration
                            </button>
                        )}

                        {hasPermission('manage_settings') && (
                            <>
                                <div className="p-4 border-t border-slate-100 font-medium text-slate-800 mt-2">Organization</div>
                                <button
                                    onClick={() => setActiveView('appointments')}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'appointments' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Appointments
                                </button>
                                <button
                                    onClick={() => setActiveView('locations')}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'locations' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Building className="w-4 h-4" />
                                    Locations
                                </button>
                                <button
                                    onClick={() => setActiveView('territory')}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'territory' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Map className="w-4 h-4" />
                                    Zip Code Assignments
                                </button>
                                <button
                                    onClick={() => setActiveView('notes')}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'notes' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <FileText className="w-4 h-4" />
                                    Case Notes
                                </button>
                                <button
                                    onClick={() => setActiveView('flags')}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'flags' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Flag className="w-4 h-4" />
                                    Offender Flags
                                </button>
                                <button
                                    onClick={() => setActiveView('housing')}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'housing' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <Home className="w-4 h-4" />
                                    Housing Types
                                </button>
                            </>
                        )}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {renderContent()}
                </div>
            </div>
        </div >
    );
};

export default SettingsModule;
