import React, { useState } from 'react';
import { X, Download, Save, User, MapPin, Phone, Calendar, Shield } from 'lucide-react';

const AddOffenderModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        badgeId: '',
        dob: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        beginDate: '',
        endDate: '',
        risk: 'Low'
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImportData = () => {
        // Simulation of importing data from a legacy system
        setFormData({
            name: 'Doe, Jane',
            badgeId: '12345',
            dob: '1985-05-15',
            address: '999 Legacy Blvd',
            city: 'Old Town',
            state: 'AZ',
            zipCode: '85001',
            phone: '555-9876',
            beginDate: '2023-01-01',
            endDate: '2025-01-01',
            risk: 'Medium'
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800">Add New Offender</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={handleImportData}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Import Data from Legacy System
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="pl-10 w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Last, First"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Badge / Offender ID</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="text"
                                            name="badgeId"
                                            required
                                            value={formData.badgeId}
                                            onChange={handleChange}
                                            className="pl-10 w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="ID Number"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="date"
                                            name="dob"
                                            required
                                            value={formData.dob}
                                            onChange={handleChange}
                                            className="pl-10 w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                name="address"
                                                required
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="pl-10 w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Street Address"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <input
                                                type="text"
                                                name="city"
                                                required
                                                value={formData.city || ''}
                                                onChange={handleChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="City"
                                            />
                                            <input
                                                type="text"
                                                name="state"
                                                required
                                                value={formData.state || ''}
                                                onChange={handleChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="State"
                                            />
                                            <input
                                                type="text"
                                                name="zipCode"
                                                required
                                                value={formData.zipCode || ''}
                                                onChange={handleChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Zip Code"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="pl-10 w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="(555) 555-5555"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Supervision Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Supervision Begin Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="date"
                                            name="beginDate"
                                            required
                                            value={formData.beginDate}
                                            onChange={handleChange}
                                            className="pl-10 w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Supervision End Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <input
                                            type="date"
                                            name="endDate"
                                            required
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            className="pl-10 w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Risk Level</label>
                                    <select
                                        name="risk"
                                        value={formData.risk}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Low">Low Risk</option>
                                        <option value="Medium">Medium Risk</option>
                                        <option value="High">High Risk</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-6 rounded-lg shadow-lg shadow-navy-900/20 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                Add Offender
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddOffenderModal;
