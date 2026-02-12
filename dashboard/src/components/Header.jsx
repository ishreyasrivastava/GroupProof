import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../utils/contract';
import { FiGitCommit, FiPlus, FiFolder, FiHome, FiExternalLink } from 'react-icons/fi';

export default function Header() {
  const { account, balance, isConnecting, isConnected, connectWallet, disconnect } = useWallet();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/my-projects', icon: FiFolder, label: 'My Projects' },
    { path: '/create', icon: FiPlus, label: 'Create' },
  ];

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-polygon-purple to-polygon-light flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiGitCommit className="text-white text-xl" />
            </motion.div>
            <span className="font-bold text-xl hidden sm:block">
              <span className="gradient-text">Group</span>Proof
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-polygon-purple/20 text-polygon-light'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3">
                {/* Balance */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 pulse-green" />
                  <span className="text-sm text-slate-300">
                    {parseFloat(balance || 0).toFixed(4)} MATIC
                  </span>
                </div>

                {/* Account */}
                <motion.button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ background: `linear-gradient(135deg, #8247E5, #38bdf8)` }}
                  />
                  <span className="text-sm font-mono">{formatAddress(account)}</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={() => connectWallet()}
                disabled={isConnecting}
                className="btn btn-primary flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <FiExternalLink />
                    <span>Connect Wallet</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-slate-800/50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 ${
                  isActive ? 'text-polygon-light' : 'text-slate-500'
                }`}
              >
                <Icon className="text-lg" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
