import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, BookOpen, Info, Clock, AlertTriangle } from 'lucide-react';

const ProgramCatalog = () => {
    const [offerings, setOfferings] = useState([]);
    const [providers, setProviders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        provider_id: '',
        program_name: '',
        description: '',
        category: 'Substance Abuse',
        level_of_care: 'Outpatient (Low)',
        intervention_type: 'Group Therapy',
        duration_weeks: 12,
        is_evidence_based: false,
        target_population: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [offRes, provRes] = await Promise.all([
                axios.get('http://localhost:8000/programs/catalog'),
                axios.get('http://localhost:8000/programs/providers')
            ]);
            setOfferings(offRes.data);
            setProviders(provRes.data);
        } catch (err) {
            console.error("Error fetching catalog data:", err);
        }
    };

    const handleSave = async () => {
        try {
            await axios.post('http://localhost:8000/programs/catalog', {
                ...formData,
                target_population: formData.target_population // Ensure array
            });
            fetchData();
            setShowModal(false);
            resetForm();
        } catch (err) {
            console.error("Error saving offering:", err);
            alert("Failed to save program offering");
        }
    };

    const resetForm = () => {
        setFormData({
            provider_id: '',
            program_name: '',
            description: '',
            category: 'Substance Abuse',
            level_of_care: 'Outpatient (Low)',
            intervention_type: 'Group Therapy',
            duration_weeks: 12,
            is_evidence_based: false,
            target_population: []
        });
    };

    const filteredOfferings = offerings.filter(o =>
        o.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search program catalog..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Program
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredOfferings.map(offering => (
                    <div key={offering.offering_id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="mt-1 p-2 bg-indigo-50 text-indigo-600 rounded-lg h-fit">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{offering.program_name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                        <span className="font-medium text-slate-700">{offering.provider?.name || 'Unknown Provider'}</span>
                                        <span>•</span>
                                        <span>{offering.category}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 max-w-2xl mb-3">{offering.description || 'No description provided.'}</p>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                            <AlertTriangle size={12} />
                                            {offering.level_of_care || 'N/A'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                            {offering.intervention_type || 'General'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                            <Clock size={12} />
                                            {offering.duration_weeks} Weeks
                                        </span>
                                        {offering.is_evidence_based && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                Evidence Based
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                {/* Actions could go here */}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-10">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800">Add New Program Offering</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Program Name</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    value={formData.program_name}
                                    onChange={e => setFormData({ ...formData, program_name: e.target.value })}
                                    placeholder="e.g. Cognitive Behavioral Therapy for SUD"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Provider</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={formData.provider_id}
                                        onChange={e => setFormData({ ...formData, provider_id: e.target.value })}
                                    >
                                        <option value="">Select Provider...</option>
                                        {providers.map(p => (
                                            <option key={p.provider_id} value={p.provider_id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option>Substance Abuse</option>
                                        <option>Mental Health</option>
                                        <option>Education / GED</option>
                                        <option>Employment</option>
                                        <option>Anger Management</option>
                                        <option>Sex Offender Treatment</option>
                                        <option>Domestic Violence</option>
                                        <option>Life Skills</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Synopsis / Description</label>
                                <textarea
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm h-24 resize-none"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the program content, goals, and methodologies..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Level of Care</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={formData.level_of_care}
                                        onChange={e => setFormData({ ...formData, level_of_care: e.target.value })}
                                    >
                                        <option>Outpatient (Low)</option>
                                        <option>Intensive Outpatient (IOP)</option>
                                        <option>Partial Hospitalization</option>
                                        <option>Residential / Inpatient</option>
                                        <option>Detox</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Intervention Type</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={formData.intervention_type}
                                        onChange={e => setFormData({ ...formData, intervention_type: e.target.value })}
                                    >
                                        <option>Group Therapy</option>
                                        <option>Individual Counseling</option>
                                        <option>Medication Assisted (MAT)</option>
                                        <option>CBT (Cognitive Behavioral)</option>
                                        <option>MEP (Moral Reconation)</option>
                                        <option>ITH (In-Home Therapy)</option>
                                        <option>Educational Class</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Weeks)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={formData.duration_weeks}
                                        onChange={e => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-2 flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_evidence_based}
                                            onChange={e => setFormData({ ...formData, is_evidence_based: e.target.checked })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Is Evidence Based Practice (EBP)?</span>
                                    </label>
                                </div>
                            </div>

                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Save Offering</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgramCatalog;
