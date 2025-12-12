import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Layout, ArrowRight, Trash2 } from 'lucide-react';
import AssessmentBuilder from './AssessmentBuilder';

const AssessmentsModule = () => {
    const [instruments, setInstruments] = useState([]);
    const [view, setView] = useState('list'); // 'list', 'builder'
    const [selectedInstrumentId, setSelectedInstrumentId] = useState(null);

    useEffect(() => {
        fetchInstruments();
    }, []);

    const fetchInstruments = async () => {
        try {
            const res = await axios.get('http://localhost:8000/assessments/instruments');
            setInstruments(res.data);
        } catch (error) {
            console.error("Error fetching instruments:", error);
        }
    };

    const handleDelete = async (inst) => {
        if (window.confirm(`Are you sure you want to delete "${inst.name}"? This will remove all associated domains, questions, and historical data if any.`)) {
            try {
                await axios.delete(`http://localhost:8000/assessments/instruments/${inst.instrument_id}`);
                fetchInstruments(); // Refresh list
            } catch (error) {
                console.error("Error deleting instrument:", error);
                alert("Failed to delete instrument.");
            }
        }
    };


    if (view === 'builder') {
        return (
            <AssessmentBuilder
                instrumentId={selectedInstrumentId}
                onClose={() => { setSelectedInstrumentId(null); setView('list'); fetchInstruments(); }}
            />
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Assessment Tools</h1>
                    <p className="text-slate-500">Manage risk assessment instruments and scoring logic.</p>
                </div>
                <button
                    onClick={() => { setSelectedInstrumentId(null); setView('builder'); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Create New Tool
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instruments.map(inst => (
                    <div key={inst.instrument_id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between h-[200px]">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                    {inst.version || 'v1.0'}
                                </span>
                                {inst.is_active && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        Active
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{inst.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {inst.domains?.slice(0, 3).map(d => (
                                    <span key={d.domain_id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {d.name}
                                    </span>
                                ))}
                                {(inst.domains?.length > 3) && <span className="text-xs text-slate-400">+{inst.domains.length - 3} more</span>}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => { setSelectedInstrumentId(inst.instrument_id); setView('builder'); }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
                            >
                                Edit Configuration
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(inst); }}
                                className="text-sm font-medium text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                                title="Delete Tool"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State / Create Card */}
                {instruments.length === 0 && (
                    <div
                        onClick={() => { setSelectedInstrumentId(null); setView('builder'); }}
                        className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors h-[200px]"
                    >
                        <Layout className="w-8 h-8 mb-2 opacity-50" />
                        <span className="font-medium">Create your first tool</span>
                    </div>
                )}
            </div>
        </div >
    );
};

export default AssessmentsModule;
