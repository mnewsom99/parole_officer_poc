import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, AlertCircle, CheckCircle, Info, Link as LinkIcon, Lock } from 'lucide-react';

const assessmentOptions = [
    { id: 'ORAS-CST', name: 'ORAS-CST', description: 'Community Supervision Tool - Standard risk assessment for general population.' },
    { id: 'ORAS-SRT', name: 'ORAS-SRT', description: 'Screening Risk Tool - Initial quick screening.' },
    { id: 'ORAS-MUT', name: 'ORAS-MUT', description: 'Misdemeanor Unit Tool - For misdemeanor offenders.' }
];

const RiskAssessmentModal = ({ isOpen, onClose, offenderId, onSuccess }) => {
    const [reviewData, setReviewData] = useState(null);
    const [finalRiskLevel, setFinalRiskLevel] = useState('');
    const [overrideReason, setOverrideReason] = useState('');

    // Missing States
    const [step, setStep] = useState('select'); // select, form, review
    const [assessmentType, setAssessmentType] = useState('');
    const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [schema, setSchema] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentAssessmentId, setCurrentAssessmentId] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            setStep('select');
            setAssessmentType('');
            setSchema([]);
            setAnswers({});
            setCurrentAssessmentId(null);
            setReviewData(null);
            setFinalRiskLevel('');
            setOverrideReason('');
            setAssessmentDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleStartAssessment = async () => {
        // ... (existing helper logic same as before, no changes to start logic lines 34-72) ...
        if (!assessmentType) return;
        setIsLoading(true);
        try {
            const sessionRes = await axios.post(`http://localhost:8000/assessments/`, null, {
                params: {
                    offender_id: offenderId,
                    assessment_type: assessmentType,
                    date: assessmentDate
                }
            });
            setCurrentAssessmentId(sessionRes.data.assessment_id);

            const schemaRes = await axios.get(`http://localhost:8000/assessments/init`, {
                params: {
                    offender_id: offenderId,
                    assessment_type: assessmentType
                }
            });

            setSchema(schemaRes.data);

            const initialAnswers = {};
            schemaRes.data.forEach(q => {
                if (q.value !== null && q.value !== undefined) {
                    initialAnswers[q.universal_tag] = q.value;
                }
            });
            setAnswers(initialAnswers);

            setStep('form');
        } catch (error) {
            console.error("Error starting assessment:", error);
            alert("Failed to initialize assessment. Check console.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = (tag, value) => {
        setAnswers(prev => ({ ...prev, [tag]: value }));
        if (currentAssessmentId) {
            axios.post(`http://localhost:8000/assessments/${currentAssessmentId}/save`, {
                tag: tag,
                value: value
            }).catch(e => console.error("Auto-save failed", e));
        }
    };

    const handleReview = async () => {
        if (!currentAssessmentId) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`http://localhost:8000/assessments/${currentAssessmentId}/calculate`);
            setReviewData(res.data);
            setFinalRiskLevel(res.data.risk_level); // Default to calculated
            setOverrideReason('');
            setStep('review');
        } catch (error) {
            console.error("Calculation failed:", error);
            alert("Failed to calculate score.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            await axios.post(`http://localhost:8000/assessments/${currentAssessmentId}/submit`, {
                final_risk_level: finalRiskLevel,
                override_reason: overrideReason
            });
            alert("Assessment Submitted Successfully!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Submission failed:", error);
            alert("Failed to submit assessment.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transition-all`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">New Risk Assessment</h2>
                        <p className="text-sm text-gray-500">
                            {step === 'select' ? 'Select Assessment Type' : `${assessmentType} Assessment`}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transaction-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'select' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assessmentOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setAssessmentType(opt.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${assessmentType === opt.id
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-gray-800">{opt.name}</span>
                                        {assessmentType === opt.id && <CheckCircle size={20} className="text-blue-500" />}
                                    </div>
                                    <p className="text-sm text-gray-500">{opt.description}</p>
                                </button>
                            ))}

                            <div className="md:col-span-2 mt-4 flex items-center justify-end">
                                <button
                                    disabled={!assessmentType || isLoading}
                                    onClick={handleStartAssessment}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? 'Loading...' : 'Start Assessment'} <ArrowRightIcon />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'form' && (
                        <div className="space-y-8">
                            {schema.length === 0 && <p className="text-center text-gray-500">No questions found for this assessment type.</p>}

                            {schema.length === 0 && <p className="text-center text-gray-500">No questions found for this assessment type.</p>}

                            {/* Group by Category */
                                Object.entries(schema.reduce((groups, q) => {
                                    const cat = q.category || 'General';
                                    if (!groups[cat]) groups[cat] = [];
                                    groups[cat].push(q);
                                    return groups;
                                }, {})).map(([category, questions]) => (
                                    <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                            <h3 className="font-bold text-slate-700">{category}</h3>
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {questions.map((q, index) => (
                                                <div key={q.universal_tag} className="flex flex-col gap-2 p-4 bg-white">
                                                    <div className="flex justify-between items-start">
                                                        <label className="font-semibold text-gray-800 text-sm">
                                                            {q.question_text}
                                                        </label>
                                                        {q.is_imported && (
                                                            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100" title={q.source_note}>
                                                                <LinkIcon size={12} />
                                                                <span>Imported</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-1">
                                                        {renderInput(q, answers[q.universal_tag], handleAnswerChange)}
                                                    </div>

                                                    {q.source_type === 'static' && (
                                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                                            <Lock size={10} /> Static Field (Legacy Data)
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {step === 'review' && reviewData && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                                <h3 className="text-lg font-semibold text-blue-900">Calculated Risk Score</h3>
                                <div className="text-4xl font-bold text-blue-600 my-2">{reviewData.total_score}</div>
                                <p className="text-blue-800">
                                    Risk Level: <span className="font-bold">{reviewData.risk_level}</span>
                                </p>
                            </div>

                            {/* Driver (Category) Subtotals */}
                            {reviewData.category_scores && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(reviewData.category_scores).map(([cat, score]) => (
                                        <div key={cat} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                                            <div className="text-xs text-slate-500 font-medium uppercase">{cat}</div>
                                            <div className="text-xl font-bold text-slate-700">{score}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-white border rounded-lg p-6 shadow-sm">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-amber-500" />
                                    Final Determination
                                </h4>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Final Risk Level</label>
                                        <select
                                            value={finalRiskLevel}
                                            onChange={(e) => setFinalRiskLevel(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>

                                    {finalRiskLevel !== reviewData.risk_level && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Override (Required)</label>
                                            <textarea
                                                value={overrideReason}
                                                onChange={(e) => setOverrideReason(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Please explain why you are overriding the calculated risk level..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
                    {step === 'form' && (
                        <>
                            <div className="text-sm text-gray-500">
                                Questions: {schema.length} | Completed: {Object.keys(answers).length}
                            </div>
                            <button
                                onClick={handleReview}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center gap-2"
                            >
                                Compare & Review <ArrowRightIcon />
                            </button>
                        </>
                    )}
                    {step === 'review' && (
                        <>
                            <button
                                onClick={() => setStep('form')}
                                className="text-gray-600 font-semibold hover:text-gray-800"
                            >
                                Back to Questions
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={finalRiskLevel !== reviewData?.risk_level && !overrideReason}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} /> Confirm & Submit
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper to render inputs
const renderInput = (question, currentValue, onChange) => {
    const { input_type, options, universal_tag } = question;

    // Determine disabled state for static fields if desired (Requirement said hard-lock static)
    const isDisabled = question.source_type === 'static' && question.is_imported;

    if (input_type === 'boolean') {
        return (
            <div className="flex gap-4">
                <label className={`flex items-center gap-2 cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                        type="radio"
                        name={universal_tag}
                        checked={currentValue === true || currentValue === 'true'}
                        onChange={() => !isDisabled && onChange(universal_tag, true)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                        type="radio"
                        name={universal_tag}
                        checked={currentValue === false || currentValue === 'false'}
                        onChange={() => !isDisabled && onChange(universal_tag, false)}
                        disabled={isDisabled}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">No</span>
                </label>
            </div>
        );
    }

    if (input_type === 'select' || input_type === 'scale_0_3') {
        return (
            <select
                value={currentValue || ''}
                onChange={(e) => onChange(universal_tag, e.target.value)}
                disabled={isDisabled}
                className={`w-full max-w-xs p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDisabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
            >
                <option value="">Select...</option>
                {options && options.map((opt, i) => (
                    <option key={i} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        );
    }

    if (input_type === 'date') {
        return (
            <input
                type="date"
                value={currentValue || ''}
                onChange={(e) => onChange(universal_tag, e.target.value)}
                disabled={isDisabled}
                className={`p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDisabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
            />
        );
    }

    if (input_type === 'integer') {
        return (
            <input
                type="number"
                value={currentValue || ''}
                onChange={(e) => onChange(universal_tag, e.target.value)}
                disabled={isDisabled}
                className={`w-32 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none ${isDisabled ? 'bg-gray-100 text-gray-500' : 'bg-white'}`}
            />
        );
    }

    return <div className="text-red-500 text-xs">Unknown Input Type: {input_type}</div>;
};

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);

export default RiskAssessmentModal;
