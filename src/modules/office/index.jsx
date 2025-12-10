import React, { useState, useEffect } from 'react';
import {
    Users, FileText, CheckSquare, ArrowRight, Search, UserPlus,
    ClipboardList, Calendar, UserMinus, Clock, CheckCircle, XCircle,
    TriangleAlert, Shield, Briefcase
} from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../core/context/UserContext';
import { format, addDays, isBefore, parseISO } from 'date-fns';

const OfficeModule = () => {
    const { currentUser } = useUser();
    const [activeTab, setActiveTab] = useState('review');
    const [offices, setOffices] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [selectedOffice, setSelectedOffice] = useState('');

    // Data filtering states
    const [allOffenders, setAllOffenders] = useState([]);
    const [transferFromOfficer, setTransferFromOfficer] = useState('');
    const [transferToOfficer, setTransferToOfficer] = useState('');
    const [transferSelection, setTransferSelection] = useState([]);

    // Stats
    const [stats, setStats] = useState({
        totalOffenders: 0,
        pendingReviews: 0,
        overdueTasks: 0,
        closeouts: 0,
        employmentRate: 0
    });

    // Lists
    const [pendingReviews, setPendingReviews] = useState([]);
    const [warrantOffenders, setWarrantOffenders] = useState([]);
    const [releasingOffenders, setReleasingOffenders] = useState([]);

    // Forms
    const [taskForm, setTaskForm] = useState({
        title: '',
        assigned_officer_id: '',
        due_date: '',
        priority: 'Normal',
        description: ''
    });

    // Fetch Initial Data
    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const [locResp, offResp, reviewResp, offendersResp] = await Promise.all([
                    axios.get('http://localhost:8000/locations'),
                    axios.get('http://localhost:8000/officers'),
                    axios.get('http://localhost:8000/workflows/tasks?status=Pending_Sup_Review'),
                    axios.get('http://localhost:8000/offenders?limit=1000') // Fetch all for clientside filtering for now
                ]);

                setOffices(locResp.data);
                setOfficers(offResp.data);
                setPendingReviews(reviewResp.data);
                setAllOffenders(offendersResp.data.data);

                // Calculate Stats
                const offenders = offendersResp.data.data;
                const employedCount = offenders.filter(o => o.employment_status === 'Employed').length;
                const closeoutCount = offenders.filter(o => {
                    if (!o.csed_date) return false;
                    const date = parseISO(o.csed_date);
                    const thirtyDays = addDays(new Date(), 30);
                    return isBefore(date, thirtyDays) && isBefore(new Date(), date);
                }).length;

                // Warrants
                const activeWarrants = offenders.filter(o =>
                    o.warrantStatus &&
                    !['None', 'Cleared', 'Inactive'].includes(o.warrantStatus)
                );
                setWarrantOffenders(activeWarrants);

                // Releasing
                const releasing = offenders.filter(o => {
                    if (!o.releaseDate) return false;
                    return isBefore(parseISO(o.releaseDate), addDays(new Date(), 90)) && isBefore(new Date(), parseISO(o.releaseDate));
                });
                setReleasingOffenders(releasing);

                setStats({
                    totalOffenders: offendersResp.data.total,
                    pendingReviews: reviewResp.data.length,
                    overdueTasks: 12, // Mock for now until tasks API supports generic filtering
                    closeouts: closeoutCount,
                    employmentRate: offenders.length ? Math.round((employedCount / offenders.length) * 100) : 0
                });

            } catch (error) {
                console.error("Error loading office data:", error);
            }
        };
        fetchBaseData();
    }, []);

    // Transfer Logic
    const availableForTransfer = allOffenders.filter(o => {
        // Find officer for this offender (need to match ID from Officer list)
        // Since get_offenders doesn't return officer_id directly in the root, 
        // we might fail here unless we fetch by officer specifically.
        // Quick fix: When user selects "From Officer", we fetch filtered list.
        return true;
    });

    const [transferableList, setTransferableList] = useState([]);

    useEffect(() => {
        if (!transferFromOfficer) {
            setTransferableList([]);
            return;
        }
        const fetchCaseload = async () => {
            const resp = await axios.get(`http://localhost:8000/offenders?officer_id=${transferFromOfficer}&limit=100`);
            setTransferableList(resp.data.data);
        };
        fetchCaseload();
    }, [transferFromOfficer]);


    const handleTransfer = async () => {
        if (!transferToOfficer || transferSelection.length === 0) return;
        try {
            await axios.post('http://localhost:8000/offenders/transfer', {
                offender_ids: transferSelection,
                new_officer_id: transferToOfficer
            });
            alert("Transfer Successful");
            setTransferSelection([]);
            // Refresh list
            const resp = await axios.get(`http://localhost:8000/offenders?officer_id=${transferFromOfficer}&limit=100`);
            setTransferableList(resp.data.data);
        } catch (e) {
            alert("Transfer Failed");
            console.error(e);
        }
    };

    const handleUpdateWarrant = async (offenderId, newStatus) => {
        try {
            await axios.put(`http://localhost:8000/offenders/${offenderId}/warrant-status`, {
                status: newStatus,
                warrant_date: new Date().toISOString().split('T')[0]
            });
            // Refresh local state
            setWarrantOffenders(prev => prev.map(o => o.id === offenderId ? { ...o, warrantStatus: newStatus } : o));
            alert(`Warrant status updated to ${newStatus}`);
        } catch (e) {
            console.error(e);
            alert("Failed to update warrant");
        }
    };

    const toggleSelection = (id) => {
        if (transferSelection.includes(id)) {
            setTransferSelection(transferSelection.filter(x => x !== id));
        } else {
            setTransferSelection([...transferSelection, id]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Banner Section */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl p-6 shadow-xl relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Supervisor Office</h2>
                            <p className="text-indigo-100/80">Manage team workload and administrative tasks</p>
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={selectedOffice}
                                onChange={(e) => setSelectedOffice(e.target.value)}
                                className="bg-white/10 border border-white/20 text-white text-sm rounded-lg focus:ring-white/50 focus:border-white/50 block p-2.5 backdrop-blur-sm [&>option]:text-slate-800"
                            >
                                <option value="">All Offices</option>
                                {offices.map(office => (
                                    <option key={office.location_id} value={office.location_id}>{office.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Stats Row (Inside Banner) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Users size={12} /> Offenders
                            </div>
                            <div className="text-2xl font-bold">{stats.totalOffenders}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <FileText size={12} /> Pending
                            </div>
                            <div className="text-2xl font-bold text-yellow-300">{stats.pendingReviews}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <TriangleAlert size={12} /> Overdue
                            </div>
                            <div className="text-2xl font-bold text-red-300">{stats.overdueTasks}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Clock size={12} /> Closeouts
                            </div>
                            <div className="text-2xl font-bold">{stats.closeouts}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Briefcase size={12} /> Employed
                            </div>
                            <div className="text-2xl font-bold">{stats.employmentRate}%</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Shield size={12} /> Audits
                            </div>
                            <div className="text-2xl font-bold">8</div>
                        </div>
                    </div>

                    {/* Physical Folder Tabs */}
                    <div className="flex gap-0.5 overflow-x-auto no-scrollbar pt-6 -mx-6 px-6 relative top-[25px]">
                        {[
                            { id: 'review', label: 'Review Queue', icon: ClipboardList },
                            { id: 'transfer', label: 'Case Transfer', icon: ArrowRight },
                            { id: 'release', label: 'Pending Release', icon: Calendar },
                            { id: 'warrants', label: 'Warrant Follow-up', icon: TriangleAlert },
                            { id: 'audits', label: 'Audits', icon: CheckSquare },
                        ].map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        group flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all rounded-t-xl relative
                                        ${isActive
                                            ? 'bg-white text-violet-700 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-10'
                                            : 'bg-white/10 text-indigo-100 hover:bg-white/20 hover:text-white'
                                        }
                                    `}
                                >
                                    <tab.icon size={16} className={isActive ? 'text-violet-600' : 'text-indigo-200 group-hover:text-white transition-colors'} />
                                    {tab.label}
                                    {tab.id === 'review' && pendingReviews.length > 0 &&
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-1 ${isActive ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-white'}`}>
                                            {pendingReviews.length}
                                        </span>
                                    }
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Container - Unified White Card */}
            <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
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
                                        <button className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200">Approve</button>
                                        <button className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200">Reject</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-500 py-8">No pending reviews found.</p>
                        )}
                    </div>
                )}

                {/* Case Transfer Tab */}
                {activeTab === 'transfer' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-slate-700 mb-1">From Officer</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3"
                                    value={transferFromOfficer}
                                    onChange={(e) => setTransferFromOfficer(e.target.value)}
                                >
                                    <option value="">Select Officer...</option>
                                    {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center justify-center pb-3">
                                <ArrowRight className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-slate-700 mb-1">To Officer</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3"
                                    value={transferToOfficer}
                                    onChange={(e) => setTransferToOfficer(e.target.value)}
                                >
                                    <option value="">Select Officer...</option>
                                    {officers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div className="pb-1">
                                <button
                                    onClick={handleTransfer}
                                    disabled={transferSelection.length === 0 || !transferToOfficer}
                                    className="bg-blue-600 disabled:bg-slate-300 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                                >
                                    Transfer ({transferSelection.length})
                                </button>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 w-4">
                                            <input type="checkbox" onChange={() => {
                                                if (transferSelection.length === transferableList.length) setTransferSelection([]);
                                                else setTransferSelection(transferableList.map(o => o.id));
                                            }} />
                                        </th>
                                        <th className="px-6 py-3">Offender</th>
                                        <th className="px-6 py-3">Badg ID</th>
                                        <th className="px-6 py-3">Risk</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transferableList.length > 0 ? transferableList.map(offender => (
                                        <tr key={offender.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={transferSelection.includes(offender.id)}
                                                    onChange={() => toggleSelection(offender.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{offender.name}</td>
                                            <td className="px-6 py-4">{offender.badgeId}</td>
                                            <td className="px-6 py-4">{offender.risk}</td>
                                            <td className="px-6 py-4">{offender.status}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center">Select a "From Officer" to view caseload</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pending Release Tab */}
                {activeTab === 'release' && (
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Upcoming Releases (Next 90 Days)</h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3">Offender</th>
                                        <th className="px-6 py-3">Release Date</th>
                                        <th className="px-6 py-3">Release Type</th>
                                        <th className="px-6 py-3">Initial Placement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {releasingOffenders.map(o => (
                                        <tr key={o.id} className="bg-white border-b">
                                            <td className="px-6 py-4 font-medium text-slate-900">{o.name}</td>
                                            <td className="px-6 py-4">{o.releaseDate}</td>
                                            <td className="px-6 py-4">{o.releaseType}</td>
                                            <td className="px-6 py-4">{o.initialPlacement}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Warrant Follow-Up Tab */}
                {activeTab === 'warrants' && (
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Active Warrant Management</h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3">Offender</th>
                                        <th className="px-6 py-3">Current Status</th>
                                        <th className="px-6 py-3">Status Date</th>
                                        <th className="px-6 py-3">Tasks Generated</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warrantOffenders.map(o => (
                                        <tr key={o.id} className="bg-white border-b">
                                            <td className="px-6 py-4 font-medium text-slate-900">{o.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                        ${o.warrantStatus === 'Submitted' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                        ${o.warrantStatus === 'Approved' ? 'bg-blue-100 text-blue-800' : ''}
                                                        ${o.warrantStatus === 'Served' ? 'bg-green-100 text-green-800' : ''}
                                                    `}>{o.warrantStatus}</span>
                                            </td>
                                            <td className="px-6 py-4">{o.warrantDate || '-'}</td>
                                            <td className="px-6 py-4">
                                                {o.warrantStatus === 'Submitted' && "Review, Custody Check, Serve"}
                                                {o.warrantStatus === 'Approved' && "Active Warrant"}
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                {o.warrantStatus === 'Submitted' && (
                                                    <button
                                                        onClick={() => handleUpdateWarrant(o.id, 'Approved')}
                                                        className="text-blue-600 hover:underline"
                                                    >Approve</button>
                                                )}
                                                {o.warrantStatus === 'Approved' && (
                                                    <button
                                                        onClick={() => handleUpdateWarrant(o.id, 'Served')}
                                                        className="text-green-600 hover:underline"
                                                    >Mark Served</button>
                                                )}
                                                <button
                                                    onClick={() => handleUpdateWarrant(o.id, 'Cleared')}
                                                    className="text-slate-400 hover:text-slate-600 text-xs"
                                                >Clear</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {warrantOffenders.length === 0 && (
                                        <tr><td colSpan="5" className="p-8 text-center text-slate-400">No active warrants found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Audits Tab */}
                {activeTab === 'audits' && (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">Audit logs and compliance checks will appear here.</p>
                        <p className="text-xs text-slate-400 font-mono mt-2">Feature coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfficeModule;
