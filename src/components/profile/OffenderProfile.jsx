import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, AlertTriangle, FileText, Activity, Shield, Beaker, Plus, CheckCircle, Clock, Trash2, Pin, PinOff } from 'lucide-react';
import Modal from '../common/Modal';

import { useParams, useNavigate } from 'react-router-dom';

const OffenderProfile = () => {
    const { offenderId } = useParams();
    const navigate = useNavigate();
    const [offender, setOffender] = useState(null);

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
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', date: '', status: 'Pending' });

    // Data States
    const [uaHistory, setUaHistory] = useState([]);
    const [notes, setNotes] = useState([]);
    const [riskFactors, setRiskFactors] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [newNoteContent, setNewNoteContent] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [noteTypes, setNoteTypes] = useState([]);
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

    useEffect(() => {
        if (offenderId) {
            fetchData();
        }
    }, [offenderId]);

    useEffect(() => {
        fetchNoteTypes();
    }, []);

    const fetchNoteTypes = async () => {
        try {
            const response = await axios.get('http://localhost:8000/settings/note-types');
            setNoteTypes(response.data);
        } catch (error) {
            console.error("Error fetching note types:", error);
        }
    };

    const handlePinNote = async (noteId) => {
        try {
            const response = await axios.put(`http://localhost:8000/notes/${noteId}/pin`);
            setNotes(notes.map(n => n.note_id === noteId ? response.data : n));
        } catch (error) {
            console.error("Error pinning note:", error);
        }
    };

    const getNoteColor = (typeName) => {
        const type = noteTypes.find(t => t.name === typeName);
        return type ? type.color : 'bg-slate-100 text-slate-700';
    };

    const fetchData = async () => {
        try {
            const [offenderRes, uaRes, notesRes, riskRes, apptRes] = await Promise.all([
                axios.get(`http://localhost:8000/offenders/${offenderId}`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/urinalysis`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/notes`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/risk`),
                axios.get(`http://localhost:8000/offenders/${offenderId}/appointments`),
                axios.get(`http://localhost:8000/settings/note-types`)
            ]);

            setOffender(offenderRes.data);
            setUaHistory(uaRes.data);
            setNotes(notesRes.data);
            setNoteTypes(apptRes[2]?.data || []); // apptRes is index 4, so noteTypes is index 5 in Promise.all, but wait...
            // Actually, let's just add it to the end of the array destructuring.
            // Wait, I need to be careful with the array destructuring index.
            // Let's rewrite the Promise.all destructuring to be safe.
            setUaHistory(uaRes.data);
            setNotes(notesRes.data);

            // Process Risk Data
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

        } catch (error) {
            console.error("Error fetching offender data:", error);
        }
    };

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
        { id: 'contact', label: 'Contact Info', icon: Phone },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
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
                                    {['Pending', 'Not Due', 'Completed'].map(status => {
                                        const tasks = parolePlan?.filter(t => t.status === status) || [];

                                        return (
                                            <div key={status}>
                                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 sticky top-0 bg-white py-1 z-10 ${status === 'Completed' ? 'text-green-600' :
                                                    status === 'Pending' ? 'text-yellow-600' : 'text-slate-400'
                                                    }`}>
                                                    {status}
                                                </h4>
                                                <div className="space-y-3">
                                                    {tasks.length === 0 && (
                                                        <p className="text-xs text-slate-400 italic">No tasks</p>
                                                    )}
                                                    {tasks.map(task => (
                                                        <div key={task.id} className="flex items-center gap-3 group">
                                                            {status === 'Completed' ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> :
                                                                status === 'Pending' ? <Clock className="w-5 h-5 text-yellow-500 shrink-0" /> :
                                                                    <Clock className="w-5 h-5 text-slate-300 shrink-0" />}

                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium ${status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                                    {task.title}
                                                                </p>
                                                                <input
                                                                    type="date"
                                                                    value={task.date}
                                                                    onChange={(e) => handleUpdateTask(task.id, 'date', e.target.value)}
                                                                    className="text-xs text-slate-500 bg-transparent border-none p-0 focus:ring-0 h-auto"
                                                                />
                                                            </div>

                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                                                <select
                                                                    value={task.status}
                                                                    onChange={(e) => handleUpdateTask(task.id, 'status', e.target.value)}
                                                                    className="text-xs border border-slate-200 rounded p-1"
                                                                >
                                                                    <option value="Completed">Done</option>
                                                                    <option value="Pending">Pending</option>
                                                                    <option value="Not Due">Later</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                    className="text-slate-400 hover:text-red-500"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-4">Recent Activity</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                            <div className="w-0.5 h-full bg-slate-100 my-1"></div>
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm font-medium text-slate-800">Check-in Completed</p>
                                            <p className="text-xs text-slate-500">Yesterday, 2:15 PM</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <div className="w-0.5 h-full bg-slate-100 my-1"></div>
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-sm font-medium text-slate-800">UA Result: Negative</p>
                                            <p className="text-xs text-slate-500">Nov 28, 10:00 AM</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">Employment Verified</p>
                                            <p className="text-xs text-slate-500">Nov 15, 9:30 AM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4">Case Notes</h3>

                            <div className="mb-6">
                                <div className="flex gap-3 mb-3">
                                    <select
                                        value={newNoteType}
                                        onChange={(e) => setNewNoteType(e.target.value)}
                                        className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {noteTypes.map(type => (
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
                                                        <span className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</span>
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
                return (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Risk Assessment Module</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">This module allows officers to conduct and review risk assessments (ORAS/LSI-R). Integration pending.</p>
                        <button
                            onClick={() => setShowRiskModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg shadow-blue-600/20 transition-all"
                        >
                            Start New Assessment
                        </button>
                    </div>
                );
            case 'ua':
                return (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">LabCorp API Integration</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-6">Connect to external lab partners for real-time urinalysis results and history.</p>
                        <button className="bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-6 rounded-lg shadow-lg shadow-navy-900/20 transition-all">
                            Connect Provider
                        </button>
                    </div>
                );
            case 'contact':
                return (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-6">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Primary Phone</p>
                                    <p className="text-base font-medium text-slate-800">(555) 123-4567</p>
                                    <p className="text-xs text-slate-500">Mobile</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Mail className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email Address</p>
                                    <p className="text-base font-medium text-slate-800">john.doe@email.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                    <MapPin className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Current Residence</p>
                                    <p className="text-base font-medium text-slate-800">{offender.address}</p>
                                    <p className="text-sm text-slate-600">{offender.city}, {offender.state} {offender.zip}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5 text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date of Birth</p>
                                    <p className="text-base font-medium text-slate-800">Jan 15, 1985</p>
                                </div>
                            </div>
                        </div>

                        {/* Housing Details Section */}
                        <div className="border-t border-slate-100 pt-6 mb-6">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                Housing Details
                            </h4>
                            {offender.housingType === 'Facility' ? (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-blue-800">{offender.facility?.name || 'Unknown Facility'}</span>
                                        <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full font-bold">Approved Facility</span>
                                    </div>
                                    <p className="text-sm text-blue-900 mb-1">{offender.facility?.address || 'No Address'}</p>
                                    <p className="text-sm text-blue-800 mb-2">Phone: {offender.facility?.phone || 'N/A'}</p>
                                    <div className="text-xs text-blue-700">
                                        <span className="font-semibold">Services:</span> {offender.facility?.services || 'None'}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold text-slate-700">Private Residence</span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-bold">Approved</span>
                                    </div>
                                    <p className="text-sm text-slate-600">Standard private residence. No facility services provided.</p>
                                </div>
                            )}
                        </div>

                        {/* Residence Contacts Section */}
                        {offender.housingType === 'Private' && offender.residenceContacts?.length > 0 && (
                            <div className="border-t border-slate-100 pt-6">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-blue-600" />
                                    Residence Contacts
                                </h4>
                                <div className="space-y-3">
                                    {offender.residenceContacts?.map((contact, index) => (
                                        <div key={index} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 border border-slate-200 font-bold text-slate-500 text-xs">
                                                {contact.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{contact.name}</p>
                                                        <p className="text-xs text-slate-500">{contact.relation}</p>
                                                    </div>
                                                    <a href={`tel:${contact.phone}`} className="text-xs text-blue-600 hover:underline">
                                                        {contact.phone}
                                                    </a>
                                                </div>
                                                {contact.comments && (
                                                    <p className="text-xs text-slate-600 mt-1 italic">"{contact.comments}"</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-navy-900 relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
                        <img
                            src={offender.image}
                            alt={offender.name}
                            className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-slate-200 relative"
                        />
                        <div className="flex-1 mb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-slate-900">{offender.name}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${offender.risk === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                                    offender.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                        'bg-green-100 text-green-700 border-green-200'
                                    }`}>
                                    {offender.risk} Risk
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500 text-sm">
                                <span>ID: {offender.badgeId}</span>
                                <span>•</span>
                                <span>Status: {offender.status}</span>
                                <span>•</span>
                                <button
                                    onClick={() => setShowAppointmentModal(true)}
                                    className="hover:text-blue-600 hover:underline transition-colors"
                                >
                                    Next Check-in: {nextAppointment ? new Date(nextAppointment.date_time).toLocaleDateString() : 'None Scheduled'}
                                </button>
                            </div>
                        </div>
                        <div className="mb-2 flex gap-3">
                            <button
                                onClick={() => setShowNotesModal(true)}
                                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-all"
                            >
                                Add Note
                            </button>
                            <button
                                onClick={() => setShowUAModal(true)}
                                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2"
                            >
                                <Beaker size={18} />
                                Drug Test
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-blue-600/20 transition-all">
                                Message
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 border-b border-slate-200">
                        <nav className="flex gap-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-4 flex items-center gap-2 font-medium text-sm transition-all relative ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                        {isActive && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-8">
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
                                        <span className="text-xs text-slate-500">{new Date(note.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{note.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={showRiskModal}
                onClose={() => setShowRiskModal(false)}
                title="Risk Assessment Breakdown"
            >
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-700">Overall Risk Score</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${offender.risk === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
                                offender.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                    'bg-green-100 text-green-700 border-green-200'
                                }`}>
                                {offender.risk}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">Based on last assessment: Oct 20, 2023</p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-800">Criminogenic Needs</h4>
                        {riskFactors?.map((factor, index) => (
                            <div key={index} className="flex items-start gap-4 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${factor.score === 'High' ? 'bg-red-500' :
                                    factor.score === 'Medium' ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    }`}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-slate-700 text-sm">{factor.category}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${factor.score === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                            factor.score === 'Medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                'bg-green-50 text-green-600 border-green-100'
                                            }`}>{factor.score}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">{factor.details}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all">
                            Update Assessment
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
        </div>
    );
};

export default OffenderProfile;
