import { motion } from 'framer-motion';
import { FiGitCommit, FiFile, FiPlus, FiMinus, FiGitBranch, FiExternalLink } from 'react-icons/fi';
import { formatHash, formatAddress, formatRelativeTime, addressToColor, getExplorerUrl } from '../utils/contract';

export default function CommitList({ commits, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <CommitSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!commits || commits.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold mb-2">No commits yet</h3>
        <p className="text-slate-400">
          Install the GroupProof CLI and make your first commit to see it here!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commits.map((commit, index) => (
        <CommitItem key={commit.commitHash + index} commit={commit} index={index} />
      ))}
    </div>
  );
}

function CommitItem({ commit, index }) {
  const {
    commitHash,
    author,
    authorName,
    authorEmail,
    timestamp,
    gitTimestamp,
    message,
    filesChanged,
    additions,
    deletions,
    repoName,
    branch,
  } = commit;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-xl p-4 hover:border-polygon-purple/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div 
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium"
          style={{ backgroundColor: addressToColor(author) }}
        >
          {authorName?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{message}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                <span className="font-medium text-slate-300">{authorName}</span>
                <span>•</span>
                <span className="hash">{formatHash(commitHash)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:flex items-center gap-1">
                  <FiGitBranch className="text-xs" />
                  {branch}
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {formatRelativeTime(gitTimestamp || timestamp)}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1 text-slate-400">
              <FiFile className="text-blue-400" />
              {filesChanged} {filesChanged === 1 ? 'file' : 'files'}
            </span>
            {additions > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <FiPlus />
                {additions}
              </span>
            )}
            {deletions > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <FiMinus />
                {deletions}
              </span>
            )}
            <a
              href={getExplorerUrl(author, 'address')}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-slate-500 hover:text-polygon-light transition-colors"
              title="View on PolygonScan"
            >
              <FiExternalLink />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CommitSkeleton() {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start gap-4">
        <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="skeleton h-5 w-3/4 mb-2" />
          <div className="skeleton h-4 w-1/2 mb-3" />
          <div className="flex gap-4">
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
