import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const WorkflowActionModal = ({ isOpen, onClose, task, onSuccess }) => {
    const [comment, setComment] = useState('');
    const [action, setAction] = useState(null); // 'Submit', 'Approve', 'Return', 'Deny'
    const [targetUser, setTargetUser] = useState('');
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setComment('');
            setAction(null);
            setTargetUser('');
            // Fetch users for re-assignment if needed (e.g. for Admin/Supervisor testing)
            // In a real app, logic would dictate available targets.
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:8000/users'); // Assuming this endpoint exists, or officer endpoint
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleSubmit = async () => {
        if (!action) return;
        setIsLoading(true);
        try {
            const payload = {
                action: action,
                comment: comment,
                target_user_id: targetUser || null
            };
            await axios.put(`http://localhost:8000/workflows/submissions/${task.submission_id}/action`, payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error performing action:", error);
            alert("Action failed.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !task) return null;

    // Determine available actions based on status (Simplified logic for POC)
    const canSubmit = task.status === 'Draft' || task.status === 'Correction_Needed';
    const canApprove = task.status.startsWith('Pending');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Process Request</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-slate-800">{task.template?.name || "Task"}</h3>
                        <div className="text-sm text-slate-500 mt-1">Status: <span className="font-medium text-slate-700">{task.status}</span></div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Select Action</label>
                        <div className="grid grid-cols-2 gap-3">
                            {canSubmit && (
                                <button
                                    onClick={() => setAction('Submit')}
                                    className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition-all ${action === 'Submit' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <ArrowRight className="w-4 h-4" /> Submit
                                </button>
                            )}

                            {canApprove && (
                                <>
                                    <button
                                        onClick={() => setAction('Approve')}
                                        className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition-all ${action === 'Approve' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => setAction('Return')}
                                        className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition-all ${action === 'Return' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <AlertTriangle className="w-4 h-4" /> Return
                                    </button>
                                    <button
                                        onClick={() => setAction('Deny')}
                                        className={`p-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition-all ${action === 'Deny' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <XCircle className="w-4 h-4" /> Deny
                                    </button>
                                </>
                            )}
                            {/* Final Acceptance Logic handled by Approve/Submit for simplicity or 'Accept' if we added it specifically */}
                            {task.status === 'Pending_New_Officer' && (
                                <button
                                    onClick={() => setAction('Accept')}
                                    className={`p-3 col-span-2 rounded-lg border flex items-center justify-center gap-2 font-medium transition-all ${action === 'Accept' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <CheckCircle className="w-4 h-4" /> Accept & Complete
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Comments</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            rows="3"
                            placeholder="Add reasoning or notes..."
                        ></textarea>
                    </div>

                    {/* Target User Selection (Only for specific states normally, but exposed for POC flexibility) */}
                    {(action === 'Approve' || action === 'Submit') && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Assign To (Optional/Override)</label>
                            <select
                                value={targetUser}
                                onChange={(e) => setTargetUser(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                            >
                                <option value="">Default Routing</option>
                                {users.map(u => (
                                    <option key={u.user_id} value={u.user_id}>{u.username} ({u.role?.role_name})</option>
                                ))}
                            </select>
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!action || isLoading}
                        className={`px-6 py-2 bg-navy-800 text-white font-medium rounded-lg hover:bg-navy-900 transition-colors ${(!action || isLoading) ? 'opacity-50' : ''}`}
                    >
                        {isLoading ? 'Processing...' : 'Confirm Action'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkflowActionModal;
