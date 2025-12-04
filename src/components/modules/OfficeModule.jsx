import React, { useState } from 'react';
import { Users, FileText, CheckSquare, ArrowRight, Search, UserPlus, ClipboardList } from 'lucide-react';

const OfficeModule = () => {
    const [activeTab, setActiveTab] = useState('transfer');

    const officers = [
        { id: 1, name: 'Smith, John', caseload: 42, status: 'Active' },
        { id: 2, name: 'Johnson, Sarah', caseload: 38, status: 'Active' },
        { id: 3, name: 'Williams, Mike', caseload: 45, status: 'Warning' },
        { id: 4, name: 'Brown, Jessica', caseload: 30, status: 'Active' },
    ];

    const pendingTasks = [
        { id: 1, title: 'Approve Home Plan - Doe, J.', officer: 'Smith, John', date: 'Today', priority: 'High' },
        { id: 2, title: 'Review Incident Report - Case #882', officer: 'Williams, Mike', date: 'Yesterday', priority: 'Medium' },
        { id: 3, title: 'Sign off on Discharge', officer: 'Johnson, Sarah', date: 'Dec 10', priority: 'Low' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Supervisor Office</h2>
                    <p className="text-slate-500">Manage team workload and administrative tasks</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Officers</p>
                        <p className="text-2xl font-bold text-slate-800">12</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Pending Reviews</p>
                        <p className="text-2xl font-bold text-slate-800">8</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Tasks Assigned</p>
                        <p className="text-2xl font-bold text-slate-800">24</p>
                    </div>
                </div>
            </div>

            {/* Module Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('transfer')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'transfer' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <ArrowRight className="w-4 h-4" />
                        Case Transfer
                    </button>
                    <button
                        onClick={() => setActiveTab('assign')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'assign' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <UserPlus className="w-4 h-4" />
                        Assign Task
                    </button>
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'review' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Review Queue
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'transfer' && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">From Officer</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700">
                                        <option>Select Officer...</option>
                                        {officers.map(o => <option key={o.id}>{o.name} ({o.caseload})</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center justify-center pt-6">
                                    <ArrowRight className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">To Officer</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700">
                                        <option>Select Officer...</option>
                                        {officers.map(o => <option key={o.id}>{o.name} ({o.caseload})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Cases to Transfer</label>
                                <div className="border border-slate-200 rounded-lg bg-slate-50 p-8 text-center text-slate-500">
                                    Select a "From Officer" to view their caseload.
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
                                    Transfer Cases
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assign' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700" placeholder="e.g., Conduct Surprise Home Visit" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700">
                                    <option>Select Officer...</option>
                                    {officers.map(o => <option key={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700">
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
                                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 h-32" placeholder="Enter detailed instructions..."></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
                                    Assign Task
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'review' && (
                        <div className="space-y-4">
                            {pendingTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-12 rounded-full ${task.priority === 'High' ? 'bg-red-500' : task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{task.title}</h4>
                                            <p className="text-sm text-slate-500">Submitted by <span className="font-medium text-slate-700">{task.officer}</span> • {task.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">Approve</button>
                                        <button className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfficeModule;
