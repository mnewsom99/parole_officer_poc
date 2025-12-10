import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Plus, X, User as UserIcon, ChevronLeft, ChevronRight, Search, Briefcase, FileText, Clipboard } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../core/context/UserContext';
import { format } from 'date-fns';

const TasksModule = () => {
    const { currentUser, hasPermission, globalFilter, updateGlobalFilter } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filtering State (Local only for status/sort, global for office/officer)
    // Removed selectedOfficer / selectedOffice in favor of globalFilter
    const [selectedStatus, setSelectedStatus] = useState(''); // New Status Filter
    const [sortBy, setSortBy] = useState('dueDate'); // New Sort State
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
        assigned_officer_id: ''
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
                // Note: Workflows endpoint might need update too if it uses similar filtering. 
                // Assuming it might inspect params.
                // Fetch Ad-hoc Tasks AND Workflows
                // We fetch them separately to ensure one failure doesn't block the other (e.g. 401 on workflows)
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
                    assigned_officer: t.assigned_officer_id // This is raw ID, might fetch name if needed
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
                // Combine and Sort
                const merged = [...adHocItems, ...workflowItems].sort((a, b) => {
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);

                    // Validate Dates
                    const validDateA = !isNaN(dateA.getTime()) ? dateA : new Date(0);
                    const validDateB = !isNaN(dateB.getTime()) ? dateB : new Date(0);

                    if (sortBy === 'dueDate') {
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

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.assigned_officer_id) {
            alert("Please fill in Title and Assigned Officer");
            return;
        }

        try {
            await axios.post('http://localhost:8000/tasks', newTask);
            setShowModal(false);
            setNewTask({ title: '', description: '', due_date: '', priority: 'Normal', assigned_officer_id: '' });
            // Refresh
            // Trigger fetch again (simple way: toggle a dummy state or just refetch)
            // For now, let's just force refetch by re-running the effect logic or reloading (lazy but effective for POC)
            window.location.reload();
        } catch (error) {
            console.error("Error creating task:", error);
            alert("Failed to create task");
        }
    };

    // Filter Logic (Client-side Search)
    const filteredTasks = tasks.filter(task => {
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Tasks</h2>
                    <p className="text-slate-500">Showing {filteredTasks.length} tasks</p>
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
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[120px] cursor-pointer"
                    >
                        <option value="">All Offices</option>
                        {offices.map(office => (
                            <option key={office.location_id} value={office.location_id}>{office.name}</option>
                        ))}
                    </select>

                    <select
                        value={globalFilter.officer}
                        onChange={(e) => updateGlobalFilter({ officer: e.target.value })}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[150px] cursor-pointer"
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
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[110px] cursor-pointer"
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
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[110px] cursor-pointer"
                    >
                        <option value="dueDate">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="recent">Recently Updated</option>
                    </select>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 pl-10 p-2.5"
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

            {/* Create Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Create New Task</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                                    placeholder="Task Title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                                <select
                                    value={newTask.assigned_officer_id}
                                    onChange={e => setNewTask({ ...newTask, assigned_officer_id: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                                >
                                    <option value="">Select Officer...</option>
                                    {officers.map(o => (
                                        // Use officer_id here for assignment
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
                                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                                    >
                                        <option>Low</option>
                                        <option>Normal</option>
                                        <option>High</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-24"
                                    placeholder="Task details..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-2.5 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleCreateTask} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors">Create Task</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-3">
                {currentTasks.length > 0 ? (
                    currentTasks.map((task) => (
                        <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow group">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    {getIcon(task.type)}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        {task.title}
                                        {task.type === 'Workflow' && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Workflow</span>}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-0.5">{task.subtitle}</p>

                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
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
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
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
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl shadow-sm">
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
    );
};

export default TasksModule;
