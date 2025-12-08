import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import axios from 'axios';
import { useUser } from '../../core/context/UserContext';
import { AlertTriangle, Plus, Search } from 'lucide-react';

const CreateAppointmentModal = ({ isOpen, onClose, onCreate, initialDate }) => {
    const { currentUser } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        offender_id: '',
        date_time: '',
        location: '',
        type: 'Routine',
        notes: ''
    });

    // Offender Selection State
    const [offenders, setOffenders] = useState([]);
    const [isLoadingOffenders, setIsLoadingOffenders] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Pre-fill date if provided (e.g. clicking on a calendar day)
    useEffect(() => {
        if (isOpen) {
            // Reset form
            setFormData({
                offender_id: '',
                date_time: initialDate ? new Date(initialDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
                location: currentUser?.locationId || '', // Default to user's location if available? Logic might be complex, leave empty or default
                type: 'Routine',
                notes: ''
            });
            setError(null);
            setSearchTerm('');
            fetchOffenders();
        }
    }, [isOpen, initialDate]);

    const fetchOffenders = async () => {
        setIsLoadingOffenders(true);
        try {
            // Fetch all offenders for now. Ideally should filter by officer but simple is okay for v1
            // If we have an endpoint that supports filtering, use it.
            // Using existing endpoint logic:
            let url = 'http://localhost:8000/offenders';
            const response = await axios.get(url);
            setOffenders(response.data);
        } catch (err) {
            console.error("Error fetching offenders:", err);
            setError("Failed to load offenders list.");
        } finally {
            setIsLoadingOffenders(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.offender_id) {
            setError("Please select an offender.");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                officer_id: currentUser?.officerId // Assign to current user as officer
            };

            const response = await axios.post('http://localhost:8000/appointments', payload);
            if (onCreate) onCreate(response.data);
            onClose();
        } catch (err) {
            console.error("Error creating appointment:", err);
            setError("Failed to create appointment.");
        } finally {
            setLoading(false);
        }
    };

    // Filter offenders for dropdown
    const filteredOffenders = offenders.filter(o =>
        o.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.badge_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule New Appointment">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Offender Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Offender</label>
                    {/* Simple Searchable Select Implementation */}
                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or badge..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <select
                            name="offender_id"
                            value={formData.offender_id}
                            onChange={handleChange}
                            className={`w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${!formData.offender_id && 'text-slate-500'}`}
                            required
                        >
                            <option value="">-- Select Offender --</option>
                            {filteredOffenders.length > 0 ? (
                                filteredOffenders.slice(0, 50).map(offender => ( // Limit to 50 for perf
                                    <option key={offender.offender_id} value={offender.offender_id}>
                                        {offender.last_name}, {offender.first_name} ({offender.badge_id})
                                    </option>
                                ))
                            ) : (
                                <option disabled>No offenders found</option>
                            )}
                        </select>
                        {isLoadingOffenders && <p className="text-xs text-slate-500">Loading offenders...</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                        <input
                            type="datetime-local"
                            name="date_time"
                            value={formData.date_time}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Routine">Routine Visit</option>
                            <option value="UA">Urinalysis (UA)</option>
                            <option value="Home Visit">Home Visit</option>
                            <option value="Court">Court Appearance</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Office 101, Home, Courthouse"
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Additional details..."
                            className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : <><Plus className="w-4 h-4" /> Create Appointment</>}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateAppointmentModal;
