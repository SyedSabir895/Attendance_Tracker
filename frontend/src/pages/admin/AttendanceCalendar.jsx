import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { attendanceAPI } from '../../api/attendance.api';
import { employeeAPI } from '../../api/employee.api';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import { Select } from '../../components/common/Input';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-orange-500',
  half_day: 'bg-yellow-500', leave: 'bg-purple-500', wfh: 'bg-blue-500',
  holiday: 'bg-teal-500',
};

export default function AttendanceCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayRecords, setDayRecords] = useState([]);
  const [monthData, setMonthData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(false);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  useEffect(() => {
    employeeAPI.getDropdown().then(({ data }) => setEmployees(data.data));
  }, []);

  useEffect(() => {
    loadMonthData();
  }, [year, month, selectedEmployee]);

  const loadMonthData = async () => {
    try {
      const params = { month: month + 1, year, limit: 500 };
      if (selectedEmployee) params.employee = selectedEmployee;
      const { data } = await attendanceAPI.getAll(params);

      const map = {};
      data.data.forEach((rec) => {
        const d = new Date(rec.date).getUTCDate();
        if (!map[d]) map[d] = [];
        map[d].push(rec);
      });
      setMonthData(map);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDayClick = async (day) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setLoading(true);
    try {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const { data } = await attendanceAPI.getByDate(dateStr);
      setDayRecords(data.data);
    } catch (err) {
      toast.error('Failed to load date records');
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Calendar</h1>
          <p className="text-gray-500 text-sm">Click any date to see details</p>
        </div>
        <div className="w-64">
          <select
            className="input"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">All Employees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>{e.firstName} {e.lastName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="card p-5 lg:col-span-2">
          {/* Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <MdChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <MdChevronRight size={20} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayRecs = monthData[day] || [];
              const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
              const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              const isWeekend = [0, 6].includes(new Date(year, month, day).getDay());

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`relative aspect-square flex flex-col items-center justify-start p-1 rounded-xl text-sm transition-all ${
                    isSelected ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' :
                    isToday ? 'bg-primary-600 text-white' :
                    isWeekend ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-400' :
                    'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={`font-semibold text-xs ${isToday ? 'text-white' : ''}`}>{day}</span>
                  {isWeekend && dayRecs.length === 0 ? (
                    <div className="flex gap-0.5 mt-0.5 justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    </div>
                  ) : dayRecs.length > 0 ? (
                    <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                      {dayRecs.slice(0, 4).map((rec, ri) => (
                        <span key={ri} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[rec.status] || 'bg-gray-400'}`} />
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="capitalize">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Day detail */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
            </h3>
          </div>
          <div className="overflow-y-auto max-h-96">
            {loading ? (
              <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 rounded-full border-b-2 border-primary-600" /></div>
            ) : !selectedDate ? (
              <p className="text-center text-gray-400 py-8 text-sm">Click a date to view attendance</p>
            ) : dayRecords.length === 0 && [0, 6].includes(selectedDate?.getDay()) ? (
              <div className="text-center py-8">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium">Weekend</span>
                <p className="text-gray-400 text-xs mt-2">No attendance on weekends</p>
              </div>
            ) : dayRecords.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No records for this date</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {dayRecords.map((rec) => (
                  <div key={rec._id} className="flex items-center gap-3 px-4 py-3">
                    <Avatar name={rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : '?'} src={rec.employee?.profilePhoto} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {rec.employee ? `${rec.employee.firstName} ${rec.employee.lastName}` : 'Unknown'}
                      </p>
                      {rec.checkIn && <p className="text-xs text-gray-400">{rec.checkIn} – {rec.checkOut || '?'}</p>}
                    </div>
                    <Badge status={rec.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
