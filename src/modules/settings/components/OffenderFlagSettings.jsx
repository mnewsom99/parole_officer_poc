import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useUser } from '../../../core/context/UserContext';

const NOTE_COLOR_OPTIONS = [
    { label: 'Gray', value: 'bg-slate-100 text-slate-700' },
    { label: 'Blue', value: 'bg-blue-100 text-blue-700' },
    { label: 'Green', value: 'bg-green-100 text-green-700' },
    { label: 'Red', value: 'bg-red-100 text-red-700' },
    { label: 'Yellow', value: 'bg-yellow-100 text-yellow-700' },
    { label: 'Purple', value: 'bg-purple-100 text-purple-700' },
    { label: 'Cyan', value: 'bg-cyan-100 text-cyan-700' },
];

const OffenderFlagSettings = () => {
    const { offenderFlagSettings, addOffenderFlagType, removeOffenderFlagType, updateOffenderFlagType } = useUser();
    const [newFlagName, setNewFlagName] = useState('');
    const [newFlagColor, setNewFlagColor] = useState('bg-slate-100 text-slate-700');

    const handleAddFlag = () => {
        if (newFlagName) {
            addOffenderFlagType(newFlagName, newFlagColor);
            setNewFlagName('');
        }
    };

    const handleRemoveFlag = (name) => {
        removeOffenderFlagType(name);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Offender Flags & Classifications</h3>
            <p className="text-sm text-slate-500 mb-6">Manage the special status flags available for offender profiles (e.g. SMI, Veteran, Sex Offender).</p>

            <div className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newFlagName}
                    onChange={(e) => setNewFlagName(e.target.value)}
                    placeholder="Enter new flag name..."
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                />
                <select
                    value={newFlagColor}
                    onChange={(e) => setNewFlagColor(e.target.value)}
                    className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                    {NOTE_COLOR_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <button
                    onClick={handleAddFlag}
                    disabled={!newFlagName}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add
                </button>
            </div>

            <div className="space-y-3">
                {offenderFlagSettings?.types?.map((type, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <input
                            type="text"
                            value={type.name}
                            onChange={(e) => {
                                const newTypes = [...offenderFlagSettings.types];
                                newTypes[index].name = e.target.value;
                                updateOffenderFlagType(newTypes);
                            }}
                            className="flex-1 p-2 border border-slate-200 rounded text-sm"
                        />
                        <select
                            value={type.color}
                            onChange={(e) => {
                                const newTypes = [...offenderFlagSettings.types];
                                newTypes[index].color = e.target.value;
                                updateOffenderFlagType(newTypes);
                            }}
                            className="p-2 border border-slate-200 rounded text-sm bg-white w-32"
                        >
                            {NOTE_COLOR_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase border flex items-center justify-center ${type.color.replace('bg-slate-100', 'bg-slate-100 border-slate-200').replace('bg-blue-100', 'bg-blue-100 border-blue-200').replace('bg-green-100', 'bg-green-100 border-green-200').replace('bg-purple-100', 'bg-purple-100 border-purple-200').replace('bg-red-100', 'bg-red-100 border-red-200').replace('bg-yellow-100', 'bg-yellow-100 border-yellow-200').replace('bg-cyan-100', 'bg-cyan-100 border-cyan-200').replace('bg-orange-100', 'bg-orange-100 border-orange-200')}`}>
                            {type.name}
                        </div>

                        <button
                            onClick={() => handleRemoveFlag(type.name)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                            title="Remove Flag"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {(!offenderFlagSettings?.types || offenderFlagSettings?.types.length === 0) && (
                    <p className="text-center text-slate-400 text-sm py-4">No flags configured.</p>
                )}
            </div>
        </div>
    );
};

export default OffenderFlagSettings;
