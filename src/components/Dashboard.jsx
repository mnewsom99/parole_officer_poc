import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    // Mock Data for "Warrants Issued by Month"
    const data = [
        { name: 'Jan', warrants: 4 },
        { name: 'Feb', warrants: 3 },
        { name: 'Mar', warrants: 2 },
        { name: 'Apr', warrants: 6 },
        { name: 'May', warrants: 8 },
        { name: 'Jun', warrants: 5 },
    ];

    const handleDownloadReport = async () => {
        const month = "June"; // Hardcoded for demo
        try {
            const response = await fetch(`http://localhost:8000/reports/monthly-summary/${month}`);
            if (!response.ok) throw new Error('Network response was not ok');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
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
                {/* Warrants Chart */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Warrants Issued (Last 6 Months)</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="warrants" fill="#8884d8" name="Warrants Issued" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Placeholder for another widget */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded text-center">
                            <p className="text-sm text-gray-600">Total Caseload</p>
                            <p className="text-2xl font-bold text-blue-600">42</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded text-center">
                            <p className="text-sm text-gray-600">Compliant</p>
                            <p className="text-2xl font-bold text-green-600">38</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded text-center">
                            <p className="text-sm text-gray-600">Warrants</p>
                            <p className="text-2xl font-bold text-red-600">4</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded text-center">
                            <p className="text-sm text-gray-600">Pending Reviews</p>
                            <p className="text-2xl font-bold text-yellow-600">7</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
