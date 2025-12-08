import React, { useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { getAppointmentStyle } from './calendarUtils';

const WeekView = ({
    calendarDays,
    getDayEvents,
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
        <div className="flex flex-col h-full overflow-hidden relative">
            {/* Hover Tooltip */}
            {hoveredAppointment && hoverPosition && (
                <div
                    className="fixed z-50 bg-white p-3 rounded-lg shadow-xl border border-slate-200 border-l-4 w-64 pointer-events-none transition-opacity duration-200 animate-in fade-in zoom-in-95"
                    style={{
                        top: Math.min(hoverPosition.top, window.innerHeight - 150),
                        left: Math.min(hoverPosition.left, window.innerWidth - 270),
                        borderLeftColor: 'transparent'
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

            <div className="grid grid-cols-8 border-b border-slate-200">
                <div className="p-2 border-r border-slate-100 bg-slate-50"></div> {/* Time Header */}
                {calendarDays.map((day) => (
                    <div key={day.toString()} className={`p-2 text-center border-r border-slate-100 bg-slate-50 ${isToday(day) ? 'bg-blue-50/50' : ''}`}>
                        <div className={`text-xs font-medium uppercase ${isToday(day) ? 'text-blue-600' : 'text-slate-500'}`}>{format(day, 'EEE')}</div>
                        <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-800'}`}>{format(day, 'd')}</div>
                    </div>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto relative">
                <div className="grid grid-cols-8 min-h-[600px]">
                    {/* Time Column */}
                    <div className="border-r border-slate-200 bg-white">
                        {Array.from({ length: 14 }).map((_, i) => {
                            const hour = i + 6;
                            return (
                                <div key={hour} className="h-14 border-b border-slate-100 text-[10px] text-slate-400 text-right pr-2 pt-1 relative">
                                    <span className="-top-2 relative">{hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Day Columns */}
                    {calendarDays.map((day, dayIdx) => {
                        const dayEvents = getDayEvents(day);
                        return (
                            <div key={dayIdx} className="border-r border-slate-100 relative bg-white" onClick={() => onDayClick(day)}>
                                {/* Grid Lines */}
                                {Array.from({ length: 14 }).map((_, i) => (
                                    <div key={i} className="h-14 border-b border-slate-100"></div>
                                ))}

                                {/* Events */}
                                {dayEvents.map((evt) => {
                                    const date = new Date(evt.date_time);
                                    const hour = date.getHours();
                                    if (hour < 6 || hour > 19) return null;

                                    const minutes = date.getMinutes();
                                    const top = ((hour - 6) * 56) + ((minutes / 60) * 56);
                                    const height = 56;
                                    const style = getAppointmentStyle(evt.type, appointmentSettings);

                                    return (
                                        <div
                                            key={evt.appointment_id}
                                            className={`absolute left-0.5 right-0.5 rounded px-2 py-1 text-xs border-l-2 cursor-pointer hover:brightness-95 shadow-sm overflow-hidden 
                                            ${style.bgSoft} ${style.border} ${style.text}`}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEventClick(e, evt);
                                            }}
                                            onMouseEnter={(e) => handleEventMouseEnter(e, evt)}
                                            onMouseLeave={handleEventMouseLeave}
                                        >
                                            <div className="font-bold text-[10px] sm:text-xs truncate">
                                                {evt.type}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeekView;
