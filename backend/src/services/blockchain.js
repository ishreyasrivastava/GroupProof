const { ethers } = require('ethers');
const config = require('../config');
const ABI = require('../utils/contractABI');
const cache = require('./cache');
const { formatCommit, formatProject, AppError } = require('../utils/helpers');

let provider, contract;

function getContract() {
  if (!contract) {
    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    contract = new ethers.Contract(config.contractAddress, ABI, provider);
  }
  return contract;
}

async function getTotalProjects() {
  const cached = cache.get('totalProjects');
  if (cached !== null) return cached;
  const c = getContract();
  const total = Number(await c.getTotalProjects());
  cache.set('totalProjects', total);
  return total;
}

async function getAllProjects(offset, limit) {
  const key = `projects:${offset}:${limit}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const c = getContract();
  const ids = await c.getAllProjects(offset, limit);
  const projects = await Promise.all(
    ids.map(async (id) => {
      const p = await c.getProject(id);
      return formatProject(id, p);
    })
  );
  cache.set(key, projects);
  return projects;
}

async function getProject(projectId) {
  const key = `project:${projectId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const c = getContract();
  const p = await c.getProject(projectId);
  if (Number(p[3]) === 0) throw new AppError('Project not found', 404);
  const result = formatProject(projectId, p);
  cache.set(key, result);
  return result;
}

async function getCommits(projectId, offset, limit) {
  const key = `commits:${projectId}:${offset}:${limit}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const c = getContract();
  const commits = await c.getCommits(projectId, offset, limit);
  const result = commits.map(formatCommit);
  cache.set(key, result);
  return result;
}

async function getCommitCount(projectId) {
  const c = getContract();
  return Number(await c.getCommitCount(projectId));
}

async function getContributors(projectId) {
  const key = `contributors:${projectId}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const c = getContract();
  const addresses = await c.getContributors(projectId);
  const contributors = await Promise.all(
    addresses.map(async (addr) => {
      const stats = await c.getContributorStats(projectId, addr);
      return {
        address: addr,
        totalCommits: Number(stats.totalCommits || stats[0]),
        totalAdditions: Number(stats.totalAdditions || stats[1]),
        totalDeletions: Number(stats.totalDeletions || stats[2]),
        totalFilesChanged: Number(stats.totalFilesChanged || stats[3]),
        firstContribution: Number(stats.firstContribution || stats[4]),
        lastContribution: Number(stats.lastContribution || stats[5]),
      };
    })
  );
  cache.set(key, contributors);
  return contributors;
}

async function getUserProjects(address) {
  const key = `userProjects:${address}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const c = getContract();
  const ids = await c.getUserProjects(address);
  const projects = await Promise.all(
    ids.map(async (id) => {
      const p = await c.getProject(id);
      return formatProject(id, p);
    })
  );
  cache.set(key, projects);
  return projects;
}

module.exports = {
  getContract,
  getTotalProjects,
  getAllProjects,
  getProject,
  getCommits,
  getCommitCount,
  getContributors,
  getUserProjects,
};
