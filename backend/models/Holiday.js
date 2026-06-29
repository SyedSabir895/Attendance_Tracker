const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    type: {
      type: String,
      enum: ['public', 'optional', 'restricted', 'company'],
      default: 'public',
    },
    description: {
      type: String,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    departments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

holidaySchema.index({ date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
