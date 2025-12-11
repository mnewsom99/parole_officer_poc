import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Paperclip, Clipboard, FileText } from 'lucide-react';
import axios from 'axios';

const TaskModal = ({ isOpen, onClose, task, selectedFile, setSelectedFile, onSuccess, context = {} }) => {
    // Context can provide default values (e.g. offender_id if called from Profile)
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'Normal',
        assigned_officer_id: '',
        category: '',
        sub_category: '',
        status: 'Pending',
        offender_id: '' // New field
    });

    const [officers, setOfficers] = useState([]);
    const [taskSettings, setTaskSettings] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Fetch Officers and Settings if not provided (or re-fetch for simplicity)
        const fetchDeps = async () => {
            // Retrieve context or fetch
            // For now, simpler to fetch or rely on props? 
            // Ideally props should provide options, but to make it standalone-ish:
            try {
                const [offs, settings, user] = await Promise.all([
                    axios.get('http://localhost:8000/officers'),
                    axios.get('http://localhost:8000/settings/task-categories'),
                    axios.get('http://localhost:8000/users/me')
                ]);
                setOfficers(offs.data);
                setTaskSettings({ categories: settings.data });
                setCurrentUser(user.data); // Mapped to officer info usually
            } catch (e) {
                console.error("Failed to load modal dependencies", e);
            }
        };
        if (isOpen) fetchDeps();
    }, [isOpen]);

    useEffect(() => {
        if (task) {
            // Edit Mode
            setNewTask({
                title: task.title,
                description: task.description || task.subtitle || '', // Handle different data shapes
                due_date: task.date ? task.date.split('T')[0] : (task.due_date || ''),
                priority: task.priority || 'Normal',
                assigned_officer_id: task.assigned_officer_id || task.assigned_officer || '',
                category: task.category || '',
                sub_category: task.sub_category || '',
                status: task.status || 'Pending',
                offender_id: task.offender_id || ''
            });
        } else {
            // Create Mode
            setNewTask({
                title: '',
                description: '',
                due_date: '',
                priority: 'Normal',
                assigned_officer_id: context.assigned_officer_id || '', // Default from context
                category: context.category || '',
                sub_category: '',
                status: 'Pending',
                offender_id: context.offender_id || '' // Default from context (e.g. Profile)
            });
            if (context.assigned_officer_id) {
                // Optimization: if provided
            }
        }
    }, [task, isOpen]);

    const handleSubmit = async () => {
        if (!newTask.title || !newTask.assigned_officer_id) {
            alert("Please fill in Title and Assigned Officer");
            return;
        }

        try {
            const payload = {
                ...newTask,
                due_date: newTask.due_date || null,
                category: newTask.category || null,
                sub_category: newTask.sub_category || null,
                offender_id: newTask.offender_id || null
            };

            let response;
            let taskId;

            if (task && task.id) { // Supports both task.id (frontend) and task.task_id (backend)
                const cleanId = String(task.id).replace('task-', ''); // Handle potentially prefixed IDs if any 
                // Actually, best to use real UUID. If we are in Profile, 'task.id' might be number (fake data) or UUID (real).
                // We will assume REAL UUIDs now.
                response = await axios.put(`http://localhost:8000/tasks/${cleanId}`, payload);
                taskId = cleanId;
            } else if (task && task.task_id) {
                response = await axios.put(`http://localhost:8000/tasks/${task.task_id}`, payload);
                taskId = task.task_id;
            } else {
                response = await axios.post('http://localhost:8000/tasks', payload);
                taskId = response.data.task_id;
            }

            // Upload Attachment
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("uploaded_by_id", currentUser?.officer_id || currentUser?.user_id || 'unknown'); // Fallback
                formData.append("task_id", taskId);
                formData.append("category", "Task Attachment");

                await axios.post('http://localhost:8000/documents/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving task:", error);
            alert("Failed to save task");
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative flex flex-col max-h-[90vh] overflow-y-auto z-10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
                <h3 className="text-lg font-bold text-slate-800 mb-6">
                    {task ? 'Edit Task' : 'Create New Task'}
                </h3>

                <div className="space-y-4">
                    {/* Status Field - ONLY WHEN EDITING */}
                    {task && (
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
                                <option key={o.officer_id} value={o.officer_id}>{`${o.first_name} ${o.last_name}`}</option>
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
                                onChange={(e) => setSelectedFile && setSelectedFile(e.target.files[0])}
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
                                        if (setSelectedFile) setSelectedFile(null);
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
                        onClick={onClose}
                        className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                    >
                        {task ? 'Save Changes' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TaskModal;
