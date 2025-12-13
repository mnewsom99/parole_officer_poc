import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Calendar, CheckCircle, Clock, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

const OffenderProgramView = ({ offenderId }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [offerings, setOfferings] = useState([]);
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    // Enrollment Form
    const [enrollForm, setEnrollForm] = useState({
        offering_id: '',
        referral_source: 'Probation Officer',
        status: 'Referred',
        start_date: ''
    });

    useEffect(() => {
        if (offenderId) {
            fetchEnrollments();
            fetchCatalog();
        }
    }, [offenderId]);

    const fetchEnrollments = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/programs/enrollments/offender/${offenderId}`);
            setEnrollments(res.data);
        } catch (err) {
            console.error("Error fetching enrollments:", err);
        }
    };

    const fetchCatalog = async () => {
        try {
            const res = await axios.get('http://localhost:8000/programs/catalog');
            setOfferings(res.data);
        } catch (err) {
            console.error("Error fetching catalog:", err);
        }
    };

    const handleEnroll = async () => {
        try {
            await axios.post('http://localhost:8000/programs/enrollments', {
                offender_id: offenderId,
                offering_id: enrollForm.offering_id,
                referral_source: enrollForm.referral_source,
                status: enrollForm.status,
                start_date: enrollForm.start_date || undefined
            });
            fetchEnrollments();
            setShowEnrollModal(false);
        } catch (err) {
            console.error("Error enrolling offender:", err);
            alert("Failed to enroll offender");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'text-green-600 bg-green-50 border-green-200';
            case 'Referred': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Completed': return 'text-slate-600 bg-slate-100 border-slate-200';
            case 'Terminated': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">Program History & Referrals</h3>
                <button
                    onClick={() => setShowEnrollModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <Plus size={16} />
                    New Referral
                </button>
            </div>

            <div className="space-y-4">
                {enrollments.map(enrollment => (
                    <div key={enrollment.enrollment_id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-slate-800">{enrollment.offering?.program_name}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(enrollment.status)}`}>
                                        {enrollment.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">
                                    <span className="font-medium text-slate-700">Provider:</span> {enrollment.offering?.provider?.name}
                                </p>
                                <div className="flex gap-4 text-xs text-slate-500 mt-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        Referral: {enrollment.referral_date}
                                    </div>
                                    {enrollment.start_date && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            Started: {enrollment.start_date}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="ml-4 flex items-center h-full">
                                <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-blue-600 transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar Mockup for Active Programs */}
                        {enrollment.status === 'Active' && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-slate-600">Compliance Score</span>
                                    <span className={`font-bold ${enrollment.compliance_score < 70 ? 'text-red-500' : 'text-green-600'}`}>
                                        {enrollment.compliance_score || 100}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${enrollment.compliance_score < 70 ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${enrollment.compliance_score || 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {enrollments.length === 0 && (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-sm">No program history found for this offender.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                            <h3 className="font-bold text-slate-800">New Program Referral</h3>
                            <button onClick={() => setShowEnrollModal(false)} className="text-slate-400 hover:text-red-500">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Program</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    value={enrollForm.offering_id}
                                    onChange={e => setEnrollForm({ ...enrollForm, offering_id: e.target.value })}
                                >
                                    <option value="">Select a program...</option>
                                    {offerings.map(o => (
                                        <option key={o.offering_id} value={o.offering_id}>{o.program_name} ({o.provider?.name})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Referral Source</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                    value={enrollForm.referral_source}
                                    onChange={e => setEnrollForm({ ...enrollForm, referral_source: e.target.value })}
                                >
                                    <option>Probation Officer</option>
                                    <option>Court Order</option>
                                    <option>Parole Board</option>
                                    <option>Assessment Recommendation</option>
                                    <option>Self-Referral</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Status</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={enrollForm.status}
                                        onChange={e => setEnrollForm({ ...enrollForm, status: e.target.value })}
                                    >
                                        <option>Referred</option>
                                        <option>Intake Scheduled</option>
                                        <option>Active</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={enrollForm.start_date}
                                        onChange={e => setEnrollForm({ ...enrollForm, start_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                            <button onClick={() => setShowEnrollModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleEnroll} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Create Referral</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OffenderProgramView;
