import React, { useState } from 'react';
import Modal from '../common/Modal';
import axios from 'axios';
import { format } from 'date-fns';
import { MapPin, Clock, FileText, User, Shield, AlertTriangle } from 'lucide-react';

const AppointmentDetailModal = ({ isOpen, onClose, appointment, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({});

    // Initialize form data when appointment changes or modal opens
    React.useEffect(() => {
        if (appointment) {
            setFormData({
                date_time: appointment.date_time,
                location: appointment.location || '',
                type: appointment.type || '',
                status: appointment.status || 'Scheduled',
                notes: appointment.notes || ''
            });
            setIsEditing(false);
            setError(null);
        }
    }, [appointment, isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.put(`http://localhost:8000/appointments/${appointment.appointment_id}`, formData);
            if (onUpdate) onUpdate(response.data);
            setIsEditing(false);
            onClose();
        } catch (err) {
            console.error("Error updating appointment:", err);
            setError("Failed to update appointment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this appointment?")) return;

        setLoading(true);
        setError(null);
        try {
            await axios.delete(`http://localhost:8000/appointments/${appointment.appointment_id}`);
            if (onDelete) onDelete(appointment.appointment_id);
            onClose();
        } catch (err) {
            console.error("Error deleting appointment:", err);
            setError("Failed to delete appointment.");
        } finally {
            setLoading(false);
        }
    };

    if (!appointment) return null;

    const offenderName = appointment.offender
        ? `${appointment.offender.first_name} ${appointment.offender.last_name}`
        : 'Unknown Offender';

    const officerName = appointment.officer
        ? `${appointment.officer.first_name} ${appointment.officer.last_name}`
        : 'Unknown Officer';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Appointment" : "Appointment Details"}
        >
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Header Info (Read-only even in edit mode usually, unless reassigning) */}
                <div className="flex justify-between items-start bg-slate-50 p-4 rounded-lg">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <User className="w-4 h-4" />
                            Offender
                        </div>
                        <div className="font-semibold text-slate-800 text-lg">{offenderName}</div>
                        {appointment.offender?.badge_id && (
                            <div className="text-xs text-slate-500">Badge: {appointment.offender.badge_id}</div>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-500 text-sm mb-1">
                            <Shield className="w-4 h-4" />
                            Officer
                        </div>
                        <div className="font-medium text-slate-800">{officerName}</div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                        {isEditing ? (
                            <input
                                type="datetime-local"
                                name="date_time"
                                value={formData.date_time ? new Date(formData.date_time).toISOString().slice(0, 16) : ''}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        ) : (
                            <div className="flex items-center gap-2 text-slate-800 py-2">
                                <Clock className="w-5 h-5 text-slate-400" />
                                {format(new Date(appointment.date_time), 'PPpp')}
                            </div>
                        )}
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        {isEditing ? (
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Completed">Completed</option>
                                <option value="Missed">Missed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        ) : (
                            <div className={`
                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2
                                ${appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                    appointment.status === 'Missed' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'}
                            `}>
                                {appointment.status}
                            </div>
                        )}
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm"
                            />
                        ) : (
                            <div className="text-slate-800 py-2">{appointment.type}</div>
                        )}
                    </div>

                    <div className="col-span-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm"
                            />
                        ) : (
                            <div className="flex items-center gap-2 text-slate-800 py-2">
                                <MapPin className="w-5 h-5 text-slate-400" />
                                {appointment.location || 'N/A'}
                            </div>
                        )}
                    </div>

                    <div className="col-span-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        {isEditing ? (
                            <textarea
                                name="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-md p-2 text-sm"
                            />
                        ) : (
                            <div className="flex items-start gap-2 text-slate-800 py-2 bg-slate-50 rounded-md p-3">
                                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                                <p className="text-sm whitespace-pre-wrap">{appointment.notes || 'No notes.'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium mr-auto"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            >
                                Edit
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AppointmentDetailModal;
