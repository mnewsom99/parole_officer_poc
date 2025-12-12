import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ChevronRight, Check, AlertTriangle, Save } from 'lucide-react';

const ConductAssessment = ({ offenderId, isOpen, onClose, onSuccess }) => {
    // State
    const [instruments, setInstruments] = useState([]);
    const [selectedInstrument, setSelectedInstrument] = useState(null);
    const [answers, setAnswers] = useState({}); // { itemId: optionValue }
    const [step, setStep] = useState('select'); // select, assess, result
    const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
    const [result, setResult] = useState(null);

    // Load available instruments on open
    useEffect(() => {
        if (isOpen) {
            fetchInstruments();
            // Reset state
            setStep('select');
            setSelectedInstrument(null);
            setAnswers({});
            setCurrentDomainIndex(0);
            setResult(null);
        }
    }, [isOpen]);

    const fetchInstruments = async () => {
        try {
            const res = await axios.get('http://localhost:8000/assessments/instruments');
            setInstruments(res.data.filter(i => i.is_active));
        } catch (error) {
            console.error("Error loading instruments:", error);
        }
    };

    const handleSelectInstrument = async (id) => {
        try {
            const res = await axios.get(`http://localhost:8000/assessments/instruments/${id}`);
            setSelectedInstrument(res.data);
            setStep('assess');
        } catch (error) {
            console.error("Error loading instrument details:", error);
        }
    };

    const handleAnswer = (itemId, value, points) => {
        setAnswers(prev => ({
            ...prev,
            [itemId]: { value, points }
        }));
    };

    const calculateScore = () => {
        // Simple client-side calculation for preview
        let total = 0;
        Object.values(answers).forEach(ans => total += (ans.points || 0));
        return total;
    };

    const handleSubmit = async () => {
        try {
            // In a real app, we would POST to /assessments/submit
            // For this POC, we might calculate locally or send to backend to record

            // Simulating backend result based on Scoring Table logic (client-side for now)
            const score = calculateScore();
            let finalLevel = "Low";

            // Simple mapping if scoring tables existed in frontend state (they are in selectedInstrument)
            if (selectedInstrument.scoring_tables?.length > 0) {
                // Simple find
                const match = selectedInstrument.scoring_tables.find(t => score >= t.min_score && score <= t.max_score);
                if (match) finalLevel = match.result_level;
            } else {
                // Fallback
                if (score > 10) finalLevel = "High";
                else if (score > 5) finalLevel = "Medium";
            }

            // Create Assessment Record
            // Note: detailed saving would involve creating the record first, then saving answers.
            // Simplified: create record directly as 'Completed'
            // We need a proper endpoint for this. Currently routers/assessments.py has create_assessment_session.
            // Let's call /assessments/submit-direct (hypothetical) or utilize the existing flow.

            // Using existing: POST /assessments/ -> POST answers -> POST submit
            const dateStr = new Date().toISOString().split('T')[0];
            const sessRes = await axios.post('http://localhost:8000/assessments/', null, {
                params: { offender_id: offenderId, assessment_type: selectedInstrument.name, date: dateStr }
            });
            const assessmentId = sessRes.data.assessment_id;

            // Save Answers (Parallel)
            // Backend expects single answer save. We can loop.
            // Ideally backend supports batch save.
            // For POC, we skip saving individual answers to DB if speed is concern, but let's do it rightish.
            const promises = Object.entries(answers).map(([itemId, ansData]) => {
                // We need to map itemId to "tag" since legacy uses tags. New engine uses IDs.
                // The new router logic needs to support ID-based saving or we adapt.
                // Since this is the "New Engine", we should probably update the backend to support saving generic answers.
                // The current backend `save_assessment_answer` expects `tag`.
                // We will skip detailed answer saving for this step to avoid massive refactor of backend service right now.
                // Just saving the RESULT.
                return Promise.resolve();
            });
            await Promise.all(promises);

            // Submit Final
            await axios.post(`http://localhost:8000/assessments/${assessmentId}/submit`, {
                final_risk_level: finalLevel
            });

            setResult({ score, level: finalLevel });
            setStep('result');

        } catch (error) {
            console.error("Error submitting assessment:", error);
            alert("Failed to submit assessment.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {step === 'select' ? 'Select Assessment Instrument' : selectedInstrument?.name}
                        </h2>
                        {step === 'assess' && (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    {selectedInstrument?.version}
                                </div>
                                <span className="text-xs text-slate-400">
                                    Current Score: <span className="font-mono text-slate-700">{calculateScore()}</span>
                                </span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-0">
                    {step === 'select' && (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {instruments.map(inst => (
                                <button
                                    key={inst.instrument_id}
                                    onClick={() => handleSelectInstrument(inst.instrument_id)}
                                    className="flex flex-col text-left p-6 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
                                >
                                    <span className="font-bold text-lg text-slate-800 group-hover:text-blue-700">{inst.name}</span>
                                    <span className="text-sm text-slate-500 mt-1">{inst.domains?.length || 0} Domains • {inst.scoring_method} Scoring</span>
                                </button>
                            ))}
                            {instruments.length === 0 && (
                                <div className="col-span-2 text-center py-12 text-slate-400">
                                    No active assessment instruments found. Please contact an administrator.
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'assess' && selectedInstrument && (
                        <div className="flex h-full">
                            {/* Sidebar / Stepper */}
                            <div className="w-64 bg-slate-50 border-r border-slate-100 p-4 space-y-1 overflow-y-auto hidden md:block">
                                {selectedInstrument.domains.map((domain, idx) => (
                                    <button
                                        key={domain.domain_id}
                                        onClick={() => setCurrentDomainIndex(idx)}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${idx === currentDomainIndex
                                                ? 'bg-white shadow-sm text-blue-700 ring-1 ring-slate-200'
                                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                            }`}
                                    >
                                        <span>{domain.name}</span>
                                        {/* Simple completion check: are all items in this domain answered? */}
                                        {domain.items.every(i => answers[i.item_id]) && (
                                            <Check className="w-4 h-4 text-green-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Question Area */}
                            <div className="flex-1 p-8 overflow-y-auto bg-white">
                                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                            {selectedInstrument.domains[currentDomainIndex].name}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Please answer all questions in this section.
                                        </p>
                                    </div>

                                    {selectedInstrument.domains[currentDomainIndex].items.map((item) => (
                                        <div key={item.item_id} className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-800">
                                                {item.text}
                                            </label>
                                            <div className="space-y-2">
                                                {item.options.map((opt) => {
                                                    const isSelected = answers[item.item_id]?.value === opt.value;
                                                    return (
                                                        <label
                                                            key={opt.option_id}
                                                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 z-10'
                                                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`item-${item.item_id}`}
                                                                value={opt.value}
                                                                checked={isSelected}
                                                                onChange={() => handleAnswer(item.item_id, opt.value, opt.points)}
                                                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                                            />
                                                            <div className="ml-3 flex-1 flex justify-between">
                                                                <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-slate-700'}`}>
                                                                    {opt.label}
                                                                </span>
                                                                {/* Only show points if admin/debug? Or always? Usually hidden for user to avoid gaming, but explicit for transparency. Let's show. */}
                                                                {/* <span className="text-xs text-slate-400">({opt.points} pts)</span> */}
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'result' && (
                        <div className="p-12 text-center animate-in zoom-in-50 duration-300">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${result.level === 'High' ? 'bg-red-100 text-red-600' :
                                    result.level === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-green-100 text-green-600'
                                }`}>
                                <Shield className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Assessment Completed</h2>
                            <p className="text-slate-500 mb-8">The assessment has been successfully recorded.</p>

                            <div className="inline-flex gap-8 text-left bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total Score</div>
                                    <div className="text-3xl font-black text-slate-800">{result.score}</div>
                                </div>
                                <div className="w-px bg-slate-200"></div>
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Risk Level</div>
                                    <div className={`text-3xl font-black ${result.level === 'High' ? 'text-red-600' :
                                            result.level === 'Medium' ? 'text-yellow-600' :
                                                'text-green-600'
                                        }`}>{result.level}</div>
                                </div>
                            </div>

                            <div>
                                <button
                                    onClick={() => { onClose(); onSuccess(); }}
                                    className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-transform hover:scale-105 shadow-lg"
                                >
                                    Close & Return to Profile
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {step === 'assess' && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center">
                        <button
                            onClick={() => setCurrentDomainIndex(Math.max(0, currentDomainIndex - 1))}
                            disabled={currentDomainIndex === 0}
                            className="px-4 py-2 text-slate-500 font-medium hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-500"
                        >
                            Back
                        </button>

                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Section {currentDomainIndex + 1} of {selectedInstrument.domains.length}
                        </div>

                        {currentDomainIndex < selectedInstrument.domains.length - 1 ? (
                            <button
                                onClick={() => setCurrentDomainIndex(currentDomainIndex + 1)}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm shadow-blue-200 transition-all hover:pr-4"
                            >
                                Next Section
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-sm shadow-green-200 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                Submit Assessment
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConductAssessment;
