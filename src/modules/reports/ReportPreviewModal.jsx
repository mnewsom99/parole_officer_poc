import React from 'react';
import { X, Download, Printer } from 'lucide-react';

const ReportPreviewModal = ({ isOpen, onClose, report }) => {
    if (!isOpen || !report) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{report.title}</h3>
                        <p className="text-sm text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                            <Download className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-8 min-h-[500px]">
                        <div className="text-center mb-8 pb-8 border-b border-slate-100">
                            <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">DEPARTMENT OF CORRECTIONS</h1>
                            <h2 className="text-lg font-medium text-slate-600 uppercase tracking-wide">{report.title}</h2>
                        </div>

                        {/* Dynamic Mock Content based on Type */}
                        {report.type === 'table' ? (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold">Offender</th>
                                        <th className="px-4 py-3 font-semibold">Activity</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                                        <tr key={row} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-600">2023-12-0{row}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">DOE, John (A123{row})</td>
                                            <td className="px-4 py-3 text-slate-600">
                                                {row % 2 === 0 ? 'Office Visit' : 'Drug Test'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row % 3 === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {row % 3 === 0 ? 'Non-Compliant' : 'Completed'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-4 bg-slate-50 rounded border border-slate-200">
                                        <div className="text-sm text-slate-500 mb-1">Total Cases Reviewed</div>
                                        <div className="text-2xl font-bold text-slate-800">142</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded border border-slate-200">
                                        <div className="text-sm text-slate-500 mb-1">Compliance Rate</div>
                                        <div className="text-2xl font-bold text-slate-800">88.5%</div>
                                    </div>
                                </div>
                                <div className="prose max-w-none text-slate-600">
                                    <h4 className="text-slate-900 font-medium">Executive Summary</h4>
                                    <p>
                                        This report summarizes caseload activity for the selected period.
                                        Overall trends indicate a stabilizing compliance rate across all risk levels.
                                        High-risk offenders showed a 5% improvement in reporting consistency.
                                    </p>
                                    <h4 className="text-slate-900 font-medium mt-4">Key Findings</h4>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Employment rates remained steady at 65%.</li>
                                        <li>Urinalysis positives decreased by 12% compared to previous period.</li>
                                        <li>3 Warrants were executed successfully.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                            <span>System Generated Report</span>
                            <span>Page 1 of 1</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                    >
                        Close Preview
                    </button>
                    <button className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
                        Export Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportPreviewModal;
