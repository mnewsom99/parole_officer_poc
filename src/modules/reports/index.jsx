import React from 'react';
import { BarChart, PieChart, Activity, Users, FileText, TrendingUp } from 'lucide-react';

const ReportsModule = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
                    <p className="text-slate-500">Overview of caseload performance</p>
                </div>
                <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
                    <option>Last 30 Days</option>
                    <option>Last Quarter</option>
                    <option>Year to Date</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Caseload', value: '42', change: '+2', icon: Users, color: 'blue' },
                    { label: 'Compliance Rate', value: '85%', change: '+5%', icon: Activity, color: 'green' },
                    { label: 'Pending Tasks', value: '12', change: '-3', icon: FileText, color: 'yellow' },
                    { label: 'Risk Score Avg', value: 'Medium', change: 'Stable', icon: TrendingUp, color: 'purple' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-green-600 font-medium">{stat.change}</span>
                            <span className="text-slate-400 ml-2">vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts (Mock) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Risk Level Distribution</h3>
                    <div className="h-64 flex items-end justify-around gap-4 px-4 border-b border-slate-100 pb-4">
                        {/* Mock Bar Chart */}
                        <div className="w-16 bg-green-500 rounded-t-lg relative group" style={{ height: '30%' }}>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600">Low</div>
                        </div>
                        <div className="w-16 bg-yellow-500 rounded-t-lg relative group" style={{ height: '50%' }}>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600">Medium</div>
                        </div>
                        <div className="w-16 bg-red-500 rounded-t-lg relative group" style={{ height: '20%' }}>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600">High</div>
                        </div>
                    </div>
                    <div className="flex justify-around mt-2 text-sm text-slate-500">
                        <span>Low Risk</span>
                        <span>Medium Risk</span>
                        <span>High Risk</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Monthly Contact Compliance</h3>
                    <div className="h-64 flex items-center justify-center">
                        <div className="relative w-48 h-48 rounded-full border-8 border-slate-100 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-8 border-blue-600 border-t-transparent border-r-transparent rotate-45"></div>
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-slate-800">85%</span>
                                <span className="text-xs text-slate-500">Completed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsModule;
