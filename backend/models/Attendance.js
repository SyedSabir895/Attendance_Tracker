const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'leave', 'wfh', 'holiday', 'late'],
      required: [true, 'Status is required'],
    },
    checkIn: {
      type: String, // HH:MM format
      default: null,
    },
    checkOut: {
      type: String,
      default: null,
    },
    workingHours: {
      type: Number, // in hours
      default: 0,
    },
    overtime: {
      type: Number, // in hours
      default: 0,
    },
    remarks: {
      type: String,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
      default: '',
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'annual', 'maternity', 'paternity', null],
      default: null,
    },
    // Future: GPS, QR, Face, Fingerprint
    checkInLocation: {
      latitude: Number,
      longitude: Number,
    },
    checkOutLocation: {
      latitude: Number,
      longitude: Number,
    },
    method: {
      type: String,
      enum: ['manual', 'qr', 'gps', 'face', 'fingerprint', 'biometric'],
      default: 'manual',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Compound unique index: one record per employee per date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ employee: 1, date: -1 });

// Auto-calculate working hours before save
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const [inH, inM] = this.checkIn.split(':').map(Number);
    const [outH, outM] = this.checkOut.split(':').map(Number);
    const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes > 0) {
      this.workingHours = parseFloat((totalMinutes / 60).toFixed(2));
      const standard = 8;
      this.overtime = this.workingHours > standard
        ? parseFloat((this.workingHours - standard).toFixed(2))
        : 0;
    }
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
