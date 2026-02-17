const router = require('express').Router();
const blockchain = require('../services/blockchain');
const { verifyWalletSignature } = require('../middleware/auth');
const { validateProjectId, validateRecordCommit } = require('../middleware/validator');
const { parsePagination } = require('../utils/helpers');

// GET /api/projects/:projectId/commits
router.get('/:projectId/commits', validateProjectId, async (req, res, next) => {
  try {
    const { offset, limit, page } = parsePagination(req.query);
    const total = await blockchain.getCommitCount(req.params.projectId);
    const commits = await blockchain.getCommits(req.params.projectId, offset, limit);
    res.json({
      success: true,
      data: commits,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

// POST /api/projects/:projectId/commits
router.post('/:projectId/commits', verifyWalletSignature, validateProjectId, validateRecordCommit, async (req, res, next) => {
  try {
    const { commitHash, authorName, authorEmail, gitTimestamp, message, filesChanged, additions, deletions, repoName, branch } = req.body;
    res.status(201).json({
      success: true,
      message: 'Commit recording must be done on-chain. Use the CLI or dashboard to submit the transaction.',
      data: {
        method: 'recordCommit',
        params: {
          projectId: req.params.projectId,
          commitHash, authorName, authorEmail: authorEmail || '',
          gitTimestamp: gitTimestamp || Math.floor(Date.now() / 1000),
          message, filesChanged: filesChanged || 0,
          additions: additions || 0, deletions: deletions || 0,
          repoName: repoName || '', branch: branch || 'main',
        },
        signer: req.walletAddress,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
