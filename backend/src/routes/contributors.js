const router = require('express').Router();
const blockchain = require('../services/blockchain');
const { validateProjectId } = require('../middleware/validator');

// GET /api/projects/:projectId/contributors
router.get('/:projectId/contributors', validateProjectId, async (req, res, next) => {
  try {
    const contributors = await blockchain.getContributors(req.params.projectId);
    res.json({ success: true, data: contributors });
  } catch (err) { next(err); }
});

module.exports = router;
