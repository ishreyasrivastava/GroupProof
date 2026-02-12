import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiGitCommit, FiClock, FiArrowRight } from 'react-icons/fi';
import { formatAddress, formatRelativeTime, addressToColor } from '../utils/contract';

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
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={`/project/${id}`}
        className="block glass rounded-2xl p-6 card-hover group"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate group-hover:text-polygon-light transition-colors">
              {name}
            </h3>
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">
              {description || 'No description'}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
            isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-polygon-light mb-1">
              <FiGitCommit className="text-lg" />
              <span className="text-xl font-bold">{commitCount}</span>
            </div>
            <span className="text-xs text-slate-500">Commits</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
              <FiUsers className="text-lg" />
              <span className="text-xl font-bold">{contributorCount}</span>
            </div>
            <span className="text-xs text-slate-500">Contributors</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
              <FiClock className="text-lg" />
            </div>
            <span className="text-xs text-slate-500">{formatRelativeTime(createdAt)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: addressToColor(owner) }}
            />
            <span className="text-sm text-slate-400 font-mono">
              {formatAddress(owner)}
            </span>
          </div>
          <FiArrowRight className="text-slate-500 group-hover:text-polygon-light group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
    </motion.div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="skeleton h-6 w-3/4 mb-2" />
          <div className="skeleton h-4 w-full" />
        </div>
        <div className="skeleton h-6 w-16 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="skeleton h-8 w-12 mx-auto mb-1" />
            <div className="skeleton h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="skeleton w-6 h-6 rounded-full" />
          <div className="skeleton h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
