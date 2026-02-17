const { isValidBytes32, isValidAddress, AppError } = require('../utils/helpers');

function validateProjectId(req, res, next) {
  const { projectId } = req.params;
  if (!isValidBytes32(projectId)) {
    return next(new AppError('Invalid project ID format (expected bytes32)', 400));
  }
  next();
}

function validateAddress(req, res, next) {
  const { address } = req.params;
  if (!isValidAddress(address)) {
    return next(new AppError('Invalid Ethereum address', 400));
  }
  next();
}

function validateCreateProject(req, res, next) {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return next(new AppError('Project name is required', 400));
  }
  if (name.length > 100) {
    return next(new AppError('Project name too long (max 100 chars)', 400));
  }
  next();
}

function validateRecordCommit(req, res, next) {
  const { commitHash, authorName, message } = req.body;
  if (!commitHash || !isValidBytes32(commitHash)) {
    return next(new AppError('Valid commitHash (bytes32) is required', 400));
  }
  if (!authorName || typeof authorName !== 'string') {
    return next(new AppError('authorName is required', 400));
  }
  if (!message || typeof message !== 'string') {
    return next(new AppError('Commit message is required', 400));
  }
  next();
}

module.exports = { validateProjectId, validateAddress, validateCreateProject, validateRecordCommit };
