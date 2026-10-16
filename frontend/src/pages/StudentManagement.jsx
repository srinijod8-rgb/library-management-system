import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Building,
  Hash,
  BookOpen,
  History,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const StudentManagement = () => {
  const { showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [department, setDepartment] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    department: 'Computer Science',
    phone: '',
    status: 'active'
  });
  const [formLoading, setFormLoading] = useState(false);

  // Member History Modal
  const [viewingMember, setViewingMember] = useState(null);
  const [memberHistory, setMemberHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const departments = [
    'All',
    'Computer Science',
    'Data Science',
    'Information Technology',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Business Administration',
    'Physics',
    'Mathematics'
  ];

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        status,
        department
      };
      if (search.trim()) params.q = search.trim();

      const res = await api.get('/members', { params });
      if (res.data && res.data.success) {
        setMembers(res.data.members);
        setTotalPages(res.data.totalPages);
        setTotalMembers(res.data.total);
      }
    } catch (err) {
      showToast('Failed to load member records', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, department, showToast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      studentId: '',
      name: '',
      email: '',
      department: 'Computer Science',
      phone: '',
      status: 'active'
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setFormData({
      studentId: m.studentId,
      name: m.name,
      email: m.email,
      department: m.department,
      phone: m.phone,
      status: m.status
    });
    setShowAddEditModal(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember._id}`, formData);
        showToast('Member profile updated successfully.', 'success');
      } else {
        await api.post('/members', formData);
        showToast('New member registered successfully.', 'success');
      }
      setShowAddEditModal(false);
      fetchMembers();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Operation failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/members/${deletingMember._id}`);
      showToast('Member record deleted successfully.', 'success');
      setDeletingMember(null);
      fetchMembers();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Cannot delete member', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenHistory = async (member) => {
    setViewingMember(member);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/members/${member._id}/history`);
      if (res.data && res.data.success) {
        setMemberHistory(res.data.transactions);
      }
    } catch (err) {
      showToast('Failed to load member history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student & Member Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage student registrations, library card eligibility, and member borrowing records
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Member</span>
        </button>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white text-xs outline-none transition-all"
            />
          </form>

          {/* Department Filter */}
          <div className="lg:col-span-3">
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white text-xs outline-none transition-all text-slate-700 font-medium"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'All' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white text-xs outline-none transition-all text-slate-700 font-medium"
            >
              <option value="All">All Membership Statuses</option>
              <option value="active">Active Members</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
          Total registered members: <span className="font-bold text-slate-800">{totalMembers}</span>
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <LoadingSpinner message="Loading member profiles..." />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No member records found"
          description="Try modifying search keywords or registering a new library member."
          action={
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
            >
              Add Member
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Active Loans</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {m.studentId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Member since {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-700 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{m.email}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{m.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {m.department}
                    </td>
                    <td className="py-3.5 px-3">
                      {m.activeBorrows > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px]">
                          {m.activeBorrows} on loan
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">0 loans</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge variant={m.status}>{m.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistory(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Borrowing History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit Member"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingMember(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalMembers}
        limit={10}
        onPageChange={(p) => setPage(p)}
      />

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        title={editingMember ? 'Edit Member Information' : 'Register New Library Member'}
        subtitle={editingMember ? `Student ID: ${editingMember.studentId}` : 'Enter student or patron credentials'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Student ID / Card # *
              </label>
              <input
                type="text"
                required
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                placeholder="e.g. STU-2024-045"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Jane Doe"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. jane.doe@university.edu"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 234-5678"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs bg-white"
              >
                {departments.filter((d) => d !== 'All').map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Membership Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddEditModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : editingMember ? 'Update Member' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Member History Modal */}
      <Modal
        isOpen={Boolean(viewingMember)}
        onClose={() => setViewingMember(null)}
        title={viewingMember ? `${viewingMember.name} - Borrowing Audit History` : ''}
        subtitle={viewingMember ? `ID: ${viewingMember.studentId} • ${viewingMember.department}` : ''}
        maxWidth="max-w-2xl"
      >
        {historyLoading ? (
          <LoadingSpinner message="Fetching member audit log..." />
        ) : memberHistory.length === 0 ? (
          <p className="text-center py-8 text-slate-500 text-xs">
            No transactions found for this member.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {memberHistory.map((tx) => (
              <div
                key={tx._id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-800">{tx.book?.title || 'Unknown Book'}</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Issued on: {new Date(tx.issueDate).toLocaleDateString()} • Due:{' '}
                    {new Date(tx.dueDate).toLocaleDateString()}
                  </p>
                  {tx.returnDate && (
                    <p className="text-emerald-700 text-[11px]">
                      Returned on: {new Date(tx.returnDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={tx.status}>{tx.status}</Badge>
                  {tx.fineAmount > 0 && (
                    <p className="text-rose-600 font-bold text-[11px] mt-1">
                      Fine: ${tx.fineAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDeleteMember}
        title="Delete Member Record?"
        message={`Are you sure you want to delete ${deletingMember?.name} (${deletingMember?.studentId})? You cannot delete members with active book loans.`}
        confirmText="Confirm Delete"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default StudentManagement;
