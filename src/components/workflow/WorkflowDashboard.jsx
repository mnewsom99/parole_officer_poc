import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, RefreshCcw, Filter } from 'lucide-react';
import TaskList from './TaskList';
import NewSubmissionModal from './NewSubmissionModal';
import WorkflowActionModal from './WorkflowActionModal';

const WorkflowDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:8000/workflows/tasks/me');
            setTasks(response.data);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Workflows & Tasks</h1>
                    <p className="text-slate-500 mt-1">Manage transfer requests, approvals, and form submissions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTasks}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                        title="Refresh Tasks"
                    >
                        <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        New Request
                    </button>
                </div>
            </header>

            {/* Filters (Mock UI for now) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button className="px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium shadow-sm">All Tasks</button>
                <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:border-slate-300 rounded-full text-sm font-medium">Pending Approval</button>
                <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:border-slate-300 rounded-full text-sm font-medium">Drafts</button>
                <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:border-slate-300 rounded-full text-sm font-medium">Completed</button>
            </div>

            <TaskList tasks={tasks} onAction={setSelectedTask} />

            <NewSubmissionModal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onSuccess={fetchTasks}
            />

            <WorkflowActionModal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                task={selectedTask}
                onSuccess={fetchTasks}
            />
        </div>
    );
};

export default WorkflowDashboard;
