import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiGitCommit, FiUsers, FiClock, FiExternalLink, FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import CommitList from '../components/CommitList';
import ContributorStats from '../components/ContributorStats';
import { 
  getReadOnlyContract, 
  parseProject, 
  parseCommit, 
  formatAddress, 
  formatTimestamp,
  formatHash,
  getExplorerUrl,
  CONTRACT_ADDRESS
} from '../utils/contract';

export default function Project() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [activeTab, setActiveTab] = useState('commits');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const contract = getReadOnlyContract();
      
      // Load project details
      const projectData = await contract.getProject(projectId);
      setProject(parseProject(projectId, projectData));
      
      // Load contributors
      const contributorsData = await contract.getContributors(projectId);
      setContributors(contributorsData);
      
      // Load commits
      setLoadingCommits(true);
      const commitsData = await contract.getCommits(projectId, 0, 50);
      setCommits(commitsData.map(parseCommit));
    } catch (err) {
      console.error('Error loading project:', err);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
      setLoadingCommits(false);
    }
  };

  const copyProjectId = () => {
    navigator.clipboard.writeText(projectId);
    setCopied(true);
    toast.success('Project ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="skeleton h-8 w-32 mb-8" />
        <div className="glass rounded-2xl p-8">
          <div className="skeleton h-10 w-3/4 mb-4" />
          <div className="skeleton h-6 w-1/2 mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
        <p className="text-slate-400 mb-6">The project you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Link */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <FiArrowLeft />
        Back to Projects
      </Link>

      {/* Project Header */}
      <motion.div 
        className="glass rounded-2xl p-6 sm:p-8 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                project.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
              }`}>
                {project.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-slate-400">{project.description || 'No description'}</p>
          </div>

          {/* Project ID Copy */}
          <button
            onClick={copyProjectId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
            title="Copy Project ID"
          >
            <span className="font-mono text-slate-400">{formatHash(projectId, 12)}...</span>
            {copied ? <FiCheck className="text-green-400" /> : <FiCopy />}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-slate-800/30">
            <div className="flex items-center justify-center gap-2 text-polygon-light mb-1">
              <FiGitCommit />
              <span className="text-2xl font-bold">{project.commitCount}</span>
            </div>
            <span className="text-xs text-slate-500">Commits</span>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-800/30">
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
              <FiUsers />
              <span className="text-2xl font-bold">{project.contributorCount}</span>
            </div>
            <span className="text-xs text-slate-500">Contributors</span>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-800/30">
            <div className="flex items-center justify-center gap-2 text-slate-300 mb-1">
              <FiClock />
            </div>
            <span className="text-xs text-slate-500">Created {formatTimestamp(project.createdAt)}</span>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-800/30">
            <a 
              href={getExplorerUrl(project.owner, 'address')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-slate-300 hover:text-polygon-light mb-1"
            >
              <span className="font-mono text-sm">{formatAddress(project.owner)}</span>
              <FiExternalLink className="text-xs" />
            </a>
            <span className="text-xs text-slate-500">Owner</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2">
        {[
          { id: 'commits', label: 'Commits', icon: FiGitCommit },
          { id: 'contributors', label: 'Contributors', icon: FiUsers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              activeTab === tab.id
                ? 'bg-polygon-purple/20 text-polygon-light'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'commits' ? (
          <CommitList commits={commits} loading={loadingCommits} />
        ) : (
          <ContributorStats projectId={projectId} contributors={contributors} />
        )}
      </motion.div>

      {/* CLI Instructions */}
      <div className="glass rounded-2xl p-6 mt-8">
        <h3 className="text-lg font-semibold mb-4">Add contributors to this project</h3>
        <p className="text-slate-400 text-sm mb-4">
          Team members can join by adding the project config to their local repository:
        </p>
        <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
          <code className="text-sm text-green-400">
            npx groupproof-cli join
          </code>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          Share the <code className="hash">.groupproof.json</code> file with your team
        </p>
      </div>
    </div>
  );
}
