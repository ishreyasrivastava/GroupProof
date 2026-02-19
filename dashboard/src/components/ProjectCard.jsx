import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiGitCommit, FiClock, FiArrowRight, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { formatAddress, formatRelativeTime, addressToColor, getInitials } from '../utils/contract';

export default function ProjectCard({ project, index = 0 }) {
  const {
    id,
    name,
    description,
    owner,
    createdAt,
    isActive,
    contributorCount,
    commitCount,
  } = project;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={`/project/${id}`}
        className="block card-interactive group h-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
              {name}
            </h3>
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
              {description || 'No description provided'}
            </p>
          </div>
          
          {/* Status badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            isActive 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-zinc-700/50 text-zinc-500 border border-zinc-600'
          }`}>
            {isActive ? (
              <>
                <FiCheckCircle className="text-[10px]" />
                Active
              </>
            ) : (
              <>
                <FiXCircle className="text-[10px]" />
                Inactive
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FiGitCommit className="text-purple-400" />
              <span className="text-xl font-bold text-white">{commitCount}</span>
            </div>
            <span className="text-xs text-zinc-500">Commits</span>
          </div>
          
          <div className="text-center border-x border-white/5">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FiUsers className="text-blue-400" />
              <span className="text-xl font-bold text-white">{contributorCount}</span>
            </div>
            <span className="text-xs text-zinc-500">Contributors</span>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FiClock className="text-amber-400" />
            </div>
            <span className="text-xs text-zinc-500">{formatRelativeTime(createdAt)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: addressToColor(owner) }}
            >
              {getInitials(null, owner)}
            </div>
            <span className="text-sm text-zinc-400 font-mono">
              {formatAddress(owner)}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-zinc-500 group-hover:text-purple-400 transition-colors">
            <span className="text-xs font-medium">View</span>
            <FiArrowRight className="text-sm" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Skeleton loader
export function ProjectCardSkeleton() {
  return (
    <div className="card animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="skeleton h-6 w-3/4 rounded mb-2" />
          <div className="skeleton h-4 w-full rounded" />
        </div>
        <div className="skeleton h-6 w-16 rounded-lg" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="skeleton h-7 w-12 mx-auto mb-1 rounded" />
            <div className="skeleton h-3 w-14 mx-auto rounded" />
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <div className="skeleton w-7 h-7 rounded-full" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="skeleton h-4 w-12 rounded" />
      </div>
    </div>
  );
}
