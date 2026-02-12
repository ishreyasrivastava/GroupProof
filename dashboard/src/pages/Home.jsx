import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiPlus, 
  FiGitCommit, 
  FiUsers, 
  FiFolder, 
  FiArrowRight, 
  FiGithub, 
  FiTerminal,
  FiShield,
  FiZap,
  FiGlobe,
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
      
      // Get total projects count with retry
      const totalProjects = await withRetry(() => contract.getTotalProjects());
      
      // Get recent projects (last 12)
      const limit = Math.min(Number(totalProjects), 12);
      const offset = Math.max(0, Number(totalProjects) - limit);
      
      if (limit === 0) {
        setProjects([]);
        setStats({ totalProjects: 0, totalContributors: 0, totalCommits: 0 });
        return;
      }
      
      const projectIds = await withRetry(() => contract.getAllProjects(offset, limit));
      
      // Load project details in parallel
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
      
      // Calculate stats
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!isContractConfigured()) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div 
          className="glass rounded-2xl p-8 max-w-lg text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
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
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-8">
      {/* Hero Section */}
      <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-polygon-purple/10 border border-polygon-purple/20 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-sm font-medium text-purple-300">Powered by Polygon</span>
          </motion.div>
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Prove</span> Your
            <br className="hidden sm:block" />
            {' '}Contributions
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            GroupProof records your git commits on the blockchain.
            <span className="text-zinc-300"> No more disputes</span> over who did what in group projects.
          </p>

          {/* CTA Buttons */}
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
              <motion.button
                onClick={() => connectWallet()}
                className="btn btn-primary btn-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
                <FiArrowRight />
              </motion.button>
            ) : (
              <Link to="/create" className="btn btn-primary btn-lg">
                <FiPlus />
                Create Project
              </Link>
            )}
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              Learn More
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <motion.section 
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { 
            icon: FiFolder, 
            value: stats.totalProjects, 
            label: 'Projects',
            gradient: 'from-polygon-purple to-purple-500',
          },
          { 
            icon: FiUsers, 
            value: stats.totalContributors, 
            label: 'Contributors',
            gradient: 'from-blue-500 to-cyan-500',
          },
          { 
            icon: FiGitCommit, 
            value: stats.totalCommits, 
            label: 'Commits Recorded',
            gradient: 'from-emerald-500 to-teal-500',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-card text-center"
            variants={itemVariants}
          >
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-3 shadow-lg`}>
              <stat.icon className="text-xl text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {loading ? (
                <div className="skeleton h-8 w-16 mx-auto rounded" />
              ) : (
                stat.value.toLocaleString()
              )}
            </div>
            <div className="text-sm text-zinc-500">{stat.label}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-20">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold">
            How It <span className="text-gradient">Works</span>
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: FiTerminal,
              title: 'Install CLI',
              description: 'Run our CLI in your project to set up git hooks. Takes 30 seconds.',
              code: 'npx groupproof-cli init',
            },
            {
              step: '02',
              icon: FiGitCommit,
              title: 'Make Commits',
              description: 'Work on your project normally. Every commit is automatically recorded.',
              code: 'git commit -m "feat: auth"',
            },
            {
              step: '03',
              icon: FiShield,
              title: 'View Proof',
              description: 'Check the dashboard to see contributions. Immutable, transparent proof.',
              code: 'groupproof.vercel.app',
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              className="card relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="absolute top-4 right-4 text-5xl font-bold text-zinc-800/50">
                {item.step}
              </span>
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-polygon-purple/10 border border-polygon-purple/20 flex items-center justify-center mb-4">
                  <item.icon className="text-xl text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm mb-4">{item.description}</p>
                <code className="code block text-xs">{item.code}</code>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            { icon: FiShield, title: 'Immutable Proof', desc: 'Commits on blockchain' },
            { icon: FiZap, title: 'Automatic', desc: 'Git hooks do the work' },
            { icon: FiGlobe, title: 'Transparent', desc: 'Public verification' },
            { icon: FiUsers, title: 'Team Ready', desc: 'Multi-contributor' },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              className="glass-light rounded-xl p-4 text-center"
              variants={itemVariants}
            >
              <feature.icon className="text-xl text-purple-400 mx-auto mb-2" />
              <h4 className="font-medium text-sm">{feature.title}</h4>
              <p className="text-xs text-zinc-500">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
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
          <motion.div 
            className="error-banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FiAlertCircle className="text-xl flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error loading projects</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
            <button onClick={loadProjects} className="btn btn-sm bg-red-500/20 hover:bg-red-500/30">
              <FiRefreshCw />
              Retry
            </button>
          </motion.div>
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
              <motion.div 
                className="col-span-full card text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <FiFolder className="text-3xl text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-zinc-400 mb-6">Be the first to create a project on GroupProof!</p>
                <Link to="/create" className="btn btn-primary btn-md">
                  <FiPlus />
                  Create Project
                </Link>
              </motion.div>
            )}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <motion.section 
        className="relative overflow-hidden rounded-3xl p-8 sm:p-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-polygon-purple via-purple-600 to-pink-500 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNncmlkKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to prove your contributions?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Stop letting teammates take credit for your work. Start recording your contributions on the blockchain today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/create"
              className="btn bg-white text-polygon-purple font-semibold px-8 py-3 hover:bg-zinc-100"
            >
              Create Free Project
            </Link>
            <a
              href="https://github.com/ishreyasrivastava/GroupProof"
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-white/20 text-white font-semibold px-8 py-3 hover:bg-white/30 border border-white/20"
            >
              <FiGithub />
              View on GitHub
            </a>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
