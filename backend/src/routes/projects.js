const router = require('express').Router();
const blockchain = require('../services/blockchain');
const analytics = require('../services/analytics');
const { verifyWalletSignature } = require('../middleware/auth');
const { validateProjectId, validateCreateProject } = require('../middleware/validator');
const { parsePagination, AppError } = require('../utils/helpers');

// GET /api/projects
router.get('/', async (req, res, next) => {
  try {
    const { offset, limit, page } = parsePagination(req.query);
    const total = await blockchain.getTotalProjects();
    const projects = await blockchain.getAllProjects(offset, limit);
    res.json({
      success: true,
      data: projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

// GET /api/projects/:projectId
router.get('/:projectId', validateProjectId, async (req, res, next) => {
  try {
    const project = await blockchain.getProject(req.params.projectId);
    res.json({ success: true, data: project });
  } catch (err) { next(err); }
});

// GET /api/projects/:projectId/analytics
router.get('/:projectId/analytics', validateProjectId, async (req, res, next) => {
  try {
    const data = await analytics.getProjectAnalytics(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// POST /api/projects
router.post('/', verifyWalletSignature, validateCreateProject, async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'Project creation must be done on-chain. Use the CLI or dashboard to submit the transaction.',
      data: {
        method: 'createProject',
        params: { name: req.body.name, description: req.body.description || '' },
        signer: req.walletAddress,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
