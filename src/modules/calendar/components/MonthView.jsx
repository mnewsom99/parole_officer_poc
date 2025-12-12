import React, { useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { format, isSameMonth, isToday, isSameDay } from 'date-fns';
import { getAppointmentStyle } from './calendarUtils';

const MonthView = ({
    currentMonth,
    calendarDays,
    getDayEvents,
    selectedDate,
    onDayClick,
    onEventClick,
    appointmentSettings
}) => {
    // Hover State
    const [hoveredAppointment, setHoveredAppointment] = useState(null);
    const [hoverPosition, setHoverPosition] = useState(null);

    const handleEventMouseEnter = (e, appointment) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredAppointment(appointment);
        setHoverPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX + rect.width + 10,
            rect
        });
    };

    const handleEventMouseLeave = () => {
        setHoveredAppointment(null);
        setHoverPosition(null);
    };

    return (
        <>
            {/* Hover Tooltip - Ideally this could be its own Portal/global component, but kept here for now */}
            {hoveredAppointment && hoverPosition && (
                <div
                    className="fixed z-50 bg-white p-3 rounded-lg shadow-xl border border-slate-200 border-l-4 w-64 pointer-events-none transition-opacity duration-200 animate-in fade-in zoom-in-95"
                    style={{
                        top: Math.min(hoverPosition.top, window.innerHeight - 150),
                        left: Math.min(hoverPosition.left, window.innerWidth - 270),
                        borderLeftColor: 'transparent' // Reset, applied by class below
                    }}
                >
                    <div className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${getAppointmentStyle(hoveredAppointment.type, appointmentSettings).bg}`}></div>

                    <div className="flex justify-between items-start mb-1 pl-2">
                        <span className="font-semibold text-slate-800 text-sm truncate" title={hoveredAppointment.offender ? `${hoveredAppointment.offender.first_name} ${hoveredAppointment.offender.last_name}` : 'Unknown'}>
                            {hoveredAppointment.offender ? `${hoveredAppointment.offender.last_name}, ${hoveredAppointment.offender.first_name}` : 'Unknown'}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{hoveredAppointment.type || 'Visit'}</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-500 pl-2">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(hoveredAppointment.date_time), 'MMM d, h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{hoveredAppointment.location || 'TBD'}</span>
                        </div>
                        {hoveredAppointment.notes && (
                            <div className="mt-2 pt-2 border-t border-slate-100 italic text-[10px] text-slate-400 line-clamp-2">
                                "{hoveredAppointment.notes}"
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-7 border-b border-white/50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-slate-500 uppercase bg-white/30 backdrop-blur-sm">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr bg-slate-200 gap-px border-b border-l border-slate-200">
                {calendarDays.map((day, i) => {
                    const dayEvents = getDayEvents(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                        <div
                            key={i}
                            className={`
                            bg-white relative p-1 flex flex-col gap-1 cursor-pointer transition-colors min-h-[100px]
                            ${!isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-slate-50'}
                            ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}
                        `}
                            onClick={() => onDayClick(day)}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`
                                text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                                ${isDayToday ? 'bg-blue-600 text-white' : 'text-slate-700'}
                            `}>
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                {dayEvents.slice(0, 3).map((evt, idx) => {
                                    const style = getAppointmentStyle(evt.type, appointmentSettings);
                                    return (
                                        <div
                                            key={idx}
                                            className={`
                                            text-sm px-2 py-2 rounded truncate font-medium
                                            ${style.bg} ${style.text.replace('text-', 'text-opacity-90 text-white ')} 
                                            min-h-[40px] shadow-sm flex items-center 
                                        `}
                                            onMouseEnter={(e) => handleEventMouseEnter(e, evt)}
                                            onMouseLeave={handleEventMouseLeave}
                                            style={{ backgroundColor: style.bgSoft.replace('bg-', '') }} // Use soft background
                                        >
                                            <div className={`w-full h-full rounded px-1 flex items-center gap-1 ${style.bgSoft} ${style.text}`}>
                                                <span className="font-bold shrink-0">{format(new Date(evt.date_time), 'h:mm a')}</span>
                                                <span className="truncate">{evt.type}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {dayEvents.length > 3 && (
                                    <div className="text-[10px] text-slate-400 pl-1">
                                        + {dayEvents.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default MonthView;
