import React from 'react';
import {
    Users, Briefcase, Activity, AlertTriangle,
    Calendar, CheckCircle, FileText, Search, Bell
} from 'lucide-react';
import { StatCard, ActivityBarChart, RiskDonutChart, EmploymentLineChart, SectionHeader } from './DashboardWidgets';

const ModernDashboard = () => {
    // --- Mock Data ---
    const activityData = [
        { name: 'Jul', newCases: 20, closedCases: 15 },
        { name: 'Aug', newCases: 25, closedCases: 18 },
        { name: 'Sep', newCases: 18, closedCases: 22 },
        { name: 'Oct', newCases: 30, closedCases: 20 },
        { name: 'Nov', newCases: 28, closedCases: 25 },
        { name: 'Dec', newCases: 35, closedCases: 12 },
    ];

    const riskData = [
        { name: 'High Risk', value: 15 },
        { name: 'Moderate', value: 25 },
        { name: 'Low Risk', value: 16 },
    ];

    const employmentData = [
        { month: 'Jan', "Main Office": 65, "North Station": 55, "East Side": 45, "West End": 30, "South Branch": 60 },
        { month: 'Feb', "Main Office": 68, "North Station": 58, "East Side": 48, "West End": 32, "South Branch": 58 },
        { month: 'Mar', "Main Office": 70, "North Station": 62, "East Side": 50, "West End": 35, "South Branch": 61 },
        { month: 'Apr', "Main Office": 72, "North Station": 65, "East Side": 55, "West End": 40, "South Branch": 63 },
        { month: 'May', "Main Office": 75, "North Station": 60, "East Side": 60, "West End": 42, "South Branch": 65 },
        { month: 'Jun', "Main Office": 78, "North Station": 68, "East Side": 65, "West End": 45, "South Branch": 70 },
        { month: 'Jul', "Main Office": 80, "North Station": 70, "East Side": 70, "West End": 48, "South Branch": 68 },
        { month: 'Aug', "Main Office": 79, "North Station": 72, "East Side": 68, "West End": 50, "South Branch": 72 },
        { month: 'Sep', "Main Office": 82, "North Station": 75, "East Side": 75, "West End": 55, "South Branch": 75 },
        { month: 'Oct', "Main Office": 85, "North Station": 78, "East Side": 78, "West End": 60, "South Branch": 80 },
        { month: 'Nov', "Main Office": 83, "North Station": 80, "East Side": 80, "West End": 65, "South Branch": 82 },
        { month: 'Dec', "Main Office": 88, "North Station": 82, "East Side": 85, "West End": 70, "South Branch": 85 },
    ];

    return (
        <div className="min-h-screen bg-transparent p-6 font-sans text-slate-900">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold font-display text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, Officer Mike. Here's your quarterly overview.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-pointer relative">
                        <Bell className="w-5 h-5 text-slate-600" />
                        <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                            MN
                        </div>
                        <span className="font-medium text-sm text-slate-700">Mike Newsome</span>
                    </div>
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Active Caseload"
                    value="56"
                    subtext="Cases assigned"
                    trend="up"
                    trendValue="12%"
                    icon={Users}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="Employment Rate"
                    value="78%"
                    subtext="Employed offenders"
                    trend="up"
                    trendValue="5%"
                    icon={Briefcase}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Compliance Score"
                    value="85"
                    subtext="Overall average"
                    trend="up"
                    trendValue="3pts"
                    icon={CheckCircle}
                    color="bg-violet-500"
                />
                <StatCard
                    title="Outstanding Warrants"
                    value="3"
                    subtext="Action required"
                    trend="down" // Good thing
                    trendValue="-1"
                    icon={AlertTriangle}
                    color="bg-rose-500"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Risk Distribution - Donut */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1">
                    <SectionHeader title="Risk Profile" action={true} />
                    <RiskDonutChart data={riskData} />
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-rose-50 rounded-lg">
                            <span className="block text-2xl font-bold text-rose-600">15</span>
                            <span className="text-xs text-rose-600 font-medium uppercase tracking-wide">High Risk</span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <span className="block text-2xl font-bold text-emerald-600">16</span>
                            <span className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Low Risk</span>
                        </div>
                    </div>
                </div>

                {/* Activity & Compliance - Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Bar Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <SectionHeader title="Caseload Activity (6 Months)" action={true} />
                        <ActivityBarChart data={activityData} />
                    </div>

                    {/* Quick Stats Row */}
                    {/* Employment Trend - Spans 2 columns width in this sub-grid */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <SectionHeader title="Employment Rates by Office (Last 12 Months)" />
                        <EmploymentLineChart data={employmentData} />
                    </div>
                </div>
            </div>

            {/* Bottom Row - Lists or Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <SectionHeader title="Upcoming Appearances" />
                    <div className="space-y-4">
                        {[
                            { name: 'John Doe', type: 'Court Hearing', date: 'Tomorrow, 9:00 AM', status: 'Mandatory' },
                            { name: 'Jane Smith', type: 'Office Visit', date: 'Dec 12, 2:00 PM', status: 'Confirmed' },
                            { name: 'Robert Johnson', type: 'Drug Test', date: 'Dec 14, 10:00 AM', status: 'Pending' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-l-4 border-indigo-500 bg-white shadow-sm">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 text-slate-500">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-800">{item.name}</div>
                                        <div className="text-xs text-slate-500">{item.type}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-slate-700">{item.date}</div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{item.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <SectionHeader title="Gap Analysis" />
                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { label: 'UA Compliance', gap: '-12%', color: 'text-rose-500' },
                            { label: 'Fee Collection', gap: '-35%', color: 'text-rose-500' },
                            { label: 'Housing Stable', gap: '+5%', color: 'text-emerald-500' },
                            { label: 'Emp. Retention', gap: '+2%', color: 'text-emerald-500' },
                        ].map((gap, i) => (
                            <div key={i} className="text-center p-4 border border-slate-50 rounded-xl bg-slate-50/50">
                                <div className={`text-2xl font-bold ${gap.color} mb-1`}>{gap.gap}</div>
                                <div className="text-xs text-slate-500 uppercase font-semibold">{gap.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModernDashboard;
