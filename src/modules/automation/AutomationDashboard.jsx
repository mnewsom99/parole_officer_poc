import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, RefreshCcw, Filter, Briefcase, Clock, CheckCircle } from 'lucide-react';
import AutomationTaskList from './AutomationTaskList';
import NewAutomationTaskModal from './NewAutomationTaskModal';
import AutomationActionModal from './AutomationActionModal';
import AutomationBuilderModal from './AutomationBuilderModal';

const AutomationDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [activeRules, setActiveRules] = useState([]);

    useEffect(() => {
        fetchTasks();
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await axios.get('http://localhost:8000/automations/rules/');
            setActiveRules(response.data);
        } catch (error) {
            console.error("Error fetching rules:", error);
        }
    };

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

    const [activeTab, setActiveTab] = useState('all');

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Banner Section */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl p-6 shadow-xl relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Tasks & Automations</h1>
                            <p className="text-indigo-100/80 mt-1">Manage single-step task automations and daily workload.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchTasks}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors text-white"
                                title="Refresh Tasks"
                            >
                                <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => setIsNewModalOpen(true)}
                                className="flex items-center gap-2 bg-white text-violet-700 hover:bg-indigo-50 font-bold py-2 px-4 rounded-lg shadow-lg transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                New Request
                            </button>
                        </div>
                    </div>

                    {/* Physical Folder Tabs */}
                    <div className="flex gap-0.5 overflow-x-auto no-scrollbar pt-6 -mx-6 px-6 relative top-[25px]">
                        {[
                            { id: 'all', label: 'All Tasks', icon: Filter },
                            { id: 'pending', label: 'Pending Approval', icon: Clock },
                            { id: 'automations', label: 'Automations', icon: Briefcase },
                            { id: 'completed', label: 'Completed', icon: CheckCircle },
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
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Container - Unified White Card */}
            <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
                {activeTab === 'automations' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Active Automation Rules</h3>
                            <button
                                onClick={() => setIsBuilderOpen(true)}
                                className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-lg transition-colors"
                            >
                                <Plus size={16} />
                                Build New Automation
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {activeRules.map((wf, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all group bg-white hover:border-violet-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                            <RefreshCcw className="w-5 h-5" />
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold">Active</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 mb-1 text-lg">{wf.name}</h4>
                                    <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2" title={wf.task_description}>
                                        {wf.task_description || "No description provided."}
                                    </p>

                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Clock size={14} />
                                                <span>Trigger</span>
                                            </div>
                                            <span className="font-semibold text-slate-700">
                                                {wf.trigger_offset}d {wf.trigger_direction} {wf.trigger_field}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Briefcase size={14} />
                                                <span>Action</span>
                                            </div>
                                            <span className="font-semibold text-slate-700 capitalize">
                                                {wf.action_type === 'create_task' ? 'Create Task' : wf.action_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <AutomationTaskList tasks={tasks} onAction={setSelectedTask} />
                )}
            </div>

            <NewAutomationTaskModal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onSuccess={fetchTasks}
            />

            <AutomationActionModal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                task={selectedTask}
                onSuccess={fetchTasks}
            />

            <AutomationBuilderModal
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                onSave={async (rule) => {
                    try {
                        const payload = {
                            name: rule.name,
                            trigger_field: rule.trigger.field,
                            trigger_offset: rule.trigger.offset,
                            trigger_direction: rule.trigger.direction,
                            conditions: rule.conditions,
                            action_type: rule.action.type,
                            task_title: rule.action.title,
                            task_description: rule.action.description,
                            task_priority: rule.action.priority,
                            due_offset: rule.action.due_offset,
                            is_active: true
                        };
                        console.log("Saving rule:", payload);
                        await axios.post('http://localhost:8000/automations/rules/', payload);
                        fetchRules();
                        setIsBuilderOpen(false);
                    } catch (error) {
                        console.error("Error saving rule:", error);
                        // Be nice to show an error toaster here
                    }
                }}
            />
        </div>
    );
};

export default AutomationDashboard;
