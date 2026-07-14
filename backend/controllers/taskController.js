const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const { paginate, buildPaginationMeta } = require('../utils/helpers');
const { sendTaskAssignmentEmail } = require('../utils/email');

const populateTask = (query) => query
  .populate('assignedTo', 'firstName lastName employeeId profilePhoto department')
  .populate({ path: 'assignedTo', populate: { path: 'department', select: 'name' } })
  .populate('createdBy', 'name email')
  .populate('updatedBy', 'name email');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Admin
const getTasks = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 10, search, status, priority, employee,
    sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (employee) filter.assignedTo = employee;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const { skip } = paginate(null, page, limit);
  const total = await Task.countDocuments(filter);

  const tasks = await populateTask(Task.find(filter))
    .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  res.json({
    success: true,
    data: tasks,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Admin
const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, priority, status, dueDate } = req.body;

  if (!title || !assignedTo || !dueDate) {
    res.status(400);
    throw new Error('Title, assigned employee, and due date are required');
  }

  const employee = await Employee.findById(assignedTo);
  if (!employee) {
    res.status(404);
    throw new Error('Assigned employee not found');
  }

  const task = await Task.create({
    title,
    description,
    assignedTo,
    priority,
    status,
    dueDate,
    completedAt: status === 'completed' ? new Date() : null,
    createdBy: req.user.id,
  });

  const populatedTask = await populateTask(Task.findById(task._id));
  
  // Send email to assigned employee (commented out for now)
  /*
  try {
    await sendTaskAssignmentEmail(
      employee.email, 
      `${employee.firstName} ${employee.lastName}`, 
      task.title, 
      task.priority, 
      task.dueDate
    );
  } catch (error) {
    console.error('Failed to send task assignment email:', error);
  }
  */

  res.status(201).json({ success: true, data: populatedTask, message: 'Task created successfully' });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Admin
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const { title, description, assignedTo, priority, status, dueDate } = req.body;
  if (assignedTo) {
    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      res.status(404);
      throw new Error('Assigned employee not found');
    }
  }

  let isNewAssignee = false;
  if (assignedTo && assignedTo !== task.assignedTo?.toString() && req.body.assignedTo !== undefined) {
    isNewAssignee = true;
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (status !== undefined) {
    task.status = status;
    task.completedAt = status === 'completed' ? (task.completedAt || new Date()) : null;
  }
  task.updatedBy = req.user.id;

  await task.save();
  const populatedTask = await populateTask(Task.findById(task._id));

  // If assigned to a new employee, send email (commented out for now)
  /*
  if (isNewAssignee) {
      try {
        const employee = await Employee.findById(assignedTo);
        if (employee) {
          await sendTaskAssignmentEmail(
            employee.email, 
            `${employee.firstName} ${employee.lastName}`, 
            task.title, 
            task.priority, 
            task.dueDate
          );
        }
      } catch (error) {
        console.error('Failed to send task reassignment email:', error);
      }
  }
  */

  res.json({ success: true, data: populatedTask, message: 'Task updated successfully' });
});

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Admin
const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.status = req.body.status;
  task.completedAt = req.body.status === 'completed' ? new Date() : null;
  task.updatedBy = req.user.id;
  await task.save();

  const populatedTask = await populateTask(Task.findById(task._id));
  res.json({ success: true, data: populatedTask, message: 'Task status updated successfully' });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Admin
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  await Task.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Task deleted successfully' });
});

module.exports = { getTasks, createTask, updateTask, updateTaskStatus, deleteTask };
