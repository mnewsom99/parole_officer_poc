import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import axios from 'axios';

const LocationSettings = () => {
    const [locations, setLocations] = useState([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [locationForm, setLocationForm] = useState({
        name: '', address: '', phone: '', fax: '', zip_code: '', type: 'Field Office'
    });

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await axios.get('http://localhost:8000/locations');
                setLocations(response.data || []);
            } catch (error) {
                console.error("Error fetching locations:", error);
            }
        };
        fetchLocations();
    }, []);

    const openLocationModal = (loc = null) => {
        if (loc) {
            setEditingLocation(loc);
            setLocationForm(loc);
        } else {
            setEditingLocation(null);
            setLocationForm({ name: '', address: '', phone: '', fax: '', zip_code: '', type: 'Field Office' });
        }
        setShowLocationModal(true);
    };

    const handleSaveLocation = async () => {
        // Mock save for now - in production this would be an API call
        if (editingLocation) {
            setLocations(locations.map(l => l.location_id === editingLocation.location_id ? { ...l, ...locationForm } : l));
        } else {
            setLocations([...locations, { ...locationForm, location_id: crypto.randomUUID(), territories: [] }]);
        }
        setShowLocationModal(false);
    };

    const handleRemoveSystemLocation = (id) => {
        setLocations(locations.filter(l => l.location_id !== id));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Office Locations</h3>
                    <p className="text-sm text-slate-500">Manage the official office locations for the agency.</p>
                </div>
                <button
                    onClick={() => openLocationModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Location
                </button>
            </div>

            <div className="space-y-3">
                {locations.map(loc => (
                    <div key={loc.location_id} className="flex justify-between items-center p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                        <div>
                            <div className="font-bold text-slate-800">{loc.name}</div>
                            <div className="text-sm text-slate-500">{loc.address} ({loc.type})</div>
                            <div className="flex gap-4 mt-1 text-xs text-slate-400">
                                {loc.phone && <span>Ph: {loc.phone}</span>}
                                {loc.fax && <span>Fax: {loc.fax}</span>}
                                {loc.zip_code && <span>Zip: {loc.zip_code}</span>}
                            </div>
                            {loc.territories && loc.territories.length > 0 && (
                                <div className="mt-2 text-xs text-blue-600 font-medium">
                                    Territories: {loc.territories.map(t => t.zip_code).join(', ')}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => openLocationModal(loc)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => handleRemoveSystemLocation(loc.location_id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                {locations.length === 0 && <p className="text-slate-500 text-sm">No locations found.</p>}
            </div>

            {/* Location Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">{editingLocation ? 'Edit Location' : 'Add New Location'}</h3>
                            <button onClick={() => setShowLocationModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Office Name</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    value={locationForm.name}
                                    onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                                    placeholder="e.g. North District Office"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    value={locationForm.address}
                                    onChange={e => setLocationForm({ ...locationForm, address: e.target.value })}
                                    placeholder="123 Main St, City, State"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={locationForm.phone}
                                        onChange={e => setLocationForm({ ...locationForm, phone: e.target.value })}
                                        placeholder="(555) 555-5555"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fax</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={locationForm.fax}
                                        onChange={e => setLocationForm({ ...locationForm, fax: e.target.value })}
                                        placeholder="(555) 555-5556"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Zip Code</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={locationForm.zip_code}
                                        onChange={e => setLocationForm({ ...locationForm, zip_code: e.target.value })}
                                        placeholder="e.g. 85001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={locationForm.type}
                                        onChange={e => setLocationForm({ ...locationForm, type: e.target.value })}
                                    >
                                        <option>Field Office</option>
                                        <option>HQ</option>
                                        <option>Satellite</option>
                                    </select>
                                </div>
                            </div>
                            {editingLocation && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <p className="text-xs text-blue-800 font-medium mb-1">Assigned Territories:</p>
                                    <p className="text-xs text-blue-600">
                                        {editingLocation.territories && editingLocation.territories.length > 0
                                            ? editingLocation.territories.map(t => t.zip_code).join(', ')
                                            : 'No territories assigned. Manage in Territory tab.'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setShowLocationModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLocation}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Save Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSettings;
