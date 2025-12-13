import React, { useState, useEffect } from 'react';
import { Database, ArrowRight, Table, Layers, ChevronRight, ChevronDown } from 'lucide-react';
import generatedSchema from "../../../data/schema.json";

// Fallback if JSON is missing or empty (for initial load before script run)
const SchemaViewer = () => {
    const [activeTab, setActiveTab] = useState('schema');
    const [expandedTable, setExpandedTable] = useState('Offenders');
    const [schemaData, setSchemaData] = useState(generatedSchema);

    useEffect(() => {
        if (!generatedSchema || Object.keys(generatedSchema).length === 0) {
            // Keep hardcoded as fallback or show loading
            console.warn("Schema JSON not found or empty. Ensure backend/export_schema.py has been run.");
        } else {
            setSchemaData(generatedSchema);
        }
    }, []);

    const mappings = [
        { legacy: 'DOC_NUM', new: 'Offenders.badge_id', transform: 'Direct Map' },
        { legacy: 'FIRST_NAME', new: 'Offenders.first_name', transform: 'Direct Map' },
        { legacy: 'LAST_NAME', new: 'Offenders.last_name', transform: 'Direct Map' },
        { legacy: 'DOB', new: 'Offenders.dob', transform: 'Date Conversion' },
        { legacy: 'GENDER', new: 'Offenders.gender', transform: 'Direct Map' },
        { legacy: 'SUPERVISION_START_DATE', new: 'SupervisionEpisodes.start_date', transform: 'Date Conversion' },
        { legacy: 'CSED', new: 'SupervisionEpisodes.end_date', transform: 'Date Conversion' },
        { legacy: 'RISK_LEVEL', new: 'SupervisionEpisodes.risk_level_at_start', transform: 'Enum Mapping' },
        { legacy: 'CURRENT_ADDRESS', new: 'Residences.address_line_1', transform: 'Parse & Split' },
        { legacy: 'SPECIAL_CONDITIONS', new: 'Tasks (Multiple)', transform: 'One-to-Many Split' },
        { legacy: 'RISK_SCORE_TOTAL', new: 'RiskAssessments.total_score', transform: 'Direct Map' },
        { legacy: 'RISK_ASSESSMENT_DATE', new: 'RiskAssessments.date', transform: 'Date Conversion' },
        { legacy: 'AGE_AT_FIRST_ARREST', new: 'RiskFactors.age_first_arrest', transform: 'Logic Extraction' },
        { legacy: 'PRIOR_FELONY_COUNT', new: 'RiskFactors.prior_felony_convictions', transform: 'Direct Map' },
        { legacy: 'PRIOR_SEX_OFFENSES', new: 'RiskFactors.prior_sex_offenses', transform: 'Direct Map' },
        { legacy: 'EMPLOYMENT_STATUS', new: 'RiskFactors.employment_status', transform: 'Boolean Conversion' },
        { legacy: 'PROGRAM_ASSIGNED', new: 'Programs.name', transform: 'Lookup' },
        { legacy: 'PROGRAM_STATUS', new: 'Programs.status', transform: 'Enum Mapping' },
        { legacy: 'OWED_AMOUNT', new: 'FeeBalances.balance', transform: 'Decimal Conversion' },
        { legacy: 'DRUG_TEST_DATE', new: 'Urinalysis.date', transform: 'Date Conversion' },
        { legacy: 'DRUG_TEST_RESULT', new: 'Urinalysis.result', transform: 'Standardization' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('schema')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'schema' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Database className="w-4 h-4" />
                    Database Schema
                </button>
                <button
                    onClick={() => setActiveTab('mapping')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'mapping' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Layers className="w-4 h-4" />
                    Legacy Mapping
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'schema' ? (
                    <div className="grid grid-cols-1 gap-6">
                        {Object.entries(schemaData).map(([tableName, data]) => (
                            <div key={tableName} className="border border-slate-200 rounded-lg overflow-hidden">
                                <div
                                    className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                                    onClick={() => setExpandedTable(expandedTable === tableName ? null : tableName)}
                                >
                                    <div className="flex items-center gap-2 font-bold text-slate-700">
                                        <Table className="w-4 h-4 text-slate-500" />
                                        {tableName}
                                    </div>
                                    {expandedTable === tableName ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                </div>
                                {expandedTable === tableName && (
                                    <div className="p-4 bg-white">
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 text-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</span>
                                                    <p className="text-slate-700">{data.description || 'No description provided.'}</p>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Context & Reason</span>
                                                    <p className="text-slate-700">{data.context || 'Standard Schema Entity'}</p>
                                                </div>
                                                <div>
                                                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Usage</span>
                                                    <p className="text-slate-700">{data.usage || 'Backend API'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                                <tr>
                                                    <th className="px-2 py-1 w-1/4">Field</th>
                                                    <th className="px-2 py-1 w-1/6">Type</th>
                                                    <th className="px-2 py-1 w-16">Key</th>
                                                    <th className="px-2 py-1 w-1/2">Reason / Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.fields.map((field, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                        <td className="px-2 py-2 font-mono text-slate-700">{field.name}</td>
                                                        <td className="px-2 py-2 text-slate-500">{field.type}</td>
                                                        <td className="px-2 py-2">
                                                            {field.key && (
                                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${field.key === 'PK' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {field.key}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-2 py-2 text-slate-600 text-sm italic">
                                                            {field.description || <span className="text-slate-300">-</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm font-bold text-slate-500 uppercase px-4">
                            <div className="w-1/3">Legacy System (Source)</div>
                            <div className="w-1/3 text-center">Transformation</div>
                            <div className="w-1/3 text-right">New Schema (Target)</div>
                        </div>
                        {mappings.map((map, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="w-1/3 font-mono text-sm text-slate-700 bg-white px-3 py-2 rounded border border-slate-200 shadow-sm inline-block">
                                    {map.legacy}
                                </div>
                                <div className="w-1/3 flex flex-col items-center text-slate-400">
                                    <span className="text-xs mb-1">{map.transform}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                                <div className="w-1/3 text-right">
                                    <div className="font-mono text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded border border-blue-100 shadow-sm inline-block">
                                        {map.new}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchemaViewer;
