import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FiGitCommit, FiPlus, FiMinus, FiFile, FiClock } from 'react-icons/fi';
import { formatAddress, formatRelativeTime, addressToColor, getReadOnlyContract, parseStats } from '../utils/contract';

export default function ContributorStats({ projectId, contributors }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contributors && contributors.length > 0) {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [contributors, projectId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const contract = getReadOnlyContract();
      const statsMap = {};
      
      await Promise.all(
        contributors.map(async (address) => {
          try {
            const data = await contract.getContributorStats(projectId, address);
            statsMap[address] = parseStats(data);
          } catch (err) {
            console.error('Error loading stats for', address, err);
          }
        })
      );
      
      setStats(statsMap);
    } catch (err) {
      console.error('Error loading contributor stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="skeleton h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="skeleton h-4 w-24 mb-1" />
                <div className="skeleton h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!contributors || contributors.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <div className="text-4xl mb-2">👥</div>
        <p className="text-slate-400">No contributors yet</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = contributors
    .filter(addr => stats[addr]?.totalCommits > 0)
    .map(addr => ({
      name: formatAddress(addr, 4),
      address: addr,
      value: stats[addr]?.totalCommits || 0,
      color: addressToColor(addr),
    }))
    .sort((a, b) => b.value - a.value);

  const totalCommits = chartData.reduce((sum, item) => sum + item.value, 0);
  const totalAdditions = Object.values(stats).reduce((sum, s) => sum + (s.totalAdditions || 0), 0);
  const totalDeletions = Object.values(stats).reduce((sum, s) => sum + (s.totalDeletions || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard 
          icon={FiGitCommit}
          value={totalCommits}
          label="Total Commits"
          color="text-polygon-light"
        />
        <StatCard 
          icon={() => <span className="text-lg">👥</span>}
          value={contributors.length}
          label="Contributors"
          color="text-blue-400"
        />
        <StatCard 
          icon={FiPlus}
          value={totalAdditions.toLocaleString()}
          label="Additions"
          color="text-green-400"
        />
        <StatCard 
          icon={FiMinus}
          value={totalDeletions.toLocaleString()}
          label="Deletions"
          color="text-red-400"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart */}
        {chartData.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Contribution Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = ((data.value / totalCommits) * 100).toFixed(1);
                        return (
                          <div className="glass rounded-lg p-3 text-sm">
                            <p className="font-mono text-slate-300">{data.address}</p>
                            <p className="text-white font-bold">{data.value} commits ({percentage}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Leaderboard</h3>
          <div className="space-y-3">
            {chartData.map((item, index) => {
              const contributorStats = stats[item.address] || {};
              const percentage = ((item.value / totalCommits) * 100).toFixed(1);
              
              return (
                <motion.div
                  key={item.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-amber-600/20 text-amber-500' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.address.substring(2, 4).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-slate-300 truncate">{item.address}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FiGitCommit />
                        {item.value}
                      </span>
                      <span className="flex items-center gap-1 text-green-400">
                        <FiPlus />
                        {contributorStats.totalAdditions || 0}
                      </span>
                      <span className="flex items-center gap-1 text-red-400">
                        <FiMinus />
                        {contributorStats.totalDeletions || 0}
                      </span>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="text-right">
                    <span className="text-lg font-bold text-white">{percentage}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <motion.div
      className="stat-card text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className={`flex items-center justify-center gap-2 mb-2 ${color}`}>
        <Icon />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </motion.div>
  );
}
