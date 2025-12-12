import React, { useState } from 'react';
import { X, Save, ArrowRight, Calendar, AlertTriangle, CheckSquare, Plus, Trash2 } from 'lucide-react';

const AutomationBuilderModal = ({ isOpen, onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [workflow, setWorkflow] = useState({
        name: '',
        trigger: { type: 'date', field: 'release_date', offset: 0, direction: 'after' },
        conditions: [],
        action: { type: 'create_task', title: '', description: '', priority: 'Normal', due_offset: 7, action_is_parole_plan: false }
    });

    if (!isOpen) return null;

    const handleSave = () => {
        // Validation logic here
        onSave(workflow);
        onClose();
    };

    const addCondition = () => {
        setWorkflow(prev => ({
            ...prev,
            conditions: [...prev.conditions, { field: 'risk_level', operator: 'equals', value: 'High' }]
        }));
    };

    const removeCondition = (idx) => {
        setWorkflow(prev => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== idx)
        }));
    };

    const updateCondition = (idx, field, value) => {
        const newConditions = [...workflow.conditions];
        newConditions[idx] = { ...newConditions[idx], [field]: value };
        setWorkflow(prev => ({ ...prev, conditions: newConditions }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Automation Builder</h2>
                        <p className="text-indigo-100 text-sm">Build rules to automatically create tasks</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 flex-1">

                    {/* Section 1: Basic Info & Trigger */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-violet-700 font-bold border-b border-slate-100 pb-2">
                            <Calendar className="w-5 h-5" />
                            <h3>1. When to Run (Trigger)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Automation Rule Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                                    placeholder="e.g. 7-Day Risk Check"
                                    value={workflow.name}
                                    onChange={e => setWorkflow({ ...workflow, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Trigger Event</label>
                                <select
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                                    value={workflow.trigger.field}
                                    onChange={e => setWorkflow({ ...workflow, trigger: { ...workflow.trigger, field: e.target.value } })}
                                >
                                    <option value="release_date">Release Date</option>
                                    <option value="csed_date">CSED Date</option>
                                    <option value="intake_date">Intake Date</option>
                                    <option value="positive_ua">Positive Drug Test</option>
                                    <option value="risk_assessment_change">Risk Assessment Change</option>
                                    <option value="violation_reported">Violation Reported</option>
                                    <option value="address_change">Address Change</option>
                                    <option value="employment_change">Employment Change</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600">Run this workflow</span>
                            <input
                                type="number"
                                className="w-20 p-2 border border-slate-300 rounded-md text-center"
                                value={workflow.trigger.offset}
                                onChange={e => setWorkflow({ ...workflow, trigger: { ...workflow.trigger, offset: parseInt(e.target.value) || 0 } })}
                            />
                            <span className="text-sm font-medium text-slate-600">days</span>
                            <select
                                className="p-2 border border-slate-300 rounded-md bg-white"
                                value={workflow.trigger.direction}
                                onChange={e => setWorkflow({ ...workflow, trigger: { ...workflow.trigger, direction: e.target.value } })}
                            >
                                <option value="after">After</option>
                                <option value="before">Before</option>
                            </select>
                            <span className="text-sm font-medium text-slate-600">the event.</span>
                        </div>
                    </div>

                    {/* Section 2: Conditions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-violet-700 font-bold border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                <h3>2. Conditions (Optional)</h3>
                            </div>
                            <button onClick={addCondition} className="text-xs flex items-center gap-1 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded text-violet-700 transition-colors">
                                <Plus size={14} /> Add Rule
                            </button>
                        </div>

                        {workflow.conditions.length === 0 && (
                            <p className="text-sm text-slate-400 italic">No conditions set. Runs for all offenders.</p>
                        )}

                        <div className="space-y-2">
                            {workflow.conditions.map((cond, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <select
                                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={cond.field}
                                        onChange={e => updateCondition(idx, 'field', e.target.value)}
                                    >
                                        <option value="risk_level">Risk Level</option>
                                        <option value="supervision_level">Supervision Level</option>
                                        <option value="assigned_office">Office</option>
                                        <option value="release_date">Release Date</option>
                                        <option value="csed_date">CSED Date</option>
                                        <option value="intake_date">Intake Date</option>
                                    </select>
                                    <select
                                        className="w-40 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={cond.operator}
                                        onChange={e => updateCondition(idx, 'operator', e.target.value)}
                                    >
                                        <optgroup label="Text">
                                            <option value="equals">Equals</option>
                                            <option value="not_equals">Does Not Equal</option>
                                            <option value="contains">Contains</option>
                                            <option value="starts_with">Starts With</option>
                                            <option value="is_empty">Is Empty</option>
                                            <option value="is_not_empty">Is Not Empty</option>
                                        </optgroup>
                                        <optgroup label="Numeric">
                                            <option value="num_equals">Equals (=)</option>
                                            <option value="greater_than">Greater Than (&gt;)</option>
                                            <option value="less_than">Less Than (&lt;)</option>
                                            <option value="is_between">Is Between</option>
                                        </optgroup>
                                        <optgroup label="Date">
                                            <option value="date_equals">Equals</option>
                                            <option value="is_before">Is Before</option>
                                            <option value="is_after">Is After</option>
                                        </optgroup>
                                    </select>
                                    <input
                                        type="text"
                                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={cond.value}
                                        onChange={e => updateCondition(idx, 'value', e.target.value)}
                                        placeholder="Value..."
                                    />
                                    <button onClick={() => removeCondition(idx)} className="text-red-400 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Action Task Builder */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-violet-700 font-bold border-b border-slate-100 pb-2">
                            <CheckSquare className="w-5 h-5" />
                            <h3>3. Task Builder</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Task Title</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none"
                                    placeholder="Task to be created..."
                                    value={workflow.action.title}
                                    onChange={e => setWorkflow({ ...workflow, action: { ...workflow.action, title: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Description / Instructions</label>
                                <textarea
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none h-24 resize-none"
                                    placeholder="Details for the officer..."
                                    value={workflow.action.description}
                                    onChange={e => setWorkflow({ ...workflow, action: { ...workflow.action, description: e.target.value } })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Priority</label>
                                    <select
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                        value={workflow.action.priority}
                                        onChange={e => setWorkflow({ ...workflow, action: { ...workflow.action, priority: e.target.value } })}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Normal">Normal</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Due Date</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">Days after creation:</span>
                                        <input
                                            type="number"
                                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                            value={workflow.action.due_offset}
                                            onChange={e => setWorkflow({ ...workflow, action: { ...workflow.action, due_offset: parseInt(e.target.value) } })}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Example: "2" means due 2 days after task is created.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <input
                                type="checkbox"
                                id="autoParolePlan"
                                checked={workflow.action.action_is_parole_plan}
                                onChange={e => setWorkflow({ ...workflow, action: { ...workflow.action, action_is_parole_plan: e.target.checked } })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                            />
                            <label htmlFor="autoParolePlan" className="text-sm font-medium text-indigo-900 cursor-pointer select-none">
                                Add to Parole Plan (Key Checkpoint)
                            </label>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-6 py-2.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                    Cancel
                </button>
                <button onClick={handleSave} className="px-6 py-2.5 font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-lg shadow-violet-500/30 flex items-center gap-2 transition-all">
                    <Save size={18} />
                    Save Rule
                </button>
            </div>
        </div>

    );
};

export default AutomationBuilderModal;
