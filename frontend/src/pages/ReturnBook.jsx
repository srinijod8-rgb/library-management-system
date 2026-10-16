import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ReturnBook = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [activeLoans, setActiveLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchActiveLoans = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', {
        params: { status: 'issued', q: query, limit: 15 }
      });
      if (res.data?.success) {
        setActiveLoans(res.data.transactions);

        // If transaction ID passed via URL query
        const urlId = searchParams.get('id');
        if (urlId) {
          const matched = res.data.transactions.find((t) => t._id === urlId);
          if (matched) setSelectedLoan(matched);
        }
      }
    } catch (err) {
      showToast('Error loading active book loans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchActiveLoans(search);
  };

  const handleProcessReturn = async () => {
    if (!selectedLoan) return;

    setProcessing(true);
    try {
      const res = await api.put(`/transactions/${selectedLoan._id}/return`, {
        remarks: returnRemarks
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Book returned successfully!', 'success');
        setSelectedLoan(null);
        setReturnRemarks('');
        fetchActiveLoans();
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to process return', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Circulation Desk: Return Book
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Process student book returns, inspect condition, calculate overdue fees, and replenish shelf inventory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Loans Lookup (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID, or book title to return..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none shadow-sm"
            />
          </form>

          {/* Active Loans List */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="font-bold text-slate-700">Currently Unreturned Loans</span>
              <span className="text-slate-400">{activeLoans.length} active</span>
            </div>

            {loading ? (
              <LoadingSpinner message="Searching active loans..." />
            ) : activeLoans.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs">
                No active loans found matching your search.
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {activeLoans.map((loan) => {
                  const now = new Date();
                  const dueDate = new Date(loan.dueDate);
                  const isOverdue = dueDate < now;
                  const isSelected = selectedLoan?._id === loan._id;

                  return (
                    <div
                      key={loan._id}
                      onClick={() => setSelectedLoan(loan)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20'
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={loan.book?.coverImage}
                          alt={loan.book?.title}
                          className="w-9 h-12 object-cover rounded shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">
                            {loan.book?.title}
                          </h4>
                          <p className="text-slate-500 text-[11px] truncate">
                            {loan.member?.name} ({loan.member?.studentId})
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Due: {dueDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isOverdue ? (
                          <Badge variant="overdue">Overdue</Badge>
                        ) : (
                          <Badge variant="issued">On Time</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Return Inspection & Processing (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-24 space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Return Inspection & Settlement
            </h3>

            {selectedLoan ? (
              <div className="space-y-5">
                {/* Book & Member Info */}
                <div className="flex gap-4">
                  <img
                    src={selectedLoan.book?.coverImage}
                    alt={selectedLoan.book?.title}
                    className="w-16 h-24 object-cover rounded-xl shadow-sm shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {selectedLoan.book?.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">by {selectedLoan.book?.author}</p>
                    <p className="text-xs text-slate-700 font-semibold mt-2">
                      Borrower: {selectedLoan.member?.name}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {selectedLoan.member?.studentId} • {selectedLoan.member?.department}
                    </p>
                  </div>
                </div>

                {/* Overdue Calculation Details */}
                {selectedLoan.isOverdue ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>This book is past due date!</span>
                    </div>
                    <div className="flex justify-between text-rose-900">
                      <span>Days Overdue:</span>
                      <span className="font-bold">{selectedLoan.overdueDays} day(s)</span>
                    </div>
                    <div className="flex justify-between text-rose-900">
                      <span>Fine Rate:</span>
                      <span>$1.00 / day</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-rose-200 text-rose-900 font-extrabold text-sm">
                      <span>Total Overdue Fine:</span>
                      <span>${selectedLoan.estimatedFine?.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2.5 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Returned within schedule</span>
                      <span className="text-[11px] text-emerald-700">No overdue fines applicable.</span>
                    </div>
                  </div>
                )}

                {/* Return Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Return Condition / Remarks:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Returned in good condition"
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
                  />
                </div>

                {/* Restock Button */}
                <button
                  onClick={handleProcessReturn}
                  disabled={processing}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>{processing ? 'Processing Return...' : 'Confirm Return & Restock Copy'}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select an active loan from the left list to inspect and process return.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnBook;
