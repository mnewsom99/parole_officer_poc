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

const CaseNoteSettings = () => {
    const { caseNoteSettings, addCaseNoteType, removeCaseNoteType, updateCaseNoteType } = useUser();
    const [newType, setNewType] = useState('');
    const [newColor, setNewColor] = useState('bg-slate-100 text-slate-700');

    const handleAddType = () => {
        if (newType) {
            addCaseNoteType(newType, newColor);
            setNewType('');
        }
    };

    const handleRemoveType = (name) => {
        removeCaseNoteType(name);
    };

    return (
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
                    {NOTE_COLOR_OPTIONS.map(opt => (
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
                {caseNoteSettings?.types?.map((type, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <input
                            type="text"
                            value={type.name}
                            onChange={(e) => {
                                const newTypes = [...caseNoteSettings.types];
                                newTypes[index].name = e.target.value;
                                updateCaseNoteType(newTypes);
                            }}
                            className="flex-1 p-2 border border-slate-200 rounded text-sm"
                        />
                        <select
                            value={type.color}
                            onChange={(e) => {
                                const newTypes = [...caseNoteSettings.types];
                                newTypes[index].color = e.target.value;
                                updateCaseNoteType(newTypes);
                            }}
                            className="p-2 border border-slate-200 rounded text-sm bg-white w-32"
                        >
                            {NOTE_COLOR_OPTIONS.map(opt => (
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
                {(!caseNoteSettings?.types || caseNoteSettings.types.length === 0) && (
                    <p className="text-center text-slate-400 text-sm py-4">No note types configured.</p>
                )}
            </div>
        </div>
    );
};

export default CaseNoteSettings;
