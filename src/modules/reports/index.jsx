import React from 'react';
import { BarChart, PieChart, Activity, Users, FileText, TrendingUp } from 'lucide-react';
import ReportPreviewModal from './ReportPreviewModal';

const ReportsModule = () => {
    const [selectedReport, setSelectedReport] = React.useState(null);

    const reportCategories = [
        {
            title: "Daily Reports",
            items: [
                { id: 'd1', title: "Daily Activity Log", type: 'table', icon: FileText },
                { id: 'd2', title: "Daily Arrests & Warrants", type: 'table', icon: Activity },
                { id: 'd3', title: "Officer Field Notes", type: 'summary', icon: TrendingUp },
            ]
        },
        {
            title: "Weekly Reports",
            items: [
                { id: 'w1', title: "Weekly Compliance Summary", type: 'summary', icon: PieChart },
                { id: 'w2', title: "Caseload Movement (Intake/Exit)", type: 'table', icon: Users },
                { id: 'w3', title: "Urinalysis Results Batch", type: 'table', icon: Activity },
            ]
        },
        {
            title: "Monthly Reports",
            items: [
                { id: 'm1', title: "Monthly Caseload Statistics", type: 'summary', icon: BarChart },
                { id: 'm2', title: "Recidivism Risk Analysis", type: 'summary', icon: TrendingUp },
                { id: 'm3', title: "Fiscal Fee Collection", type: 'table', icon: FileText },
            ]
        }
    ];

    return (
        <div className="space-y-8">
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



            {/* Available Reports Section */}
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-6">Available Reports</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reportCategories.map((category) => (
                        <div key={category.title} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                                <h4 className="font-semibold text-slate-700">{category.title}</h4>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {category.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedReport(item)}
                                        className="w-full text-left px-6 py-4 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center group"
                                    >
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 mr-4">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-slate-600 group-hover:text-blue-700">{item.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Report Builder */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Custom Report Builder</h3>
                        <p className="text-slate-500">Generate a specific report based on custom criteria</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Officer Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Officer</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="">All Officers</option>
                            <option value="1">Officer Smith</option>
                            <option value="2">Officer Jones</option>
                            <option value="3">Officer Davis</option>
                        </select>
                    </div>

                    {/* Offender Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Offender Type / Risk</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="">All Types</option>
                            <option value="Sex Offender">Sex Offender</option>
                            <option value="Gang Member">Gang Member</option>
                            <option value="High Risk">High Risk</option>
                            <option value="Medium Risk">Medium Risk</option>
                        </select>
                    </div>

                    {/* Program */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="">Any Program</option>
                            <option value="Anger Management">Anger Management</option>
                            <option value="Substance Abuse">Substance Abuse Treatment</option>
                            <option value="Vocational">Vocational Training</option>
                        </select>
                    </div>

                    {/* Date Range Start */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                        <input
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Date Range End */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                        <input
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Format */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Export Format</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <option value="pdf">PDF Document</option>
                            <option value="csv">Excel / CSV</option>
                            <option value="print">Print View</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                        onClick={() => setSelectedReport({ title: "Custom Generated Report", type: "table" })}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <FileText className="w-5 h-5" />
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Modal */}
            <ReportPreviewModal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                report={selectedReport}
            />
        </div>
    );
};

export default ReportsModule;
