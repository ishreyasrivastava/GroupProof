const { ethers } = require('ethers');

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function isValidBytes32(value) {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

function isValidAddress(value) {
  return ethers.isAddress(value);
}

function formatCommit(c) {
  return {
    commitHash: c.commitHash,
    author: c.author,
    authorName: c.authorName,
    authorEmail: c.authorEmail,
    timestamp: Number(c.timestamp),
    gitTimestamp: Number(c.gitTimestamp),
    message: c.message,
    filesChanged: Number(c.filesChanged),
    additions: Number(c.additions),
    deletions: Number(c.deletions),
    repoName: c.repoName,
    branch: c.branch,
  };
}

function formatProject(projectId, p) {
  return {
    projectId,
    name: p.name || p[0],
    description: p.description || p[1],
    owner: p.owner || p[2],
    createdAt: Number(p.createdAt || p[3]),
    isActive: p.isActive ?? p[4],
    contributorCount: Number(p.contributorCount || p[5]),
    commitCount: Number(p.commitCount || p[6]),
  };
}

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

module.exports = { parsePagination, isValidBytes32, isValidAddress, formatCommit, formatProject, AppError };
