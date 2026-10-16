import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BorrowingHistory = () => {
  const { isStaff, user } = useAuth();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', {
        params: {
          q: search,
          status,
          page,
          limit: 10
        }
      });
      if (res.data?.success) {
        setTransactions(res.data.transactions);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);
      }
    } catch (err) {
      showToast('Failed to load transaction audit history', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleExportCsv = () => {
    window.open('/api/reports/export?type=history', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Borrowing Audit History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete historical registry of book checkouts, returns, penalties, and audit records
          </p>
        </div>

        {isStaff && (
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export History (CSV)</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transaction records by book title or member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:border-sky-500 outline-none"
          />
        </form>

        <div className="sm:w-56">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:border-sky-500 outline-none font-medium text-slate-700"
          >
            <option value="all">All Transaction Types</option>
            <option value="issued">Currently Issued</option>
            <option value="returned">Successfully Returned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <LoadingSpinner message="Fetching history audit trail..." />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No history records found"
          description="No transactions match your current search and filter parameters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-3">Student / Member</th>
                  <th className="py-3 px-3">Issue Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Return Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Fine Charged</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 truncate max-w-xs">
                        {tx.book?.title || 'Unknown Book'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ISBN: {tx.book?.isbn || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-800">{tx.member?.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {tx.member?.studentId} • {tx.member?.department}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {new Date(tx.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3">
                      {tx.returnDate ? (
                        <span className="text-emerald-700 font-semibold">
                          {new Date(tx.returnDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Returned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge variant={tx.status}>{tx.status}</Badge>
                    </td>
                    <td className="py-3.5 px-3">
                      {tx.fineAmount > 0 ? (
                        <span className="font-bold text-rose-600">${tx.fineAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-[160px] truncate">
                      {tx.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        limit={10}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
};

export default BorrowingHistory;
