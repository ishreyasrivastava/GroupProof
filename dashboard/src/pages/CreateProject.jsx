import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FiArrowLeft, 
  FiCheck, 
  FiLoader, 
  FiExternalLink, 
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo,
  FiCopy,
  FiTerminal,
  FiUsers,
  FiGitBranch,
  FiShield,
} from 'react-icons/fi';
import { useWallet, useTransaction } from '../hooks/useWallet';
import { 
  getContract, 
  validateProjectName, 
  parseContractError,
  getExplorerTxUrl,
  isContractConfigured,
} from '../utils/contract';

// Transaction states UI
const TxStateDisplay = ({ status, hash, error, confirmations }) => {
  if (status === 'idle') return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`rounded-xl p-4 ${
          status === 'pending' ? 'tx-pending' :
          status === 'confirming' ? 'tx-pending' :
          status === 'success' ? 'tx-success' :
          'tx-error'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${
            status === 'pending' || status === 'confirming' ? 'bg-amber-500/20' :
            status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            {(status === 'pending' || status === 'confirming') && (
              <FiLoader className="text-amber-400 animate-spin" />
            )}
            {status === 'success' && <FiCheck className="text-emerald-400" />}
            {status === 'error' && <FiAlertCircle className="text-red-400" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${
              status === 'pending' || status === 'confirming' ? 'text-amber-300' :
              status === 'success' ? 'text-emerald-300' : 'text-red-300'
            }`}>
              {status === 'pending' && 'Waiting for signature...'}
              {status === 'confirming' && 'Confirming transaction...'}
              {status === 'success' && 'Project created successfully!'}
              {status === 'error' && 'Transaction failed'}
            </p>
            
            {hash && (
              <a
                href={getExplorerTxUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-white flex items-center gap-1 mt-1"
              >
                View on PolygonScan
                <FiExternalLink className="text-xs" />
              </a>
            )}
            
            {error && (
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function CreateProject() {
  const navigate = useNavigate();
  const { 
    account, 
    signer, 
    isConnected, 
    isWrongNetwork,
    isLowBalance,
    balance,
    connectWallet,
    switchToAmoy,
    isMetaMaskInstalled,
  } = useWallet();
  
  const tx = useTransaction();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate on input change
  useEffect(() => {
    if (formData.name) {
      const validation = validateProjectName(formData.name);
      setValidationError(validation.valid ? null : validation.error);
    } else {
      setValidationError(null);
    }
  }, [formData.name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validation = validateProjectName(formData.name);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    setIsSubmitting(true);
    tx.resetTx();

    try {
      const contract = getContract(signer);
      
      // Create the transaction
      const txPromise = contract.createProject(
        formData.name.trim(),
        formData.description.trim()
      );

      const receipt = await tx.sendTransaction(txPromise, {
        confirmations: 1,
        onSubmit: () => {
          // Transaction submitted
        },
        onConfirm: (receipt) => {
          // Find project ID from event
          const event = receipt.logs.find(log => {
            try {
              const parsed = contract.interface.parseLog(log);
              return parsed.name === 'ProjectCreated';
            } catch { return false; }
          });
          
          const projectId = event ? contract.interface.parseLog(event).args[0] : null;
          
          if (projectId) {
            // Small delay then navigate
            setTimeout(() => {
              navigate(`/project/${projectId}`);
            }, 1500);
          } else {
            navigate('/my-projects');
          }
        },
        onError: (err) => {
          const parsed = parseContractError(err);
          console.error('Create project error:', parsed);
        },
      });

    } catch (err) {
      const parsed = parseContractError(err);
      toast.error(parsed.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not connected state
  if (!isMetaMaskInstalled) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <FiArrowLeft />
          Back
        </Link>
        
        <motion.div 
          className="card text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="text-3xl text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">MetaMask Required</h1>
          <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
            You need MetaMask to create projects on GroupProof. It's free and takes a minute to set up.
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-md"
          >
            <FiExternalLink />
            Install MetaMask
          </a>
        </motion.div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <FiArrowLeft />
          Back
        </Link>
        
        <motion.div 
          className="card text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-polygon-purple/10 flex items-center justify-center mx-auto mb-4">
            <FiShield className="text-3xl text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Connect Your Wallet</h1>
          <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
            Connect your wallet to create a project on the Polygon blockchain.
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

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Back Link */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <FiArrowLeft />
        Back
      </Link>

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-2">Create New Project</h1>
        <p className="text-zinc-400 mb-8">
          Start tracking contributions for your group project on the blockchain.
        </p>

        {/* Network warning */}
        {isWrongNetwork && (
          <div className="warning-banner mb-6">
            <FiAlertTriangle className="text-xl flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Wrong Network</p>
              <p className="text-sm opacity-80">Please switch to Polygon Amoy testnet</p>
            </div>
            <button onClick={switchToAmoy} className="btn btn-sm bg-amber-500/20 hover:bg-amber-500/30">
              Switch Network
            </button>
          </div>
        )}

        {/* Low balance warning */}
        {isLowBalance && !isWrongNetwork && (
          <div className="warning-banner mb-6">
            <FiAlertTriangle className="text-xl flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Low Balance</p>
              <p className="text-sm opacity-80">
                You have {parseFloat(balance).toFixed(4)} MATIC. You may need more for gas fees.
              </p>
            </div>
            <a 
              href="https://faucet.polygon.technology/" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm bg-amber-500/20 hover:bg-amber-500/30"
            >
              Get MATIC
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Final Year Project"
              className={`input ${validationError ? 'input-error' : ''}`}
              maxLength={100}
              disabled={isSubmitting || tx.isPending || tx.isConfirming}
              autoFocus
            />
            <div className="flex justify-between mt-1.5">
              {validationError ? (
                <p className="text-xs text-red-400">{validationError}</p>
              ) : (
                <p className="text-xs text-zinc-500">Choose a descriptive name</p>
              )}
              <p className={`text-xs ${formData.name.length > 90 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {formData.name.length}/100
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your project..."
              rows={3}
              className="input resize-none"
              disabled={isSubmitting || tx.isPending || tx.isConfirming}
            />
          </div>

          {/* Transaction state display */}
          <TxStateDisplay {...tx} />

          {/* Info box */}
          {!tx.isPending && !tx.isConfirming && !tx.isSuccess && (
            <div className="info-banner">
              <FiInfo className="text-xl flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Creating a project on the blockchain</p>
                <p className="opacity-80">
                  This will deploy your project to Polygon Amoy testnet. 
                  You'll need to confirm the transaction in MetaMask. 
                  Gas fees are minimal (~0.001 MATIC).
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              !formData.name.trim() || 
              validationError || 
              isSubmitting || 
              tx.isPending || 
              tx.isConfirming ||
              tx.isSuccess ||
              isWrongNetwork
            }
            className="w-full btn btn-primary btn-lg justify-center"
          >
            {tx.isPending || tx.isConfirming ? (
              <>
                <FiLoader className="animate-spin" />
                {tx.isPending ? 'Waiting for signature...' : 'Confirming...'}
              </>
            ) : tx.isSuccess ? (
              <>
                <FiCheck />
                Project Created!
              </>
            ) : (
              <>
                <FiCheck />
                Create Project
              </>
            )}
          </button>
        </form>

        {/* Next Steps */}
        {!tx.isSuccess && (
          <div className="mt-10 pt-8 border-t border-white/10">
            <h3 className="font-semibold text-zinc-300 mb-4">After creating your project:</h3>
            <div className="space-y-4">
              {[
                { icon: FiTerminal, text: 'Install the CLI', code: 'npm i -g groupproof-cli' },
                { icon: FiGitBranch, text: 'Initialize in your repo', code: 'groupproof init' },
                { icon: FiCopy, text: 'Share config with team', code: '.groupproof.json' },
                { icon: FiUsers, text: 'Team members join', code: 'groupproof join' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-polygon-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-purple-400">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">{step.text}</p>
                    <code className="text-xs text-purple-300 bg-polygon-purple/10 px-2 py-0.5 rounded mt-1 inline-block">
                      {step.code}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
