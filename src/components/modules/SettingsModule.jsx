import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Globe, Moon, Save, Database, Plus, Trash2, FileText } from 'lucide-react';
import axios from 'axios';
import SchemaViewer from './SchemaViewer';

const SettingsModule = () => {
    const [activeView, setActiveView] = useState('profile');
    const [noteTypes, setNoteTypes] = useState([]);
    const [newType, setNewType] = useState('');
    const [newColor, setNewColor] = useState('bg-slate-100 text-slate-700');

    const colorOptions = [
        { label: 'Gray', value: 'bg-slate-100 text-slate-700' },
        { label: 'Blue', value: 'bg-blue-100 text-blue-700' },
        { label: 'Green', value: 'bg-green-100 text-green-700' },
        { label: 'Red', value: 'bg-red-100 text-red-700' },
        { label: 'Yellow', value: 'bg-yellow-100 text-yellow-700' },
        { label: 'Purple', value: 'bg-purple-100 text-purple-700' },
    ];

    useEffect(() => {
        fetchNoteTypes();
    }, []);

    const fetchNoteTypes = async () => {
        try {
            const response = await axios.get('http://localhost:8000/settings/note-types');
            setNoteTypes(response.data);
        } catch (error) {
            console.error("Error fetching note types:", error);
        }
    };

    const handleAddType = () => {
        if (newType && !noteTypes.some(t => t.name === newType)) {
            setNoteTypes([...noteTypes, { name: newType, color: newColor }]);
            setNewType('');
            setNewColor('bg-slate-100 text-slate-700');
        }
    };

    const handleRemoveType = (typeName) => {
        if (window.confirm("Removing this type will remove the color coding from any existing notes of this type. Are you sure?")) {
            setNoteTypes(noteTypes.filter(t => t.name !== typeName));
        }
    };

    const handleSaveSettings = async () => {
        try {
            await axios.put('http://localhost:8000/settings/note-types', { types: noteTypes });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Failed to save settings.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
                    <p className="text-slate-500">Manage your account and preferences</p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    className="flex items-center gap-2 bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-navy-900/20 transition-all"
                >
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
                            Security
                        </button>
                        <button
                            onClick={() => setActiveView('notes')}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeView === 'notes' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <FileText className="w-4 h-4" />
                            Case Notes
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
                    ) : activeView === 'notes' ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Case Note Configuration</h3>
                            <p className="text-sm text-slate-500 mb-6">Manage the types of case notes available when documenting offender interactions.</p>

                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                    placeholder="Enter new note type..."
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                                />
                                <select
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                >
                                    {colorOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddType}
                                    disabled={!newType}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>

                            <div className="space-y-3">
                                {noteTypes.map((type, index) => (
                                    <div key={index} className="flex gap-2 items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <input
                                            type="text"
                                            value={type.name}
                                            onChange={(e) => {
                                                const newTypes = [...noteTypes];
                                                newTypes[index].name = e.target.value;
                                                setNoteTypes(newTypes);
                                            }}
                                            className="flex-1 p-2 border border-slate-200 rounded text-sm"
                                        />
                                        <select
                                            value={type.color}
                                            onChange={(e) => {
                                                const newTypes = [...noteTypes];
                                                newTypes[index].color = e.target.value;
                                                setNoteTypes(newTypes);
                                            }}
                                            className="p-2 border border-slate-200 rounded text-sm bg-white w-32"
                                        >
                                            {colorOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        <div className={`w-8 h-8 rounded border border-slate-200 ${type.color.split(' ').find(c => c.startsWith('bg-'))}`}></div>
                                        <button
                                            onClick={() => handleRemoveType(type.name)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                            title="Remove Type"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {noteTypes.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-4">No note types configured.</p>
                                )}
                            </div>
                        </div>
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
