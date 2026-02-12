import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ProjectCard, { ProjectCardSkeleton } from '../components/ProjectCard';
import { getReadOnlyContract, parseProject } from '../utils/contract';
import { useWallet } from '../hooks/useWallet';

export default function MyProjects() {
  const { account, isConnected, connectWallet } = useWallet();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account) {
      loadUserProjects();
    } else {
      setLoading(false);
    }
  }, [account]);

  const loadUserProjects = async () => {
    setLoading(true);
    try {
      const contract = getReadOnlyContract();
      
      // Get user's project IDs
      const projectIds = await contract.getUserProjects(account);
      
      if (projectIds.length === 0) {
        setProjects([]);
        return;
      }

      // Load project details
      const projectsData = await Promise.all(
        projectIds.map(async (id) => {
          try {
            const data = await contract.getProject(id);
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
      toast.error('Failed to load your projects');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-polygon-purple/20 flex items-center justify-center">
            <FiFolder className="text-4xl text-polygon-light" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-slate-400 mb-8">
            Connect your wallet to view the projects you've created or contributed to.
          </p>
          <button
            onClick={() => connectWallet()}
            className="btn btn-primary px-8 py-3"
          >
            Connect Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Projects</h1>
          <p className="text-slate-400 mt-1">Projects you've created or contributed to</p>
        </div>
        <Link to="/create" className="btn btn-primary flex items-center gap-2">
          <FiPlus />
          <span className="hidden sm:inline">New Project</span>
        </Link>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          className="glass rounded-2xl p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800 flex items-center justify-center">
            <FiFolder className="text-4xl text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
          <p className="text-slate-400 mb-6">
            Create your first project to start tracking contributions on the blockchain.
          </p>
          <Link to="/create" className="btn btn-primary inline-flex items-center gap-2">
            <FiPlus />
            Create Project
          </Link>
        </motion.div>
      )}

      {/* Quick Stats */}
      {projects.length > 0 && (
        <div className="mt-12 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-polygon-light">{projects.length}</div>
              <div className="text-sm text-slate-500">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {projects.filter(p => p.isActive).length}
              </div>
              <div className="text-sm text-slate-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {projects.reduce((sum, p) => sum + p.commitCount, 0)}
              </div>
              <div className="text-sm text-slate-500">Total Commits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">
                {projects.reduce((sum, p) => sum + p.contributorCount, 0)}
              </div>
              <div className="text-sm text-slate-500">Total Contributors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
