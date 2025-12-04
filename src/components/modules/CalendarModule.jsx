import React from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';

const CalendarModule = () => {
    const events = [
        { id: 1, title: 'Home Visit - John Doe', time: '2:00 PM - 3:00 PM', location: '123 Main St', type: 'visit' },
        { id: 2, title: 'Staff Meeting', time: '4:00 PM - 5:00 PM', location: 'Conference Room B', type: 'meeting' },
        { id: 3, title: 'Court Hearing - Sarah Smith', time: '9:00 AM - 11:00 AM', location: 'County Court, Room 304', type: 'court', date: 'Tomorrow' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Calendar</h2>
                    <p className="text-slate-500">December 2025</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                    <button className="p-1 hover:bg-slate-50 rounded text-slate-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 font-medium text-slate-700">Today</span>
                    <button className="p-1 hover:bg-slate-50 rounded text-slate-600">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Calendar View (Mock) */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="grid grid-cols-7 gap-4 text-center mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-sm font-medium text-slate-400 uppercase">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-4">
                        {Array.from({ length: 35 }).map((_, i) => {
                            const day = i - 2; // Offset for mock start of month
                            const isToday = day === 4; // Mock today is the 4th
                            return (
                                <div
                                    key={i}
                                    className={`h-24 border rounded-lg p-2 ${day > 0 && day <= 31 ? 'border-slate-100 hover:border-blue-200' : 'border-transparent'} ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                                >
                                    {day > 0 && day <= 31 && (
                                        <>
                                            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{day}</span>
                                            {day === 4 && <div className="mt-1 w-full h-1.5 bg-blue-400 rounded-full"></div>}
                                            {day === 5 && <div className="mt-1 w-full h-1.5 bg-purple-400 rounded-full"></div>}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800">Upcoming Today</h3>
                    {events.filter(e => !e.date).map(event => (
                        <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                            <h4 className="font-semibold text-slate-800">{event.title}</h4>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Clock className="w-4 h-4" />
                                    {event.time}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                </div>
                            </div>
                        </div>
                    ))}

                    <h3 className="font-bold text-slate-800 mt-6">Tomorrow</h3>
                    {events.filter(e => e.date === 'Tomorrow').map(event => (
                        <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
                            <h4 className="font-semibold text-slate-800">{event.title}</h4>
                            <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Clock className="w-4 h-4" />
                                    {event.time}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <MapPin className="w-4 h-4" />
                                    {event.location}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarModule;
