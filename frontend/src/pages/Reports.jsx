import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  BookOpen,
  Clock,
  AlertCircle,
  Users,
  Award,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api, { exportReportCsv } from '../services/api';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Reports = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports/summary');
        if (res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        showToast('Failed to load reports data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [showToast]);

  const handleDownloadCsv = (type) => {
    exportReportCsv(type);
    showToast(`Downloading ${type} report CSV...`, 'info');
  };

  if (loading) {
    return <LoadingSpinner message="Generating library analytics & reports..." size="lg" />;
  }

  const summary = data?.summary || {};
  const mostBorrowed = data?.mostBorrowed || [];

  const exportCards = [
    {
      title: 'Book Catalog Report',
      description: 'Export complete titles, ISBNs, authors, publisher, year, shelf locations, and inventory stock counts.',
      type: 'books',
      icon: BookOpen,
      color: 'sky'
    },
    {
      title: 'Active Issues Report',
      description: 'Export all books currently borrowed by students, including issue dates, due dates, and member details.',
      type: 'issued',
      icon: Clock,
      color: 'indigo'
    },
    {
      title: 'Overdue Loans Report',
      description: 'Export delinquent book loans with calculated overdue days, estimated fines, and student contact info.',
      type: 'overdue',
      icon: AlertCircle,
      color: 'rose'
    },
    {
      title: 'Complete History Log',
      description: 'Export complete audit history of all past and active borrowing transactions with return dates and fines.',
      type: 'history',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: 'Members Directory',
      description: 'Export all registered library students, departments, email contacts, and membership status.',
      type: 'members',
      icon: Users,
      color: 'amber'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Library Analytics & Reports
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Generate operational summaries, export datasets to CSV, and analyze circulation performance
        </p>
      </div>

      {/* CSV Export Cards Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Instant CSV Data Exports
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.type}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-sky-600" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                      CSV Ready
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <button
                  onClick={() => handleDownloadCsv(card.type)}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-sky-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Circulation Performance Overview Cards */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Repository Inventory & Circulation Balance
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider">
              Total Books Cataloged
            </span>
            <span className="text-2xl font-extrabold text-slate-800">{summary.totalBooks}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider">
              Physical Volumes
            </span>
            <span className="text-2xl font-extrabold text-slate-800">{summary.totalCopies}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider">
              Copies On Shelf
            </span>
            <span className="text-2xl font-extrabold text-emerald-600">{summary.availableCopies}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block mb-1 font-semibold uppercase tracking-wider">
              Currently On Loan
            </span>
            <span className="text-2xl font-extrabold text-sky-600">{summary.issuedCopies}</span>
          </div>
        </div>
      </div>

      {/* Most Borrowed Books Leaderboard */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Most Borrowed Titles Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-500">Highest circulation popularity in the university collection</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-4">Title & Author</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">ISBN</th>
                <th className="py-3 px-3">Total Borrows</th>
                <th className="py-3 px-4 text-right">Available Copies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mostBorrowed.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">
                    No borrowing history recorded yet.
                  </td>
                </tr>
              ) : (
                mostBorrowed.map((b, idx) => (
                  <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-amber-50 text-amber-900'
                            : 'text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.title}</div>
                      <div className="text-[11px] text-slate-500">by {b.author}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">{b.category}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-500">{b.isbn}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-extrabold text-xs">
                        {b.borrowCount} Checkouts
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant={b.availableCopies > 0 ? 'available' : 'outOfStock'}>
                        {b.availableCopies} / {b.totalCopies}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
