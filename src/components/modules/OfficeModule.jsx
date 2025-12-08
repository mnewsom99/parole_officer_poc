import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckSquare, ArrowRight, Search, UserPlus, ClipboardList, Calendar, UserMinus, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import { format } from 'date-fns';

const OfficeModule = () => {
    const { currentUser } = useUser();
    const [activeTab, setActiveTab] = useState('review');
    const [offices, setOffices] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [selectedOffice, setSelectedOffice] = useState('');
    const [selectedOfficer, setSelectedOfficer] = useState('');

    // Stats
    const [totalOffenders, setTotalOffenders] = useState(0);
    const [pendingReviews, setPendingReviews] = useState([]);

    // Forms
    const [taskForm, setTaskForm] = useState({
        title: '',
        assigned_officer_id: '',
        due_date: '',
        priority: 'Normal',
        description: '' // Mapped to instructions
    });

    // Fetch Offices
    useEffect(() => {
        const fetchOffices = async () => {
            try {
                const response = await axios.get('http://localhost:8000/locations');
                setOffices(response.data);
            } catch (error) {
                console.error("Error fetching offices:", error);
            }
        };
        fetchOffices();
    }, []);

    // Fetch Officers (filtered by office)
    useEffect(() => {
        const fetchOfficers = async () => {
            try {
                let url = 'http://localhost:8000/officers';
                if (selectedOffice) {
                    url += `?location_id=${selectedOffice}`;
                }
                const response = await axios.get(url);
                const mappedOfficers = response.data.map(o => ({
                    id: o.officer_id,
                    name: `${o.first_name} ${o.last_name}`,
                    caseload: 0, // Mock for now, or fetch individually if needed
                    status: 'Active'
                }));
                setOfficers(mappedOfficers);
            } catch (error) {
                console.error("Error fetching officers:", error);
            }
        };
        fetchOfficers();
    }, [selectedOffice]);

    // Fetch Stats (Total Offenders)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch just 1 item to get the 'total' count metadata
                const response = await axios.get('http://localhost:8000/offenders?limit=1');
                if (response.data && response.data.total !== undefined) {
                    setTotalOffenders(response.data.total);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, []);

    // Fetch Pending Reviews (Workflows)
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // Assuming status 'Pending_Sup_Review' is what we look for
                const response = await axios.get('http://localhost:8000/workflows/tasks?status=Pending_Sup_Review');
                setPendingReviews(response.data);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            }
        };
        // Fetch initially and polling/refresh could happen here
        fetchReviews();
    }, []);

    const handleAssignTask = async () => {
        if (!taskForm.title || !taskForm.assigned_officer_id) {
            alert("Please fill in required fields");
            return;
        }
        try {
            await axios.post('http://localhost:8000/tasks', taskForm);
            alert("Task Assigned Successfully");
            setTaskForm({ title: '', assigned_officer_id: '', due_date: '', priority: 'Normal', description: '' });
        } catch (error) {
            console.error("Error assigning task:", error);
            alert("Failed to assign task");
        }
    };

    const handleReviewAction = async (submissionId, action) => {
        try {
            // Action: 'Approve' or 'Return' (Reject)
            await axios.put(`http://localhost:8000/workflows/submissions/${submissionId}/action`, {
                action: action,
                comment: `Supervisor ${action === 'Approve' ? 'Approved' : 'Returned'}`
            });
            // Refresh list
            const response = await axios.get('http://localhost:8000/workflows/tasks?status=Pending_Sup_Review');
            setPendingReviews(response.data);
        } catch (error) {
            console.error("Error updating submission:", error);
            alert("Action failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Supervisor Office</h2>
                    <p className="text-slate-500">Manage team workload and administrative tasks</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedOffice}
                        onChange={(e) => setSelectedOffice(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                        <option value="">All Offices</option>
                        {offices.map(office => (
                            <option key={office.location_id} value={office.location_id}>{office.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Row 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Offenders</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {totalOffenders}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Pending Reviews</p>
                        <p className="text-2xl font-bold text-slate-800">{pendingReviews.length}</p>
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
                        onClick={() => setActiveTab('review')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'review' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Review Queue {pendingReviews.length > 0 && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingReviews.length}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('assign')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'assign' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <UserPlus className="w-4 h-4" />
                        Assign Task
                    </button>
                    <button
                        onClick={() => setActiveTab('transfer')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'transfer' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        <ArrowRight className="w-4 h-4" />
                        Case Transfer
                    </button>
                </div>

                <div className="p-6">
                    {/* Review Queue Tab */}
                    {activeTab === 'review' && (
                        <div className="space-y-4">
                            {pendingReviews.length > 0 ? (
                                pendingReviews.map(task => (
                                    <div key={task.submission_id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-full">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{task.template?.name || "Request"}</h4>
                                                <p className="text-sm text-slate-500">
                                                    Submitted by <span className="font-medium text-slate-700">{task.created_by?.username || 'Officer'}</span>
                                                    {task.offender && <span> • Re: {task.offender.first_name} {task.offender.last_name}</span>}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">{format(new Date(task.created_at), 'MMM d, yyyy h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReviewAction(task.submission_id, 'Approve')}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleReviewAction(task.submission_id, 'Return')}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                            >
                                                <XCircle className="w-4 h-4" /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No pending reviews found.</p>
                                    <p className="text-xs text-slate-400">Tasks requiring supervisor approval will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Assign Task Tab */}
                    {activeTab === 'assign' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., Conduct Surprise Home Visit"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                                <select
                                    value={taskForm.assigned_officer_id}
                                    onChange={(e) => setTaskForm({ ...taskForm, assigned_officer_id: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select Officer...</option>
                                    {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={taskForm.due_date}
                                        onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option>Low</option>
                                        <option>Normal</option>
                                        <option>High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter detailed instructions..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAssignTask}
                                    className="bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-6 rounded-lg shadow-lg shadow-navy-900/20 transition-all"
                                >
                                    Assign Task
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Case Transfer Tab (Placeholder logic still, but UI kept) */}
                    {activeTab === 'transfer' && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">From Officer</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700">
                                        <option>Select Officer...</option>
                                        {officers.map(o => <option key={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center justify-center pt-6">
                                    <ArrowRight className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">To Officer</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700">
                                        <option>Select Officer...</option>
                                        {officers.map(o => <option key={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg bg-slate-50 p-8 text-center text-slate-500">
                                Select a "From Officer" to view their caseload.
                            </div>
                            <div className="flex justify-end">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors">
                                    Transfer Cases
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OfficeModule;
