import React, { useState, useEffect } from 'react';
import Modal from '../components/common/Modal';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { BookOpen, Image as ImageIcon } from 'lucide-react';

const BookFormModal = ({ isOpen, onClose, book = null, onSuccess }) => {
  const { showToast } = useToast();
  const isEditing = Boolean(book);

  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    author: '',
    category: 'Computer Science',
    publisher: '',
    publicationYear: new Date().getFullYear(),
    totalCopies: 1,
    location: '',
    coverImage: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  const categories = [
    'Computer Science',
    'Artificial Intelligence',
    'Software Architecture',
    'Database Systems',
    'Networking',
    'Mathematics',
    'Physics',
    'Business & Economics',
    'Engineering',
    'Literature',
    'General Science'
  ];

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        isbn: book.isbn || '',
        author: book.author || '',
        category: book.category || 'Computer Science',
        publisher: book.publisher || '',
        publicationYear: book.publicationYear || new Date().getFullYear(),
        totalCopies: book.totalCopies || 1,
        location: book.location || '',
        coverImage: book.coverImage || '',
        description: book.description || ''
      });
    } else {
      setFormData({
        title: '',
        isbn: '',
        author: '',
        category: 'Computer Science',
        publisher: '',
        publicationYear: new Date().getFullYear(),
        totalCopies: 3,
        location: 'CS Wing - Shelf 1A',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800',
        description: ''
      });
    }
  }, [book, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await api.put(`/books/${book._id}`, formData);
        showToast('Book updated successfully!', 'success');
      } else {
        await api.post('/books', formData);
        showToast('New book added to library catalog!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Book Details' : 'Add New Book to Catalog'}
      subtitle={isEditing ? `Modifying: ${book.title}` : 'Enter the catalog and inventory details'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Book Title *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Introduction to Algorithms"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              ISBN (Unique Identifier) *
            </label>
            <input
              type="text"
              name="isbn"
              required
              value={formData.isbn}
              onChange={handleChange}
              placeholder="e.g. 978-0262046305"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Author(s) *
            </label>
            <input
              type="text"
              name="author"
              required
              value={formData.author}
              onChange={handleChange}
              placeholder="e.g. Thomas H. Cormen"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Publisher *
            </label>
            <input
              type="text"
              name="publisher"
              required
              value={formData.publisher}
              onChange={handleChange}
              placeholder="e.g. MIT Press"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Publication Year *
            </label>
            <input
              type="number"
              name="publicationYear"
              required
              min="1800"
              max={new Date().getFullYear() + 1}
              value={formData.publicationYear}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Total Copies *
            </label>
            <input
              type="number"
              name="totalCopies"
              required
              min="1"
              value={formData.totalCopies}
              onChange={handleChange}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Shelf / Location *
            </label>
            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. CS Wing - Shelf 2B"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief abstract or book summary..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-none text-xs"
          />
        </div>

        {/* Modal footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Book' : 'Add to Catalog'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookFormModal;
