import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ExternalLink } from 'lucide-react';
import Modal from '../../components/common/Modal'; // Adjust import path if needed

const DrugTestingTab = ({ offenderId }) => {
    const [uaHistory, setUaHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showUAModal, setShowUAModal] = useState(false);

    const safeDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    };

    const fetchUAHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8000/offenders/${offenderId}/urinalysis`);
            setUaHistory(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching UA history:", err);
            setError("Failed to load drug testing records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (offenderId) {
            fetchUAHistory();
        }
    }, [offenderId]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Drug Testing History</h3>
                <div className="flex gap-2">
                    <a
                        href="https://example-lab-portal.com" // Placeholder
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2"
                    >
                        <ExternalLink size={16} />
                        Lab Portal
                    </a>
                    <button
                        onClick={() => setShowUAModal(true)}
                        className="bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm"
                    >
                        Request New Test
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500">Loading records...</div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            ) : uaHistory.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Test Type</th>
                                <th className="px-6 py-3">Result</th>
                                <th className="px-6 py-3">Collected By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {uaHistory.map((ua) => (
                                <tr key={ua.test_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">{safeDate(ua.date)}</td>
                                    <td className="px-6 py-4 font-medium text-slate-800">{ua.test_type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${ua.result === 'Positive' ? 'bg-red-100 text-red-700' :
                                            ua.result === 'Negative' ? 'bg-green-100 text-green-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {ua.result}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {ua.collected_by ? `${ua.collected_by.last_name}, ${ua.collected_by.first_name}` : 'Unknown'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No Test History</h3>
                    <p className="text-slate-500 mb-6">No drug testing records found for this offender.</p>
                </div>
            )}

            <Modal
                isOpen={showUAModal}
                onClose={() => setShowUAModal(false)}
                title="Log Drug Test"
            >
                <div className="p-4 text-center text-slate-500 italic">
                    Placeholder: Form to log new drug test would go here.
                </div>
            </Modal>
        </div>
    );
};

export default DrugTestingTab;
