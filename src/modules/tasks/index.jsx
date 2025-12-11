import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import TaskModal from '../../components/modals/TaskModal'; // Import
import {
    CheckCircle, Clock, AlertCircle, Plus, X, User as UserIcon,
    ChevronLeft, ChevronRight, Search, Briefcase, FileText, Clipboard,
    Home, Calculator, AlertTriangle, FileQuestion, MoreHorizontal, LayoutGrid,
    Calendar, CheckSquare, Paperclip // Added for consistency with Office
} from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../core/context/UserContext';
import { format, isAfter, parseISO } from 'date-fns';

const TasksModule = () => {
    const { currentUser, hasPermission, globalFilter, updateGlobalFilter, taskSettings } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    // Filtering State (Local only for status/sort, global for office/officer)
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortBy, setSortBy] = useState('dueDate');
    const [searchQuery, setSearchQuery] = useState('');

    // Dropdown Data
    const [officers, setOfficers] = useState([]);
    const [offices, setOffices] = useState([]);

    // New Task Form State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'Normal',
        assigned_officer_id: '',
        category: '',
        sub_category: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

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

    // Fetch Officers (filtered by office if selected)
    useEffect(() => {
        const fetchOfficers = async () => {
            try {
                let url = 'http://localhost:8000/officers';
                if (globalFilter.office) {
                    url += `?location_id=${globalFilter.office}`;
                }
                const response = await axios.get(url);
                const mappedOfficers = response.data.map(o => ({
                    id: o.user_id, // For filter (user_id)
                    officer_id: o.officer_id, // For assignment (officer_id)
                    name: `${o.first_name} ${o.last_name}`
                }));
                setOfficers(mappedOfficers);
            } catch (error) {
                console.error("Error fetching officers:", error);
            }
        };
        fetchOfficers();
    }, [globalFilter.office]);

    // Default Filter
    useEffect(() => {
        if (!currentUser) return;

        const updates = {};
        if (currentUser.officerId && !globalFilter.officer) {
            updates.officer = currentUser.officerId;
        }
        if (currentUser.locationId && !globalFilter.office) {
            updates.office = currentUser.locationId;
        }

        if (Object.keys(updates).length > 0) {
            updateGlobalFilter(updates);
        }
    }, [currentUser]);


    // Fetch Tasks (Unified)
    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();

                // Tasks are assigned to user_id, but global filter stores officer_id.
                // We need to resolve the officer_id to a user_id.
                // Use direct officer ID from global filter if available
                if (globalFilter.officer) {
                    params.append('assigned_officer_id', globalFilter.officer);
                }

                if (globalFilter.office) params.append('location_id', globalFilter.office);
                if (selectedStatus) params.append('status', selectedStatus);

                // Fetch Ad-hoc Tasks AND Workflows in parallel
                let adHocRes = { data: [] };
                let workflowRes = { data: [] };

                try {
                    adHocRes = await axios.get(`http://localhost:8000/tasks?${params.toString()}`);
                } catch (e) {
                    console.error("Error fetching tasks:", e);
                }

                try {
                    workflowRes = await axios.get(`http://localhost:8000/workflows/tasks?${params.toString()}`);
                } catch (e) {
                    console.warn("Error fetching workflow tasks (ignoring):", e);
                }

                // Normalize Data
                // Ad-hoc
                const adHocItems = adHocRes.data.map(t => ({
                    id: `task-${t.task_id}`,
                    type: 'AdHoc',
                    title: t.title,
                    subtitle: t.description || 'No description',
                    date: t.due_date,
                    status: t.status,
                    priority: t.priority,
                    updated_at: t.created_at, // Use created/updated
                    assigned_officer: t.assigned_officer_id, // This is raw ID, might fetch name if needed
                    category: t.category,
                    sub_category: t.sub_category
                }));

                // Workflows
                const workflowItems = workflowRes.data.map(w => ({
                    id: `wf-${w.submission_id}`,
                    type: 'Workflow',
                    title: w.template?.name || 'Workflow Task',
                    subtitle: w.offender ? `Re: ${w.offender.first_name} ${w.offender.last_name}` : 'General Workflow',
                    date: w.updated_at, // Workflows usually track "Last Updated" or "Created At"
                    status: w.status,
                    priority: 'Normal', // Default for now
                    step: w.current_step,
                    updated_at: w.updated_at
                }));

                // Combine and Sort
                const merged = [...adHocItems, ...workflowItems].sort((a, b) => {
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);

                    // Validate Dates
                    const validDateA = !isNaN(dateA.getTime()) ? dateA : new Date(0);
                    const validDateB = !isNaN(dateB.getTime()) ? dateB : new Date(0);

                    if (sortBy === 'dueDate' || sortBy === 'pastDue') {
                        // Ascending for dates (soonest first)
                        return validDateA - validDateB;
                    } else if (sortBy === 'priority') {
                        // High > Normal > Low
                        const pMap = { 'High': 3, 'Normal': 2, 'Low': 1 };
                        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
                    } else {
                        // Recent first (created/updated)
                        const updateA = new Date(a.updated_at || 0);
                        const updateB = new Date(b.updated_at || 0);
                        return (!isNaN(updateB.getTime()) ? updateB : new Date(0)) - (!isNaN(updateA.getTime()) ? updateA : new Date(0));
                    }
                });

                setTasks(merged);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [globalFilter.officer, globalFilter.office, selectedStatus, sortBy, officers]);

    // State for editing
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleEditClick = (task) => {
        // Hydrate form
        setNewTask({
            title: task.title,
            description: task.subtitle || '', // Note: we mapped description to subtitle in fetch
            due_date: task.date ? task.date.split('T')[0] : '',
            priority: task.priority,
            assigned_officer_id: task.assigned_officer || '',
            category: task.category || '',
            sub_category: task.sub_category || '',
            status: task.status || 'Pending'
        });
        setSelectedTask(task); // Keep ref to original (has ID)
        setShowModal(true);
    };

    const handleCreateOrUpdateTask = async () => {
        if (!newTask.title || !newTask.assigned_officer_id) {
            alert("Please fill in Title and Assigned Officer");
            return;
        }

        try {
            const payload = {
                ...newTask,
                due_date: newTask.due_date || null,
                category: newTask.category || null,
                sub_category: newTask.sub_category || null
            };

            let response;
            let taskId;

            if (selectedTask && selectedTask.type === 'AdHoc') {
                // UPDATE (PUT)
                // Extract clean UUID from "task-UUID" ID format
                const cleanId = selectedTask.id.replace('task-', '');
                response = await axios.put(`http://localhost:8000/tasks/${cleanId}`, payload);
                taskId = cleanId;
            } else {
                // CREATE (POST)
                response = await axios.post('http://localhost:8000/tasks', payload);
                taskId = response.data.task_id;
            }

            // 2. Upload Attachment if present (for both Create and Update)
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("uploaded_by_id", currentUser?.officerId || 'unknown');
                formData.append("task_id", taskId);
                formData.append("category", "Task Attachment");

                await axios.post('http://localhost:8000/documents/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setShowModal(false);
            setNewTask({ title: '', description: '', due_date: '', priority: 'Normal', assigned_officer_id: '', category: '', sub_category: '' });
            setSelectedFile(null);
            setSelectedTask(null);
            // Refresh
            window.location.reload();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Failed to save task");
        }
    };

    // --- Stats & Categories Calculation ---
    const stats = useMemo(() => {
        const now = new Date();
        const getCount = (filterFn) => tasks.filter(filterFn).length;

        // Categorization Helpers - Hybrid Approach (Category Field > Title Match)
        const checkCategory = (t, key) => {
            if (t.category) return t.category.toLowerCase().includes(key);
            return t.title.toLowerCase().includes(key);
        };

        const isHomeVisit = t => checkCategory(t, 'home visit');
        const isRisk = t => checkCategory(t, 'risk') || checkCategory(t, 'oras') || checkCategory(t, 'assessment');
        const isCloseout = t => checkCategory(t, 'closeout');
        const isEmployment = t => checkCategory(t, 'employ');
        const isOverdue = t => t.date && isAfter(now, parseISO(t.date)) && t.status !== 'Completed';
        const isOther = t => !isHomeVisit(t) && !isRisk(t) && !isCloseout(t) && !isEmployment(t);

        return {
            homeVisits: getCount(isHomeVisit),
            risk: getCount(isRisk),
            overdue: getCount(isOverdue),
            closeouts: getCount(isCloseout),
            employment: getCount(isEmployment),
            other: getCount(isOther)
        };
    }, [tasks]);


    // Filter Logic (Client-side Search + Tabs)
    const filteredTasks = tasks.filter(task => {
        // 1. Tab Filter
        const checkCat = (key) => task.category ? task.category.toLowerCase().includes(key) : task.title.toLowerCase().includes(key);

        if (activeTab === 'home_visits' && !checkCat('home visit')) return false;
        if (activeTab === 'risk' && !(checkCat('risk') || checkCat('oras') || checkCat('assessment'))) return false;
        if (activeTab === 'overdue' && !(task.date && isAfter(new Date(), parseISO(task.date)) && task.status !== 'Completed')) return false;
        if (activeTab === 'closeouts' && !checkCat('closeout')) return false;
        if (activeTab === 'employment' && !checkCat('employ')) return false;
        if (activeTab === 'other') {
            const isKnown = checkCat('home visit') ||
                checkCat('risk') ||
                checkCat('oras') ||
                checkCat('assessment') ||
                checkCat('closeout') ||
                checkCat('employ');
            if (isKnown) return false;
        }

        // 2. Sort-as-Filter (Past Due)
        if (sortBy === 'pastDue') {
            const isOverdue = task.date && isAfter(new Date(), parseISO(task.date)) && task.status !== 'Completed';
            if (!isOverdue) return false;
        }

        // 2. Search Filter
        const searchLower = searchQuery.toLowerCase();
        return task.title.toLowerCase().includes(searchLower) || task.subtitle.toLowerCase().includes(searchLower);
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // Helpers
    const getPriorityColor = (priority) => {
        if (priority === 'High') return 'text-red-700 bg-red-50 border-red-200';
        if (priority === 'Normal') return 'text-blue-700 bg-blue-50 border-blue-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    const getIcon = (type) => {
        if (type === 'AdHoc') return <Clipboard className="w-5 h-5 text-indigo-500" />;
        return <FileText className="w-5 h-5 text-emerald-500" />;
    };

    const Modal = () => (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => {
                    setShowModal(false);
                    setSelectedTask(null); // Clear selected task on modal close
                    setNewTask({ title: '', description: '', due_date: '', priority: 'Normal', assigned_officer_id: '', category: '', sub_category: '' });
                    setSelectedFile(null);
                }}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative flex flex-col max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in duration-200">
                <button
                    onClick={() => {
                        setShowModal(false);
                        setSelectedTask(null); // Clear selected task on modal close
                        setNewTask({ title: '', description: '', due_date: '', priority: 'Normal', assigned_officer_id: '', category: '', sub_category: '' });
                        setSelectedFile(null);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
                <h3 className="text-lg font-bold text-slate-800 mb-6">
                    {selectedTask ? 'Edit Task' : 'Create New Task'}
                </h3>

                <div className="space-y-4">
                    {/* Status Field - ONLY VISIBLE WHEN EDITING */}
                    {selectedTask && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <label className="block text-sm font-bold text-yellow-800 mb-1">Status</label>
                            <select
                                value={newTask.status}
                                onChange={e => setNewTask({ ...newTask, status: e.target.value })}
                                className="w-full border border-yellow-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-yellow-500 outline-none"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Task Title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                        <select
                            value={newTask.assigned_officer_id}
                            onChange={e => setNewTask({ ...newTask, assigned_officer_id: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Select Officer...</option>
                            {Array.isArray(officers) && officers.map(o => (
                                <option key={o.officer_id} value={o.officer_id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={newTask.due_date}
                                onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                            <select
                                value={newTask.priority}
                                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option>Low</option>
                                <option>Normal</option>
                                <option>High</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
                            <select
                                value={newTask.category}
                                onChange={e => setNewTask({ ...newTask, category: e.target.value, sub_category: '' })}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Select Type...</option>
                                {taskSettings && Array.isArray(taskSettings.categories) && taskSettings.categories.map(cat => (
                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Sub Type</label>
                            <select
                                value={newTask.sub_category}
                                onChange={e => setNewTask({ ...newTask, sub_category: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                disabled={!newTask.category}
                            >
                                <option value="">Select Sub-Type...</option>
                                {newTask.category && taskSettings && Array.isArray(taskSettings.categories) ?
                                    taskSettings.categories.find(c => c.name === newTask.category)?.subcategories?.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    )) : null
                                }
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Task details..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Attachment (Optional)</label>
                        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-blue-600 transition-colors w-full border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50 hover:bg-slate-100">
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                            />
                            <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <Paperclip size={16} className="text-slate-600" />
                            </div>
                            <span className="flex-1 truncate font-medium">{selectedFile ? selectedFile.name : "Click to attach a document"}</span>
                            {selectedFile && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove attachment"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                    <button
                        onClick={() => {
                            setShowModal(false);
                            setSelectedTask(null); // Clear selected task on modal close
                            setNewTask({ title: '', description: '', due_date: '', priority: 'Normal', assigned_officer_id: '', category: '', sub_category: '' });
                            setSelectedFile(null);
                        }}
                        className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateOrUpdateTask}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                    >
                        {selectedTask ? 'Save Changes' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Banner Section */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl p-6 shadow-xl relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">Task Management</h2>
                            <p className="text-indigo-100/80">Track and manage officer tasks and workflows</p>
                        </div>
                    </div>

                    {/* Stats Row (Inside Banner) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        {/* 1. Home Visits */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Home size={12} /> Home Visits
                            </div>
                            <div className="text-2xl font-bold">{stats.homeVisits}</div>
                        </div>
                        {/* 2. Risk Assessments */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Calculator size={12} /> Risk Asmnts
                            </div>
                            <div className="text-2xl font-bold">{stats.risk}</div>
                        </div>
                        {/* 3. Overdue */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <AlertTriangle size={12} /> Overdue
                            </div>
                            <div className="text-2xl font-bold text-red-300">{stats.overdue}</div>
                        </div>
                        {/* 4. Closeouts */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Clock size={12} /> Closeouts
                            </div>
                            <div className="text-2xl font-bold">{stats.closeouts}</div>
                        </div>
                        {/* 5. Employment */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <Briefcase size={12} /> Employment
                            </div>
                            <div className="text-2xl font-bold">{stats.employment}</div>
                        </div>
                        {/* 6. Other */}
                        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                                <LayoutGrid size={12} /> Other
                            </div>
                            <div className="text-2xl font-bold">{stats.other}</div>
                        </div>
                    </div>

                    {/* Physical Folder Tabs */}
                    <div className="flex gap-0.5 overflow-x-auto no-scrollbar pt-6 -mx-6 px-6 relative top-[25px]">
                        {[
                            { id: 'all', label: 'All Tasks', icon: LayoutGrid },
                            { id: 'home_visits', label: 'Home Visits', icon: Home },
                            { id: 'risk', label: 'Risk Asmnts', icon: Calculator },
                            { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
                            { id: 'closeouts', label: 'Closeouts', icon: Clock },
                            { id: 'employment', label: 'Employment', icon: Briefcase },
                            { id: 'other', label: 'Other', icon: MoreHorizontal },
                        ].map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        group flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all rounded-t-xl relative whitespace-nowrap
                                        ${isActive
                                            ? 'bg-white text-violet-700 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-10'
                                            : 'bg-white/10 text-indigo-100 hover:bg-white/20 hover:text-white'
                                        }
                                    `}
                                >
                                    <tab.icon size={16} className={isActive ? 'text-violet-600' : 'text-indigo-200 group-hover:text-white transition-colors'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Container - Unified White Card */}
            <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">

                {/* Task Selection Bar (Preserved & Styled) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">
                            {activeTab === 'all' ? 'All Tasks' :
                                activeTab === 'home_visits' ? 'Home Visit Tasks' :
                                    activeTab === 'risk' ? 'Risk Assessments' :
                                        activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h3>
                        <p className="text-sm text-slate-500">Showing {filteredTasks.length} tasks</p>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <select
                            value={globalFilter.office}
                            onChange={(e) => {
                                updateGlobalFilter({
                                    office: e.target.value,
                                    officer: ''
                                });
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[120px] cursor-pointer"
                        >
                            <option value="">All Offices</option>
                            {offices.map(office => (
                                <option key={office.location_id} value={office.location_id}>{office.name}</option>
                            ))}
                        </select>

                        <select
                            value={globalFilter.officer}
                            onChange={(e) => updateGlobalFilter({ officer: e.target.value })}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[150px] cursor-pointer"
                        >
                            <option value="">All Officers</option>
                            {officers.map(officer => (
                                <option key={officer.id} value={officer.officer_id}>{officer.name}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[110px] cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </select>

                        {/* Sort Filter */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[110px] cursor-pointer"
                        >
                            <option value="dueDate">Due Date</option>
                            <option value="pastDue">Past Due</option>
                            <option value="priority">Priority</option>
                            <option value="recent">Recently Updated</option>
                        </select>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 pl-10 p-2.5"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {hasPermission('assign_tasks') && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-2 bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-navy-900/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                New Task
                            </button>
                        )}
                    </div>
                </div>

                {/* Task List */}
                <div className="grid gap-2">
                    {currentTasks.length > 0 ? (
                        currentTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => handleEditClick(task)}
                                className={`${task.date && isAfter(new Date(), parseISO(task.date)) && task.status !== 'Completed' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'} p-2.5 rounded-xl shadow-sm border flex items-center justify-between hover:shadow-md transition-shadow group cursor-pointer`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        {getIcon(task.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                                            {task.title}
                                            {task.type === 'Workflow' && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Workflow</span>}
                                        </h3>
                                        {task.subtitle !== 'No description' && <p className="text-xs text-slate-500">{task.subtitle}</p>}

                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {task.date ? format(new Date(task.date), 'MMM d') : 'No Date'}
                                            </span>
                                            {task.step && (
                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                                    Step: {task.step}
                                                </span>
                                            )}
                                            <span className="capitalize">{task.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">No tasks found.</p>
                            {loading && <p className="text-xs text-blue-500 mt-2">Loading...</p>}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {filteredTasks.length > itemsPerPage && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white pt-4 mt-6">
                        <div className="flex md:flex-1 md:items-center md:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, filteredTasks.length)}</span> of{' '}
                                    <span className="font-medium">{filteredTasks.length}</span> results
                                </p>
                            </div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                )}
            </div>

            {/* Portal the Modal to document.body */}
            {showModal && createPortal(
                <TaskModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedTask(null);
                        setSelectedFile(null);
                    }}
                    task={selectedTask}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    onSuccess={() => {
                        // Refresh
                        window.location.reload();
                    }}
                />,
                document.body
            )}
        </div>
    );
};

export default TasksModule;
