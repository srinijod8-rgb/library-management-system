import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  Check
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const IssueBook = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search queries for selectors
  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  // Selected items
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  // Lists
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Due date settings
  const [duePreset, setDuePreset] = useState(14); // 14 days default
  const [customDueDate, setCustomDueDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Initialize pre-selected book if bookId passed in URL
  useEffect(() => {
    const prefillBookId = searchParams.get('bookId');
    if (prefillBookId) {
      api.get(`/books/${prefillBookId}`).then((res) => {
        if (res.data?.success && res.data.book) {
          setSelectedBook(res.data.book);
        }
      }).catch(() => {});
    }
  }, [searchParams]);

  // Search Members
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoadingMembers(true);
      try {
        const res = await api.get('/members', {
          params: { q: studentSearch, limit: 6, status: 'active' }
        });
        if (res.data?.success) {
          setMembers(res.data.members);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMembers(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  // Search Books
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoadingBooks(true);
      try {
        const res = await api.get('/books', {
          params: { q: bookSearch, limit: 6, available: 'true' }
        });
        if (res.data?.success) {
          setBooks(res.data.books);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBooks(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [bookSearch]);

  const calculateDueDate = () => {
    if (customDueDate) return new Date(customDueDate);
    const d = new Date();
    d.setDate(d.getDate() + duePreset);
    return d;
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMember) {
      showToast('Please select a student / member to issue to.', 'warning');
      return;
    }
    if (!selectedBook) {
      showToast('Please select an available book to issue.', 'warning');
      return;
    }

    const calculatedDue = calculateDueDate();
    if (calculatedDue <= new Date()) {
      showToast('Due date must be in the future.', 'warning');
      return;
    }

    setIssuing(true);
    try {
      const res = await api.post('/transactions/issue', {
        bookId: selectedBook._id,
        memberId: selectedMember._id,
        dueDate: calculatedDue.toISOString(),
        remarks
      });

      if (res.data?.success) {
        showToast(`Book successfully issued to ${selectedMember.name}!`, 'success');
        navigate('/transactions/issued');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Issue failed', 'error');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Circulation Desk: Issue Book
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Assign library catalog items to registered students with automated due-date scheduling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selectors Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Member Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">
                  1
                </span>
                Select Student / Member
              </span>
              {selectedMember && (
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Change Student
                </button>
              )}
            </div>

            {selectedMember ? (
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedMember.name}</h4>
                    <p className="text-xs text-slate-600 font-mono">
                      {selectedMember.studentId} • {selectedMember.department}
                    </p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search active students by name or Student ID..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:border-sky-500 outline-none"
                  />
                </div>

                {loadingMembers ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Searching members...</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {members.map((m) => (
                      <div
                        key={m._id}
                        onClick={() => setSelectedMember(m)}
                        className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{m.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {m.studentId} • {m.department}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-sky-600">
                          Select &rarr;
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Book Selector */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">
                  2
                </span>
                Select Available Book
              </span>
              {selectedBook && (
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Change Book
                </button>
              )}
            </div>

            {selectedBook ? (
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBook.coverImage}
                    alt={selectedBook.title}
                    className="w-10 h-14 object-cover rounded shadow-sm shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{selectedBook.title}</h4>
                    <p className="text-xs text-slate-600">by {selectedBook.author}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      ISBN: {selectedBook.isbn} • {selectedBook.availableCopies} Copies Available
                    </p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search books by title, author, or ISBN..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:border-sky-500 outline-none"
                  />
                </div>

                {loadingBooks ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Searching catalog...</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {books.map((b) => (
                      <div
                        key={b._id}
                        onClick={() => setSelectedBook(b)}
                        className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={b.coverImage}
                            alt={b.title}
                            className="w-7 h-10 object-cover rounded shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-bold text-slate-800 truncate">{b.title}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {b.author} • {b.availableCopies} available
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-sky-600 shrink-0 ml-2">
                          Select &rarr;
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Loan Duration & Notes */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">
                3
              </span>
              Loan Duration & Terms
            </span>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Quick Loan Presets:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '7 Days', days: 7 },
                  { label: '14 Days (Standard)', days: 14 },
                  { label: '21 Days', days: 21 },
                  { label: '30 Days (Semester)', days: 30 }
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => {
                      setDuePreset(item.days);
                      setCustomDueDate('');
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                      duePreset === item.days && !customDueDate
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Or Specify Custom Due Date:
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={customDueDate}
                onChange={(e) => setCustomDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Circulation Remarks (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Reference copy for thesis research"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-sky-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary & Confirmation (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-24 space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Checkout Confirmation
            </h3>

            {/* Book Preview */}
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-slate-100 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-200">
                {selectedBook ? (
                  <img
                    src={selectedBook.coverImage}
                    alt={selectedBook.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <BookOpen className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">
                  Selected Item
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-2">
                  {selectedBook?.title || 'No book selected yet'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{selectedBook?.author}</p>
                {selectedBook && (
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Shelf: {selectedBook.location}
                  </p>
                )}
              </div>
            </div>

            {/* Transaction Terms Summary */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">
                  {selectedMember ? selectedMember.name : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student ID:</span>
                <span className="font-mono text-slate-700">
                  {selectedMember ? selectedMember.studentId : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issue Date:</span>
                <span className="font-medium text-slate-800">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/60">
                <span className="text-slate-700 font-semibold">Scheduled Due Date:</span>
                <span className="font-bold text-sky-700">
                  {calculateDueDate().toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleIssueSubmit}
              disabled={!selectedMember || !selectedBook || issuing}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{issuing ? 'Recording Transaction...' : 'Confirm Book Checkout'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueBook;
