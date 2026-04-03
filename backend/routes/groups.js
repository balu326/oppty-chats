import express from 'express';
import Group from '../models/Group.js';
import Employee from '../models/Employee.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.employee?.id);
    
    if (!employee || !['admin', 'superadmin'].includes(employee.role)) {
      return res.status(403).json({ message: 'Access denied. Admin or superadmin only.' });
    }

    req.employee = employee;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/groups - Get all groups
router.get('/', async (req, res) => {
  try {
    const groups = await Group.find().populate('members', 'name email role').populate('createdBy', 'name email');
    res.json({ success: true, groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/groups - Create new group (Admin only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const existingGroup = await Group.findOne({ name: name.trim() });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group with this name already exists' });
    }

    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.employee._id
    });

    await group.save();
    
    res.json({
      success: true,
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/groups/:id - Update group (Admin only)
router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (name) {
      const existingGroup = await Group.findOne({ 
        name: name.trim(), 
        _id: { $ne: groupId } 
      });
      
      if (existingGroup) {
        return res.status(400).json({ message: 'Group with this name already exists' });
      }
      group.name = name.trim();
    }

    if (description !== undefined) {
      group.description = description?.trim() || '';
    }

    await group.save();
    
    res.json({
      success: true,
      message: 'Group updated successfully',
      group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/groups/:id - Delete group (Admin only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Remove group from all members
    await Employee.updateMany(
      { group: groupId },
      { $set: { group: null } }
    );

    await Group.findByIdAndDelete(groupId);
    
    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/groups/:id/members/:employeeId - Add employee to group (Admin only)
router.put('/:groupId/members/:employeeId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { groupId, employeeId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Add employee to group
    if (!group.members.includes(employeeId)) {
      group.members.push(employeeId);
      await group.save();
    }

    // Update employee's group
    employee.group = groupId;
    await employee.save();

    res.json({
      success: true,
      message: 'Employee added to group successfully',
      group: await Group.findById(groupId).populate('members', 'name email role')
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/groups/:id/members/:employeeId - Remove employee from group (Admin only)
router.delete('/:groupId/members/:employeeId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { groupId, employeeId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Remove employee from group
    group.members = group.members.filter(id => id.toString() !== employeeId);
    await group.save();

    // Remove group from employee
    employee.group = null;
    await employee.save();

    res.json({
      success: true,
      message: 'Employee removed from group successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
