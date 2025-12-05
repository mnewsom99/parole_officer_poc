import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Plus, X, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUser } from '../../context/UserContext';

const TasksModule = () => {
    const { currentUser, hasPermission, availableRoles } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', assignTo: currentUser.name, priority: 'Medium', dueDate: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Mock "All Users" list for the dropdown
    const allUsers = [
        { id: 1, name: 'Officer Smith' },
        { id: 2, name: 'Officer Jones' },
        { id: 3, name: 'Supervisor Davis' }
    ];

    const handleCreateTask = () => {
        // Here we would actually save the task
        console.log("Creating task:", newTask);
        setShowModal(false);
    };
    const tasks = [
        { id: 1, title: 'Home Visit - John Doe', dueDate: 'Today, 2:00 PM', priority: 'High', status: 'Pending', type: 'Visit' },
        { id: 2, title: 'Submit Monthly Report', dueDate: 'Tomorrow, 5:00 PM', priority: 'Medium', status: 'Pending', type: 'Admin' },
        { id: 3, title: 'Risk Assessment - Sarah Smith', dueDate: 'Dec 10, 2025', priority: 'High', status: 'Pending', type: 'Assessment' },
        { id: 4, title: 'Update Case Notes - Michael Johnson', dueDate: 'Dec 12, 2025', priority: 'Low', status: 'Pending', type: 'Admin' },
        { id: 5, title: 'Court Hearing Preparation', dueDate: 'Dec 15, 2025', priority: 'High', status: 'Pending', type: 'Court' },
    ];

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTasks = tasks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(tasks.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-600 bg-red-50 border-red-200';
            case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'Low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Tasks</h2>
                    <p className="text-slate-500">You have {tasks.length} pending tasks</p>
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

            {/* New Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Create New Task</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-800 focus:border-transparent"
                                    placeholder="e.g. Home Visit"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                                {hasPermission('assign_tasks_others') ? (
                                    <select
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-800 focus:border-transparent"
                                        value={newTask.assignTo}
                                        onChange={e => setNewTask({ ...newTask, assignTo: e.target.value })}
                                    >
                                        {allUsers.map(u => (
                                            <option key={u.id} value={u.name}>{u.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed">
                                        <UserIcon size={16} />
                                        <span>{currentUser.name} (Self)</span>
                                    </div>
                                )}
                                {!hasPermission('assign_tasks_others') && (
                                    <p className="text-xs text-slate-500 mt-1">You can only assign tasks to yourself.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-800 focus:border-transparent"
                                    value={newTask.dueDate}
                                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-800 focus:border-transparent"
                                    value={newTask.priority}
                                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateTask}
                                    className="px-4 py-2 bg-navy-800 text-white rounded-lg font-medium hover:bg-navy-900"
                                >
                                    Create Task
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {currentTasks.map((task) => (
                    <div key={task.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <button className="text-slate-400 hover:text-green-600 transition-colors">
                                <CheckCircle className="w-6 h-6" />
                            </button>
                            <div>
                                <h3 className="font-semibold text-slate-800">{task.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {task.dueDate}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                        {task.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {tasks.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl shadow-sm">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, tasks.length)}</span> of{' '}
                                <span className="font-medium">{tasks.length}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksModule;
