const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [120, 'Author cannot exceed 120 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    publisher: {
      type: String,
      required: [true, 'Publisher is required'],
      trim: true
    },
    publicationYear: {
      type: Number,
      required: [true, 'Publication year is required'],
      min: [1000, 'Invalid publication year'],
      max: [new Date().getFullYear() + 1, 'Publication year cannot be in the future']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies count is required'],
      min: [1, 'Total copies must be at least 1'],
      default: 1
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies count is required'],
      min: [0, 'Available copies cannot be negative'],
      default: 1
    },
    location: {
      type: String,
      required: [true, 'Shelf / Location is required'],
      trim: true,
      default: 'Main Shelf - A1'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast search
bookSchema.index({ title: 'text', author: 'text', category: 'text', isbn: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ availableCopies: 1 });

module.exports = mongoose.model('Book', bookSchema);
