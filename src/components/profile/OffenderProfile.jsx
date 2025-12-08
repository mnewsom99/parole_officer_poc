import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../core/context/UserContext';
import axios from 'axios';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, AlertTriangle, FileText, Activity, Shield, Beaker, Plus, CheckCircle, Clock, Trash2, Pin, PinOff, DollarSign, ExternalLink } from 'lucide-react';
import Modal from '../common/Modal';
import RiskAssessmentModal from '../modals/RiskAssessmentModal';

import { useParams, useNavigate } from 'react-router-dom';

const OffenderProfile = () => {
    const { offenderId } = useParams();
    const navigate = useNavigate();
    const { currentUser, caseNoteSettings } = useContext(UserContext);
    const [offender, setOffender] = useState(null);
    const noteTypes = caseNoteSettings?.types || [];

    const safeDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    };

    const [activeTab, setActiveTab] = useState('overview');
    const [showUAModal, setShowUAModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showRiskModal, setShowRiskModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    const [parolePlan, setParolePlan] = useState([
        { id: 1, title: 'Started Supervision', date: '2023-10-15', status: 'Completed' },
        { id: 2, title: 'Attend Orientation', date: '2023-10-20', status: 'Completed' },
        { id: 3, title: 'Complete Assessments', date: '2023-11-01', status: 'Pending' },
        { id: 4, title: 'Completed Parole', date: '2024-10-15', status: 'Not Due' },
    ]);
    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', date: '', status: 'Pending' });

    // Data States
    const [uaHistory, setUaHistory] = useState([]);
    const [notes, setNotes] = useState([]);
    const [riskFactors, setRiskFactors] = useState([]);
    const [riskHistory, setRiskHistory] = useState([]);

    const [appointments, setAppointments] = useState([]);

    const [programs, setPrograms] = useState([]);
    const [feeSummary, setFeeSummary] = useState({ balance: 0, history: [] });

    // Derived State: Recent Activity
    const recentActivity = React.useMemo(() => {
        const activity = [];

        // Add Notes
        notes?.forEach(n => activity.push({
            id: `note-${n.note_id}`,
            type: 'Note',
            title: n.type || 'Case Note',
            date: n.date,
            desc: n.content,
            color: 'bg-blue-500'
        }));

        // Add UA
        uaHistory?.forEach(u => activity.push({
            id: `ua-${u.test_id}`,
            type: 'UA',
            title: `UA Test: ${u.result || 'Pending'}`,
            date: u.date,
            desc: u.test_type,
            color: u.result === 'Positive' ? 'bg-red-500' : 'bg-green-500'
        }));

        // Add Appointments
        appointments?.forEach(a => activity.push({
            id: `appt-${a.appointment_id}`,
            type: 'Appt',
            title: a.type || 'Appointment',
            date: a.date_time,
            desc: a.status,
            color: 'bg-purple-500'
        }));

        return activity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    }, [notes, uaHistory, appointments]);

    const [newNoteContent, setNewNoteContent] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    // noteTypes derived from context now
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
    const [newNoteType, setNewNoteType] = useState('General');
    const [newAppointment, setNewAppointment] = useState({
        date: '',
        time: '',
        location: 'Field Office (Main St)',
        type: 'Routine Check-in',
        notes: ''
    });

    const itemsPerPage = 10;



    // fetchNoteTypes removed, utilizing UserContext


    const handlePinNote = async (noteId) => {
        try {
            const response = await axios.put(`http://localhost:8000/notes/${noteId}/pin`);
            setNotes(notes.map(n => n.note_id === noteId ? response.data : n));
        } catch (error) {
            console.error("Error pinning note:", error);
        }
    };

    const getNoteColor = (typeName) => {
        if (typeName === 'System') return 'bg-slate-100 text-slate-700 border-slate-200';
        const type = noteTypes.find(t => t.name === typeName);
        return type ? type.color : 'bg-slate-100 text-slate-700';
    };

    const fetchData = async () => {
        try {
            const [offenderRes, uaRes, notesRes, riskRes, apptRes, programsRes, feesRes] = await Promise.all([
                axios.get(`http://localhost:8000/offenders/${offenderId}`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/urinalysis`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/notes`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/risk`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/appointments`),

                axios.get(`http://localhost:8000/offenders/${offenderId}/programs`),
                axios.get(`http://localhost:8000/fees/${offenderId}`)
            ]);

            setOffender(offenderRes.data);
            setUaHistory(uaRes.data);
            setNotes(notesRes.data);

            // Process Risk Data
            setRiskHistory(riskRes.data);
            if (riskRes.data.length > 0) {
                const latestRisk = riskRes.data[0];
                const factors = Object.entries(latestRisk.details || {}).map(([category, score]) => ({
                    category,
                    score,
                    details: `${score} risk factor identified.`
                }));
                setRiskFactors(factors);
            }

            setAppointments(apptRes.data);
            setPrograms(programsRes.data);

            if (feesRes && feesRes.data) {
                setFeeSummary(feesRes.data);
            }


        } catch (error) {
            console.error("Error fetching offender data:", error);
        }
    };

    useEffect(() => {
        if (offenderId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchData();
        }
    }, [offenderId]);

    useEffect(() => {
        // Note types validation or fallback if needed
    }, []);

    if (!offender) {
        return <div className="p-8 text-center text-slate-500">Loading offender profile...</div>;
    }

    const handleUpdateTask = (id, field, value) => {
        setParolePlan(parolePlan.map(task =>
            task.id === id ? { ...task, [field]: value } : task
        ));
    };

    const handleAddTask = () => {
        if (newTask.title && newTask.date) {
            setParolePlan([
                ...parolePlan,
                { id: Date.now(), ...newTask }
            ]);
            setNewTask({ title: '', date: '', status: 'Pending' });
            setIsAddingTask(false);
        }
    };

    const handleDeleteTask = (id) => {
        setParolePlan(parolePlan.filter(task => task.id !== id));
    };



    const handleSaveChanges = () => {
        const changes = [];
        const fieldLabels = {
            phone: 'Phone Number',
            email: 'Email Address',
            gender: 'Gender',
            releaseType: 'Release Type',
            releaseDate: 'Start Date',
            address: 'Current Address',
            reversionDate: 'Reversion Date',
            gangAffiliation: 'Gang Affiliation',
            risk: 'Risk Level'
        };

        const officerName = currentUser?.name || 'Officer';

        Object.keys(editForm).forEach(key => {
            if (offender[key] !== editForm[key] && fieldLabels[key]) {
                const oldVal = offender[key] || 'empty';
                const newVal = editForm[key] || 'empty';

                changes.push({
                    field: fieldLabels[key],
                    oldVal,
                    newVal
                });
            }
        });

        if (changes.length > 0) {
            const newSystemNotes = changes.map((change, index) => ({
                note_id: Date.now() + index,
                type: 'System',
                content: `${officerName} changed ${change.field} from "${change.oldVal}" to "${change.newVal}" today.`,
                author: { first_name: 'System', last_name: 'Audit', id: 0 },
                date: new Date().toISOString().split('T')[0],
                isPinned: false
            }));

            setNotes(prevNotes => [...newSystemNotes, ...prevNotes]);
        }

        setOffender(editForm);
        setIsEditing(false);
    };

    const handleAddNote = async () => {
        if (!newNoteContent.trim()) return;

        try {
            const response = await axios.post(`http://localhost:8000/offenders/${offender.id}/notes`, {
                content: newNoteContent,
                type: newNoteType
            });

            setNotes([response.data, ...notes]);
            setNewNoteContent('');
            setCurrentPage(1);
        } catch (error) {
            console.error("Error adding note:", error);
        }
    };

    const handleScheduleAppointment = async () => {
        if (!newAppointment.date) return;

        try {
            const timeToUse = newAppointment.time || '09:00';
            const dateTime = `${newAppointment.date}T${timeToUse}:00`;
            const response = await axios.post(`http://localhost:8000/offenders/${offender.id}/appointments`, {
                date_time: dateTime,
                location: newAppointment.location,
                type: newAppointment.type,
                notes: newAppointment.notes
            });

            setAppointments([...appointments, response.data]);

            // Create automatic case note
            try {
                const noteContent = `Scheduled appointment for ${newAppointment.date} at ${timeToUse}.${newAppointment.notes ? ` Notes: ${newAppointment.notes}` : ''}`;
                const noteResponse = await axios.post(`http://localhost:8000/offenders/${offender.id}/notes`, {
                    content: noteContent,
                    type: 'Next Report Date'
                });
                setNotes([noteResponse.data, ...notes]);
            } catch (noteError) {
                console.error("Error creating automatic case note:", noteError);
            }

            setShowAppointmentModal(false);
            setNewAppointment({
                date: '',
                time: '',
                location: 'Field Office (Main St)',
                type: 'Routine Check-in',
                notes: ''
            });
        } catch (error) {
            console.error("Error scheduling appointment:", error);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
        { id: 'ua', label: 'Urine Analysis', icon: Activity },
        { id: 'fees', label: 'Costs & Fees', icon: DollarSign },
        { id: 'detail', label: 'Detail View', icon: Phone },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">Parole Plan</h3>
                                    <button
                                        onClick={() => setIsAddingTask(true)}
                                        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Add Task
                                    </button>
                                </div>

                                {isAddingTask && (
                                    <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 gap-3 mb-3">
                                            <input
                                                type="text"
                                                placeholder="Task Title"
                                                className="w-full p-2 border border-slate-200 rounded text-sm"
                                                value={newTask.title}
                                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            />
                                            <div className="flex gap-3">
                                                <input
                                                    type="date"
                                                    className="flex-1 p-2 border border-slate-200 rounded text-sm"
                                                    value={newTask.date}
                                                    onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                                                />
                                                <select
                                                    className="flex-1 p-2 border border-slate-200 rounded text-sm"
                                                    value={newTask.status}
                                                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Not Due">Not Due</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setIsAddingTask(false)}
                                                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAddTask}
                                                className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded"
                                            >
                                                Save Task
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6 max-h-64 overflow-y-auto pr-2">
                                    <div className="space-y-3">
                                        {parolePlan.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No tasks</p>
                                        )}
                                        {parolePlan
                                            .sort((a, b) => {
                                                // Sort by completion status first (Completed at bottom)
                                                if (a.status === 'Completed' && b.status !== 'Completed') return 1;
                                                if (a.status !== 'Completed' && b.status === 'Completed') return -1;

                                                // Then sort by date
                                                return new Date(a.date) - new Date(b.date);
                                            })
                                            .map(task => {
                                                const isPastDue = task.status === 'Pending' && new Date(task.date) < new Date();
                                                const dotColor = task.status === 'Completed' ? 'bg-green-500' :
                                                    isPastDue ? 'bg-red-500' :
                                                        task.status === 'Pending' ? 'bg-yellow-500' :
                                                            'bg-slate-300';

                                                return (
                                                    <div key={task.id} className="flex items-center gap-3 group hover:bg-slate-50 p-1 rounded -mx-1 transition-colors">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`}></div>

                                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                                            <span className={`text-xs font-medium truncate ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                                {task.title}
                                                            </span>
                                                            <span className="text-xs text-slate-400">-</span>
                                                            <input
                                                                type="date"
                                                                value={task.date}
                                                                onChange={(e) => handleUpdateTask(task.id, 'date', e.target.value)}
                                                                className="text-[10px] text-slate-500 bg-transparent border-none p-0 focus:ring-0 h-auto w-auto"
                                                            />
                                                        </div>

                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                            <select
                                                                value={task.status}
                                                                onChange={(e) => handleUpdateTask(task.id, 'status', e.target.value)}
                                                                className="text-[10px] border border-slate-200 rounded py-0.5 px-1 bg-white"
                                                            >
                                                                <option value="Completed">Done</option>
                                                                <option value="Pending">Pending</option>
                                                                <option value="Not Due">Later</option>
                                                            </select>
                                                            <button
                                                                onClick={() => handleDeleteTask(task.id)}
                                                                className="text-slate-400 hover:text-red-500 p-0.5"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4">Recent Activity</h3>
                                <div className="space-y-3">
                                    {recentActivity.length > 0 ? (
                                        recentActivity.map(item => (
                                            <div key={item.id} className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.color} shrink-0`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs font-medium text-slate-800 truncate">{item.title}</p>
                                                        <p className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                            {safeDate(item.date)}
                                                        </p>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">No recent activity.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4">Case Notes</h3>

                            <div className="mb-6">
                                <div className="flex gap-3 mb-3">
                                    <select
                                        value={newNoteType}
                                        onChange={(e) => setNewNoteType(e.target.value)}
                                        className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {noteTypes
                                            .filter(type => type.name !== 'System')
                                            .map(type => (
                                                <option key={type.name} value={type.name}>{type.name}</option>
                                            ))}
                                    </select>
                                </div>
                                <div className="flex gap-3">
                                    <textarea
                                        value={newNoteContent}
                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                        placeholder="Add a new note..."
                                        className="flex-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px] text-sm"
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNoteContent.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all text-sm"
                                    >
                                        Add Note
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-slate-800">Recent Notes</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Filter:</span>
                                    <select
                                        value={selectedTypeFilter}
                                        onChange={(e) => setSelectedTypeFilter(e.target.value)}
                                        className="text-xs border border-slate-200 rounded p-1 bg-white"
                                    >
                                        <option value="All">All Types</option>
                                        {noteTypes.map(type => (
                                            <option key={type.name} value={type.name}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {notes
                                    ?.filter(note => selectedTypeFilter === 'All' || note.type === selectedTypeFilter)
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map((note) => {
                                        const colorClasses = getNoteColor(note.type);
                                        const bgClass = colorClasses.split(' ').find(c => c.startsWith('bg-')) || 'bg-slate-50';

                                        return (
                                            <div key={note.note_id || note.id} className={`${bgClass} p-4 rounded-lg border border-slate-200/60`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-sm">
                                                            {note.type || 'General'}
                                                        </span>
                                                        <span className="text-xs text-slate-500">•</span>
                                                        <span className="font-medium text-slate-700 text-sm">
                                                            {note.author ? `${note.author.last_name}, ${note.author.first_name}` : 'Unknown'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500">{safeDate(note.date)}</span>
                                                        <button
                                                            onClick={() => handlePinNote(note.note_id)}
                                                            className={`transition-colors ${note.is_pinned ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                                            title={note.is_pinned ? "Unpin note" : "Pin to top"}
                                                        >
                                                            {note.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-800 leading-relaxed">{note.content}</p>
                                            </div>
                                        );
                                    })}
                            </div>

                            {notes.length > itemsPerPage && (
                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="text-sm text-slate-500 hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed font-medium px-3 py-1"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-slate-400 font-medium">
                                        Page {currentPage} of {Math.ceil(notes.length / itemsPerPage)}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(notes.length / itemsPerPage)))}
                                        disabled={currentPage === Math.ceil(notes.length / itemsPerPage)}
                                        className="text-sm text-slate-500 hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed font-medium px-3 py-1"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div >
                );
            case 'risk':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Risk Assessment History</h3>
                            <button
                                onClick={() => setShowRiskModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm"
                            >
                                Start New Assessment
                            </button>
                        </div>

                        {riskHistory.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Risk Level</th>
                                            <th className="px-6 py-3">Total Score</th>
                                            <th className="px-6 py-3">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {riskHistory.map((risk) => (
                                            <tr key={risk.assessment_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">{safeDate(risk.date)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${(risk.final_risk_level || risk.risk_level) === 'High' ? 'bg-red-100 text-red-700' :
                                                            (risk.final_risk_level || risk.risk_level) === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-green-100 text-green-700'
                                                            }`}>
                                                            {risk.final_risk_level || risk.risk_level}
                                                        </span>
                                                        {risk.final_risk_level && risk.final_risk_level !== risk.risk_level && (
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded border border-slate-200" title={risk.override_reason}>
                                                                Overridden (Calc: {risk.risk_level})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{risk.total_score}</td>
                                                <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                                                    {risk.details ? Object.keys(risk.details).length + " Factors Identified" : "No details"}
                                                    {risk.override_reason && (
                                                        <div className="text-[10px] text-slate-400 italic mt-0.5 truncate w-48">
                                                            Reason: {risk.override_reason}
                                                        </div>
                                                    )}
                                                </td>
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
                    </div>
                );
            case 'ua':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Urine Analysis History</h3>
                            <div className="flex gap-2">
                                <a
                                    href="https://example-lab-portal.com" // Placeholder
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2"
                                >
                                    <ExternalLink size={16} />
                                    Lab Portal
                                </a>
                                <button className="bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm">
                                    Request New Test
                                </button>
                            </div>
                        </div>

                        {uaHistory.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-700">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Test Type</th>
                                            <th className="px-6 py-3">Result</th>
                                            <th className="px-6 py-3">Collected By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {uaHistory.map((ua) => (
                                            <tr key={ua.test_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">{safeDate(ua.date)}</td>
                                                <td className="px-6 py-4 font-medium text-slate-800">{ua.test_type}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${ua.result === 'Positive' ? 'bg-red-100 text-red-700' :
                                                        ua.result === 'Negative' ? 'bg-green-100 text-green-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {ua.result}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {ua.collected_by ? `${ua.collected_by.last_name}, ${ua.collected_by.first_name}` : 'Unknown'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Activity className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">No Test History</h3>
                                <p className="text-slate-500 mb-6">No urinalysis records found for this offender.</p>
                            </div>
                        )}
                    </div>
                );
            case 'fees':
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
                                {feeSummary.history && feeSummary.history.length > 0 ? (
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
            case 'detail':
                return (
                    <div className="space-y-6">
                        {/* Personal & Supervision Info */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={18} className="text-blue-600" />
                                    Personal & Supervision Details
                                </h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => {
                                            setEditForm(JSON.parse(JSON.stringify(offender)));
                                            setIsEditing(true);
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Edit Profile
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveChanges}
                                            className="text-xs bg-blue-600 text-white hover:bg-blue-700 px-3 py-1 rounded font-medium"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Demographics & Contact</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                <Phone size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 font-medium">Primary Phone</p>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        value={editForm.phone || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                        className="w-full text-sm font-semibold text-slate-800 border-b border-blue-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-semibold text-slate-800">{offender.phone}</p>
                                                )}
                                                <p className="text-xs text-slate-400">Mobile</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                <Mail size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 font-medium">Email Address</p>
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        value={editForm.email || `${editForm.name?.toLowerCase().replace(', ', '.')}@email.com`}
                                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                        className="w-full text-sm font-semibold text-slate-800 border-b border-blue-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-semibold text-slate-800">{offender.name.toLowerCase().replace(', ', '.')}@email.com</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-medium">Age</p>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value="39"
                                                            disabled
                                                            className="w-12 text-sm font-semibold text-slate-400 border-b border-transparent bg-transparent cursor-not-allowed"
                                                        />
                                                    ) : (
                                                        "39"
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <p className="text-xs text-slate-500">Gender</p>
                                                {isEditing ? (
                                                    <select
                                                        value={editForm.gender || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                                        className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none bg-transparent"
                                                    >
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-800">{offender.gender || 'Not Specified'}</p>
                                                )}
                                            </div>
                                            {offender.isSexOffender && (
                                                <div className="col-span-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                                        Sex Offender Registry
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Supervision Status</h4>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500">Release Type</p>
                                                {isEditing ? (
                                                    <select
                                                        value={editForm.releaseType || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, releaseType: e.target.value })}
                                                        className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none bg-transparent"
                                                    >
                                                        <option value="Parole">Parole</option>
                                                        <option value="Probation">Probation</option>
                                                        <option value="Mandatory Supervision">Mandatory Supervision</option>
                                                        <option value="Transition">Transition</option>
                                                    </select>
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-800">{offender.releaseType || 'Parole'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Start Date</p>
                                                {isEditing ? (
                                                    <input
                                                        type="date"
                                                        value={editForm.releaseDate || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, releaseDate: e.target.value })}
                                                        className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-800">{offender.releaseDate || 'N/A'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Current Address</p>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.address || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                        className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-800">{offender.address || 'N/A'}</p>
                                                )}
                                            </div>
                                            {offender.releaseType === 'Transition' && (
                                                <div>
                                                    <p className="text-xs text-slate-500 font-bold text-orange-600">Reversion Date</p>
                                                    {isEditing ? (
                                                        <input
                                                            type="date"
                                                            value={editForm.reversionDate || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, reversionDate: e.target.value })}
                                                            className="w-full text-sm font-bold text-orange-700 border-b border-orange-500 focus:outline-none"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-orange-700">{offender.reversionDate || 'TBD'}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {offender.isGangMember && (
                                            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <AlertTriangle size={14} className="text-amber-500" />
                                                    <span className="text-xs font-bold text-slate-700">Gang Affiliation</span>
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.gangAffiliation || ''}
                                                        onChange={(e) => setEditForm({ ...editForm, gangAffiliation: e.target.value })}
                                                        className="w-full text-sm font-medium text-slate-800 border-b border-amber-500 focus:outline-none bg-transparent"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-slate-800">{offender.gangAffiliation}</p>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-4">
                                            <p className="text-xs text-slate-500 mb-1">Risk Assessment (ORAS)</p>
                                            {isEditing ? (
                                                <select
                                                    value={editForm.risk || 'Low'}
                                                    onChange={(e) => setEditForm({ ...editForm, risk: e.target.value })}
                                                    className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none bg-transparent"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${offender.risk === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        offender.risk === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-green-50 text-green-700 border-green-200'
                                                        }`}>
                                                        {offender.risk} Risk
                                                    </span>
                                                    <span className="text-xs text-slate-400">(See Risk Tab for details)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Programs & Interventions */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity size={18} className="text-blue-600" />
                                    Programs & Interventions
                                </h3>
                                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add Program</button>
                            </div>

                            {programs && programs.length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {programs.map(prog => (
                                        <div key={prog.program_id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${prog.category === 'Sanction' ? 'bg-red-100 text-red-700' :
                                                        prog.category === 'Treatment' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>{prog.category}</span>
                                                    <span className="text-sm font-semibold text-slate-800">{prog.name}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">Provider: {prog.provider} • {prog.start_date ? `Started: ${prog.start_date}` : 'Not started'}</p>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${prog.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                prog.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-200 text-slate-600'
                                                }`}>
                                                {prog.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-500">No active programs or interventions.</p>
                                </div>
                            )}
                        </div>

                        {/* Housing (Existing) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <MapPin size={18} className="text-blue-600" />
                                Housing Details
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-slate-800">
                                        {offender.housingType} Residence
                                    </span>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200">
                                        Approved
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">{offender.address}</p>
                                {offender.city && <p className="text-sm text-slate-600">{offender.city}, {offender.state} {offender.zip}</p>}
                                <p className="text-xs text-slate-400 mt-2">Standard private residence. No facility services provided.</p>
                            </div>
                        </div>

                        {/* General Comments */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">General Comments</h3>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {offender.generalComments || "No general comments recorded for this offender."}
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const nextAppointment = appointments
        .filter(a => new Date(a.date_time) > new Date())
        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))[0];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => navigate('/caseload')}
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
                <ArrowLeft size={18} />
                <span className="font-medium">Back to Caseload</span>
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-20 bg-navy-900 relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
                <div className="px-6 pb-4">
                    <div className="flex flex-col md:flex-row items-center md:items-end -mt-8 gap-4">
                        <img
                            src={offender.image}
                            alt={offender.name}
                            className="w-20 h-20 rounded-xl border-4 border-white shadow-md object-cover bg-slate-200 relative"
                        />
                        <div className="flex-1 mb-1 text-center md:text-left">
                            <div className="flex items-center gap-2 mb-0.5 justify-center md:justify-start">
                                <h1 className="text-xl font-bold text-slate-900">{offender.name}</h1>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${offender.risk === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                                    offender.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                        'bg-green-100 text-green-700 border-green-200'
                                    }`}>
                                    {offender.risk} Risk
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 text-xs justify-center md:justify-start">
                                <span>ID: {offender.badgeId}</span>
                                <span>•</span>
                                <span>Status: {offender.status}</span>
                                <span>•</span>
                                <button
                                    onClick={() => setShowAppointmentModal(true)}
                                    className="hover:text-blue-600 hover:underline transition-colors"
                                >
                                    Next: {nextAppointment ? safeDate(nextAppointment.date_time) : 'None'}
                                </button>
                            </div>
                        </div>
                        <div className="mb-1 flex gap-2">
                            <button
                                onClick={() => setShowNotesModal(true)}
                                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-3 rounded text-xs shadow-sm transition-all"
                            >
                                Add Note
                            </button>
                            <button
                                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-3 rounded text-xs shadow-sm transition-all flex items-center gap-1"
                            >
                                <Mail size={14} />
                                Email
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded text-xs shadow-sm shadow-blue-600/20 transition-all">
                                Text
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 border-b border-slate-200">
                        <nav className="flex gap-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-2 flex items-center gap-1.5 font-medium text-xs transition-all relative ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        {tab.label}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-4">
                        {renderTabContent()}
                    </div>
                </div>
            </div>


            <Modal
                isOpen={showUAModal}
                onClose={() => setShowUAModal(false)}
                title="Urinalysis History"
            >
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                            Showing recent test results for <span className="font-semibold text-slate-900">{offender.name}</span>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                            + Record New Test
                        </button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Type</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Result</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Lab</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Collected By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {uaHistory?.map((test) => (
                                    <tr key={test.test_id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-600">{test.date}</td>
                                        <td className="px-4 py-3 text-slate-600">{test.test_type}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${test.result.includes('Positive')
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {test.result}
                                            </span>
                                            {test.notes && (
                                                <div className="text-xs text-slate-400 mt-1">{test.notes}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{test.lab_name}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {test.collected_by ? `${test.collected_by.last_name}, ${test.collected_by.first_name}` : 'Unknown'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showNotesModal}
                onClose={() => setShowNotesModal(false)}
                title="Case Notes"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Add New Note</label>
                        <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                            placeholder="Type note content here..."
                        ></textarea>
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handleAddNote}
                                disabled={!newNoteContent.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-bold text-slate-800 mb-4">Recent Notes</h4>
                        <div className="space-y-4">
                            {notes.map((note) => (
                                <div key={note.note_id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-slate-700 text-sm">
                                            {note.author ? `${note.author.last_name}, ${note.author.first_name}` : 'Unknown'}
                                        </span>
                                        <span className="text-xs text-slate-500">{safeDate(note.date)}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{note.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            <RiskAssessmentModal
                isOpen={showRiskModal}
                onClose={() => setShowRiskModal(false)}
                offenderId={offenderId}
                onSuccess={() => {
                    fetchData(); // Refresh risk history
                }}
            />

            <Modal
                isOpen={showAppointmentModal}
                onClose={() => setShowAppointmentModal(false)}
                title="Schedule Next Appointment"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                            <input
                                type="date"
                                value={newAppointment.date}
                                onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Time (Optional)</label>
                            <input
                                type="time"
                                value={newAppointment.time}
                                onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                        <select
                            value={newAppointment.location}
                            onChange={(e) => setNewAppointment({ ...newAppointment, location: e.target.value })}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        >
                            <option>Field Office (Main St)</option>
                            <option>Home Visit</option>
                            <option>Employment Site</option>
                            <option>Virtual / Phone</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Appointment Type</label>
                        <select
                            value={newAppointment.type}
                            onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        >
                            <option>Routine Check-in</option>
                            <option>Risk Assessment Review</option>
                            <option>UA Testing</option>
                            <option>Case Plan Update</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                        <textarea
                            value={newAppointment.notes}
                            onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px]"
                            placeholder="Additional instructions..."
                        ></textarea>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            onClick={() => setShowAppointmentModal(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleScheduleAppointment}
                            disabled={!newAppointment.date}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg shadow-lg shadow-blue-600/20 transition-all"
                        >
                            Schedule Appointment
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OffenderProfile;
