import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Shield, Plus } from 'lucide-react';
import RiskAssessmentModal from '../../components/modals/RiskAssessmentModal'; // Keeping location for now

const RiskTab = ({ offenderId }) => {
    const [riskHistory, setRiskHistory] = useState([]);
    const [riskFactors, setRiskFactors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRiskModal, setShowRiskModal] = useState(false);

    const safeDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    };

    const fetchRiskHistory = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8000/offenders/${offenderId}/risk`);
            const history = response.data;
            setRiskHistory(history);

            // Calculate Risk Factors from latest
            if (history.length > 0) {
                const latestRisk = history[0];
                const factors = Object.entries(latestRisk.details || {}).map(([category, score]) => ({
                    category,
                    score,
                    details: `${score} risk factor identified.`
                }));
                setRiskFactors(factors);
            } else {
                setRiskFactors([]);
            }
            setError(null);
        } catch (err) {
            console.error("Error fetching risk history:", err);
            setError("Failed to load risk assessments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (offenderId) {
            fetchRiskHistory();
        }
    }, [offenderId]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Risk Assessment History</h3>
                <button
                    onClick={() => setShowRiskModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2"
                >
                    <Plus size={16} />
                    New Assessment
                </button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-slate-500">Loading assessments...</div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {riskFactors.map((factor, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <h4 className="font-bold text-slate-700 text-sm mb-1">{factor.category}</h4>
                                <div className="text-2xl font-bold text-indigo-600 mb-1">{factor.score}</div>
                                <p className="text-xs text-slate-400">{factor.details}</p>
                            </div>
                        ))}
                    </div>

                    {riskHistory.length > 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Raw Score</th>
                                        <th className="px-4 py-3">Risk Level</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {riskHistory.map((risk) => (
                                        <tr key={risk.assessment_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">{safeDate(risk.date)}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{risk.assessment_type || 'Unknown'}</td>
                                            <td className="px-4 py-3">{risk.total_score}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${risk.final_risk_level === 'High' ? 'bg-red-100 text-red-700' :
                                                    risk.final_risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {risk.final_risk_level}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{risk.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">No Assessments Found</h3>
                            <p className="text-slate-500 mb-6">No risk assessments have been recorded for this offender.</p>
                        </div>
                    )}
                </>
            )}

            <RiskAssessmentModal
                isOpen={showRiskModal}
                onClose={() => setShowRiskModal(false)}
                offenderId={offenderId}
                onSuccess={() => fetchRiskHistory()}
            />
        </div>
    );
};

export default RiskTab;
