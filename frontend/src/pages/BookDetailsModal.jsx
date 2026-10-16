import React from 'react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { BookOpen, MapPin, Calendar, Building, Hash, Copy, CheckCircle2 } from 'lucide-react';

const BookDetailsModal = ({ isOpen, onClose, book, onIssueClick, isStaff }) => {
  if (!book) return null;

  const isAvailable = book.availableCopies > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Details & Availability"
      subtitle={`ISBN: ${book.isbn}`}
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Book Cover */}
        <div className="w-full sm:w-44 shrink-0 flex flex-col items-center">
          <img
            src={book.coverImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'}
            alt={book.title}
            className="w-36 h-52 sm:w-44 sm:h-64 object-cover rounded-xl shadow-md border border-slate-100"
          />
          <div className="mt-3 w-full">
            <Badge
              variant={isAvailable ? 'available' : 'outOfStock'}
              className="w-full justify-center py-1 font-bold text-xs"
            >
              {isAvailable ? `${book.availableCopies} Copies Available` : 'Out of Stock'}
            </Badge>
          </div>
        </div>

        {/* Book Specifications */}
        <div className="flex-1 space-y-4">
          <div>
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              {book.category}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5 leading-snug">
              {book.title}
            </h3>
            <p className="text-sm font-medium text-slate-600 mt-1">by {book.author}</p>
          </div>

          {/* Description */}
          {book.description && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto">
              {book.description}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5 flex items-center gap-1 font-medium">
                <Building className="w-3.5 h-3.5" /> Publisher
              </span>
              <span className="font-semibold text-slate-800">{book.publisher}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" /> Published Year
              </span>
              <span className="font-semibold text-slate-800">{book.publicationYear}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5 flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5" /> Shelf / Location
              </span>
              <span className="font-semibold text-slate-800">{book.location || 'General Stacks'}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block mb-0.5 flex items-center gap-1 font-medium">
                <Copy className="w-3.5 h-3.5" /> Total Inventory
              </span>
              <span className="font-semibold text-slate-800">{book.totalCopies} copies ({book.totalCopies - book.availableCopies} issued)</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            {isStaff && isAvailable && (
              <button
                onClick={() => {
                  onClose();
                  onIssueClick(book);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                <span>Issue This Book</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BookDetailsModal;
