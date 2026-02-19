import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../hooks/useWallet';
import { formatAddress } from '../utils/contract';
import { 
  FiGitCommit, 
  FiPlus, 
  FiFolder, 
  FiHome, 
  FiExternalLink, 
  FiChevronDown,
  FiLogOut,
  FiAlertTriangle,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiMenu,
  FiX,
} from 'react-icons/fi';

export default function Header() {
  const { 
    account, 
    balance, 
    isConnecting, 
    isConnected, 
    isWrongNetwork,
    isLowBalance,
    isMetaMaskInstalled,
    connectWallet, 
    disconnect,
    switchToAmoy,
    getExplorerUrl,
    networkConfig,
  } = useWallet();
  
  const location = useLocation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const navItems = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/my-projects', icon: FiFolder, label: 'My Projects' },
    { path: '/create', icon: FiPlus, label: 'Create' },
  ];

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-polygon-purple flex items-center justify-center">
                <FiGitCommit className="text-white text-lg" />
              </div>
              <span className="font-semibold text-lg hidden sm:block text-white">
                GroupProof
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="text-base" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Wallet Section */}
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-zinc-400 hover:text-white"
              >
                {showMobileMenu ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>

              {/* Wallet */}
              {!isMetaMaskInstalled ? (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-md"
                >
                  <FiExternalLink className="text-sm" />
                  <span className="hidden sm:inline">Install MetaMask</span>
                  <span className="sm:hidden">MetaMask</span>
                </a>
              ) : isConnected ? (
                <div className="relative">
                  {/* Wrong network warning */}
                  {isWrongNetwork && (
                    <motion.button
                      onClick={switchToAmoy}
                      className="mr-3 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium flex items-center gap-2 hover:bg-amber-500/20 transition-colors"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <FiAlertTriangle className="text-xs" />
                      <span className="hidden sm:inline">Wrong Network</span>
                      <span className="sm:hidden">Switch</span>
                    </motion.button>
                  )}

                  {/* Balance indicator */}
                  {!isWrongNetwork && (
                    <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg mr-3 ${
                      isLowBalance 
                        ? 'bg-amber-500/10 border border-amber-500/20' 
                        : 'bg-white/5 border border-white/10'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        isLowBalance ? 'bg-amber-500' : 'bg-emerald-500 pulse-dot'
                      }`} />
                      <span className={`text-sm ${isLowBalance ? 'text-amber-400' : 'text-zinc-300'}`}>
                        {parseFloat(balance || 0).toFixed(4)} MATIC
                      </span>
                    </div>
                  )}

                  {/* Account button */}
                  <motion.button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ background: `linear-gradient(135deg, #8247e5, #ec4899)` }}
                    />
                    <span className="text-sm font-mono text-zinc-300">{formatAddress(account)}</span>
                    <FiChevronDown className={`text-zinc-500 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Account dropdown */}
                  <AnimatePresence>
                    {showAccountMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowAccountMenu(false)}
                        />
                        <motion.div
                          className="absolute right-0 top-full mt-2 w-72 glass-elevated rounded-xl overflow-hidden z-50"
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                        >
                          {/* Account info */}
                          <div className="p-4 border-b border-white/10">
                            <div className="flex items-center gap-3 mb-3">
                              <div 
                                className="w-10 h-10 rounded-full"
                                style={{ background: `linear-gradient(135deg, #8247e5, #ec4899)` }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-mono text-zinc-300 truncate">{account}</p>
                                <p className="text-xs text-zinc-500">
                                  {networkConfig.name}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={copyAddress}
                                className="flex-1 btn btn-sm bg-white/5 hover:bg-white/10 text-zinc-300 justify-center"
                              >
                                {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                                <span>{copied ? 'Copied!' : 'Copy'}</span>
                              </button>
                              <a
                                href={getExplorerUrl(account, 'address')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 btn btn-sm bg-white/5 hover:bg-white/10 text-zinc-300 justify-center"
                              >
                                <FiExternalLink />
                                <span>Explorer</span>
                              </a>
                            </div>
                          </div>

                          {/* Balance */}
                          <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-zinc-500">Balance</span>
                              <span className={`text-sm font-medium ${isLowBalance ? 'text-amber-400' : 'text-white'}`}>
                                {parseFloat(balance || 0).toFixed(4)} MATIC
                              </span>
                            </div>
                            {isLowBalance && (
                              <a
                                href="https://faucet.polygon.technology/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                              >
                                <FiExternalLink className="text-[10px]" />
                                Get free testnet MATIC
                              </a>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="p-2">
                            {isWrongNetwork && (
                              <button
                                onClick={() => {
                                  switchToAmoy();
                                  setShowAccountMenu(false);
                                }}
                                className="w-full px-3 py-2 rounded-lg text-left text-sm text-amber-400 hover:bg-amber-500/10 flex items-center gap-2"
                              >
                                <FiRefreshCw />
                                Switch to Polygon Amoy
                              </button>
                            )}
                            <button
                              onClick={() => {
                                disconnect();
                                setShowAccountMenu(false);
                              }}
                              className="w-full px-3 py-2 rounded-lg text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <FiLogOut />
                              Disconnect
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  onClick={() => connectWallet()}
                  disabled={isConnecting}
                  className="btn btn-primary btn-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isConnecting ? (
                    <>
                      <div className="spinner" />
                      <span className="hidden sm:inline">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <FiExternalLink className="text-sm" />
                      <span>Connect</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            className="md:hidden fixed inset-x-0 top-16 z-40 glass border-b border-white/5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="text-lg" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
