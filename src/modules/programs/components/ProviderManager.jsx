import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Building2, MapPin, Phone, Mail, Edit, Trash2 } from 'lucide-react';

const ProviderManager = () => {
    const [providers, setProviders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProvider, setEditingProvider] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'External',
        status: 'Active',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: ''
    });

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            const res = await axios.get('http://localhost:8000/programs/providers');
            setProviders(res.data);
        } catch (err) {
            console.error("Error fetching providers:", err);
        }
    };

    const handleSave = async () => {
        try {
            // Check if editing or creating
            // NOTE: In a real app, we'd have a PUT endpoint too. For this POC, we might implemented POST only or handle PUT similarly. 
            // The plan specified POST /providers. We'll use that for now.
            // If editing logic is needed, we'd need to add PUT to backend or handle it here.
            // For now, let's assume create new only based on the plan, or simple mock up.

            await axios.post('http://localhost:8000/programs/providers', formData);
            fetchProviders();
            setShowModal(false);
            resetForm();
        } catch (err) {
            console.error("Error saving provider:", err);
            alert("Failed to save provider");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'External',
            status: 'Active',
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            zip_code: ''
        });
        setEditingProvider(null);
    };

    const filteredProviders = providers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search providers..."
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
                    Add Provider
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProviders.map(provider => (
                    <div key={provider.provider_id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{provider.name}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${provider.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {provider.status}
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                {provider.type}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                            {provider.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin size={14} className="mt-0.5 text-slate-400" />
                                    <span>{provider.address}, {provider.city}, {provider.state} {provider.zip_code}</span>
                                </div>
                            )}
                            {provider.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-slate-400" />
                                    <span>{provider.phone}</span>
                                </div>
                            )}
                            {provider.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" />
                                    <a href={`mailto:${provider.email}`} className="text-blue-600 hover:underline">{provider.email}</a>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-2">
                            <button className="text-slate-400 hover:text-blue-600 p-1">
                                <Edit size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Add New Provider</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Provider Name</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Valley Counseling Services"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="External">External Vendor</option>
                                        <option value="Internal">Internal Program</option>
                                        <option value="NGO">Non-Profit / NGO</option>
                                        <option value="Government">Government Agency</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option>Active</option>
                                        <option>Inactive</option>
                                        <option>Suspended</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Running Address"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zip</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={formData.zip_code}
                                        onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Save Provider</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderManager;
