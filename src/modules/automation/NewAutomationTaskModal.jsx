import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, FileText, User, ChevronRight } from 'lucide-react';

const NewAutomationTaskModal = ({ isOpen, onClose, onSuccess }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [offenders, setOffenders] = useState([]);
    const [selectedOffender, setSelectedOffender] = useState('');
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            fetchOffenders();
            resetForm();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('http://localhost:8000/workflows/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const fetchOffenders = async () => {
        try {
            // In a real app, this should probably be a search input, not a fetch all
            const response = await axios.get('http://localhost:8000/offenders?limit=100');
            setOffenders(response.data.data || []);
        } catch (error) {
            console.error("Error fetching offenders:", error);
        }
    };

    const resetForm = () => {
        setSelectedTemplate(null);
        setSelectedOffender('');
        setFormData({});
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                template_id: selectedTemplate.template_id,
                offender_id: selectedOffender,
                form_data: formData
            };
            await axios.post('http://localhost:8000/workflows/submissions', payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Failed to submit form");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        New Request
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Step 1: Select Template */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">1. Select Request Type</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {templates.map(template => (
                                <button
                                    key={template.template_id}
                                    onClick={() => setSelectedTemplate(template)}
                                    className={`p-4 border rounded-xl text-left transition-all ${selectedTemplate?.template_id === template.template_id
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="font-semibold text-slate-900">{template.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{template.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedTemplate && (
                        <>
                            {/* Step 2: Select Offender */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700">2. Select Offender</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                    <select
                                        value={selectedOffender}
                                        onChange={(e) => setSelectedOffender(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Select an offender...</option>
                                        {offenders.map(offender => (
                                            <option key={offender.id} value={offender.id}>
                                                {offender.name} ({offender.badgeId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Step 3: Fill Dynamic Form */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-700">3. Request Details</label>
                                <form id="workflow-form" onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    {selectedTemplate.form_schema.fields.map(field => (
                                        <div key={field.name}>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                                {field.label}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea
                                                    required
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    rows="3"
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                />
                                            ) : (
                                                <input
                                                    type={field.type || 'text'}
                                                    required
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </form>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3 sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        form="workflow-form"
                        type="submit"
                        disabled={!selectedTemplate || !selectedOffender || isLoading}
                        className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 ${(!selectedTemplate || !selectedOffender || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                        {!isLoading && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewAutomationTaskModal;
