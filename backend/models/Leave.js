const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'annual', 'maternity', 'paternity'],
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      maxlength: [300, 'Rejection reason cannot exceed 300 characters'],
      default: null,
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDayPeriod: {
      type: String,
      enum: ['morning', 'afternoon', null],
      default: null,
    },
    attachments: [{
      filename: String,
      url: String,
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

// Calculate total days before save
leaveSchema.pre('save', function (next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    if (this.isHalfDay) {
      this.totalDays = 0.5;
    } else {
      const diff = Math.ceil(
        (new Date(this.endDate) - new Date(this.startDate)) / (1000 * 60 * 60 * 24)
      ) + 1;
      this.totalDays = diff > 0 ? diff : 1;
    }
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
