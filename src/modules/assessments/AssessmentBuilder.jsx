import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, Settings } from 'lucide-react';

const AssessmentBuilder = ({ instrumentId, onClose }) => {
    const [instrument, setInstrument] = useState({
        name: '',
        version: 'v1.0',
        target_populations: ['Male', 'Female'],
        scoring_method: 'Additive',
        domains: [], // { id, name, items: [] }
        scoring_tables: []
    });

    // activeTab removed, single page view

    useEffect(() => {
        if (instrumentId) {
            fetchInstrument(instrumentId);
        }
    }, [instrumentId]);

    const fetchInstrument = async (id) => {
        try {
            const res = await axios.get(`http://localhost:8000/assessments/instruments/${id}`);
            // Normalize ID field for frontend consistency (backend uses domain_id, frontend wants id)
            const data = res.data;
            if (data.domains) {
                data.domains = data.domains.map(d => ({ ...d, id: d.domain_id }));
            }
            setInstrument(data);
        } catch (error) {
            console.error("Error fetching instrument:", error);
        }
    };

    const handleSave = async () => {
        if (!instrument.name || !instrument.name.trim()) {
            alert("Please enter a name for the instrument at the top of the page.");
            return;
        }

        try {
            // Ensure payload has proper IDs for mapping
            // Note: backend expects 'id' in domains for mapping old->new, we have it in state.
            if (instrumentId) {
                await axios.put(`http://localhost:8000/assessments/instruments/${instrumentId}`, instrument);
            } else {
                await axios.post('http://localhost:8000/assessments/instruments', instrument);
            }
            onClose();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Failed to save instrument. Check console for details.");
        }
    };

    // --- DOMAIN LOGIC ---
    const addDomain = () => {
        setInstrument(prev => ({
            ...prev,
            domains: [...prev.domains, { id: crypto.randomUUID(), name: 'New Domain', order_index: prev.domains.length, items: [] }]
        }));
    };

    const updateDomain = (index, field, value) => {
        const newDomains = [...instrument.domains];
        newDomains[index][field] = value;
        setInstrument(prev => ({ ...prev, domains: newDomains }));
    };

    // --- ITEM LOGIC ---
    const addItem = (domainIndex) => {
        const newDomains = [...instrument.domains];
        newDomains[domainIndex].items.push({
            text: 'New Question',
            control_type: 'Radio',
            options: [
                { label: 'No', value: '0', points: 0 },
                { label: 'Yes', value: '1', points: 1 }
            ]
        });
        setInstrument(prev => ({ ...prev, domains: newDomains }));
    };

    const updateItem = (domainIndex, itemIndex, field, value) => {
        const newDomains = [...instrument.domains];
        newDomains[domainIndex].items[itemIndex][field] = value;
        setInstrument(prev => ({ ...prev, domains: newDomains }));
    };

    const addOption = (domainIndex, itemIndex) => {
        const newDomains = [...instrument.domains];
        newDomains[domainIndex].items[itemIndex].options.push({ label: 'Option', value: '', points: 0 });
        setInstrument(prev => ({ ...prev, domains: newDomains }));
    };

    const updateOption = (domainIndex, itemIndex, optIndex, field, value) => {
        const newDomains = [...instrument.domains];
        newDomains[domainIndex].items[itemIndex].options[optIndex][field] = value;
        setInstrument(prev => ({ ...prev, domains: newDomains }));
    };

    // --- REMOVE LOGIC ---
    const removeDomain = (index) => {
        if (window.confirm("Delete this entire domain and all its questions?")) {
            setInstrument(prev => ({
                ...prev,
                domains: prev.domains.filter((_, i) => i !== index)
            }));
        }
    };

    const removeItem = (domainIndex, itemIndex) => {
        const newDomains = [...instrument.domains];
        newDomains[domainIndex].items = newDomains[domainIndex].items.filter((_, i) => i !== itemIndex);
        setInstrument(prev => ({ ...prev, domains: newDomains }));
    };

    const removeOption = (domainIndex, itemIndex, optIndex) => {
        const newDomains = [...instrument.domains];
        newDomains[domainIndex].items[itemIndex].options = newDomains[domainIndex].items[itemIndex].options.filter((_, i) => i !== optIndex);
        setInstrument(prev => ({ ...prev, domains: newDomains }));
    };

    // --- SCORING TABLE LOGIC ---
    const addScoringRow = (domainId = null) => {
        setInstrument(prev => ({
            ...prev,
            scoring_tables: [
                ...(prev.scoring_tables || []),
                {
                    domain_id: domainId,
                    population_filter: 'All',
                    min_score: 0,
                    max_score: 10,
                    result_level: 'Low',
                    recommendation: ''
                }
            ]
        }));
    };

    const updateScoringRow = (index, field, value) => {
        const newTables = [...(instrument.scoring_tables || [])];
        newTables[index][field] = value;
        setInstrument(prev => ({ ...prev, scoring_tables: newTables }));
    };

    const removeScoringRow = (index) => {
        const newTables = (instrument.scoring_tables || []).filter((_, i) => i !== index);
        setInstrument(prev => ({ ...prev, scoring_tables: newTables }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {instrumentId ? 'Edit Instrument' : 'Create Instrument'}
                        </h2>
                        {/* Inline Name Edit */}
                        <input
                            value={instrument.name}
                            onChange={e => setInstrument(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Instrument Name (e.g. ORAS-CST)"
                            className="text-sm border border-slate-200 bg-slate-50 rounded px-2 py-1 mt-1 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 placeholder:text-slate-400 w-64 transition-all"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">

                <div className="space-y-8">
                    {instrument.domains.map((domain, dIdx) => (
                        <div key={dIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Domain Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center rounded-t-xl">
                                <div className="flex items-center gap-3">
                                    <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
                                    <input
                                        value={domain.name}
                                        onChange={(e) => updateDomain(dIdx, 'name', e.target.value)}
                                        className="font-bold text-lg bg-transparent border-none focus:ring-0 p-0 text-slate-800"
                                        placeholder="Domain Name"
                                    />
                                    <HoverHelp text="A Domain groups related risk factors together (e.g. 'Criminal History', 'Substance Abuse')." />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-slate-400">Total Items: {domain.items.length}</span>
                                    <button
                                        onClick={() => removeDomain(dIdx)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete Domain"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Items */}
                            < div className="p-6 space-y-6" >
                                {
                                    domain.items.map((item, iIdx) => (
                                        <div key={iIdx} className="pl-4 border-l-2 border-slate-200">
                                            <div className="flex gap-4 mb-3">
                                                <input
                                                    value={item.text}
                                                    onChange={(e) => updateItem(dIdx, iIdx, 'text', e.target.value)}
                                                    className="flex-1 text-sm font-medium border-slate-200 rounded-md focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="Question Text"
                                                />
                                                <select
                                                    value={item.control_type}
                                                    onChange={(e) => updateItem(dIdx, iIdx, 'control_type', e.target.value)}
                                                    className="text-sm border-slate-200 rounded-md bg-slate-50 text-slate-600"
                                                >
                                                    <option value="Radio">Single Select</option>
                                                    <option value="Checkbox">Multi Select</option>
                                                    <option value="NumberInput">Numeric</option>
                                                </select>
                                                <button
                                                    onClick={() => removeItem(dIdx, iIdx)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Options */}
                                            <div className="space-y-2 pl-4">
                                                {item.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                        <input
                                                            value={opt.label}
                                                            onChange={(e) => updateOption(dIdx, iIdx, oIdx, 'label', e.target.value)}
                                                            className="flex-1 text-xs border-none bg-transparent p-0 focus:ring-0"
                                                            placeholder="Option Label"
                                                        />
                                                        <span className="text-xs text-slate-400">Pts:</span>
                                                        <input
                                                            type="number"
                                                            value={opt.points}
                                                            onChange={(e) => updateOption(dIdx, iIdx, oIdx, 'points', parseInt(e.target.value))}
                                                            className="w-12 text-xs border-slate-200 rounded bg-slate-50 py-0.5 px-1 text-right"
                                                        />
                                                        <button
                                                            onClick={() => removeOption(dIdx, iIdx, oIdx)}
                                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                                            title="Remove Option"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addOption(dIdx, iIdx)} className="text-xs text-blue-600 hover:underline pl-3.5 pt-1">
                                                    + Add Option
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                }

                                < button
                                    onClick={() => addItem(dIdx)}
                                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Question to {domain.name}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <HoverHelp text="Add a new question/item to this domain." />
                                    </div>
                                </button>

                                {/* Inline Domain Scoring */}
                                <div className="mt-8 pt-6 border-t border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        Domain Scoring Logic
                                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
                                    </h4>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                        {/* Header */}
                                        {(instrument.scoring_tables || []).some(t => t.domain_id === domain.id) && (
                                            <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                <div className="col-span-2">Population</div>
                                                <div className="col-span-2">Range</div>
                                                <div className="col-span-3">Risk Level</div>
                                                <div className="col-span-4">Recommendation</div>
                                                <div className="col-span-1"></div>
                                            </div>
                                        )}

                                        {/* Rows */}
                                        {(instrument.scoring_tables || []).map((row, globalIdx) => ({ ...row, globalIdx }))
                                            .filter(row => row.domain_id === domain.id)
                                            .map((row, localIdx) => (
                                                <div key={localIdx} className="grid grid-cols-12 gap-2 mb-2 items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
                                                    <div className="col-span-2">
                                                        <select
                                                            value={row.population_filter}
                                                            onChange={e => updateScoringRow(row.globalIdx, 'population_filter', e.target.value)}
                                                            className="w-full text-xs border-slate-200 rounded p-1"
                                                        >
                                                            <option value="All">All</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-2 flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            value={row.min_score}
                                                            onChange={e => updateScoringRow(row.globalIdx, 'min_score', parseInt(e.target.value))}
                                                            className="w-1/2 text-xs border-slate-200 rounded p-1 text-center"
                                                            placeholder="Min"
                                                        />
                                                        <span className="text-slate-400">-</span>
                                                        <input
                                                            type="number"
                                                            value={row.max_score}
                                                            onChange={e => updateScoringRow(row.globalIdx, 'max_score', parseInt(e.target.value))}
                                                            className="w-1/2 text-xs border-slate-200 rounded p-1 text-center"
                                                            placeholder="Max"
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <select
                                                            value={row.result_level}
                                                            onChange={e => updateScoringRow(row.globalIdx, 'result_level', e.target.value)}
                                                            className="w-full text-xs border-slate-200 rounded p-1"
                                                        >
                                                            <option value="Low">Low</option>
                                                            <option value="Moderate">Moderate</option>
                                                            <option value="High">High</option>
                                                            <option value="Very High">Very High</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-4">
                                                        <input
                                                            value={row.recommendation}
                                                            onChange={e => updateScoringRow(row.globalIdx, 'recommendation', e.target.value)}
                                                            className="w-full text-xs border-slate-200 rounded p-1"
                                                            placeholder="Recommendation..."
                                                        />
                                                    </div>
                                                    <div className="col-span-1 text-center">
                                                        <button
                                                            onClick={() => removeScoringRow(row.globalIdx)}
                                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                        <button
                                            onClick={() => addScoringRow(domain.id)}
                                            className="w-full py-1.5 border border-dashed border-slate-300 rounded text-xs text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-white transition-colors flex items-center justify-center gap-1 mt-2"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Scoring Rule for {domain.name || 'Domain'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addDomain}
                        className="w-full py-6 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors flex flex-col items-center justify-center gap-2"
                    >
                        <Plus className="w-6 h-6" />
                        <span className="font-semibold">Add New Domain</span>
                        <div onClick={(e) => e.stopPropagation()}>
                            <HoverHelp text="Create a new category section for your assessment instrument." />
                        </div>
                    </button>

                    {/* Global Scoring Configuration */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="text-center mb-6">
                            <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">Global Scoring Rules</h3>
                            <p className="text-slate-500">
                                Define score ranges, risk levels, and cut-offs for target populations.
                                <HoverHelp text="Configure how total points map to Risk Levels (Low, Moderate, High)." />
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="p-3 text-xs font-bold text-slate-500 uppercase w-48">Scope</th>
                                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Population</th>
                                        <th className="p-3 text-xs font-bold text-slate-500 uppercase w-24">Min Score</th>
                                        <th className="p-3 text-xs font-bold text-slate-500 uppercase w-24">Max Score</th>
                                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Risk Level</th>
                                        <th className="p-3 text-xs font-bold text-slate-500 uppercase">Recommendation</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {(instrument.scoring_tables || []).map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-3">
                                                <select
                                                    value={row.domain_id || ''}
                                                    onChange={e => updateScoringRow(idx, 'domain_id', e.target.value || null)}
                                                    className="w-full border-slate-200 rounded-md text-sm font-medium text-slate-700 bg-slate-50"
                                                >
                                                    <option value="" className="font-bold">Instrument Total</option>
                                                    <optgroup label="Individual Domains">
                                                        {instrument.domains.map((d) => (
                                                            <option key={d.id} value={d.id}>{d.name || 'Unnamed Domain'}</option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    value={row.population_filter}
                                                    onChange={e => updateScoringRow(idx, 'population_filter', e.target.value)}
                                                    className="w-full border-slate-200 rounded-md text-sm"
                                                >
                                                    <option value="All">All</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={row.min_score}
                                                    onChange={e => updateScoringRow(idx, 'min_score', parseInt(e.target.value))}
                                                    className="w-full border-slate-200 rounded-md text-sm"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={row.max_score}
                                                    onChange={e => updateScoringRow(idx, 'max_score', parseInt(e.target.value))}
                                                    className="w-full border-slate-200 rounded-md text-sm"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    value={row.result_level}
                                                    onChange={e => updateScoringRow(idx, 'result_level', e.target.value)}
                                                    className="w-full border-slate-200 rounded-md text-sm"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Moderate">Moderate</option>
                                                    <option value="High">High</option>
                                                    <option value="Very High">Very High</option>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={row.recommendation}
                                                    onChange={e => updateScoringRow(idx, 'recommendation', e.target.value)}
                                                    placeholder="Recommended Action"
                                                    className="w-full border-slate-200 rounded-md text-sm"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => removeScoringRow(idx)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                    title="Remove Row"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={() => addScoringRow(null)}
                            className="w-full mt-4 py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add Scoring Logic Rule
                        </button>
                    </div>
                </div >
            </div >
        </div >
    );
};

const HoverHelp = ({ text }) => (
    <div className="group relative inline-block ml-2 align-middle z-50">
        <div className="text-slate-400 hover:text-blue-500 cursor-help transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl text-center">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
        </div>
    </div>
);

export default AssessmentBuilder;
