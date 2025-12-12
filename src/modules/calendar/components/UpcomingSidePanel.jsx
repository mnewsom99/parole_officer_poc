import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { getAppointmentStyle } from './calendarUtils';

const UpcomingSidePanel = ({
    selectedDate,
    onClearDate,
    appointments, // pre-filtered list
    onEventClick,
    onCreateForDate,
    appointmentSettings
}) => {
    return (
        <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                    {selectedDate ? format(selectedDate, 'MMM do') : 'Next 10 Appointments'}
                </h3>
                {selectedDate && (
                    <button
                        onClick={onClearDate}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="space-y-3 max-h-[1100px] overflow-y-auto pr-1">
                {appointments.length > 0 ? (
                    appointments.map(event => (
                        <div
                            key={event.appointment_id}
                            className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 cursor-pointer hover:shadow-md transition-shadow min-h-[115px] flex flex-col justify-center ${getAppointmentStyle(event.type, appointmentSettings).border}`}
                            onClick={(e) => onEventClick(e, event)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-slate-800 text-sm truncate max-w-[120px]" title={event.offender ? `${event.offender.first_name} ${event.offender.last_name}` : 'Unknown'}>
                                    {event.offender ? `${event.offender.last_name}, ${event.offender.first_name.charAt(0)}.` : 'Unknown'}
                                </span>
                                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{event.type || 'Visit'}</span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    <span>{format(new Date(event.date_time), 'MMM d, h:mm a')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{event.location || 'TBD'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-xs text-slate-400 italic mb-2">No appointments.</p>
                        {selectedDate && (
                            <button
                                onClick={onCreateForDate}
                                className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                            >
                                + Add to {format(selectedDate, 'MMM d')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingSidePanel;
