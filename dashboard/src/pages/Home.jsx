import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlus, FiGitCommit, FiUsers, FiFolder, FiArrowRight, FiGithub, FiTerminal } from 'react-icons/fi';
import ProjectCard, { ProjectCardSkeleton } from '../components/ProjectCard';
import { getReadOnlyContract, parseProject } from '../utils/contract';
import { useWallet } from '../hooks/useWallet';

export default function Home() {
  const { isConnected, connectWallet } = useWallet();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProjects: 0, totalContributors: 0, totalCommits: 0 });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const contract = getReadOnlyContract();
      
      // Get total projects count
      const totalProjects = await contract.getTotalProjects();
      
      // Get recent projects (last 12)
      const limit = Math.min(Number(totalProjects), 12);
      const offset = Math.max(0, Number(totalProjects) - limit);
      
      const projectIds = await contract.getAllProjects(offset, limit);
      
      // Load project details
      const projectsData = await Promise.all(
        projectIds.reverse().map(async (id) => {
          const data = await contract.getProject(id);
          return parseProject(id, data);
        })
      );

      setProjects(projectsData);
      
      // Calculate stats
      const totalContributors = projectsData.reduce((sum, p) => sum + p.contributorCount, 0);
      const totalCommits = projectsData.reduce((sum, p) => sum + p.commitCount, 0);
      
      setStats({
        totalProjects: Number(totalProjects),
        totalContributors,
        totalCommits,
      });
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-polygon-purple/20 text-polygon-light text-sm font-medium mb-6">
            <div className="w-2 h-2 rounded-full bg-green-500 pulse-green" />
            Powered by Polygon
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6">
            <span className="gradient-text">Prove</span> Your Contributions
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            GroupProof records your git commits on the blockchain.
            No more disputes over who did what in group projects.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isConnected ? (
              <motion.button
                onClick={() => connectWallet()}
                className="btn btn-primary text-lg px-8 py-3 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
                <FiArrowRight />
              </motion.button>
            ) : (
              <Link
                to="/create"
                className="btn btn-primary text-lg px-8 py-3 flex items-center gap-2"
              >
                <FiPlus />
                Create Project
              </Link>
            )}
            <a
              href="#how-it-works"
              className="btn btn-secondary text-lg px-8 py-3 flex items-center gap-2"
            >
              Learn More
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: FiFolder, value: stats.totalProjects, label: 'Projects', color: 'from-polygon-purple to-polygon-light' },
          { icon: FiUsers, value: stats.totalContributors, label: 'Contributors', color: 'from-blue-500 to-cyan-400' },
          { icon: FiGitCommit, value: stats.totalCommits, label: 'Commits Recorded', color: 'from-green-500 to-emerald-400' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="stat-card text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-3`}>
              <stat.icon className="text-2xl text-white" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
          How It <span className="gradient-text">Works</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: FiTerminal,
              title: 'Install CLI',
              description: 'Run our CLI in your project to set up git hooks. Takes 30 seconds.',
              code: 'npx groupproof-cli init'
            },
            {
              step: '02',
              icon: FiGitCommit,
              title: 'Make Commits',
              description: 'Work on your project normally. Every commit is automatically recorded on Polygon.',
              code: 'git commit -m "feat: add auth"'
            },
            {
              step: '03',
              icon: FiUsers,
              title: 'View Proof',
              description: 'Check the dashboard to see who contributed what. Immutable, transparent proof.',
              code: 'groupproof.vercel.app'
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              className="glass rounded-2xl p-6 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <span className="absolute top-4 right-4 text-6xl font-bold text-slate-800">
                {item.step}
              </span>
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-polygon-purple/20 flex items-center justify-center mb-4">
                  <item.icon className="text-2xl text-polygon-light" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 mb-4">{item.description}</p>
                <code className="hash block text-sm">{item.code}</code>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Projects</h2>
          {projects.length > 6 && (
            <Link to="/my-projects" className="text-polygon-light hover:underline flex items-center gap-1">
              View all <FiArrowRight />
            </Link>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </>
          ) : projects.length > 0 ? (
            projects.slice(0, 6).map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))
          ) : (
            <div className="col-span-full glass rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-slate-400 mb-6">Be the first to create a project on GroupProof!</p>
              <Link to="/create" className="btn btn-primary inline-flex items-center gap-2">
                <FiPlus />
                Create Project
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-bg rounded-3xl p-8 sm:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          Ready to prove your contributions?
        </h2>
        <p className="text-white/80 mb-8 max-w-xl mx-auto">
          Stop letting teammates take credit for your work. Start recording your contributions on the blockchain today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/create"
            className="btn bg-white text-polygon-purple font-semibold px-8 py-3 hover:bg-slate-100"
          >
            Create Free Project
          </Link>
          <a
            href="https://github.com/ishreyasrivastava/GroupProof"
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-white/20 text-white font-semibold px-8 py-3 hover:bg-white/30 flex items-center gap-2"
          >
            <FiGithub />
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
