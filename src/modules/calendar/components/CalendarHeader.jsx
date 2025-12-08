import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, isSameMonth, startOfWeek, endOfWeek, addWeeks } from 'date-fns';

const CalendarHeader = ({
    viewMode,
    setViewMode,
    currentMonth,
    onPrev,
    onNext,
    onToday,
    globalFilter,
    updateGlobalFilter,
    selectedType,
    setSelectedType,
    onCreateClick,
    offices,
    officers,
    appointmentSettings
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Calendar</h2>
                <p className="text-slate-500">
                    {viewMode === 'month'
                        ? format(currentMonth, 'MMMM yyyy')
                        : isSameMonth(startOfWeek(currentMonth), endOfWeek(currentMonth))
                            ? format(startOfWeek(currentMonth), 'MMMM yyyy')
                            : `${format(startOfWeek(currentMonth), 'MMM')} - ${format(endOfWeek(viewMode === '2week' ? addWeeks(currentMonth, 1) : currentMonth), 'MMM yyyy')}`
                    }
                </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-sm">
                <button
                    onClick={onCreateClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New</span>
                </button>

                <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer min-w-[100px]"
                >
                    <option value="month">Month View</option>
                    <option value="week">Week View</option>
                    <option value="2week">2 Weeks View</option>
                </select>

                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer min-w-[100px]"
                >
                    <option value="">All Types</option>
                    {appointmentSettings?.types.map(type => (
                        <option key={type.name} value={type.name}>{type.name}</option>
                    ))}
                </select>

                <select
                    value={globalFilter.office}
                    onChange={(e) => {
                        updateGlobalFilter({
                            office: e.target.value,
                            officer: ''
                        });
                    }}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer max-w-[140px]"
                >
                    <option value="">All Offices</option>
                    {offices.map(office => (
                        <option key={office.location_id} value={office.location_id}>{office.name}</option>
                    ))}
                </select>

                <select
                    value={globalFilter.officer}
                    onChange={(e) => updateGlobalFilter({ officer: e.target.value })}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 cursor-pointer max-w-[140px]"
                >
                    <option value="">All Officers</option>
                    {officers.map(officer => (
                        <option key={officer.id} value={officer.id}>{officer.name}</option>
                    ))}
                </select>

                <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
                    <button onClick={onPrev} className="p-1 hover:bg-slate-50 rounded text-slate-600">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={onToday} className="px-2 font-medium text-slate-700 hover:bg-slate-50 rounded">Today</button>
                    <button onClick={onNext} className="p-1 hover:bg-slate-50 rounded text-slate-600">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarHeader;
