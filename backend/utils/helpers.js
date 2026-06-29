const generateEmployeeId = async (Employee) => {
  const count = await Employee.countDocuments();
  const num = String(count + 1).padStart(4, '0');
  return `EMP${num}`;
};

const getDateRange = (period, year, month) => {
  const now = new Date();
  let start, end;

  if (period === 'today') {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  } else if (period === 'week') {
    const day = now.getUTCDay();
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day));
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 6, 23, 59, 59, 999));
  } else if (period === 'month') {
    const y = year || now.getUTCFullYear();
    const m = month !== undefined ? month - 1 : now.getUTCMonth();
    start = new Date(Date.UTC(y, m, 1));
    end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
  } else if (period === 'year') {
    const y = year || now.getUTCFullYear();
    start = new Date(Date.UTC(y, 0, 1));
    end = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
  }

  return { start, end };
};

const getWorkingDays = (startDate, endDate, holidays = []) => {
  let count = 0;
  const current = new Date(startDate);
  const holidayStrings = holidays.map((h) => new Date(h).toDateString());

  while (current <= new Date(endDate)) {
    const day = current.getDay();
    if (day !== 0 && day !== 6 && !holidayStrings.includes(current.toDateString())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const paginate = (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  pages: Math.ceil(total / limit),
  hasNextPage: parseInt(page) < Math.ceil(total / limit),
  hasPrevPage: parseInt(page) > 1,
});

module.exports = {
  generateEmployeeId,
  getDateRange,
  getWorkingDays,
  paginate,
  buildPaginationMeta,
};
