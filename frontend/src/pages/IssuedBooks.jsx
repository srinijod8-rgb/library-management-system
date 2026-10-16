import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  BookOpen,
  User,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api, { exportReportCsv } from '../services/api';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const IssuedBooks = () => {
  const { user, isStaff } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchIssuedTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', {
        params: {
          status: 'issued',
          q: search,
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
      showToast('Failed to load active borrowings', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => {
    fetchIssuedTransactions();
  }, [fetchIssuedTransactions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIssuedTransactions();
  };

  const handleExportCsv = () => {
    exportReportCsv('issued');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Currently Issued Books
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active book loans across repository collections and member accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isStaff && (
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          )}
          {isStaff && (
            <Link
              to="/issue"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Issue Book</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by book title, student name, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:border-sky-500 outline-none"
          />
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading issued records..." />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No active issued books found"
          description="There are currently no active book loans matching this query."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Book</th>
                  <th className="py-3 px-3">Student / Member</th>
                  <th className="py-3 px-3">Issue Date</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Loan Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const now = new Date();
                  const dueDate = new Date(tx.dueDate);
                  const isLate = tx.isOverdue || dueDate < now;
                  const diffTime = Math.abs(dueDate - now);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
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
                            <p className="text-slate-500 text-[11px] truncate">
                              {tx.book?.author} • ISBN: {tx.book?.isbn}
                            </p>
                          </div>
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
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800">
                          {dueDate.toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {isLate ? (
                          <Badge variant="overdue">{diffDays}d Overdue</Badge>
                        ) : (
                          <Badge variant="issued">{diffDays}d remaining</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isStaff && (
                          <Link
                            to={`/return?id=${tx._id}`}
                            className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Return</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

export default IssuedBooks;
