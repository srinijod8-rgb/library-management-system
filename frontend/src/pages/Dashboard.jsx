import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Users,
  Clock,
  CheckCircle,
  BarChart3,
  Calendar,
  DollarSign,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const { user, isStaff, isStudent } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data && res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard statistics and analytics..." size="lg" />;
  }

  // STUDENT DASHBOARD
  if (isStudent || data?.isStudent) {
    const studentStats = data?.stats || {};
    const activeList = data?.activeList || [];
    const recentTransactions = data?.recentTransactions || [];

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 to-sky-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
              Student Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Student ID: <span className="font-semibold text-white">{user?.studentId || 'N/A'}</span> • Department: <span className="font-semibold text-white">{user?.department || 'General'}</span>
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/books"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Catalog</span>
              </Link>
              <Link
                to="/transactions/history"
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                Borrowing History
              </Link>
            </div>
          </div>
        </div>

        {/* Student Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Currently Issued"
            value={studentStats.activeBorrows || 0}
            icon={BookOpen}
            color="sky"
            subtitle="Books on loan"
            onClick={() => navigate('/transactions/issued')}
          />
          <StatCard
            title="Overdue Books"
            value={studentStats.overdueBorrows || 0}
            icon={AlertCircle}
            color="rose"
            subtitle={studentStats.overdueBorrows > 0 ? "Action required!" : "None overdue"}
            onClick={() => navigate('/transactions/overdue')}
          />
          <StatCard
            title="Total Returned"
            value={studentStats.totalReturned || 0}
            icon={CheckCircle}
            color="emerald"
            subtitle="Completed loans"
          />
          <StatCard
            title="Outstanding Fine"
            value={`$${(studentStats.totalFines || 0).toFixed(2)}`}
            icon={DollarSign}
            color="amber"
            subtitle="$1.00 / day overdue rate"
          />
        </div>

        {/* Currently Issued Books Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Active Borrowed Books</h2>
              <p className="text-xs text-slate-500">Keep track of your return dates to prevent overdue charges</p>
            </div>
            <Link to="/transactions/issued" className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              <p>You have no active book loans at the moment.</p>
              <Link to="/books" className="mt-2 inline-block text-sky-600 font-semibold text-xs">Browse Library Catalog &rarr;</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeList.map((loan) => {
                const now = new Date();
                const dueDate = new Date(loan.dueDate);
                const isLate = dueDate < now;
                const daysDiff = Math.ceil(Math.abs(dueDate - now) / (1000 * 60 * 60 * 24));

                return (
                  <div key={loan._id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <img
                      src={loan.book?.coverImage}
                      alt={loan.book?.title}
                      className="w-16 h-24 object-cover rounded-lg shadow-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate">{loan.book?.title}</h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{loan.book?.author}</p>
                      <p className="text-[11px] text-slate-400 mt-1">ISBN: {loan.book?.isbn}</p>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Due: <span className="font-semibold text-slate-700">{dueDate.toLocaleDateString()}</span>
                        </span>
                        {isLate ? (
                          <Badge variant="overdue">{daysDiff}d Overdue</Badge>
                        ) : (
                          <Badge variant="issued">{daysDiff}d remaining</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADMIN / LIBRARIAN DASHBOARD
  const stats = data?.stats || {};
  const recentTransactions = data?.recentTransactions || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const monthlyTrends = data?.monthlyTrends || [];

  return (
    <div className="space-y-6">
      {/* Header with Quick Action Circulation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Library Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time catalog analytics, stock availability, and circulation metrics
          </p>
        </div>

        {/* Quick Circulation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/issue"
            className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm shadow-sky-600/20 transition-all flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Book</span>
          </Link>
          <Link
            to="/return"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Return Book</span>
          </Link>
          <Link
            to="/books?action=new"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-sky-600" />
            <span>Add Book</span>
          </Link>
          <Link
            to="/reports"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors"
            title="Reports & Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Titles"
          value={stats.totalBooks || 0}
          icon={BookOpen}
          color="indigo"
          subtitle="Catalog cataloged"
          onClick={() => navigate('/books')}
        />
        <StatCard
          title="Total Copies"
          value={stats.totalCopies || 0}
          icon={Copy}
          color="purple"
          subtitle="Physical inventory"
        />
        <StatCard
          title="Available Copies"
          value={stats.availableCopies || 0}
          icon={CheckCircle}
          color="emerald"
          subtitle="Ready on shelves"
          onClick={() => navigate('/books?available=true')}
        />
        <StatCard
          title="Active Issues"
          value={stats.issuedBooks || 0}
          icon={ArrowUpRight}
          color="sky"
          subtitle="Currently on loan"
          onClick={() => navigate('/transactions/issued')}
        />
        <StatCard
          title="Overdue Books"
          value={stats.overdueBooks || 0}
          icon={AlertCircle}
          color="rose"
          subtitle="Requires attention"
          onClick={() => navigate('/transactions/overdue')}
        />
        <StatCard
          title="Members"
          value={stats.registeredMembers || 0}
          icon={Users}
          color="amber"
          subtitle="Registered patrons"
          onClick={() => navigate('/members')}
        />
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Circulation Trends Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Circulation Volume Trends</h3>
              <p className="text-xs text-slate-500">Monthly book issues vs. book returns</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-3 h-3 rounded bg-sky-500" /> Issued
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-3 h-3 rounded bg-emerald-500" /> Returned
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 flex items-end justify-between gap-4 pt-4 pb-2 border-b border-slate-100">
            {monthlyTrends.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No circulation history yet
              </div>
            ) : (
              monthlyTrends.map((trend, i) => {
                const maxVal = Math.max(
                  ...monthlyTrends.map((t) => Math.max(t.issued, t.returned)),
                  1
                );
                const issuedHeight = (trend.issued / maxVal) * 100;
                const returnedHeight = (trend.returned / maxVal) * 100;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-48">
                      {/* Issued Bar */}
                      <div
                        style={{ height: `${Math.max(issuedHeight, 4)}%` }}
                        className="w-1/2 max-w-[28px] bg-sky-500 rounded-t-md hover:bg-sky-600 transition-all relative"
                        title={`Issued: ${trend.issued}`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity">
                          {trend.issued}
                        </span>
                      </div>
                      {/* Returned Bar */}
                      <div
                        style={{ height: `${Math.max(returnedHeight, 4)}%` }}
                        className="w-1/2 max-w-[28px] bg-emerald-500 rounded-t-md hover:bg-emerald-600 transition-all relative"
                        title={`Returned: ${trend.returned}`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none transition-opacity">
                          {trend.returned}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 mt-2 truncate w-full text-center">
                      {trend.month}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Breakdown Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Book Categories</h3>
              <p className="text-xs text-slate-500">Distribution across major disciplines</p>
            </div>
            <Link to="/books" className="text-xs font-bold text-sky-600 hover:text-sky-700">
              Catalog &rarr;
            </Link>
          </div>

          <div className="space-y-3.5 pt-2">
            {categoryDistribution.map((cat, idx) => {
              const totalCopies = stats.totalCopies || 1;
              const percent = Math.round((cat.copies / totalCopies) * 100);
              const colors = ['bg-sky-500', 'bg-indigo-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
              const barColor = colors[idx % colors.length];

              return (
                <div key={idx}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 truncate max-w-[180px]">{cat.category}</span>
                    <span className="text-slate-500">{cat.copies} copies ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Borrowing Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Circulation Activity</h3>
            <p className="text-xs text-slate-500">Latest checkout and return transactions</p>
          </div>
          <Link to="/transactions/history" className="text-xs font-bold text-sky-600 hover:text-sky-700">
            Full Audit History &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px]">
                <th className="py-3 px-3">Book</th>
                <th className="py-3 px-3">Student / Member</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={tx.book?.coverImage}
                          alt={tx.book?.title}
                          className="w-8 h-12 object-cover rounded shadow-sm shrink-0"
                        />
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-bold text-slate-800 truncate">{tx.book?.title || 'Unknown Book'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{tx.book?.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-700">{tx.member?.name || 'N/A'}</p>
                      <p className="text-[11px] text-slate-400">{tx.member?.studentId} • {tx.member?.department}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(tx.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={tx.status}>{tx.status}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {tx.status !== 'returned' ? (
                        <Link
                          to={`/return?id=${tx._id}`}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] transition-colors"
                        >
                          Process Return
                        </Link>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[11px]">Completed</span>
                      )}
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

export default Dashboard;
