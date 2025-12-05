import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_caseload: 0,
        active_offenders: 0,
        compliance_rate: 100,
        pending_reviews: 0,
        warrants_issued: 0,
        risk_distribution: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:8000/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
                // Fallback / silent fail?
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleDownloadReport = async () => {
        const month = "June"; // Hardcoded for demo
        try {
            // Use axios for consistency, though blob handling needs care
            const response = await axios.get(`http://localhost:8000/reports/monthly-summary/${month}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${month}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <button
                    onClick={handleDownloadReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                >
                    <span>Download PDF Report</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Distribution Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Risk Level Distribution (Active Cases)</h2>
                    <div className="h-64">
                        {stats.risk_distribution && stats.risk_distribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.risk_distribution}
                                    margin={{
                                        top: 5,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" name="Offenders">
                                        {stats.risk_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                {loading ? "Loading..." : "No data available"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats Widget */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded text-center">
                            <p className="text-sm text-gray-600">Total Caseload</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {loading ? "..." : stats.total_caseload}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded text-center">
                            <p className="text-sm text-gray-600">Compliance Rate</p>
                            <p className="text-2xl font-bold text-green-600">
                                {loading ? "..." : `${stats.compliance_rate}%`}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded text-center">
                            <p className="text-sm text-gray-600">Active Warrants</p>
                            <p className="text-2xl font-bold text-red-600">
                                {loading ? "..." : stats.warrants_issued}
                            </p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded text-center">
                            <p className="text-sm text-gray-600">Pending Reviews</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {loading ? "..." : stats.pending_reviews}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
