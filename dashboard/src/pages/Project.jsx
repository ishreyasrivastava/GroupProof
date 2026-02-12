import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiGitCommit, 
  FiUsers, 
  FiClock, 
  FiExternalLink, 
  FiCopy, 
  FiCheck,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiFile,
  FiPlus,
  FiMinus,
  FiGitBranch,
  FiTerminal,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  getReadOnlyContract, 
  parseProject, 
  parseCommit, 
  parseStats,
  formatAddress, 
  formatTimestamp,
  formatRelativeTime,
  formatHash,
  formatCommitHash,
  formatNumber,
  getExplorerAddressUrl,
  addressToColor,
  getInitials,
  withRetry,
  isValidProjectId,
} from '../utils/contract';

// Commit item component
function CommitItem({ commit, index }) {
  const {
    commitHash,
    author,
    authorName,
    timestamp,
    gitTimestamp,
    message,
    filesChanged,
    additions,
    deletions,
    branch,
  } = commit;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="card p-4 hover:border-white/10 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div 
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium text-white"
          style={{ backgroundColor: addressToColor(author) }}
        >
          {getInitials(authorName, author)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white font-medium leading-snug">{message}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm">
                <span className="font-medium text-zinc-300">{authorName}</span>
                <span className="hash">{formatCommitHash(commitHash).substring(0, 7)}</span>
                <span className="hidden sm:flex items-center gap-1 text-zinc-500">
                  <FiGitBranch className="text-xs" />
                  {branch}
                </span>
              </div>
            </div>
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {formatRelativeTime(gitTimestamp || timestamp)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <FiFile className="text-blue-400" />
              {filesChanged} {filesChanged === 1 ? 'file' : 'files'}
            </span>
            {additions > 0 && (
              <span className="flex items-center gap-1 text-emerald-400">
                <FiPlus className="text-xs" />
                {formatNumber(additions)}
              </span>
            )}
            {deletions > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <FiMinus className="text-xs" />
                {formatNumber(deletions)}
              </span>
            )}
            <a
              href={getExplorerAddressUrl(author)}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-zinc-500 hover:text-purple-400 transition-colors"
              title="View on PolygonScan"
            >
              <FiExternalLink className="text-sm" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Contributor stats component
function ContributorCard({ address, stats, totalCommits, index }) {
  const percentage = totalCommits > 0 ? ((stats.totalCommits / totalCommits) * 100).toFixed(1) : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/[0.07] transition-colors"
    >
      {/* Rank */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        index === 0 ? 'bg-amber-500/20 text-amber-400' :
        index === 1 ? 'bg-zinc-400/20 text-zinc-300' :
        index === 2 ? 'bg-orange-500/20 text-orange-400' :
        'bg-zinc-700 text-zinc-400'
      }`}>
        {index + 1}
      </div>

      {/* Avatar */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
        style={{ backgroundColor: addressToColor(address) }}
      >
        {getInitials(null, address)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-zinc-300 truncate">{address}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <FiGitCommit className="text-purple-400" />
            {stats.totalCommits}
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <FiPlus />
            {formatNumber(stats.totalAdditions)}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <FiMinus />
            {formatNumber(stats.totalDeletions)}
          </span>
        </div>
      </div>

      {/* Percentage */}
      <div className="text-right">
        <span className="text-lg font-bold text-white">{percentage}%</span>
      </div>
    </motion.div>
  );
}

export default function Project() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [contributorStats, setContributorStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('commits');
  const [copied, setCopied] = useState(false);

  const loadProject = useCallback(async () => {
    if (!isValidProjectId(projectId)) {
      setError('Invalid project ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const contract = getReadOnlyContract();
      
      // Load project details
      const projectData = await withRetry(() => contract.getProject(projectId));
      const parsedProject = parseProject(projectId, projectData);
      
      if (!parsedProject.name) {
        setError('Project not found');
        setLoading(false);
        return;
      }
      
      setProject(parsedProject);
      
      // Load contributors
      const contributorsData = await withRetry(() => contract.getContributors(projectId));
      setContributors(contributorsData);
      
      // Load commits
      setLoadingCommits(true);
      const commitsData = await withRetry(() => contract.getCommits(projectId, 0, 50));
      setCommits(commitsData.map(parseCommit));
      
      // Load contributor stats
      const statsMap = {};
      await Promise.all(
        contributorsData.map(async (address) => {
          try {
            const data = await withRetry(() => contract.getContributorStats(projectId, address));
            statsMap[address] = parseStats(data);
          } catch (err) {
            console.error('Error loading stats for', address, err);
          }
        })
      );
      setContributorStats(statsMap);
      
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project. Please try again.');
    } finally {
      setLoading(false);
      setLoadingCommits(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const copyProjectId = () => {
    navigator.clipboard.writeText(projectId);
    setCopied(true);
    toast.success('Project ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Sort contributors by commits
  const sortedContributors = [...contributors].sort((a, b) => {
    const statsA = contributorStats[a]?.totalCommits || 0;
    const statsB = contributorStats[b]?.totalCommits || 0;
    return statsB - statsA;
  });

  const totalCommits = Object.values(contributorStats).reduce((sum, s) => sum + (s.totalCommits || 0), 0);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        <div className="skeleton h-6 w-24 rounded mb-8" />
        <div className="card">
          <div className="skeleton h-8 w-3/4 rounded mb-3" />
          <div className="skeleton h-5 w-1/2 rounded mb-6" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-3xl text-red-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{error || 'Project Not Found'}</h1>
        <p className="text-zinc-400 mb-6">
          {error?.includes('Invalid') 
            ? 'The project ID format is invalid.'
            : 'The project you\'re looking for doesn\'t exist or has been removed.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn btn-secondary btn-md">
            Go Home
          </Link>
          <button onClick={loadProject} className="btn btn-primary btn-md">
            <FiRefreshCw />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4">
      {/* Back Link */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <FiArrowLeft />
        Back to Projects
      </Link>

      {/* Project Header */}
      <motion.div 
        className="card mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
              <span className={`badge ${project.isActive ? 'badge-success' : 'badge-neutral'}`}>
                {project.isActive ? (
                  <><FiCheckCircle className="text-xs" /> Active</>
                ) : (
                  <><FiXCircle className="text-xs" /> Inactive</>
                )}
              </span>
            </div>
            <p className="text-zinc-400">{project.description || 'No description'}</p>
          </div>

          {/* Project ID */}
          <button
            onClick={copyProjectId}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm group"
            title="Copy Project ID"
          >
            <span className="font-mono text-zinc-400 group-hover:text-zinc-300">
              {formatHash(projectId, 12)}...
            </span>
            {copied ? (
              <FiCheck className="text-emerald-400" />
            ) : (
              <FiCopy className="text-zinc-500 group-hover:text-zinc-300" />
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-center gap-2 text-purple-400 mb-1">
              <FiGitCommit />
              <span className="text-2xl font-bold text-white">{project.commitCount}</span>
            </div>
            <span className="text-xs text-zinc-500">Commits</span>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
              <FiUsers />
              <span className="text-2xl font-bold text-white">{project.contributorCount}</span>
            </div>
            <span className="text-xs text-zinc-500">Contributors</span>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-center gap-2 text-zinc-400 mb-1">
              <FiClock />
            </div>
            <span className="text-xs text-zinc-500">Created {formatTimestamp(project.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <a 
              href={getExplorerAddressUrl(project.owner)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-zinc-300 hover:text-purple-400 transition-colors"
            >
              <span className="font-mono text-sm">{formatAddress(project.owner)}</span>
              <FiExternalLink className="text-xs" />
            </a>
            <span className="text-xs text-zinc-500 mt-1 block">Owner</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
        {[
          { id: 'commits', label: 'Commits', icon: FiGitCommit, count: commits.length },
          { id: 'contributors', label: 'Contributors', icon: FiUsers, count: contributors.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="text-sm" />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
        
        <button
          onClick={loadProject}
          className="ml-auto btn btn-ghost btn-sm"
          disabled={loading || loadingCommits}
        >
          <FiRefreshCw className={loading || loadingCommits ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'commits' ? (
          <motion.div
            key="commits"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {loadingCommits ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-start gap-4">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-5 w-3/4 rounded mb-2" />
                      <div className="skeleton h-4 w-1/2 rounded mb-3" />
                      <div className="flex gap-4">
                        <div className="skeleton h-4 w-16 rounded" />
                        <div className="skeleton h-4 w-12 rounded" />
                        <div className="skeleton h-4 w-12 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : commits.length > 0 ? (
              commits.map((commit, index) => (
                <CommitItem key={commit.commitHash + index} commit={commit} index={index} />
              ))
            ) : (
              <div className="card py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <FiGitCommit className="text-3xl text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No commits yet</h3>
                <p className="text-zinc-400 max-w-sm mx-auto">
                  Install the GroupProof CLI and make your first commit to see it here!
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="contributors"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {sortedContributors.length > 0 ? (
              sortedContributors.map((address, index) => (
                <ContributorCard
                  key={address}
                  address={address}
                  stats={contributorStats[address] || {}}
                  totalCommits={totalCommits}
                  index={index}
                />
              ))
            ) : (
              <div className="card py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="text-3xl text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No contributors yet</h3>
                <p className="text-zinc-400">Contributors will appear here after making commits.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLI Instructions */}
      <div className="card mt-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-polygon-purple/10 flex items-center justify-center flex-shrink-0">
            <FiTerminal className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Add contributors to this project</h3>
            <p className="text-sm text-zinc-400 mb-3">
              Team members can join by sharing the project config file:
            </p>
            <div className="bg-black/40 rounded-xl p-3 overflow-x-auto">
              <code className="text-sm text-emerald-400">npx groupproof-cli join</code>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Share the <code className="hash">.groupproof.json</code> file with your team members
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
