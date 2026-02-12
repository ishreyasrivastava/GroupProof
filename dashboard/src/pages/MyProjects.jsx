import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiFolder, FiRefreshCw, FiAlertCircle, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ProjectCard, { ProjectCardSkeleton } from '../components/ProjectCard';
import { getReadOnlyContract, parseProject, withRetry, isContractConfigured } from '../utils/contract';
import { useWallet } from '../hooks/useWallet';

export default function MyProjects() {
  const { account, isConnected, connectWallet, isMetaMaskInstalled } = useWallet();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUserProjects = useCallback(async () => {
    if (!account) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = getReadOnlyContract();
      
      // Get user's project IDs
      const projectIds = await withRetry(() => contract.getUserProjects(account));
      
      if (projectIds.length === 0) {
        setProjects([]);
        return;
      }

      // Load project details in parallel
      const projectsData = await Promise.all(
        projectIds.map(async (id) => {
          try {
            const data = await withRetry(() => contract.getProject(id));
            return parseProject(id, data);
          } catch (err) {
            console.error('Error loading project:', id, err);
            return null;
          }
        })
      );

      setProjects(projectsData.filter(Boolean).reverse());
    } catch (err) {
      console.error('Error loading user projects:', err);
      setError('Failed to load your projects. Please try again.');
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (account && isContractConfigured()) {
      loadUserProjects();
    } else {
      setLoading(false);
    }
  }, [account, loadUserProjects]);

  // Not connected state
  if (!isMetaMaskInstalled) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <FiAlertCircle className="text-4xl text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">MetaMask Required</h1>
          <p className="text-zinc-400 mb-8">
            Install MetaMask to view your projects and contributions.
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-md"
          >
            Install MetaMask
          </a>
        </motion.div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-polygon-purple/10 flex items-center justify-center">
            <FiShield className="text-4xl text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-zinc-400 mb-8">
            Connect your wallet to view the projects you've created or contributed to.
          </p>
          <button
            onClick={() => connectWallet()}
            className="btn btn-primary btn-md"
          >
            Connect Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.isActive).length,
    totalCommits: projects.reduce((sum, p) => sum + p.commitCount, 0),
    totalContributors: projects.reduce((sum, p) => sum + p.contributorCount, 0),
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Projects</h1>
          <p className="text-zinc-400 mt-1">Projects you've created or contributed to</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadUserProjects}
            className="btn btn-secondary btn-md"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link to="/create" className="btn btn-primary btn-md">
            <FiPlus />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <motion.div 
          className="error-banner mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FiAlertCircle className="text-xl flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Error loading projects</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
          <button onClick={loadUserProjects} className="btn btn-sm bg-red-500/20 hover:bg-red-500/30">
            <FiRefreshCw />
            Retry
          </button>
        </motion.div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>

          {/* Stats Summary */}
          <motion.div 
            className="card mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-purple-400">{stats.total}</div>
                <div className="text-xs text-zinc-500 mt-1">Total Projects</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
                <div className="text-xs text-zinc-500 mt-1">Active</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-blue-400">{stats.totalCommits}</div>
                <div className="text-xs text-zinc-500 mt-1">Total Commits</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-amber-400">{stats.totalContributors}</div>
                <div className="text-xs text-zinc-500 mt-1">Total Contributors</div>
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div
          className="card py-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <FiFolder className="text-4xl text-zinc-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
            Create your first project to start tracking contributions on the blockchain.
          </p>
          <Link to="/create" className="btn btn-primary btn-md">
            <FiPlus />
            Create Project
          </Link>
        </motion.div>
      )}
    </div>
  );
}
