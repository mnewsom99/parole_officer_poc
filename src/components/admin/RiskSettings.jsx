import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Plus, Save, X, Trash2 } from 'lucide-react';


const OptionsEditor = ({ options, onChange, readOnly = false }) => {
    const handleAddOption = () => {
        onChange([...(options || []), { label: '', value: '', score: 0 }]);
    };

    const handleRemoveOption = (index) => {
        const newOptions = [...(options || [])];
        newOptions.splice(index, 1);
        onChange(newOptions);
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...(options || [])];
        newOptions[index] = { ...newOptions[index], [field]: value };
        onChange(newOptions);
    };

    return (
        <div className="mt-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-sm text-slate-700">Answer Options & Scoring</h4>
                {!readOnly && (
                    <button onClick={handleAddOption} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 flex items-center gap-1">
                        <Plus size={12} /> Add Option
                    </button>
                )}
            </div>
            <div className="space-y-2">
                <div className="flex gap-2 text-xs font-bold text-slate-400 uppercase mb-1 px-1">
                    <div className="flex-1">Label</div>
                    <div className="w-32">Value</div>
                    <div className="w-20">Score</div>
                    <div className="w-5"></div>
                </div>
                {(options || []).map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <input
                            placeholder="Label (e.g. Yes)"
                            disabled={readOnly}
                            value={opt.label || ''}
                            onChange={e => handleOptionChange(idx, 'label', e.target.value)}
                            className="flex-1 p-1 text-sm border rounded"
                        />
                        <input
                            placeholder="Value (e.g. true)"
                            disabled={readOnly}
                            value={opt.value || ''}
                            onChange={e => handleOptionChange(idx, 'value', e.target.value)}
                            className="w-32 p-1 text-sm border rounded"
                        />
                        <input
                            type="number"
                            placeholder="Score"
                            disabled={readOnly}
                            value={opt.score ?? 0}
                            onChange={e => handleOptionChange(idx, 'score', parseInt(e.target.value) || 0)}
                            className="w-20 p-1 text-sm border rounded"
                        />
                        {!readOnly && (
                            <button onClick={() => handleRemoveOption(idx)} className="text-red-400 hover:text-red-600">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
                {(!options || options.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No options defined. Add options to enable scoring.</p>
                )}
            </div>
        </div>
    );
};

const ScoringMatrixEditor = ({ matrix, onChange, readOnly = false }) => {
    const handleAddRule = () => {
        onChange([...(matrix || []), { label: '', min: 0, max: 0 }]);
    };

    const handleRemoveRule = (index) => {
        const newMatrix = [...(matrix || [])];
        newMatrix.splice(index, 1);
        onChange(newMatrix);
    };

    const handleRuleChange = (index, field, value) => {
        const newMatrix = [...(matrix || [])];
        newMatrix[index] = { ...newMatrix[index], [field]: value };
        onChange(newMatrix);
    };

    return (
        <div className="mt-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-sm text-slate-700">Risk Level Scoring Rules</h4>
                {!readOnly && (
                    <button onClick={handleAddRule} className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 flex items-center gap-1">
                        <Plus size={12} /> Add Rule
                    </button>
                )}
            </div>
            <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase mb-1 px-1">
                    <div className="col-span-6">Label</div>
                    <div className="col-span-2">Min</div>
                    <div className="col-span-2">Max</div>
                    <div className="col-span-2"></div>
                </div>
                {(matrix || []).map((rule, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-6">
                            <input
                                placeholder="Risk Label (e.g. High)"
                                disabled={readOnly}
                                value={rule.label || ''}
                                onChange={e => handleRuleChange(idx, 'label', e.target.value)}
                                className="w-full p-1 text-sm border rounded"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                placeholder="Min"
                                disabled={readOnly}
                                value={rule.min ?? ''}
                                onChange={e => handleRuleChange(idx, 'min', parseInt(e.target.value) || 0)}
                                className="w-full p-1 text-sm border rounded"
                            />
                        </div>
                        <div className="col-span-2">
                            <input
                                type="number"
                                placeholder="Max"
                                disabled={readOnly}
                                value={rule.max ?? ''}
                                onChange={e => handleRuleChange(idx, 'max', parseInt(e.target.value) || 0)}
                                className="w-full p-1 text-sm border rounded"
                            />
                        </div>
                        <div className="col-span-2 flex justify-end">
                            {!readOnly && (
                                <button onClick={() => handleRemoveRule(idx)} className="text-red-400 hover:text-red-600">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {(!matrix || matrix.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No rules defined. Default logic will be used.</p>
                )}
            </div>
        </div>
    );
};

const RiskSettings = () => {
    const [questions, setQuestions] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([]); // Array of { type_id, name, scoring_matrix }
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isAdding, setIsAdding] = useState(false);

    // Scoring Matrix Editing
    const [isEditingScoring, setIsEditingScoring] = useState(false);
    const [scoringForm, setScoringForm] = useState([]);

    const [newQuestion, setNewQuestion] = useState({
        universal_tag: '',
        question_text: '',
        input_type: 'boolean',
        source_type: 'dynamic',
        category: 'General',
        assessments_list: 'ORAS',
        scoring_note: '',
        options: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [qRes, tRes] = await Promise.all([
                axios.get('http://localhost:8000/assessments/questions'),
                axios.get('http://localhost:8000/assessments/types')
            ]);

            // Parse Question Options
            const parsedQuestions = qRes.data.map(q => {
                let parsedOptions = [];
                try {
                    parsedOptions = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
                } catch (e) {
                    console.error(`Failed to parse options for question ${q.question_id}`, e);
                    parsedOptions = [];
                }
                return { ...q, options: parsedOptions };
            });
            setQuestions(parsedQuestions.sort((a, b) => a.question_id - b.question_id));

            // Set Types
            setAssessmentTypes(tRes.data);

        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (q) => {
        setEditingId(q.question_id);
        const options = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
        setEditForm({ ...q, options });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = async () => {
        try {
            await axios.put(`http://localhost:8000/assessments/questions/${editingId}`, editForm);
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error("Failed to update question", error);
            alert("Failed to update question");
        }
    };

    const handleAddQuestion = async () => {
        try {
            await axios.post('http://localhost:8000/assessments/questions', newQuestion);
            setIsAdding(false);
            setNewQuestion({
                universal_tag: '',
                question_text: '',
                input_type: 'boolean',
                source_type: 'dynamic',
                category: 'General',
                assessments_list: selectedTool !== 'All' ? selectedTool : 'ORAS',
                scoring_note: '',
                options: []
            });
            fetchData();
        } catch (error) {
            console.error("Failed to create question", error);
            alert("Failed to create question. Ensure Tag is unique.");
        }
    };

    const handleCreateAssessmentType = async () => {
        const name = prompt("Enter new Assessment Name (e.g. DV-Matrix):");
        if (!name) return;

        try {
            await axios.post('http://localhost:8000/assessments/types', {
                name: name,
                description: "User created assessment type",
                scoring_matrix: []
            });
            fetchData(); // Refresh list
            setSelectedTool(name); // Switch to new tool
        } catch (error) {
            console.error("Failed to create assessment type", error);
            alert("Failed to create. Name might be duplicate.");
        }
    };

    const handleSaveScoring = async () => {
        let typeObj = assessmentTypes.find(t => t.name === selectedTool);

        try {
            if (!typeObj) {
                // Type does not exist in DB yet (only as a tag), create it
                const res = await axios.post('http://localhost:8000/assessments/types', {
                    name: selectedTool,
                    description: `Auto-generated configuration for ${selectedTool}`,
                    scoring_matrix: scoringForm
                });
                // Alert success or just refresh
                // alert(`Created configuration for ${selectedTool} and saved rules.`);
            } else {
                // Update existing
                await axios.put(`http://localhost:8000/assessments/types/${typeObj.type_id}`, {
                    scoring_matrix: scoringForm
                });
            }

            setIsEditingScoring(false);
            fetchData();
        } catch (error) {
            console.error("Failed to save scoring rules", error);
            alert("Failed to save rules. Check console.");
        }
    };

    // Helper to render preview inputs (Same as Modal)
    const renderPreviewInput = (question) => {
        const { input_type, options } = question;
        if (input_type === 'boolean') {
            return (
                <div className="flex gap-4 opacity-75 pointer-events-none">
                    <label className="flex items-center gap-2"><input type="radio" checked={false} readOnly className="w-4 h-4 text-blue-600" /> <span className="text-sm">Yes</span></label>
                    <label className="flex items-center gap-2"><input type="radio" checked={false} readOnly className="w-4 h-4 text-blue-600" /> <span className="text-sm">No</span></label>
                </div>
            );
        }
        if (input_type === 'select' || input_type === 'scale_0_3') {
            return (
                <select disabled className="w-full max-w-xs p-2 border border-slate-300 rounded text-sm bg-slate-50 text-slate-500">
                    <option>Select Option...</option>
                    {options && options.map((opt, i) => <option key={i}>{opt.label}</option>)}
                </select>
            );
        }
        if (input_type === 'date') return <input type="date" disabled className="p-2 border border-slate-300 rounded text-sm bg-slate-50" />;
        if (input_type === 'integer') return <input type="number" disabled className="w-32 p-2 border border-slate-300 rounded text-sm bg-slate-50" placeholder="0" />;
        return <div className="text-xs text-red-400">Unknown Type: {input_type}</div>;
    };

    // Track selected tool
    const [selectedTool, setSelectedTool] = useState('All');

    // Filter questions based on selection
    const filteredQuestions = React.useMemo(() => {
        if (selectedTool === 'All') return questions;
        return questions.filter(q => (q.assessments_list || "").includes(selectedTool));
    }, [questions, selectedTool]);

    // Update newQuestion when tool changes
    useEffect(() => {
        if (selectedTool !== 'All') {
            setNewQuestion(prev => ({ ...prev, assessments_list: selectedTool }));
        }
    }, [selectedTool]);

    // When opening scoring editor, load current matrix
    useEffect(() => {
        if (isEditingScoring) {
            const typeObj = assessmentTypes.find(t => t.name === selectedTool);
            if (typeObj) {
                // Ensure matrix is parsed if string (though backend returns dict from JSON col usually)
                let matrix = typeObj.scoring_matrix || [];
                if (typeof matrix === 'string') {
                    try { matrix = JSON.parse(matrix); } catch (e) { }
                }
                setScoringForm(matrix);
            }
        }
    }, [isEditingScoring, selectedTool, assessmentTypes]);

    // Group questions (Use filtered list)
    const groupedQuestions = filteredQuestions.reduce((groups, q) => {
        const cat = q.category || 'General';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(q);
        return groups;
    }, {});

    const sortedGroups = Object.keys(groupedQuestions).sort();

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-slate-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col pt-4">
                <div className="px-4 pb-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-800">Assessment Types</h2>
                    <p className="text-xs text-slate-500">Manage questions per tool</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button
                        onClick={() => setSelectedTool('All')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTool === 'All' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        All Questions
                    </button>
                    {/* Combine both questions' derived tools AND fetched types to ensure we see all */}
                    {Array.from(new Set([
                        ...assessmentTypes.map(t => t.name),
                        ...questions.flatMap(q => (q.assessments_list || "").split("|").map(t => t.trim()))
                    ])).filter(Boolean).filter(t => t !== 'All').sort().map(tool => (
                        <button
                            key={tool}
                            onClick={() => setSelectedTool(tool)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTool === tool ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {tool}
                        </button>
                    ))}

                    <div className="pt-4 mt-2 border-t border-slate-100">
                        <button
                            onClick={handleCreateAssessmentType}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg justify-start"
                        >
                            <Plus size={16} /> Create Assessment
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                {selectedTool === 'All' ? 'All Risk Questions' : `${selectedTool} Settings`}
                            </h1>
                            <p className="text-slate-500">
                                {selectedTool === 'All'
                                    ? 'Viewing all questions across all assessments.'
                                    : `Manage questions specifically for the ${selectedTool} assessment.`}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {selectedTool !== 'All' && (
                                <button
                                    onClick={() => setIsEditingScoring(true)}
                                    className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <Edit2 size={16} /> Scoring Rules
                                </button>
                            )}
                            <button
                                onClick={() => setIsAdding(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Plus size={18} /> Add Question
                            </button>
                        </div>
                    </div>

                    {/* Scoring Rules Modal/Inline */}
                    {isEditingScoring && selectedTool !== 'All' && (
                        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-top-2">
                            <h3 className="font-bold text-amber-900 mb-2">Edit Scoring Logic for {selectedTool}</h3>
                            <p className="text-sm text-amber-700 mb-4">Define score ranges and their corresponding risk levels. (e.g. 0-14 = Low)</p>

                            <ScoringMatrixEditor
                                matrix={scoringForm}
                                onChange={setScoringForm}
                            />

                            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-amber-200">
                                <button
                                    onClick={() => setIsEditingScoring(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-amber-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveScoring}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm font-medium"
                                >
                                    Save Rules
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add New Question Form */}
                    {isAdding && (
                        <div className="mb-8 bg-white border border-blue-200 rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-top-2 ring-1 ring-blue-100">
                            <h3 className="font-bold text-blue-900 mb-4 text-lg border-b border-blue-100 pb-2">Create New Question for {selectedTool === 'All' ? 'Library' : selectedTool}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tag (Unique ID)</label>
                                    <input
                                        value={newQuestion.universal_tag}
                                        onChange={e => setNewQuestion({ ...newQuestion, universal_tag: e.target.value })}
                                        className="w-full p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. criminal_history_count"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question Text</label>
                                    <input
                                        value={newQuestion.question_text}
                                        onChange={e => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                                        className="w-full p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Enter the full question text..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                    <input
                                        value={newQuestion.category}
                                        onChange={e => setNewQuestion({ ...newQuestion, category: e.target.value })}
                                        className="w-full p-2 border border-blue-200 rounded"
                                        placeholder="e.g. Criminal History"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Input Type</label>
                                    <select
                                        value={newQuestion.input_type}
                                        onChange={e => setNewQuestion({ ...newQuestion, input_type: e.target.value })}
                                        className="w-full p-2 border border-blue-200 rounded bg-white"
                                    >
                                        <option value="boolean">Boolean (Yes/No)</option>
                                        <option value="select">Select (Dropdown)</option>
                                        <option value="integer">Integer</option>
                                        <option value="date">Date</option>
                                        <option value="scale_0_3">Scale 0-3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assessment Toools</label>
                                    <input
                                        value={newQuestion.assessments_list}
                                        onChange={e => setNewQuestion({ ...newQuestion, assessments_list: e.target.value })}
                                        className="w-full p-2 border border-blue-200 rounded"
                                        placeholder="e.g. ORAS|Static-99R"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Pipe-separated list of tools this question applies to.</p>
                                </div>
                            </div>

                            {/* Options for New Question */}
                            {(newQuestion.input_type === 'select' || newQuestion.input_type === 'scale_0_3' || newQuestion.input_type === 'boolean') && (
                                <OptionsEditor
                                    options={newQuestion.options}
                                    onChange={(newOpts) => setNewQuestion({ ...newQuestion, options: newOpts })}
                                />
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddQuestion}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-medium"
                                >
                                    Create Question
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8 pb-12">
                        {isLoading && <p className="text-center text-slate-500">Loading form...</p>}

                        {!isLoading && Object.entries(groupedQuestions).length === 0 && (
                            <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 mb-2">No questions found for {selectedTool}.</p>
                                <button onClick={() => setIsAdding(true)} className="text-blue-600 font-medium hover:underline">Add the first question</button>
                            </div>
                        )}

                        {sortedGroups.map((category) => {
                            const questions = groupedQuestions[category];
                            return (
                                <div key={category} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700 text-lg">{category}</h3>
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{questions.length} Questions</span>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {questions.map(q => (
                                            <div key={q.question_id} className={`p-6 transition-all ${editingId === q.question_id ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                                {editingId === q.question_id ? (
                                                    // EDIT MODE
                                                    <div className="animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="flex justify-between items-start mb-4 border-b border-blue-100 pb-2">
                                                            <h4 className="font-bold text-blue-800">Editing Question</h4>
                                                            <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div className="col-span-2">
                                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question Text</label>
                                                                <input
                                                                    value={editForm.question_text || ''}
                                                                    onChange={e => setEditForm({ ...editForm, question_text: e.target.value })}
                                                                    className="w-full p-2 border border-slate-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                                                                <input
                                                                    value={editForm.category || ''}
                                                                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                                                    className="w-full p-2 border border-slate-300 rounded"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Input Type</label>
                                                                <select
                                                                    value={editForm.input_type || ''}
                                                                    onChange={e => setEditForm({ ...editForm, input_type: e.target.value })}
                                                                    className="w-full p-2 border border-slate-300 rounded bg-white"
                                                                >
                                                                    <option value="boolean">Boolean</option>
                                                                    <option value="select">Select</option>
                                                                    <option value="integer">Integer</option>
                                                                    <option value="date">Date</option>
                                                                    <option value="scale_0_3">Scale 0-3</option>
                                                                </select>
                                                            </div>
                                                            <div className="col-span-2 border-t border-dashed border-slate-200 pt-2 mt-2">
                                                                <div className="flex gap-4">
                                                                    <div className="flex-1">
                                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Internal Tag</label>
                                                                        <input disabled value={q.universal_tag} className="w-full p-1 bg-slate-100 border-none text-slate-500 text-xs font-mono" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tools</label>
                                                                        <input
                                                                            value={editForm.assessments_list || ''}
                                                                            onChange={e => setEditForm({ ...editForm, assessments_list: e.target.value })}
                                                                            className="w-full p-1 border border-slate-300 rounded text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Options Editor Reused */}
                                                        {(editForm.input_type === 'select' || editForm.input_type === 'scale_0_3' || editForm.input_type === 'boolean') && (
                                                            <OptionsEditor
                                                                options={editForm.options}
                                                                onChange={(newOpts) => setEditForm({ ...editForm, options: newOpts })}
                                                            />
                                                        )}

                                                        <div className="flex justify-end gap-3 mt-6">
                                                            <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm font-medium">
                                                                <Save size={16} /> Save Changes
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // PREVIEW MODE
                                                    <div className="group relative">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <label className="font-semibold text-gray-800 text-sm">{q.question_text}</label>
                                                            <button
                                                                onClick={() => handleEditClick(q)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-blue-600 hover:bg-blue-50 rounded-lg absolute top-0 right-0"
                                                                title="Edit Question"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                        </div>
                                                        <div className="mt-1 pr-12">
                                                            {renderPreviewInput(q)}
                                                        </div>
                                                        <div className="mt-2 flex gap-3 text-xs text-slate-400 items-center">
                                                            <span className="font-mono bg-slate-100 px-1 rounded">{q.universal_tag}</span>
                                                            <span>Type: {q.input_type}</span>
                                                            {q.input_type === 'select' && <span>({(q.options || []).length} options)</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskSettings;


