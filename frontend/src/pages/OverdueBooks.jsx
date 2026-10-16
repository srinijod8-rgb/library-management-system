import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Mail,
  Phone,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  FileSpreadsheet,
  Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { exportReportCsv } from '../services/api';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const OverdueBooks = () => {
  const { isStaff } = useAuth();
  const { showToast } = useToast();

  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions/overdue');
      if (res.data?.success) {
        setOverdueList(res.data.transactions);
      }
    } catch (err) {
      showToast('Failed to load overdue records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const totalOutstandingFines = overdueList.reduce((sum, item) => sum + (item.estimatedFine || 0), 0);

  const handleExportCsv = () => {
    exportReportCsv('overdue');
  };

  const handleEmailReminder = (tx) => {
    const subject = encodeURIComponent(`URGENT: Library Overdue Notice - ${tx.book?.title}`);
    const body = encodeURIComponent(
      `Dear ${tx.member?.name},\n\nOur library records indicate that "${tx.book?.title}" (ISBN: ${tx.book?.isbn}) was due on ${new Date(
        tx.dueDate
      ).toLocaleDateString()}.\n\nIt is currently ${tx.overdueDays} days overdue, with an accumulated fine of $${tx.estimatedFine?.toFixed(
        2
      )}.\n\nPlease return this book to the circulation desk as soon as possible.\n\nSincerely,\nAthena University Library`
    );
    window.location.href = `mailto:${tx.member?.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="text-rose-600">Overdue Tracking Desk</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time monitoring of delinquent loans, penalty fine calculations, and patron notices
          </p>
        </div>

        {isStaff && (
          <button
            onClick={handleExportCsv}
            disabled={overdueList.length === 0}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Overdue List (CSV)</span>
          </button>
        )}
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Overdue Loans</p>
            <h3 className="text-2xl font-extrabold text-rose-900 mt-0.5">{overdueList.length} items</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Accumulated Fines</p>
            <h3 className="text-2xl font-extrabold text-amber-900 mt-0.5">
              ${totalOutstandingFines.toFixed(2)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Standard Fine Policy</p>
            <h3 className="text-lg font-bold text-slate-800 mt-0.5">$1.00 / day overdue</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Overdue Items List */}
      {loading ? (
        <LoadingSpinner message="Checking overdue transactions..." />
      ) : overdueList.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No overdue books!"
          description="All active library loans are currently within their due dates. Good job!"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50/50 border-b border-rose-100 text-rose-900 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-3">Student / Member</th>
                  <th className="py-3 px-3">Student Contact</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Days Late</th>
                  <th className="py-3 px-3">Calculated Fine</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueList.map((tx) => (
                  <tr key={tx._id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={tx.book?.coverImage}
                          alt={tx.book?.title}
                          className="w-9 h-12 object-cover rounded shadow-sm shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-slate-900 truncate">
                            {tx.book?.title || 'Unknown Book'}
                          </p>
                          <p className="text-slate-500 text-[11px] truncate">{tx.book?.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-800">{tx.member?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {tx.member?.studentId} • {tx.member?.department}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-700 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{tx.member?.email}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{tx.member?.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge variant="overdue">{tx.overdueDays} Days Late</Badge>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-extrabold text-rose-600 text-sm">
                        ${tx.estimatedFine?.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEmailReminder(tx)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors flex items-center gap-1"
                          title="Send Email Reminder Notice"
                        >
                          <Send className="w-3 h-3 text-sky-600" />
                          <span>Notice</span>
                        </button>
                        {isStaff && (
                          <Link
                            to={`/return?id=${tx._id}`}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1"
                          >
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>Return</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueBooks;
