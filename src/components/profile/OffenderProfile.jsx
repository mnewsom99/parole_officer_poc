import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { UserContext } from '../../core/context/UserContext';
import axios from 'axios';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, AlertTriangle, FileText, Activity, Shield, Beaker, Plus, CheckCircle, Clock, Trash2, Pin, PinOff, DollarSign, ExternalLink, MoreHorizontal, ChevronRight, ChevronLeft, X, Flag, Briefcase, Paperclip, Clipboard } from 'lucide-react';
import Modal from '../common/Modal';

import TaskModal from '../modals/TaskModal'; // Import
import DocumentsTab from '../../modules/documents/DocumentsTab';
import UATab from '../../modules/urinalysis/UATab';
import RiskTab from '../../modules/assessments/RiskTab';
import FeesTab from '../../modules/finance/FeesTab';
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
    const [showEmploymentModal, setShowEmploymentModal] = useState(false); // New
    const [employmentStatus, setEmploymentStatus] = useState('Unemployed'); // New
    const [unemployableReason, setUnemployableReason] = useState(''); // New
    const [newEmployment, setNewEmployment] = useState({
        employer_name: '',
        address_line_1: '',
        supervisor: '',
        phone: '',
        pay_rate: '',
        is_current: true
    });
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    // Housing / Move State
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [moveForm, setMoveForm] = useState({
        address_line_1: '',
        city: '',
        state: 'AZ',
        zip_code: '',
        start_date: new Date().toISOString().split('T')[0],
        housing_type: 'Residence',
        notes: ''
    });

    // --- Task / Parole Plan State ---
    const [parolePlanTasks, setParolePlanTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedTaskFile, setSelectedTaskFile] = useState(null);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

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

    const handleUpdateEmploymentStatus = async (status, reason = '') => {
        try {
            await axios.put(`http://localhost:8000/offenders/${offenderId}/employment-status`, { status, reason });
            setEmploymentStatus(status);
            setUnemployableReason(reason);
            // Updating local offender object reference
            setOffender(prev => ({ ...prev, employment_status: status, unemployable_reason: reason }));
        } catch (error) {
            console.error("Error updating employment status:", error);
        }
    };

    const handleAddEmployment = async () => {
        try {
            await axios.post(`http://localhost:8000/offenders/${offenderId}/employment`, newEmployment);
            setShowEmploymentModal(false);
            fetchData();
            setNewEmployment({
                employer_name: '',
                address_line_1: '',
                city: '',
                state: '',
                zip_code: '',
                supervisor: '',
                phone: '',
                pay_rate: '',
                is_current: true
            });
        } catch (error) {
            console.error("Error adding employment:", error);
        }
    }


    const handleMoveOffender = async () => {
        try {
            await axios.post(`http://localhost:8000/offenders/${offenderId}/residences/move`, moveForm);
            setShowMoveModal(false);
            fetchData(); // Refresh data
            // Reset form
            setMoveForm({
                address_line_1: '',
                city: '',
                state: 'AZ',
                zip_code: '',
                start_date: new Date().toISOString().split('T')[0],
                housing_type: 'Residence',
                notes: ''
            });
        } catch (error) {
            console.error("Error moving offender:", error);
        }
    };

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

    useEffect(() => {
        if (offender) {
            setEmploymentStatus(offender.employment_status || 'Unemployed');
            setUnemployableReason(offender.unemployable_reason || '');
        }
    }, [offender]);

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

    const handleAddTask = () => {
        // This function is no longer directly used for adding tasks via inline form.
        // TaskModal handles adding/editing.
    };

    const handleDeleteTask = (id) => {
        // This function is no longer directly used for deleting tasks via inline button.
        // TaskModal handles deleting.
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
        { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
        { id: 'ua', label: 'Drug Testing', icon: Activity },
        { id: 'fees', label: 'Costs & Fees', icon: DollarSign },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'detail', label: 'Detail View', icon: Phone },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Parole Plan / Tasks */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">Parole Plan</h3>
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

                                <div className="space-y-6 max-h-64 overflow-y-auto pr-2">
                                    <div className="space-y-3">
                                        {parolePlanTasks.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No tasks found for this offender.</p>
                                        )}
                                        {parolePlanTasks
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
            case 'risk':
                return <RiskTab offenderId={offenderId} />;
            case 'ua':
                return <UATab offenderId={offenderId} />;
            case 'fees':
                return <FeesTab offenderId={offenderId} />;
            case 'documents':
                return <DocumentsTab offenderId={offenderId} />;
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
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs text-slate-500">Current Address</p>
                                                    {!isEditing && (
                                                        <button
                                                            onClick={() => setShowMoveModal(true)}
                                                            className="text-[10px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                                                        >
                                                            <MapPin size={10} />
                                                            Move
                                                        </button>
                                                    )}
                                                </div>
                                                {isEditing ? (
                                                    <div className="space-y-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Street"
                                                            value={editForm.address || ''}
                                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                            className="w-full text-sm font-medium text-slate-800 border-b border-blue-500 focus:outline-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{offender.address || 'N/A'}</p>
                                                        {offender.housingType && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 mt-1">
                                                                {offender.housingType}
                                                            </span>
                                                        )}
                                                    </div>
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

                                        {/* Housing History */}
                                        <div className="mt-6 border-t border-slate-100 pt-4">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Housing History</h4>
                                            <div className="space-y-3">
                                                {offender.residenceHistory?.map((res, idx) => (
                                                    <div key={idx} className="flex gap-3 text-sm">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`w-2 h-2 rounded-full ${res.isCurrent ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                            {idx !== offender.residenceHistory.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>}
                                                        </div>
                                                        <div className="flex-1 pb-2">
                                                            <p className="text-slate-800 font-medium">{res.address}, {res.city}</p>
                                                            <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                                                                <span>{safeDate(res.startDate)} - {res.endDate ? safeDate(res.endDate) : 'Present'}</span>
                                                                <span className="px-1.5 rounded bg-slate-100 text-slate-600">{res.housingType}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!offender.residenceHistory || offender.residenceHistory.length === 0) && (
                                                    <p className="text-xs text-slate-400 italic">No history available.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-xs text-slate-500">Employment Status</p>
                                                <button
                                                    onClick={() => setShowEmploymentModal(true)}
                                                    className="text-[10px] text-blue-600 font-medium hover:text-blue-700"
                                                >
                                                    Manage
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={`p-1.5 rounded-full ${employmentStatus === 'Employed' ? 'bg-green-100 text-green-700' :
                                                    employmentStatus === 'Unemployed' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    <Briefcase size={14} />
                                                </div>
                                                <select
                                                    value={employmentStatus}
                                                    onChange={(e) => handleUpdateEmploymentStatus(e.target.value, unemployableReason)}
                                                    className="text-sm font-semibold text-slate-800 bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none"
                                                >
                                                    <option value="Employed">Employed</option>
                                                    <option value="Unemployed">Unemployed</option>
                                                    <option value="Unemployable">Unemployable</option>
                                                </select>
                                            </div>

                                            {employmentStatus === 'Unemployable' && (
                                                <select
                                                    value={unemployableReason}
                                                    onChange={(e) => handleUpdateEmploymentStatus('Unemployable', e.target.value)}
                                                    className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-1 mb-2 outline-none"
                                                >
                                                    <option value="">Select Reason...</option>
                                                    <option value="SSI">SSI (Disability)</option>
                                                    <option value="SMI">SMI (Mental Health)</option>
                                                    <option value="Retired">Retired</option>
                                                    <option value="Treatment">In Treatment</option>
                                                    <option value="Student">Student</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            )}

                                            {employmentStatus === 'Employed' && offender.employments && offender.employments.filter(e => e.is_current).map(emp => (
                                                <div key={emp.employment_id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-1 mb-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-bold text-slate-800">{emp.employer_name}</span>
                                                        <span className="text-xs text-slate-500">{emp.pay_rate}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-600 flex items-center gap-1">
                                                        <MapPin size={10} /> {emp.address_line_1}, {emp.city}
                                                    </div>
                                                    <div className="text-xs text-slate-600 flex items-center gap-1">
                                                        <Phone size={10} /> {emp.phone}
                                                    </div>
                                                    {emp.supervisor && <div className="text-xs text-slate-500">Sup: {emp.supervisor}</div>}
                                                </div>
                                            ))}

                                            {employmentStatus === 'Employed' && (!offender.employments || !offender.employments.some(e => e.is_current)) && (
                                                <div className="p-2 border border-dashed border-slate-300 rounded text-center">
                                                    <button onClick={() => setShowEmploymentModal(true)} className="text-xs text-blue-600 font-medium">+ Add Employer Details</button>
                                                </div>
                                            )}
                                        </div>

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
                    </div >
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

            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl shadow-lg border border-indigo-500/50 overflow-hidden text-white relative">
                {/* Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                <div className="relative px-6 pt-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                        {/* Avatar */}
                        <div className="shrink-0 relative">
                            <img
                                src={offender.image}
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



            <Modal
                isOpen={showEmploymentModal}
                onClose={() => setShowEmploymentModal(false)}
                title="Add Employment Details"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Employer Name</label>
                        <input
                            value={newEmployment.employer_name}
                            onChange={e => setNewEmployment({ ...newEmployment, employer_name: e.target.value })}
                            className="w-full p-2 border rounded-lg outline-none focus:border-blue-500"
                            placeholder="e.g. Acme Corp"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                            <input
                                value={newEmployment.address_line_1}
                                onChange={e => setNewEmployment({ ...newEmployment, address_line_1: e.target.value })}
                                className="w-full p-2 border rounded-lg outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                            <input
                                value={newEmployment.city}
                                onChange={e => setNewEmployment({ ...newEmployment, city: e.target.value })}
                                className="w-full p-2 border rounded-lg outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                            <input
                                value={newEmployment.phone}
                                onChange={e => setNewEmployment({ ...newEmployment, phone: e.target.value })}
                                className="w-full p-2 border rounded-lg outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supervisor</label>
                            <input
                                value={newEmployment.supervisor}
                                onChange={e => setNewEmployment({ ...newEmployment, supervisor: e.target.value })}
                                className="w-full p-2 border rounded-lg outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pay Rate (e.g. $15/hr)</label>
                        <input
                            value={newEmployment.pay_rate}
                            onChange={e => setNewEmployment({ ...newEmployment, pay_rate: e.target.value })}
                            className="w-full p-2 border rounded-lg outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => setShowEmploymentModal(false)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddEmployment}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                        >
                            Save Employment
                        </button>
                    </div>
                </div>
            </Modal>

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
            {showMoveModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Change Address / Move</h3>
                            <button onClick={() => setShowMoveModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Address</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="123 New St"
                                    value={moveForm.address_line_1}
                                    onChange={e => setMoveForm({ ...moveForm, address_line_1: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        placeholder="Phoenix"
                                        value={moveForm.city}
                                        onChange={e => setMoveForm({ ...moveForm, city: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        placeholder="AZ"
                                        value={moveForm.state}
                                        onChange={e => setMoveForm({ ...moveForm, state: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zip</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        placeholder="85001"
                                        value={moveForm.zip_code}
                                        onChange={e => setMoveForm({ ...moveForm, zip_code: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={moveForm.start_date}
                                        onChange={e => setMoveForm({ ...moveForm, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Housing Type</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={moveForm.housing_type}
                                        onChange={e => setMoveForm({ ...moveForm, housing_type: e.target.value })}
                                    >
                                        <option value="">Select Type</option>
                                        {housingTypeSettings?.types?.map((type, idx) => (
                                            <option key={idx} value={type.name}>{type.name}</option>
                                        ))}
                                        {(!housingTypeSettings?.types || housingTypeSettings.types.length === 0) && (
                                            <>
                                                <option value="Residence">Residence</option>
                                                <option value="Homeless">Homeless</option>
                                                <option value="Halfway House">Halfway House</option>
                                                <option value="Treatment Center">Treatment Center</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes (Optional)</label>
                                <textarea
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm h-20"
                                    placeholder="Reason for move, etc."
                                    value={moveForm.notes}
                                    onChange={e => setMoveForm({ ...moveForm, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setShowMoveModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMoveOffender}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                Confirm Move
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OffenderProfile;
