import { useState, useEffect, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { attendanceAPI } from '../../api/attendance.api';
import Badge from '../../components/common/Badge';

const STATUS_DOT = {
  present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-orange-500',
  half_day: 'bg-yellow-500', leave: 'bg-purple-500', wfh: 'bg-blue-500', holiday: 'bg-teal-500',
};

const STATUS_ABBR = {
  present: 'P', absent: 'A', late: 'LT', half_day: 'HD', leave: 'L', wfh: 'WFH', holiday: 'H',
};

export default function EmployeeAttendance() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getMy({ month, year });
      setRecords(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const recordMap = records.reduce((acc, r) => { acc[new Date(r.date).getDate()] = r; return acc; }, {});

  const summary = {
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    leave: records.filter((r) => r.status === 'leave').length,
    wfh: records.filter((r) => r.status === 'wfh').length,
    holiday: records.filter((r) => r.status === 'holiday').length,
  };

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attendance</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Present', value: summary.present, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Absent', value: summary.absent, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Late', value: summary.late, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Leave', value: summary.leave, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'WFH', value: summary.wfh, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Holiday', value: summary.holiday, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
        ].map((s) => (
          <div key={s.label} className={`card p-3 text-center ${s.bg}`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <MdChevronLeft size={20} />
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-white">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <MdChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 rounded-full border-b-2 border-primary-600" /></div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const rec = recordMap[day];
              const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
              const isWeekend = [0, 6].includes(new Date(year, month - 1, day).getDay());

              return (
                <div
                  key={day}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all ${
                    isToday ? 'ring-2 ring-primary-500' : ''
                  } ${
                    rec ? STATUS_DOT[rec.status]?.replace('bg-', 'bg-opacity-10 bg-') || '' : ''
                  } ${isWeekend && !rec ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                >
                  <span className={`font-semibold ${isToday ? 'text-primary-600' : isWeekend ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day}
                  </span>
                  {rec && (
                    <span className={`text-xs font-bold ${
                      rec.status === 'present' ? 'text-green-600' :
                      rec.status === 'absent' ? 'text-red-600' :
                      rec.status === 'late' ? 'text-orange-600' :
                      rec.status === 'leave' ? 'text-purple-600' :
                      rec.status === 'wfh' ? 'text-blue-600' : 'text-teal-600'
                    }`}>
                      {STATUS_ABBR[rec.status]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Detailed Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Day</th>
                <th className="table-header">Status</th>
                <th className="table-header">Check In</th>
                <th className="table-header">Check Out</th>
                <th className="table-header">Hours</th>
                <th className="table-header">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No records for this month</td></tr>
              ) : [...records].sort((a, b) => new Date(a.date) - new Date(b.date)).map((rec) => (
                <tr key={rec._id}>
                  <td className="table-cell text-xs">{new Date(rec.date).toLocaleDateString()}</td>
                  <td className="table-cell text-xs text-gray-500">{new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' })}</td>
                  <td className="table-cell"><Badge status={rec.status} /></td>
                  <td className="table-cell text-xs">{rec.checkIn || '—'}</td>
                  <td className="table-cell text-xs">{rec.checkOut || '—'}</td>
                  <td className="table-cell text-xs">{rec.workingHours ? `${rec.workingHours}h` : '—'}</td>
                  <td className="table-cell text-xs text-gray-500">{rec.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
