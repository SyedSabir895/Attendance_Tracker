const asyncHandler = require('express-async-handler');
const Holiday = require('../models/Holiday');

const getHolidays = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const filter = {};
  if (year) {
    filter.date = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31T23:59:59.999Z`),
    };
  }
  const holidays = await Holiday.find(filter).sort('date').lean();
  res.json({ success: true, data: holidays });
});

const getHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) { res.status(404); throw new Error('Holiday not found'); }
  res.json({ success: true, data: holiday });
});

const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, data: holiday, message: 'Holiday added' });
});

const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!holiday) { res.status(404); throw new Error('Holiday not found'); }
  res.json({ success: true, data: holiday, message: 'Holiday updated' });
});

const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) { res.status(404); throw new Error('Holiday not found'); }
  await Holiday.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Holiday deleted' });
});

module.exports = { getHolidays, getHoliday, createHoliday, updateHoliday, deleteHoliday };
