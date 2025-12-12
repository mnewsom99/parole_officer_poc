import React, { useState, useEffect, useContext } from 'react';

import { UserContext } from '../../core/context/UserContext';
import axios from 'axios';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, FileText, Activity, Shield, Plus, Clock, Pin, PinOff, ChevronRight, X, Paperclip, CheckSquare } from 'lucide-react';
import Modal from '../common/Modal';

import TaskModal from '../modals/TaskModal';
import ModuleRegistry from '../../core/ModuleRegistry';
import PersonalDetailsTab from './tabs/PersonalDetailsTab';
import { useParams, useNavigate } from 'react-router-dom';

const OffenderProfile = () => {
    const { offenderId } = useParams();
    const navigate = useNavigate();
    const { currentUser, caseNoteSettings, offenderFlagSettings, housingTypeSettings } = useContext(UserContext);
    const [offender, setOffender] = useState(null);
    const noteTypes = caseNoteSettings?.types || [];

    const safeDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
    };

    const [activeTab, setActiveTab] = useState('overview');
    const [showNotesModal, setShowNotesModal] = useState(false);
    // Employment State moved to PersonalDetailsTab
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    // Housing State moved to PersonalDetailsTab

    // --- Task / Parole Plan State ---
    const [parolePlanTasks, setParolePlanTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedTaskFile, setSelectedTaskFile] = useState(null);

    // Editing State moved to PersonalDetailsTab

    // Data States
    const [notes, setNotes] = useState([]);

    const [appointments, setAppointments] = useState([]);

    const [programs, setPrograms] = useState([]);

    // Derived State: Recent Activity
    const recentActivity = React.useMemo(() => {
        const activity = [];

        // Add Notes
        if (Array.isArray(notes)) {
            notes.forEach(n => activity.push({
                id: `note-${n.note_id}`,
                type: 'Note',
                title: n.type || 'Case Note',
                date: n.date,
                desc: n.content,
                color: 'bg-blue-500'
            }));
        }

        // UA Logic Removed for Modularity


        // Add Appointments
        if (Array.isArray(appointments)) {
            appointments.forEach(a => activity.push({
                id: `appt-${a.appointment_id}`,
                type: 'Appt',
                title: a.type || 'Appointment',
                date: a.date_time,
                desc: a.status,
                color: 'bg-purple-500'
            }));
        }

        return activity.sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return dateB - dateA;
        }).slice(0, 5);
    }, [notes, appointments]);

    const [newNoteContent, setNewNoteContent] = useState('');
    const [selectedFile, setSelectedFile] = useState(null); // New State
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



    // Employment & Move handlers moved to PersonalDetailsTab

    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setError(null);
            // Fetch core offender data first (Critical)
            const offenderRes = await axios.get(`http://localhost:8000/offenders/${offenderId}`);
            setOffender(offenderRes.data);

            // Fetch related data in parallel (Non-critical)
            const results = await Promise.allSettled([
                axios.get(`http://localhost:8000/offenders/${offenderId}/notes`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/appointments`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/programs`),
                // NEW: Fetch Tasks for this offender
                axios.get(`http://localhost:8000/tasks?offender_id=${offenderId}`)
            ]);

            const [notesRes, apptRes, programsRes, tasksRes] = results;

            if (notesRes.status === 'fulfilled') setNotes(notesRes.value.data);

            if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.data);
            if (programsRes.status === 'fulfilled') setPrograms(programsRes.value.data);
            if (tasksRes.status === 'fulfilled') setParolePlanTasks(tasksRes.value.data);

        } catch (error) {
            console.error("Error fetching offender data:", error);
            if (error.response && error.response.status === 404) {
                setError("Offender not found. The database may have been reset. Please return to the Caseload.");
            } else {
                setError("Failed to load offender profile. Please try again.");
            }
        }
    };

    useEffect(() => {
        if (offenderId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchData();
        }
    }, [offenderId]);

    // useEffect for employment status moved to PersonalDetailsTab

    useEffect(() => {
        // Note types validation or fallback if needed
    }, []);

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
                    <p className="font-bold">Error Loading Profile</p>
                    <p className="text-sm">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-3 text-sm underline hover:text-red-800"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    if (!offender) {
        return <div className="p-8 text-center text-slate-500">Loading offender profile...</div>;
    }

    const handleUpdateTask = (id, field, value) => {
        setParolePlanTasks(parolePlanTasks.map(task =>
            task.task_id === id ? { ...task, [field]: value } : task
        ));
    };





    // handleSaveChanges moved to PersonalDetailsTab

    const handleAddNote = async () => {
        if (!newNoteContent.trim()) return;

        try {
            // 1. Create Note
            const response = await axios.post(`http://localhost:8000/offenders/${offender.id}/notes`, {
                content: newNoteContent,
                type: newNoteType
            });

            const createdNote = response.data;

            // 2. Upload Attachment if present
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("offender_id", offenderId);
                formData.append("uploaded_by_id", currentUser?.officerId || 'unknown');
                formData.append("note_id", createdNote.note_id);
                formData.append("category", "Note Attachment");

                await axios.post('http://localhost:8000/documents/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setNotes([createdNote, ...notes]);
            setNewNoteContent('');
            setSelectedFile(null); // Reset file
            setCurrentPage(1);
            setShowNotesModal(false); // Close modal
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
        { id: 'detail', label: 'Detail View', icon: Phone },
        ...ModuleRegistry.getTabs(),
    ];



    const renderTabContent = () => {
        // Dynamic Module Rendering from Registry
        const registeredModule = ModuleRegistry.getTabs().find(t => t.id === activeTab);
        if (registeredModule) {
            const Component = registeredModule.component;
            return <Component offenderId={offenderId} />;
        }

        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Parole Plan / Tasks */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">Parole Plan Objectives</h3>
                                    <button
                                        onClick={() => {
                                            setSelectedTask(null);
                                            setShowTaskModal(true);
                                        }}
                                        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Add Task
                                    </button>
                                </div>

                                <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                                    {/* Objectives Section */}
                                    <div className="space-y-3">
                                        {parolePlanTasks.filter(t => t.is_parole_plan).length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No objectives set.</p>
                                        )}
                                        {parolePlanTasks
                                            .filter(t => t.is_parole_plan)
                                            .sort((a, b) => new Date(a.due_date || a.created_at) - new Date(b.due_date || b.created_at))
                                            .map(task => (
                                                <div
                                                    key={task.task_id}
                                                    onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
                                                    className="flex items-center gap-3 bg-violet-50 border border-violet-100 p-3 rounded-lg cursor-pointer hover:bg-violet-100 transition-colors"
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-violet-500'} shrink-0`}></div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                        <p className="text-xs text-slate-500">{task.description}</p>
                                                    </div>
                                                    {task.status === 'Completed' && <CheckSquare size={16} className="text-green-600" />}
                                                </div>
                                            ))
                                        }
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <h4 className="text-sm font-bold text-slate-700 mb-3">Tasks & To-Dos</h4>
                                        <div className="space-y-3">
                                            {parolePlanTasks.filter(t => !t.is_parole_plan).length === 0 && (
                                                <p className="text-xs text-slate-400 italic">No pending tasks.</p>
                                            )}
                                            {parolePlanTasks
                                                .filter(t => !t.is_parole_plan)
                                                .sort((a, b) => {
                                                    if (a.status === 'Completed' && b.status !== 'Completed') return 1;
                                                    if (a.status !== 'Completed' && b.status === 'Completed') return -1;
                                                    return new Date(a.due_date || a.created_at) - new Date(b.due_date || b.created_at);
                                                })
                                                .map(task => {
                                                    const taskDate = task.due_date ? new Date(task.due_date) : null;
                                                    const isPastDue = task.status === 'Pending' && taskDate && taskDate < new Date();
                                                    const dotColor = task.status === 'Completed' ? 'bg-green-500' :
                                                        isPastDue ? 'bg-red-500' :
                                                            task.status === 'Pending' ? 'bg-yellow-500' :
                                                                'bg-slate-300';

                                                    return (
                                                        <div
                                                            key={task.task_id}
                                                            onClick={() => {
                                                                setSelectedTask(task);
                                                                setShowTaskModal(true);
                                                            }}
                                                            className="flex items-center gap-3 group hover:bg-slate-50 p-2 rounded -mx-2 transition-colors cursor-pointer"
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${dotColor} shrink-0`}></div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-sm font-medium truncate ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                                        {task.title}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                                    <Calendar size={10} />
                                                                    <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date'}</span>
                                                                    {task.status === 'Completed' && <span className="text-green-600 font-medium ml-2">Done</span>}
                                                                </div>
                                                            </div>

                                                            <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-400" />
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Column */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4">Recent Activity</h3>
                                <div className="space-y-4 relative pl-2">
                                    <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-slate-100"></div>
                                    {recentActivity.map(item => (
                                        <div key={item.id} className="relative flex gap-4">
                                            <div className={`w-2.5 h-2.5 rounded-full ${item.color} mt-1.5 shrink-0 z-10 border-2 border-white box-content`}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-medium text-sm text-slate-800">{item.title}</p>
                                                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                                        {item.date ? new Date(item.date).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate mt-0.5">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {recentActivity.length === 0 && (
                                        <p className="text-xs text-slate-400 italic">No recent activity.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Case Notes Section (Reused) */}
                        <div className="mt-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
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
                    </div>
                );
            // Modules are handled dynamically above
            case 'detail':
                return <PersonalDetailsTab offender={offender} onRefresh={fetchData} />;
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

            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg border border-indigo-500/50 overflow-hidden text-white relative">
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                <div className="relative px-6 pt-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                        {/* Avatar */}
                        <div className="shrink-0 relative">
                            <img
                                src={offender.image && !offender.image.includes('ui-avatars') ? offender.image : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                                alt={offender.name}
                                className="w-24 h-24 rounded-xl border-4 border-white/20 shadow-lg object-cover bg-indigo-800"
                            />
                            {offender.risk && (
                                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-indigo-600 flex items-center justify-center ${offender.risk === 'High' ? 'bg-red-500' :
                                    offender.risk === 'Medium' ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                    }`} title={`${offender.risk} Risk`}>
                                    <Activity size={12} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold tracking-tight text-white">{offender.name}</h1>
                                {offender.housing_status === 'Home Arrest' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-400/50 bg-red-500/20 text-red-50 shadow-sm flex items-center gap-1">
                                        <MapPin size={10} /> Home Arrest
                                    </span>
                                )}
                            </div>

                            {/* ID Line */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-indigo-100 text-sm font-medium mb-4">
                                <span className="flex items-center gap-1.5 opacity-90"><Shield size={14} /> ID: {offender.badgeId}</span>
                                <span className="flex items-center gap-1.5 opacity-90"><Activity size={14} /> Status: {offender.status}</span>
                                {offender.csed_date && (
                                    <span className="flex items-center gap-1.5 opacity-90"><Calendar size={14} /> CSED: {safeDate(offender.csed_date)}</span>
                                )}
                                <button
                                    onClick={() => setShowAppointmentModal(true)}
                                    className="flex items-center gap-1.5 hover:text-white hover:bg-white/10 px-2 py-0.5 -ml-2 rounded transition-all"
                                >
                                    <Clock size={14} />
                                    Next: {nextAppointment ? safeDate(nextAppointment.date_time) : 'Schedule'}
                                </button>
                            </div>

                            {/* Flags */}
                            <div className="flex flex-wrap items-center gap-2">
                                {offender.special_flags && offender.special_flags.map((flagName, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-white/20 bg-white/10 text-white shadow-sm flex items-center backdrop-blur-sm">
                                        {flagName === 'GPS' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>}
                                        {flagName}
                                    </span>
                                ))}
                                {offender.icots_number && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm">
                                        ICOTS: {offender.icots_number}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                onClick={() => setShowNotesModal(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all backdrop-blur-sm shadow-sm"
                            >
                                <FileText size={16} />
                                <span className="md:hidden lg:inline">Add Note</span>
                            </button>
                            <div className="flex gap-2">
                                <button className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all backdrop-blur-sm shadow-sm" title="Send Email">
                                    <Mail size={16} />
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all backdrop-blur-sm shadow-sm" title="Call">
                                    <Phone size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Physical Folder Tabs */}
                    <div className="flex gap-0.5 overflow-x-auto no-scrollbar pt-6 -mx-6 px-6 relative top-[1px]">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
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
                                    <Icon size={16} className={isActive ? 'text-violet-600' : 'text-indigo-200 group-hover:text-white transition-colors'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-0 animation-fade-in-up">
                {renderTabContent()}
            </div>



            <Modal
                isOpen={showNotesModal}
                onClose={() => setShowNotesModal(false)}
                title="Case Notes"
            >
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Add New Note</label>
                        <div className="mb-3">
                            <select
                                value={newNoteType}
                                onChange={(e) => setNewNoteType(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-sm"
                            >
                                {noteTypes
                                    .filter(type => type.name !== 'System')
                                    .map(type => (
                                        <option key={type.name} value={type.name}>{type.name}</option>
                                    ))}
                            </select>
                        </div>
                        <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                            placeholder="Type note content here..."
                        ></textarea>

                        {/* File Attachment */}
                        <div className="mt-3">
                            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-blue-600 transition-colors w-fit">
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                                <div className="p-1.5 bg-slate-100 rounded-lg">
                                    <Paperclip size={16} />
                                </div>
                                <span>{selectedFile ? selectedFile.name : "Attach a file (optional)"}</span>
                                {selectedFile && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedFile(null);
                                        }}
                                        className="text-red-500 hover:text-red-700 ml-2"
                                        title="Remove attachment"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </label>
                        </div>
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



            {/* Employment Modal removed - logic moved to PersonalDetailsTab */}

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

            <TaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                task={selectedTask}
                selectedFile={selectedTaskFile}
                setSelectedFile={setSelectedTaskFile}
                onSuccess={() => {
                    fetchData(); // Refresh all data including tasks
                    setShowTaskModal(false);
                }}
                context={{
                    offender_id: offenderId,
                    assigned_officer_id: currentUser?.officerId
                }}
            />
            {/* Move Modal */}
            {/* Move Modal removed - logic moved to PersonalDetailsTab */}
        </div>
    );
};

export default OffenderProfile;
