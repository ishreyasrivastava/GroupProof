import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCheck, FiLoader, FiExternalLink, FiAlertTriangle } from 'react-icons/fi';
import { useWallet } from '../hooks/useWallet';
import { getContract, getExplorerUrl } from '../utils/contract';

export default function CreateProject() {
  const navigate = useNavigate();
  const { account, signer, isConnected, connectWallet, balance } = useWallet();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    if (formData.name.length > 100) {
      setError('Project name must be 100 characters or less');
      return;
    }

    if (parseFloat(balance) < 0.01) {
      setError('Insufficient MATIC balance. Get testnet tokens from faucet.polygon.technology');
      return;
    }

    setCreating(true);
    setError(null);
    setTxHash(null);

    try {
      const contract = getContract(signer);
      
      // Send transaction
      const tx = await contract.createProject(
        formData.name.trim(),
        formData.description.trim()
      );
      
      setTxHash(tx.hash);
      toast.loading('Waiting for confirmation...', { id: 'create' });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Get project ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'ProjectCreated';
        } catch { return false; }
      });
      
      const projectId = event ? contract.interface.parseLog(event).args[0] : null;
      
      toast.success('Project created successfully!', { id: 'create' });
      
      // Navigate to project page
      if (projectId) {
        navigate(`/project/${projectId}`);
      } else {
        navigate('/my-projects');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
      toast.error('Failed to create project', { id: 'create' });
    } finally {
      setCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-slate-400 mb-8">
            You need to connect your wallet to create a project on the blockchain.
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
    <div className="max-w-2xl mx-auto">
      {/* Back Link */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <FiArrowLeft />
        Back
      </Link>

      <motion.div
        className="glass rounded-2xl p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-slate-400 mb-8">
          Start tracking contributions for your group project on the blockchain.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Final Year Project"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-polygon-purple focus:ring-1 focus:ring-polygon-purple outline-none transition-colors"
              maxLength={100}
              disabled={creating}
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your project..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-polygon-purple focus:ring-1 focus:ring-polygon-purple outline-none transition-colors resize-none"
              disabled={creating}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <FiAlertTriangle className="text-xl flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
                {error.includes('Insufficient') && (
                  <a 
                    href="https://faucet.polygon.technology/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-polygon-light hover:underline flex items-center gap-1 mt-2"
                  >
                    Get free testnet MATIC <FiExternalLink />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {txHash && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <FiLoader className="text-xl text-blue-400 animate-spin" />
              <div>
                <p className="font-medium text-blue-400">Transaction Pending</p>
                <a 
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                >
                  View on PolygonScan <FiExternalLink />
                </a>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-sm text-slate-400">
              <strong className="text-white">Note:</strong> Creating a project requires a small amount of MATIC for gas fees. 
              Make sure you have testnet MATIC from{' '}
              <a 
                href="https://faucet.polygon.technology/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-polygon-light hover:underline"
              >
                faucet.polygon.technology
              </a>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={creating || !formData.name.trim()}
            className="w-full btn btn-primary py-4 text-lg flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <FiLoader className="animate-spin" />
                Creating Project...
              </>
            ) : (
              <>
                <FiCheck />
                Create Project
              </>
            )}
          </button>
        </form>

        {/* What's Next */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="font-semibold mb-4">After creating your project:</h3>
          <ol className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-polygon-purple/20 text-polygon-light flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>Install the CLI: <code className="hash">npm i -g groupproof-cli</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-polygon-purple/20 text-polygon-light flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>Initialize in your repo: <code className="hash">groupproof init</code></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-polygon-purple/20 text-polygon-light flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>Share <code className="hash">.groupproof.json</code> with your team</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-polygon-purple/20 text-polygon-light flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
              <span>Team members run <code className="hash">groupproof join</code> with their wallets</span>
            </li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}
