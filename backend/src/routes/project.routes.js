const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

/**
 * @route   GET /api/projects
 * @desc    Get all active projects (or all projects if manager specifies includeInactive=true)
 * @access  Private (All authenticated users)
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const where = {};

    if (includeInactive !== 'true' || req.user.role !== 'MANAGER') {
      where.isActive = true;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project details
 * @access  Private (All authenticated users)
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { reports: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private (Manager only)
 */
router.post('/', requireAuth, requireRole('MANAGER'), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const trimmedName = name.trim();

    const existing = await prisma.project.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return res.status(409).json({ error: 'A project with this name already exists' });
    }

    const project = await prisma.project.create({
      data: {
        name: trimmedName,
        description: description ? description.trim() : null,
        isActive: true,
      },
    });

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  Private (Manager only)
 */
router.put('/:id', requireAuth, requireRole('MANAGER'), async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    const existing = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/projects/:id
 * @desc    Deactivate or delete a project
 * @access  Private (Manager only)
 */
router.delete('/:id', requireAuth, requireRole('MANAGER'), async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { reports: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // If project has associated reports, soft-deactivate rather than foreign-key violation
    if (project._count.reports > 0) {
      const updated = await prisma.project.update({
        where: { id: req.params.id },
        data: { isActive: false },
      });
      return res.json({
        message: 'Project has existing reports and was deactivated (archived) rather than deleted.',
        project: updated,
      });
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
