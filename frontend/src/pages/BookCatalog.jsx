import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Eye,
  Grid,
  List,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BookDetailsModal from './BookDetailsModal';
import BookFormModal from './BookFormModal';

const BookCatalog = () => {
  const { isStaff } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [available, setAvailable] = useState(searchParams.get('available') || 'all');
  const [sort, setSort] = useState('title-asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals state
  const [selectedBook, setSelectedBook] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(searchParams.get('action') === 'new');
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/books/meta/categories');
        if (res.data && res.data.success) {
          setCategories(['All', ...res.data.categories]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch books
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 12,
        sort
      };
      if (search.trim()) params.q = search.trim();
      if (category && category !== 'All') params.category = category;
      if (available !== 'all') params.available = available;

      const res = await api.get('/books', { params });
      if (res.data && res.data.success) {
        setBooks(res.data.books);
        setTotalPages(res.data.totalPages);
        setTotalBooks(res.data.total);
      }
    } catch (err) {
      showToast('Failed to load books catalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, available, sort, showToast]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/books/${deletingBook._id}`);
      showToast('Book deleted from catalog successfully.', 'success');
      setDeletingBook(null);
      fetchBooks();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Cannot delete book', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenIssue = (book) => {
    navigate(`/issue?bookId=${book._id}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Library Book Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Browse, search, and manage repository titles, editions, and shelf locations
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => {
              setEditingBook(null);
              setShowFormModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input (5 cols) */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, author, ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white text-xs outline-none transition-all"
            />
          </form>

          {/* Category Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white text-xs outline-none transition-all text-slate-700 font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Disciplines & Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={available}
              onChange={(e) => {
                setAvailable(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white text-xs outline-none transition-all text-slate-700 font-medium"
            >
              <option value="all">Stock: All</option>
              <option value="true">In Stock Only</option>
              <option value="false">Out of Stock</option>
            </select>
          </div>

          {/* Sort By (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-sky-500 focus:bg-white text-xs outline-none transition-all text-slate-700 font-medium"
            >
              <option value="title-asc">Title: A to Z</option>
              <option value="title-desc">Title: Z to A</option>
              <option value="year-desc">Year: Newest</option>
              <option value="year-asc">Year: Oldest</option>
              <option value="copies-desc">Copies: High to Low</option>
            </select>
          </div>
        </div>

        {/* View mode toggle and results counter */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{books.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalBooks}</span> cataloged titles
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner message="Searching catalog..." />
      ) : books.length === 0 ? (
        <EmptyState
          title="No books found"
          description="Try modifying your search keywords or switching category filters."
          action={
            isStaff ? (
              <button
                onClick={() => {
                  setEditingBook(null);
                  setShowFormModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
              >
                Add This Book
              </button>
            ) : null
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {books.map((book) => {
            const isAvail = book.availableCopies > 0;
            return (
              <div
                key={book._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Book Cover Image */}
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                  <img
                    src={book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant={isAvail ? 'available' : 'outOfStock'}>
                      {isAvail ? `${book.availableCopies} Available` : 'Out of Stock'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold">
                      {book.category}
                    </span>
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => {
                        setSelectedBook(book);
                        setShowDetailsModal(true);
                      }}
                      className="text-sm font-bold text-slate-900 hover:text-sky-600 cursor-pointer line-clamp-1 transition-colors"
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">by {book.author}</p>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">ISBN: {book.isbn}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Shelf: {book.location || 'General'}</span>
                    <span>{book.publicationYear}</span>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedBook(book);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {isStaff && (
                      <>
                        {isAvail && (
                          <button
                            onClick={() => handleOpenIssue(book)}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors"
                            title="Issue Book"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingBook(book);
                            setShowFormModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Edit Book"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingBook(book)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Book"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Book Details</th>
                  <th className="py-3 px-3">ISBN</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {books.map((book) => {
                  const isAvail = book.availableCopies > 0;
                  return (
                    <tr key={book._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded shadow-sm shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <p
                              onClick={() => {
                                setSelectedBook(book);
                                setShowDetailsModal(true);
                              }}
                              className="font-bold text-slate-900 hover:text-sky-600 cursor-pointer truncate"
                            >
                              {book.title}
                            </p>
                            <p className="text-slate-500 text-[11px] truncate mt-0.5">
                              by {book.author} ({book.publicationYear})
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{book.isbn}</td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">{book.category}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{book.location || 'N/A'}</td>
                      <td className="py-3 px-3">
                        <Badge variant={isAvail ? 'available' : 'outOfStock'}>
                          {book.availableCopies} / {book.totalCopies} Copies
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedBook(book);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isStaff && (
                            <>
                              {isAvail && (
                                <button
                                  onClick={() => handleOpenIssue(book)}
                                  className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors"
                                  title="Issue Book"
                                >
                                  <BookOpen className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingBook(book);
                                  setShowFormModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="Edit Book"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingBook(book)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Book"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalBooks}
        limit={12}
        onPageChange={(p) => setPage(p)}
      />

      {/* Book Details Modal */}
      <BookDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        book={selectedBook}
        onIssueClick={handleOpenIssue}
        isStaff={isStaff}
      />

      {/* Add / Edit Book Modal */}
      <BookFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingBook(null);
        }}
        book={editingBook}
        onSuccess={fetchBooks}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingBook)}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleDeleteBook}
        title="Delete Book from Catalog?"
        message={`Are you sure you want to delete "${deletingBook?.title}"? This cannot be undone.`}
        confirmText="Confirm Delete"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default BookCatalog;
