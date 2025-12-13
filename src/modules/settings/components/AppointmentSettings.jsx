import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useUser } from '../../../core/context/UserContext';

const AppointmentSettings = () => {
    const { appointmentSettings, updateAppointmentType, addAppointmentType, removeAppointmentType } = useUser();
    const [apptLocations, setApptLocations] = useState([{ name: 'Field Office' }, { name: 'Home' }]);
    const [newApptType, setNewApptType] = useState('');
    const [newApptColor, setNewApptColor] = useState('blue');
    const [newApptLocation, setNewApptLocation] = useState('');

    const APPOINTMENT_COLOR_OPTIONS = [
        { label: 'Blue', value: 'blue' },
        { label: 'Purple', value: 'purple' },
        { label: 'Red', value: 'red' },
        { label: 'Green', value: 'green' },
        { label: 'Yellow', value: 'yellow' },
        { label: 'Gray', value: 'slate' },
    ];

    const handleAddApptType = () => {
        if (newApptType) {
            addAppointmentType(newApptType, newApptColor);
            setNewApptType('');
        }
    };

    const handleRemoveApptType = (name) => {
        removeAppointmentType(name);
    };

    const handleAddApptLocation = () => {
        if (newApptLocation) {
            setApptLocations([...apptLocations, { name: newApptLocation }]);
            setNewApptLocation('');
        }
    };

    const handleRemoveApptLocation = (name) => {
        setApptLocations(apptLocations.filter(l => l.name !== name));
    };

    return (
        <div className="space-y-6">
            {/* Appointment Types */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Appointment Configuration</h3>
                <p className="text-sm text-slate-500 mb-6">Manage the standard types of appointments available for scheduling.</p>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newApptType}
                        onChange={(e) => setNewApptType(e.target.value)}
                        placeholder="Enter new appointment type..."
                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                    />
                    <select
                        value={newApptColor}
                        onChange={(e) => setNewApptColor(e.target.value)}
                        className="p-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                        {APPOINTMENT_COLOR_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddApptType}
                        disabled={!newApptType}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                </div>

                <div className="space-y-2">
                    {appointmentSettings?.types.map((type, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">{type.name}</span>
                            <div className="flex items-center gap-2">
                                <select
                                    value={type.color}
                                    onChange={(e) => updateAppointmentType(type.name, e.target.value)}
                                    className="p-1 border border-slate-200 rounded text-xs bg-white"
                                >
                                    {APPOINTMENT_COLOR_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleRemoveApptType(type.name)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    title="Remove"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {appointmentSettings?.types.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-4">No appointment types configured.</p>
                    )}
                </div>
            </div>

            {/* Appointment Locations */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Location Presets</h3>
                <p className="text-sm text-slate-500 mb-6">Manage common locations used for appointments.</p>

                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newApptLocation}
                        onChange={(e) => setNewApptLocation(e.target.value)}
                        placeholder="Enter new location preset..."
                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                    />
                    <button
                        onClick={handleAddApptLocation}
                        disabled={!newApptLocation}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add
                    </button>
                </div>

                <div className="space-y-2">
                    {apptLocations.map((loc, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">{loc.name}</span>
                            <button
                                onClick={() => handleRemoveApptLocation(loc.name)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                title="Remove"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {apptLocations.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-4">No locations configured.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentSettings;
