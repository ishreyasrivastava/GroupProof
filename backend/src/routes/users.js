const router = require('express').Router();
const blockchain = require('../services/blockchain');
const { validateAddress } = require('../middleware/validator');

// GET /api/users/:address/projects
router.get('/:address/projects', validateAddress, async (req, res, next) => {
  try {
    const projects = await blockchain.getUserProjects(req.params.address);
    res.json({ success: true, data: projects });
  } catch (err) { next(err); }
});

module.exports = router;
