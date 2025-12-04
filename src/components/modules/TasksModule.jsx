import React from 'react';
import { CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';

const TasksModule = () => {
    const tasks = [
        { id: 1, title: 'Home Visit - John Doe', dueDate: 'Today, 2:00 PM', priority: 'High', status: 'Pending', type: 'Visit' },
        { id: 2, title: 'Submit Monthly Report', dueDate: 'Tomorrow, 5:00 PM', priority: 'Medium', status: 'Pending', type: 'Admin' },
        { id: 3, title: 'Risk Assessment - Sarah Smith', dueDate: 'Dec 10, 2025', priority: 'High', status: 'Pending', type: 'Assessment' },
        { id: 4, title: 'Update Case Notes - Michael Johnson', dueDate: 'Dec 12, 2025', priority: 'Low', status: 'Pending', type: 'Admin' },
        { id: 5, title: 'Court Hearing Preparation', dueDate: 'Dec 15, 2025', priority: 'High', status: 'Pending', type: 'Court' },
    ];

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
                <button className="flex items-center gap-2 bg-navy-800 hover:bg-navy-900 text-white font-medium py-2 px-4 rounded-lg shadow-lg shadow-navy-900/20 transition-all">
                    <Plus className="w-4 h-4" />
                    New Task
                </button>
            </div>

            <div className="grid gap-4">
                {tasks.map((task) => (
                    <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
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
        </div>
    );
};

export default TasksModule;
