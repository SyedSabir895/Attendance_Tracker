const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  relationship: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true, default: 'Pakistan' },
  zipCode: { type: String, trim: true },
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
  bankName: { type: String, trim: true },
  accountNumber: { type: String, trim: true },
  accountTitle: { type: String, trim: true },
  iban: { type: String, trim: true },
}, { _id: false });

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      required: [true, 'Employee ID is required'],
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
    },
    joiningDate: {
      type: Date,
    },
    leavingDate: {
      type: Date,
      default: null,
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern', 'remote'],
      default: 'full_time',
    },
    salary: {
      amount: { type: Number, min: 0 },
      currency: { type: String, default: 'PKR' },
      frequency: { type: String, enum: ['monthly', 'weekly', 'hourly'], default: 'monthly' },
    },
    address: addressSchema,
    emergencyContact: emergencyContactSchema,
    bankDetails: bankDetailsSchema,
    leaveBalance: {
      casual: { type: Number, default: 12 },
      sick: { type: Number, default: 10 },
      annual: { type: Number, default: 14 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated', 'on_leave'],
      default: 'active',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Future: QR code, biometric ID, GPS tracking
    qrCode: { type: String, default: null },
    biometricId: { type: String, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: full name
employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual: age
employeeSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const dob = new Date(this.dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
});

// Virtual: years of service
employeeSchema.virtual('yearsOfService').get(function () {
  if (!this.joiningDate) return 0;
  const ms = Date.now() - new Date(this.joiningDate).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365));
});

// Index for search
employeeSchema.index({ firstName: 'text', lastName: 'text', email: 'text', employeeId: 'text' });
employeeSchema.index({ department: 1, status: 1 });
employeeSchema.index({ dateOfBirth: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
