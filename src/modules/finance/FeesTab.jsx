import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ExternalLink } from 'lucide-react';

const FeesTab = ({ offenderId }) => {
    const [feeSummary, setFeeSummary] = useState({ balance: 0, history: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const safeDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    };

    const fetchFees = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8000/fees/${offenderId}`);
            setFeeSummary(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching fees:", err);
            setError("Failed to load financial records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (offenderId) {
            fetchFees();
        }
    }, [offenderId]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading financial records...</div>;
    if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Cost of Supervision & Fees</h3>
                <a
                    href="https://example-vendor-portal.com" // Placeholder link
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2"
                >
                    <ExternalLink size={16} />
                    Vendor Portal
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1">
                    <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Current Balance</h4>
                    <div className={`text-4xl font-bold ${feeSummary.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Number(feeSummary.balance).toFixed(2)}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Last Updated: {safeDate(feeSummary.last_updated)}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <DollarSign size={16} className="text-slate-400" />
                            <span>Status: {feeSummary.balance > 0 ? 'Payment Due' : 'In Good Standing'}</span>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden col-span-1 md:col-span-2">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800">Recent Transactions</h4>
                        <span className="text-xs text-slate-500">Last 5 records</span>
                    </div>
                    {feeSummary?.history && feeSummary.history.length > 0 ? (
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {feeSummary.history.map((tx) => (
                                    <tr key={tx.transaction_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">{safeDate(tx.transaction_date)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-800">{tx.description}</span>
                                                <span className="text-xs text-slate-400">{tx.type}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 font-bold ${tx.type === 'Payment' ? 'text-green-600' : 'text-slate-800'}`}>
                                            {tx.type === 'Payment' ? '-' : '+'}${Number(tx.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-500 italic">
                            No recent transactions available.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeesTab;
