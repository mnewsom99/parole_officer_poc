import React, { useState } from 'react';
import { ArrowLeft, MapPin, Phone, Mail, Calendar, AlertTriangle, FileText, Activity, Shield, Beaker, Plus, CheckCircle, Clock, Circle, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';

const OffenderProfile = ({ offender, onBack }) => {
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

    const uaHistory = [
        { id: 1, date: 'Nov 28, 2023', type: 'Random', result: 'Negative', lab: 'LabCorp', collectedBy: 'Officer Smith' },
        { id: 2, date: 'Nov 15, 2023', type: 'Scheduled', result: 'Negative', lab: 'LabCorp', collectedBy: 'Officer Smith' },
        { id: 3, date: 'Nov 01, 2023', type: 'Random', result: 'Positive (THC)', lab: 'LabCorp', collectedBy: 'Officer Jones', notes: 'Offender admitted to use.' },
        { id: 4, date: 'Oct 15, 2023', type: 'Scheduled', result: 'Negative', lab: 'LabCorp', collectedBy: 'Officer Smith' },
    ];

    const [notes, setNotes] = useState([
        { id: 1, date: 'Nov 28, 2023', author: 'Officer Smith', content: 'Routine check-in. Subject reports new employment at construction site.' },
        { id: 2, date: 'Nov 15, 2023', author: 'Officer Smith', content: 'Verified address change. New residence approved.' },
        { id: 3, date: 'Nov 01, 2023', author: 'Officer Jones', content: 'Phone call received regarding missed appointment. Rescheduled for Nov 2.' },
        { id: 4, date: 'Oct 20, 2023', author: 'Officer Smith', content: 'Initial intake interview completed. Risk assessment scheduled.' },
        { id: 5, date: 'Oct 15, 2023', author: 'System', content: 'Case file transferred from County Court.' },
        { id: 6, date: 'Sep 30, 2023', author: 'Officer Smith', content: 'Home visit conducted. No issues found.' },
        { id: 7, date: 'Sep 15, 2023', author: 'Officer Smith', content: 'Phone check-in. Subject is compliant.' },
        { id: 8, date: 'Sep 01, 2023', author: 'Officer Jones', content: 'Urinalysis requested. Result pending.' },
        { id: 9, date: 'Aug 15, 2023', author: 'Officer Smith', content: 'Employment verification call made.' },
        { id: 10, date: 'Aug 01, 2023', author: 'System', content: 'Monthly report generated.' },
        { id: 11, date: 'Jul 15, 2023', author: 'Officer Smith', content: 'Initial meeting scheduled.' },
    ]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleAddNote = () => {
        if (!newNoteContent.trim()) return;

        const newNote = {
            id: Date.now(),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            author: 'Officer Smith', // Hardcoded for POC
            content: newNoteContent
        };

        setNotes([newNote, ...notes]);
        setNewNoteContent('');
        setCurrentPage(1);
    };

    const riskFactors = [
        { category: 'Criminal History', score: 'High', details: 'Multiple prior felony convictions.' },
        { category: 'Education/Employment', score: 'Low', details: 'Currently employed full-time.' },
        { category: 'Family/Marital', score: 'Medium', details: 'Unstable housing situation reported.' },
        { category: 'Leisure/Recreation', score: 'Medium', details: 'Limited pro-social activities.' },
        { category: 'Companions', score: 'High', details: 'Known association with gang members.' },
        { category: 'Alcohol/Drug Problem', score: 'Medium', details: 'History of substance abuse, currently in treatment.' },
    ];

    if (!offender) return null;

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
                                        const tasks = parolePlan.filter(t => t.status === status);

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
                                                                    <Circle className="w-5 h-5 text-slate-300 shrink-0" />}

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

                            <div className="space-y-4">
                                {notes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((note) => (
                                    <div key={note.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-slate-700 text-sm">{note.author}</span>
                                            <span className="text-xs text-slate-500">{note.date}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{note.content}</p>
                                    </div>
                                ))}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <p className="text-base font-medium text-slate-800">1234 Elm Street, Apt 4B</p>
                                    <p className="text-sm text-slate-600">Springfield, IL 62704</p>
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
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={onBack}
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
                                    Next Check-in: {offender.nextCheck}
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
                                {uaHistory.map((test) => (
                                    <tr key={test.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-slate-600">{test.date}</td>
                                        <td className="px-4 py-3 text-slate-600">{test.type}</td>
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
                                        <td className="px-4 py-3 text-slate-600">{test.lab}</td>
                                        <td className="px-4 py-3 text-slate-600">{test.collectedBy}</td>
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
                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                            placeholder="Type note content here..."
                        ></textarea>
                        <div className="flex justify-end mt-2">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all">
                                Save Note
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-sm font-bold text-slate-800 mb-4">Recent Notes</h4>
                        <div className="space-y-4">
                            {notes.map((note) => (
                                <div key={note.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-slate-700 text-sm">{note.author}</span>
                                        <span className="text-xs text-slate-500">{note.date}</span>
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
                        {riskFactors.map((factor, index) => (
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
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Time</label>
                            <input
                                type="time"
                                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                        <select className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                            <option>Field Office (Main St)</option>
                            <option>Home Visit</option>
                            <option>Employment Site</option>
                            <option>Virtual / Phone</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Appointment Type</label>
                        <select className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                            <option>Routine Check-in</option>
                            <option>Risk Assessment Review</option>
                            <option>UA Testing</option>
                            <option>Case Plan Update</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                        <textarea
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
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg shadow-blue-600/20 transition-all">
                            Schedule Appointment
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OffenderProfile;
