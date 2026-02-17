const blockchain = require('./blockchain');
const cache = require('./cache');

async function getProjectAnalytics(projectId) {
  const key = `analytics:${projectId}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [project, contributors] = await Promise.all([
    blockchain.getProject(projectId),
    blockchain.getContributors(projectId),
  ]);

  const totalCommits = project.commitCount;
  const totalAdditions = contributors.reduce((s, c) => s + c.totalAdditions, 0);
  const totalDeletions = contributors.reduce((s, c) => s + c.totalDeletions, 0);
  const totalFilesChanged = contributors.reduce((s, c) => s + c.totalFilesChanged, 0);

  // Contribution breakdown by contributor
  const contributionBreakdown = contributors.map((c) => ({
    address: c.address,
    commits: c.totalCommits,
    additions: c.totalAdditions,
    deletions: c.totalDeletions,
    percentage: totalCommits > 0 ? Math.round((c.totalCommits / totalCommits) * 10000) / 100 : 0,
  }));

  // Activity timeline (contributors sorted by last activity)
  const activityTimeline = contributors
    .filter((c) => c.lastContribution > 0)
    .sort((a, b) => b.lastContribution - a.lastContribution)
    .map((c) => ({
      address: c.address,
      lastActive: c.lastContribution,
      firstActive: c.firstContribution,
    }));

  const result = {
    projectId,
    summary: {
      totalCommits,
      totalContributors: contributors.length,
      totalAdditions,
      totalDeletions,
      totalFilesChanged,
      netLinesChanged: totalAdditions - totalDeletions,
    },
    contributionBreakdown,
    activityTimeline,
  };

  cache.set(key, result);
  return result;
}

module.exports = { getProjectAnalytics };
