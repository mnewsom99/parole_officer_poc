import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../../core/context/UserContext';
import {
    FileText, Image as ImageIcon, File, Download, Trash2,
    Upload, Loader, AlertCircle
} from 'lucide-react';

const API_URL = 'http://localhost:8000'; // TODO: Move to config

const DocumentsTab = ({ offenderId }) => {
    const { currentUser } = useUser();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (offenderId) {
            fetchDocuments();
        }
    }, [offenderId]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/documents/offender/${offenderId}`);
            setDocuments(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching documents:", err);
            setError("Failed to load documents.");
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file) => {
        if (!file) return;

        // Basic validation
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert("File is too large (Max 10MB)");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('offender_id', offenderId);
        if (currentUser?.officerId) {
            formData.append('uploaded_by_id', currentUser.officerId);
        }
        formData.append('category', 'General');

        try {
            setUploading(true);
            await axios.post(`${API_URL}/documents/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Refresh list
            fetchDocuments();
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleFileSelect = (e) => {
        uploadFile(e.target.files[0]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;

        try {
            await axios.delete(`${API_URL}/documents/${docId}`);
            setDocuments(documents.filter(d => d.document_id !== docId));
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Failed to delete document.");
        }
    };

    const getFileIcon = (type) => {
        if (type?.includes('image')) return <ImageIcon className="text-purple-500" size={24} />;
        if (type?.includes('pdf')) return <FileText className="text-red-500" size={24} />;
        return <File className="text-blue-500" size={24} />;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Documents</h3>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                <Loader size={16} className="animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Upload Document
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Persistent Drop Zone */}
            <div
                className={`text-center py-8 rounded-xl border-dashed border-2 transition-all cursor-pointer ${isDragging ? 'bg-blue-50 border-blue-400 scale-[1.01]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="pointer-events-none">
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-slate-300'}`} />
                    <p className={`font-medium ${isDragging ? 'text-blue-600' : 'text-slate-600'}`}>
                        {isDragging ? 'Drop file here' : 'Click or Drag & Drop to Upload'}
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Supports images, PDF, documents (Max 10MB)</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-10">
                    <Loader size={24} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-slate-400 mt-2 text-sm">Loading documents...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-slate-400 italic">
                            No documents uploaded yet.
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <div key={doc.document_id} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 bg-slate-50 rounded-lg">
                                        {getFileIcon(doc.file_type)}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click issues
                                            handleDelete(doc.document_id);
                                        }}
                                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <h4 className="font-medium text-slate-800 truncate mb-1" title={doc.file_name}>
                                    {doc.file_name}
                                </h4>

                                <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                        {doc.category || 'General'}
                                    </span>
                                </div>

                                <a
                                    href={`${API_URL}/media/${doc.file_path.split(/[\\/]/).pop()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Download size={14} />
                                    Download / View
                                </a>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentsTab;
