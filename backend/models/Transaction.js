const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required']
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required']
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issuer user reference is required']
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    returnDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued'
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ member: 1 });
transactionSchema.index({ book: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
