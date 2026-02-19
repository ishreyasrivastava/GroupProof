import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPlus, 
  FiGitCommit, 
  FiUsers, 
  FiFolder, 
  FiArrowRight, 
  FiGithub, 
  FiTerminal,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import ProjectCard, { ProjectCardSkeleton } from '../components/ProjectCard';
import { getReadOnlyContract, parseProject, isContractConfigured, withRetry } from '../utils/contract';
import { useWallet } from '../hooks/useWallet';

export default function Home() {
  const { isConnected, connectWallet, isMetaMaskInstalled } = useWallet();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalProjects: 0, totalContributors: 0, totalCommits: 0 });

  useEffect(() => {
    if (isContractConfigured()) {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const contract = getReadOnlyContract();
      
      const totalProjects = await withRetry(() => contract.getTotalProjects());
      
      const limit = Math.min(Number(totalProjects), 12);
      const offset = Math.max(0, Number(totalProjects) - limit);
      
      if (limit === 0) {
        setProjects([]);
        setStats({ totalProjects: 0, totalContributors: 0, totalCommits: 0 });
        return;
      }
      
      const projectIds = await withRetry(() => contract.getAllProjects(offset, limit));
      
      const projectsData = await Promise.all(
        projectIds.reverse().map(async (id) => {
          try {
            const data = await withRetry(() => contract.getProject(id));
            return parseProject(id, data);
          } catch (err) {
            console.error('Error loading project:', id, err);
            return null;
          }
        })
      );

      const validProjects = projectsData.filter(Boolean);
      setProjects(validProjects);
      
      const totalContributors = validProjects.reduce((sum, p) => sum + p.contributorCount, 0);
      const totalCommits = validProjects.reduce((sum, p) => sum + p.commitCount, 0);
      
      setStats({
        totalProjects: Number(totalProjects),
        totalContributors,
        totalCommits,
      });
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isContractConfigured()) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass rounded-2xl p-8 max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-3xl text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Configuration Required</h1>
          <p className="text-zinc-400 mb-6">
            The smart contract address hasn't been configured yet. 
            Please deploy the contract and set the <code className="hash">VITE_CONTRACT_ADDRESS</code> environment variable.
          </p>
          <a 
            href="https://github.com/ishreyasrivastava/GroupProof#deployment"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-md"
          >
            <FiGithub />
            View Deployment Guide
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-8">
      {/* Hero */}
      <section className="pt-8 pb-4 sm:pt-12 sm:pb-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            See who contributed what
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8">
            GroupProof records git commits on-chain so there's a clear record
            of who did what in group projects.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isMetaMaskInstalled ? (
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                Install MetaMask
                <FiArrowRight />
              </a>
            ) : !isConnected ? (
              <button
                onClick={() => connectWallet()}
                className="btn btn-primary btn-lg"
              >
                Get Started
                <FiArrowRight />
              </button>
            ) : (
              <Link to="/create" className="btn btn-primary btn-lg">
                <FiPlus />
                Create Project
              </Link>
            )}
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Live stats from the contract */}
      {!loading && stats.totalProjects > 0 && (
        <section className="grid grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: FiFolder, value: stats.totalProjects, label: 'Projects' },
            { icon: FiUsers, value: stats.totalContributors, label: 'Contributors' },
            { icon: FiGitCommit, value: stats.totalCommits, label: 'Commits' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card text-center">
              <stat.icon className="text-lg text-zinc-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </section>
      )}

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-20">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
          How it works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              icon: FiTerminal,
              title: 'Install the CLI',
              description: 'Run one command in your project to set up git hooks.',
              code: 'npx groupproof-cli init',
            },
            {
              step: '2',
              icon: FiGitCommit,
              title: 'Commit like normal',
              description: 'Every git commit gets recorded automatically. Nothing changes about your workflow.',
              code: 'git commit -m "feat: auth"',
            },
            {
              step: '3',
              icon: FiFolder,
              title: 'Check the dashboard',
              description: 'Come here to see who committed what, when, and how much.',
              code: 'groupproof.vercel.app',
            },
          ].map((item, index) => (
            <div
              key={item.step}
              className="card relative overflow-hidden"
            >
              <span className="absolute top-4 right-4 text-4xl font-bold text-zinc-800/50">
                {item.step}
              </span>
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                  <item.icon className="text-lg text-zinc-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm mb-4">{item.description}</p>
                <code className="code block text-xs">{item.code}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">Recent Projects</h2>
          {!loading && !error && projects.length > 0 && (
            <button
              onClick={loadProjects}
              className="btn btn-ghost btn-sm"
              disabled={loading}
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>

        {error ? (
          <div className="error-banner">
            <FiAlertCircle className="text-xl flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error loading projects</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={loadProjects} className="btn btn-sm bg-red-500/20 hover:bg-red-500/30">
              <FiRefreshCw />
              Retry
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))
            ) : projects.length > 0 ? (
              projects.slice(0, 6).map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))
            ) : (
              <div className="col-span-full card text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <FiFolder className="text-3xl text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-zinc-400 mb-6">Be the first to create a project!</p>
                <Link to="/create" className="btn btn-primary btn-md">
                  <FiPlus />
                  Create Project
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="rounded-2xl bg-zinc-900 border border-zinc-800 p-8 sm:p-10 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-3">
          Want to try it?
        </h2>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
          Create a project, share the config with your team, and start committing. It's free on testnet.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/create" className="btn btn-primary btn-md">
            Create a Project
          </Link>
          <a
            href="https://github.com/ishreyasrivastava/GroupProof"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-md"
          >
            <FiGithub />
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
