import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import axios from 'axios';
import { useUser } from '../../context/UserContext';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    isTomorrow
} from 'date-fns';

const CalendarModule = () => {
    const { currentUser, globalFilter, updateGlobalFilter } = useUser();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [appointments, setAppointments] = useState([]);

    // Filtering State (Local only for status/sort, global for office/officer)
    // Removed selectedOfficer / selectedOffice in favor of globalFilter
    const [officers, setOfficers] = useState([]);
    const [offices, setOffices] = useState([]);

    // Fetch Offices
    useEffect(() => {
        const fetchOffices = async () => {
            try {
                const response = await axios.get('http://localhost:8000/locations');
                setOffices(response.data);
            } catch (error) {
                console.error("Error fetching offices:", error);
            }
        };
        fetchOffices();
    }, []);

    // Fetch Officers (filtered by office if selected)
    useEffect(() => {
        const fetchOfficers = async () => {
            try {
                let url = 'http://localhost:8000/officers';
                if (globalFilter.office) {
                    url += `?location_id=${globalFilter.office}`;
                }
                const response = await axios.get(url);
                const mappedOfficers = response.data.map(o => ({
                    id: o.officer_id, // Map to officer_id to match global filter expectation
                    name: `${o.first_name} ${o.last_name}`
                }));
                setOfficers(mappedOfficers);
            } catch (error) {
                console.error("Error fetching officers:", error);
            }
        };
        fetchOfficers();
    }, [globalFilter.office]);

    // Default Filter to Current User
    useEffect(() => {
        if (!currentUser) return;

        const updates = {};
        if (currentUser.officerId && !globalFilter.officer) { // Use officerId
            updates.officer = currentUser.officerId;
        }
        if (currentUser.locationId && !globalFilter.office) {
            updates.office = currentUser.locationId;
        }

        if (Object.keys(updates).length > 0) {
            updateGlobalFilter(updates);
        }
    }, [currentUser]);

    // Fetch Appointments
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const params = new URLSearchParams();
                if (globalFilter.officer) params.append('officer_id', globalFilter.officer);
                if (globalFilter.office) params.append('location_id', globalFilter.office);

                const response = await axios.get(`http://localhost:8000/appointments?${params.toString()}`);
                setAppointments(response.data);
            } catch (error) {
                console.error("Error fetching appointments:", error);
            }
        };
        fetchAppointments();
    }, [currentMonth, globalFilter.officer, globalFilter.office]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const jumpToToday = () => setCurrentMonth(new Date());

    // Generate Calendar Grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    // Filtering for "Upcoming" list
    const todayEvents = appointments.filter(appt => isToday(new Date(appt.date_time)));
    const tomorrowEvents = appointments.filter(appt => isTomorrow(new Date(appt.date_time)));

    const getDayEvents = (day) => {
        return appointments.filter(appt => isSameDay(new Date(appt.date_time), day));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Calendar</h2>
                    <p className="text-slate-500">{format(currentMonth, 'MMMM yyyy')}</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={globalFilter.office}
                        onChange={(e) => {
                            updateGlobalFilter({
                                office: e.target.value,
                                officer: ''
                            });
                        }}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[140px] cursor-pointer"
                    >
                        <option value="">All Offices</option>
                        {offices.map(office => (
                            <option key={office.location_id} value={office.location_id}>{office.name}</option>
                        ))}
                    </select>

                    <select
                        value={globalFilter.officer}
                        onChange={(e) => updateGlobalFilter({ officer: e.target.value })}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[180px] cursor-pointer"
                    >
                        <option value="">All Officers</option>
                        {officers.map(officer => (
                            <option key={officer.id} value={officer.id}>{officer.name}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-50 rounded text-slate-600">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={jumpToToday} className="px-3 font-medium text-slate-700 text-sm hover:bg-slate-50 rounded">Today</button>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-50 rounded text-slate-600">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Calendar View */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="grid grid-cols-7 gap-4 text-center mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-sm font-medium text-slate-400 uppercase">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-4">
                        {calendarDays.map((day, i) => {
                            const dayEvents = getDayEvents(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isDayToday = isToday(day);

                            return (
                                <div
                                    key={i}
                                    className={`
                                        min-h-[6rem] border rounded-lg p-2 flex flex-col items-center justify-between
                                        ${!isCurrentMonth ? 'bg-slate-50 text-slate-400 border-transparent' : 'border-slate-100 hover:border-blue-200'}
                                        ${isDayToday ? 'bg-blue-50 border-blue-200' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-medium ${isDayToday ? 'text-blue-600' : (isCurrentMonth ? 'text-slate-700' : 'text-slate-400')}`}>
                                        {format(day, 'd')}
                                    </span>

                                    <div className="w-full space-y-1 mt-1">
                                        {dayEvents.slice(0, 3).map((evt, idx) => (
                                            <div key={idx} className={`h-1.5 rounded-full w-full ${evt.type === 'UA' ? 'bg-purple-400' : 'bg-blue-400'}`} title={evt.notes || 'Appointment'}></div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="h-1.5 rounded-full w-full bg-slate-300"></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming Events */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800">Upcoming Today</h3>
                    {todayEvents.length > 0 ? (
                        todayEvents.map(event => (
                            <div key={event.appointment_id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                                <h4 className="font-semibold text-slate-800 flex justify-between">
                                    {event.offender ? `${event.offender.first_name} ${event.offender.last_name}` : 'Unknown Offender'}
                                    <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">{event.type || 'Visit'}</span>
                                </h4>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(event.date_time), 'h:mm a')}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <MapPin className="w-4 h-4" />
                                        {event.location || 'TBD'}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 italic">No events scheduled today.</p>
                    )}

                    <h3 className="font-bold text-slate-800 mt-6">Tomorrow</h3>
                    {tomorrowEvents.length > 0 ? (
                        tomorrowEvents.map(event => (
                            <div key={event.appointment_id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
                                <h4 className="font-semibold text-slate-800 flex justify-between">
                                    {event.offender ? `${event.offender.first_name} ${event.offender.last_name}` : 'Unknown Offender'}
                                    <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">{event.type || 'Visit'}</span>
                                </h4>
                                <div className="mt-2 space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Clock className="w-4 h-4" />
                                        {format(new Date(event.date_time), 'h:mm a')}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <MapPin className="w-4 h-4" />
                                        {event.location || 'TBD'}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 italic">No events scheduled for tomorrow.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarModule;
