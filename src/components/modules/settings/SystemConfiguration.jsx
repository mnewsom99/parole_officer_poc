import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, AlertCircle, Settings } from 'lucide-react';

const SystemConfiguration = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({});

    // Define known settings with metadata for better UI
    const knownSettings = {
        'onboarding_due_delay': {
            label: 'Onboarding Due Delay (Days)',
            type: 'number',
            description: 'Number of days after release until onboarding tasks are due.'
        },
        'default_caseload_cap': {
            label: 'Default Caseload Cap',
            type: 'number',
            description: 'Maximum number of offenders per officer (warning threshold only).'
        },
        'system_email': {
            label: 'System Notification Email',
            type: 'email',
            description: 'Email address used for sending system notifications.'
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('http://localhost:8000/settings/system');
            const settingsData = response.data;
            setSettings(settingsData);

            // Map array to object for form
            const form = {};
            settingsData.forEach(s => {
                form[s.key] = s.value;
            });
            setFormData(form);
        } catch (error) {
            console.error("Error fetching system settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key) => {
        try {
            await axios.put(`http://localhost:8000/settings/system/${key}`, {
                value: String(formData[key])
            });
            alert(`Saved setting: ${knownSettings[key]?.label || key}`);
        } catch (error) {
            console.error("Error saving setting:", error);
            alert("Failed to save setting");
        }
    };

    if (loading) return <div>Loading configuration...</div>;

    // Helper to get all keys (both from DB and known definitions)
    const allKeys = Array.from(new Set([
        ...Object.keys(knownSettings),
        ...settings.map(s => s.key)
    ]));

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">System Configuration</h3>
                    <p className="text-sm text-slate-500">Manage global application parameters.</p>
                </div>
            </div>

            <div className="space-y-6">
                {allKeys.map(key => {
                    const config = knownSettings[key] || { label: key, type: 'text', description: 'Custom setting' };
                    const value = formData[key] || '';

                    return (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-bold text-slate-700 mb-1">{config.label}</label>
                                <p className="text-sm text-slate-500 mb-3">{config.description}</p>
                                <input
                                    type={config.type}
                                    className="w-full max-w-md p-2 border border-slate-200 rounded-lg text-sm"
                                    value={value}
                                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    placeholder={`Enter ${config.label}`}
                                />
                            </div>
                            <div className="flex items-end justify-end">
                                <button
                                    onClick={() => handleSave(key)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Save
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                    <strong>Note:</strong> Changes to system settings may require a server restart or cache clear to take immediate effect for all users.
                </p>
            </div>
        </div>
    );
};

export default SystemConfiguration;
