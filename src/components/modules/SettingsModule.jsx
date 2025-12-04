import React, { useState } from 'react';
import { User, Bell, Shield, Globe, Moon, Save, Database } from 'lucide-react';
import SchemaViewer from './SchemaViewer';

const SettingsModule = () => {
    const [activeView, setActiveView] = useState('profile');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
                    <p className="text-slate-500">Manage your account and preferences</p>
                </div>
                <button className="flex items-center gap-2 bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-navy-900/20 transition-all">
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
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
                            Profile
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <Bell className="w-4 h-4" />
                            Notifications
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                            <Shield className="w-4 h-4" />
                            Security
                        </button>
                        <div className="my-2 border-t border-slate-100"></div>
                        <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase">System</div>
                        <button
                            onClick={() => setActiveView('data')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'data' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Database className="w-4 h-4" />
                            Data Architecture
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    {activeView === 'data' ? (
                        <SchemaViewer />
                    ) : (
                        <>
                            {/* Profile Section */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Profile Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 mb-6">
                                        <img
                                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            alt="Profile"
                                            className="w-20 h-20 rounded-full border-4 border-slate-50"
                                        />
                                        <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Change Photo</button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                            <input type="text" defaultValue="Officer" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                            <input type="text" defaultValue="Smith" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Badge ID</label>
                                            <input type="text" defaultValue="PO-8821" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-slate-500 cursor-not-allowed" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                            <input type="email" defaultValue="officer.smith@dept.gov" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preferences */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Preferences</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-800">Email Notifications</p>
                                            <p className="text-sm text-slate-500">Receive daily summaries and alerts</p>
                                        </div>
                                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer bg-blue-600">
                                            <span className="absolute left-6 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform"></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-800">Dark Mode</p>
                                            <p className="text-sm text-slate-500">Use dark theme for the interface</p>
                                        </div>
                                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer bg-slate-200">
                                            <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModule;
