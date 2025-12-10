import React, { useState } from 'react';
import { Plus, Trash2, ChevronRight, ChevronDown, List } from 'lucide-react';
import { useUser } from '../../../core/context/UserContext';

const TaskCategorySettings = () => {
    const { taskSettings, updateTaskSettings } = useUser();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [newSubcategoryName, setNewSubcategoryName] = useState('');

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;

        // Prevent duplicates
        if (taskSettings.categories.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            alert('Category already exists');
            return;
        }

        const newCategories = [...taskSettings.categories, { name: newCategoryName.trim(), subcategories: [] }];
        updateTaskSettings(newCategories);
        setNewCategoryName('');
    };

    const handleRemoveCategory = (name) => {
        if (confirm(`Are you sure you want to delete category "${name}"?`)) {
            const newCategories = taskSettings.categories.filter(c => c.name !== name);
            updateTaskSettings(newCategories);
        }
    };

    const handleAddSubcategory = (categoryName) => {
        if (!newSubcategoryName.trim()) return;

        const categoryIndex = taskSettings.categories.findIndex(c => c.name === categoryName);
        if (categoryIndex === -1) return;

        const category = taskSettings.categories[categoryIndex];

        // Prevent duplicates
        if (category.subcategories.some(s => s.toLowerCase() === newSubcategoryName.trim().toLowerCase())) {
            alert('Subcategory already exists');
            return;
        }

        const newCategories = [...taskSettings.categories];
        newCategories[categoryIndex] = {
            ...category,
            subcategories: [...category.subcategories, newSubcategoryName.trim()]
        };

        updateTaskSettings(newCategories);
        setNewSubcategoryName('');
    };

    const handleRemoveSubcategory = (categoryName, subcategoryName) => {
        const categoryIndex = taskSettings.categories.findIndex(c => c.name === categoryName);
        if (categoryIndex === -1) return;

        const category = taskSettings.categories[categoryIndex];
        const newCategories = [...taskSettings.categories];

        newCategories[categoryIndex] = {
            ...category,
            subcategories: category.subcategories.filter(s => s !== subcategoryName)
        };

        updateTaskSettings(newCategories);
    };

    const toggleExpand = (name) => {
        if (expandedCategory === name) {
            setExpandedCategory(null);
        } else {
            setExpandedCategory(name);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Task Configuration</h3>
            <p className="text-sm text-slate-500 mb-6">Define the categories and sub-categories available for tasks. These are used for filtering and reporting.</p>

            {/* Add New Category */}
            <div className="flex gap-2 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new category name (e.g. Home Visit)..."
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                />
                <button
                    onClick={handleAddCategory}
                    disabled={!newCategoryName}
                    className="bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Category
                </button>
            </div>

            <div className="space-y-3">
                {taskSettings?.categories?.map((category) => (
                    <div key={category.name} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div
                            className={`flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-slate-50 transition-colors ${expandedCategory === category.name ? 'border-b border-slate-100' : ''}`}
                            onClick={() => toggleExpand(category.name)}
                        >
                            <div className="flex items-center gap-3">
                                {expandedCategory === category.name ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                <span className="font-medium text-slate-700">{category.name}</span>
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {category.subcategories.length} sub-types
                                </span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveCategory(category.name); }}
                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {expandedCategory === category.name && (
                            <div className="p-4 bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                                <div className="ml-8 space-y-3">
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={newSubcategoryName}
                                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                                            placeholder={`Add sub-type to ${category.name}...`}
                                            className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleAddSubcategory(category.name); }}
                                            disabled={!newSubcategoryName}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {category.subcategories.length === 0 ? (
                                        <div className="text-sm text-slate-400 italic">No subcategories defined.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {category.subcategories.map((sub, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-sm">
                                                    <span className="text-slate-600 pl-2 border-l-2 border-violet-200">{sub}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveSubcategory(category.name, sub); }}
                                                        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {(!taskSettings?.categories || taskSettings.categories.length === 0) && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <List size={48} className="mx-auto text-slate-300 mb-3" />
                        <h3 className="text-slate-500 font-medium">No Categories Configured</h3>
                        <p className="text-slate-400 text-sm">Add a category above to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCategorySettings;
