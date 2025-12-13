import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Map, Building, Edit2, ArrowUpDown } from 'lucide-react';

const TerritoryManagement = () => {
    const [territories, setTerritories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [specialAssignments, setSpecialAssignments] = useState([]);

    // UI State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null); // For Special Assignments (UUID), Zip is in form
    const [activeTab, setActiveTab] = useState('geographic');
    const [sortConfig, setSortConfig] = useState({ key: 'zip_code', direction: 'asc' });

    const [form, setForm] = useState({
        zip_code: '',
        assigned_location_id: '',
        assigned_officer_ids: [],
        region_name: '',
        // Special fields
        type: 'Facility',
        name: '',
        address: '',
        priority: 1
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [terrRes, locRes, offRes, specRes] = await Promise.all([
                axios.get('http://localhost:8000/territories'),
                axios.get('http://localhost:8000/locations'),
                axios.get('http://localhost:8000/officers'),
                axios.get('http://localhost:8000/special-assignments')
            ]);
            setTerritories(terrRes.data);
            setLocations(locRes.data);
            setOfficers(offRes.data);
            setSpecialAssignments(specRes.data);
        } catch (error) {
            console.error("Error fetching territory data:", error);
        }
    };

    const handleDelete = async (zip) => {
        if (!confirm('Are you sure you want to delete this territory assignment?')) return;
        try {
            await axios.delete(`http://localhost:8000/territories/${zip}`);
            fetchData();
        } catch (error) {
            console.error("Error deleting territory:", error);
        }
    };

    const handleDeleteSpecial = async (id) => {
        if (!confirm('Are you sure you want to remove this verified assignment?')) return;
        try {
            await axios.delete(`http://localhost:8000/special-assignments/${id}`);
            fetchData();
        } catch (error) {
            console.error("Error deleting special assignment:", error);
        }
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        if (activeTab === 'geographic') {
            setForm({
                zip_code: item.zip_code,
                assigned_location_id: item.assigned_location_id || '',
                assigned_officer_ids: item.officers ? item.officers.map(o => o.officer_id) : [],
                region_name: item.region_name || '',
                // Reset special fields
                type: 'Facility', name: '', address: '', priority: 1
            });
        } else {
            // Special
            setEditingId(item.assignment_id);
            setForm({
                zip_code: item.zip_code || '',
                assigned_location_id: '',
                assigned_officer_ids: item.officer ? [item.officer.officer_id] : [],
                region_name: '',
                type: item.type,
                name: item.name,
                address: item.address || '',
                priority: item.priority || 1
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setEditingId(null);
        setForm({
            zip_code: '',
            assigned_location_id: '',
            assigned_officer_ids: [],
            region_name: '',
            type: 'Facility',
            name: '',
            address: '',
            priority: 1
        });
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedTerritories = () => {
        const sorted = [...territories];
        sorted.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle nested checks
            if (sortConfig.key === 'location') {
                aValue = a.location ? a.location.name : '';
                bValue = b.location ? b.location.name : '';
            }
            if (sortConfig.key === 'officers') {
                // Approximate sort by first officer's name
                aValue = a.officers && a.officers.length > 0 ? a.officers[0].last_name : '';
                bValue = b.officers && b.officers.length > 0 ? b.officers[0].last_name : '';
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sorted;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'geographic') {
                // Geographic uses POST for Upsert based on Zip Code (PK)
                await axios.post('http://localhost:8000/territories', {
                    zip_code: form.zip_code,
                    assigned_location_id: form.assigned_location_id,
                    assigned_officer_ids: form.assigned_officer_ids || [],
                    region_name: locations.find(l => l.location_id === form.assigned_location_id)?.name || 'Assigned Region'
                });
            } else {
                // Special Assignments
                const payload = {
                    type: form.type,
                    name: form.name,
                    address: form.address,
                    zip_code: form.zip_code,
                    assigned_officer_id: form.assigned_officer_ids[0], // Single officer logic
                    priority: form.type === 'Specialty' ? 1 : 2
                };

                if (isEditing && editingId) {
                    await axios.put(`http://localhost:8000/special-assignments/${editingId}`, payload);
                } else {
                    await axios.post('http://localhost:8000/special-assignments', payload);
                }
            }
            handleCloseModal();
            fetchData();
            // Reset form
            setForm({
                zip_code: '',
                assigned_location_id: '',
                assigned_officer_ids: [],
                region_name: '',
                type: 'Facility',
                name: '',
                address: '',
                priority: 1
            });
        } catch (error) {
            console.error("Error saving assignment:", error);
            alert("Failed to save assignment. Check console.");
        }
    };

    // Helper to get location name by ID
    const getLocationName = (id) => {
        const loc = locations.find(l => l.location_id === id);
        return loc ? loc.name : 'Unassigned';
    };

    // Helper to get officer names
    const getOfficerNames = (ids) => {
        if (!ids || ids.length === 0) return 'Unassigned';
        // Handle if ids is array of objects (from backend join) or list of UUIDs
        // The backend returns objects in .officers list
        // But here we might be processing the raw list
        // Let's rely on the structure returned by backend get_territories
        // it returns filtered objects.
        // Wait, backend territory object has 'officers' list of objects.
        return 'Check Logic';
    };

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('geographic')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'geographic' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Map className="w-4 h-4" />
                        Zip Code Assignments
                    </button>
                    <button
                        onClick={() => setActiveTab('special')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'special' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Building className="w-4 h-4" />
                        Special Assignments
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {activeTab === 'geographic' ? 'Zip Code Assignments' : 'Facilities & Specialties'}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {activeTab === 'geographic'
                                    ? 'Assign officers and field offices to specific zip code regions.'
                                    : 'Manage overrides for high-priority facilities or specialty caseloads.'}
                            </p>
                        </div>
                        <button
                            onClick={() => { setIsEditing(false); setShowModal(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Assignment
                        </button>
                    </div>

                    {/* Content Table */}
                    <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    {activeTab === 'geographic' ? (
                                        <>
                                            <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('zip_code')}>
                                                <div className="flex items-center gap-1">Zip Code <ArrowUpDown size={12} /></div>
                                            </th>
                                            <th className="px-4 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('officers')}>
                                                <div className="flex items-center gap-1">Assigned Officers <ArrowUpDown size={12} /></div>
                                            </th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Location / Criteria</th>
                                            <th className="px-4 py-3">Assigned Officer</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === 'geographic' ? (
                                    getSortedTerritories().map((t) => (
                                        <tr key={t.zip_code} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{t.zip_code}</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {t.location ? t.location.name : 'Unassigned'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    {t.officers && t.officers.length > 0 ? (
                                                        t.officers.map((o) => (
                                                            <span key={o.officer_id} className="text-sm text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block w-fit">
                                                                {o.first_name} {o.last_name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => handleEdit(t)} className="text-slate-400 hover:text-blue-600">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(t.zip_code)} className="text-slate-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    specialAssignments.map((a) => (
                                        <tr key={a.assignment_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{a.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${a.type === 'Specialty' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {a.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {a.address || 'N/A'} {a.zip_code && `(${a.zip_code})`}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {a.officer ? `${a.officer.first_name} ${a.officer.last_name}` : 'Unassigned'}
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                                <button onClick={() => handleEdit(a)} className="text-slate-400 hover:text-blue-600">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteSpecial(a.assignment_id)} className="text-slate-400 hover:text-red-600">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {(activeTab === 'geographic' && territories.length === 0) || (activeTab === 'special' && specialAssignments.length === 0) ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                                            No assignments found. Click "Add Assignment" to create one.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div >
                </div >
            </div >

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800">
                                    {isEditing ? 'Edit Assignment' : (activeTab === 'geographic' ? 'Add Zip Code Assignment' : 'Add Special Assignment')}
                                </h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">Close</button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {activeTab === 'geographic' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zip Code</label>
                                            <input
                                                required
                                                disabled={isEditing} // Cannot change PK in upsert mode
                                                className={`w-full p-2 border border-slate-200 rounded-lg text-sm ${isEditing ? 'bg-slate-100 text-slate-500' : ''}`}
                                                placeholder="e.g. 85001"
                                                value={form.zip_code}
                                                onChange={e => setForm({ ...form, zip_code: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Office</label>
                                            <select
                                                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                value={form.assigned_location_id}
                                                onChange={e => setForm({ ...form, assigned_location_id: e.target.value })}
                                            >
                                                <option value="">Select Office...</option>
                                                {locations.map(l => (
                                                    <option key={l.location_id} value={l.location_id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Officers (Hold Ctrl/Cmd to select multiple)</label>
                                            <select
                                                multiple
                                                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white h-32"
                                                value={form.assigned_officer_ids}
                                                onChange={e => {
                                                    const options = [...e.target.selectedOptions];
                                                    const values = options.map(option => option.value);
                                                    setForm({ ...form, assigned_officer_ids: values });
                                                }}
                                            >
                                                {officers.map(o => (
                                                    <option key={o.officer_id} value={o.officer_id}>{o.last_name}, {o.first_name}</option>
                                                ))}
                                            </select>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-slate-400">Select one or more officers.</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setForm({ ...form, assigned_officer_ids: [] })}
                                                    className="text-xs text-red-500 hover:text-red-700 underline"
                                                >
                                                    Clear Selection
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                                <select
                                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                    value={form.type}
                                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                                >
                                                    <option value="Facility">Facility (Housing)</option>
                                                    <option value="Specialty">Specialty (Caseload)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                                <input
                                                    required
                                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                                    placeholder="e.g. New Freedom"
                                                    value={form.name}
                                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        {form.type === 'Facility' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address / Zip</label>
                                                <input
                                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                                    placeholder="123 Care Ln"
                                                    value={form.address}
                                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Officer</label>
                                            <select
                                                className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                value={form.assigned_officer_ids[0] || ''}
                                                onChange={e => setForm({ ...form, assigned_officer_ids: [e.target.value] })}
                                            >
                                                <option value="">Select Lead Officer...</option>
                                                {officers.map(o => (
                                                    <option key={o.officer_id} value={o.officer_id}>{o.last_name}, {o.first_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                                >
                                    Save Assignment
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default TerritoryManagement;
