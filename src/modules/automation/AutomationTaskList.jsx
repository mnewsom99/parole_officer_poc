import React from 'react';
import { format } from 'date-fns';
import { FileText, ChevronRight, User, Clock } from 'lucide-react';

const TaskList = ({ tasks, onAction }) => {
    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="mb-4">No tasks found.</p>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'bg-slate-100 text-slate-600';
            case 'Completed': return 'bg-green-100 text-green-700';
            case 'Denied': return 'bg-red-100 text-red-700';
            case 'Correction_Needed': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-blue-100 text-blue-700'; // Pending states
        }
    };

    return (
        <div className="overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Offender</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status & Step</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {tasks.map((task) => (
                        <tr key={task.submission_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-slate-900">{task.template?.name || "Unknown"}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <User className="w-4 h-4 text-slate-400" />
                                    {task.offender ? `${task.offender.last_name}, ${task.offender.first_name}` : 'N/A'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <span className={`inline-flex self-start px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                        {task.status.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-slate-400">{task.current_step}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(task.updated_at), 'MMM d, h:mm a')}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onAction(task)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end gap-1 hover:underline"
                                >
                                    View
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TaskList;
