import { ethers } from 'ethers';

// Contract address - MUST be configured
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 80002,
  name: 'Polygon Amoy',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://rpc-amoy.polygon.technology',
  blockExplorer: 'https://amoy.polygonscan.com',
};

// Full contract ABI
export const CONTRACT_ABI = [
  // State-changing functions
  "function createProject(string calldata name, string calldata description) external returns (bytes32 projectId)",
  "function recordCommit(bytes32 projectId, bytes32 commitHash, string calldata authorName, string calldata authorEmail, uint256 gitTimestamp, string calldata message, uint16 filesChanged, uint32 additions, uint32 deletions, string calldata repoName, string calldata branch) external",
  "function deactivateProject(bytes32 projectId) external",
  
  // View functions
  "function getProject(bytes32 projectId) external view returns (string memory name, string memory description, address owner, uint256 createdAt, bool isActive, uint256 contributorCount, uint256 commitCount)",
  "function getCommits(bytes32 projectId, uint256 offset, uint256 limit) external view returns (tuple(bytes32 commitHash, address author, string authorName, string authorEmail, uint256 timestamp, uint256 gitTimestamp, string message, uint16 filesChanged, uint32 additions, uint32 deletions, string repoName, string branch)[] memory)",
  "function getContributorStats(bytes32 projectId, address contributor) external view returns (tuple(uint256 totalCommits, uint256 totalAdditions, uint256 totalDeletions, uint256 totalFilesChanged, uint256 firstContribution, uint256 lastContribution) memory)",
  "function getContributors(bytes32 projectId) external view returns (address[] memory)",
  "function getUserProjects(address user) external view returns (bytes32[] memory)",
  "function getTotalProjects() external view returns (uint256)",
  "function getAllProjects(uint256 offset, uint256 limit) external view returns (bytes32[] memory)",
  "function isCommitRecorded(bytes32 projectId, bytes32 commitHash) external view returns (bool)",
  "function getCommitCount(bytes32 projectId) external view returns (uint256)",
  
  // Events
  "event ProjectCreated(bytes32 indexed projectId, string name, address indexed owner, uint256 timestamp)",
  "event CommitRecorded(bytes32 indexed projectId, bytes32 indexed commitHash, address indexed author, string authorName, uint256 timestamp, uint16 filesChanged, uint32 additions, uint32 deletions)",
  "event ContributorAdded(bytes32 indexed projectId, address indexed contributor, uint256 timestamp)",
];

// Validation
export function isContractConfigured() {
  return CONTRACT_ADDRESS && CONTRACT_ADDRESS.length === 42 && CONTRACT_ADDRESS.startsWith('0x');
}

// Create read-only provider with retry logic
let cachedProvider = null;
let providerLastCreated = 0;
const PROVIDER_CACHE_TTL = 60000; // 1 minute

export function getProvider() {
  const now = Date.now();
  if (cachedProvider && now - providerLastCreated < PROVIDER_CACHE_TTL) {
    return cachedProvider;
  }
  
  cachedProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl, {
    chainId: NETWORK_CONFIG.chainId,
    name: NETWORK_CONFIG.name,
  });
  providerLastCreated = now;
  
  return cachedProvider;
}

// Get read-only contract instance
export function getReadOnlyContract() {
  if (!isContractConfigured()) {
    throw new ContractError('Contract address not configured', 'CONFIG_MISSING');
  }
  
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Get writable contract instance
export function getContract(signer) {
  if (!isContractConfigured()) {
    throw new ContractError('Contract address not configured', 'CONFIG_MISSING');
  }
  
  if (!signer) {
    throw new ContractError('Signer is required for write operations', 'SIGNER_REQUIRED');
  }
  
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// Custom error class
export class ContractError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.originalError = originalError;
  }
}

// Parse contract errors into user-friendly messages
export function parseContractError(error) {
  const message = error?.message || error?.toString() || 'Unknown error';
  
  // User rejected
  if (error?.code === 'ACTION_REJECTED' || error?.code === 4001) {
    return { message: 'Transaction was cancelled', code: 'USER_REJECTED', recoverable: true };
  }
  
  // Insufficient funds
  if (error?.code === 'INSUFFICIENT_FUNDS' || message.includes('insufficient funds')) {
    return { 
      message: 'Insufficient MATIC for gas fees', 
      code: 'INSUFFICIENT_FUNDS',
      recoverable: true,
      action: 'Get free testnet MATIC from the faucet',
    };
  }
  
  // Network errors
  if (error?.code === 'NETWORK_ERROR' || message.includes('network')) {
    return { 
      message: 'Network error. Please check your connection and try again.', 
      code: 'NETWORK_ERROR',
      recoverable: true,
    };
  }
  
  // Nonce issues
  if (error?.code === 'NONCE_EXPIRED' || message.includes('nonce')) {
    return { 
      message: 'Transaction expired. Please try again.', 
      code: 'NONCE_ERROR',
      recoverable: true,
    };
  }
  
  // Gas estimation failed
  if (message.includes('cannot estimate gas') || message.includes('execution reverted')) {
    // Try to parse revert reason
    const revertMatch = message.match(/reason="([^"]+)"/);
    const reason = revertMatch ? revertMatch[1] : 'Transaction would fail';
    return { 
      message: reason, 
      code: 'GAS_ESTIMATION_FAILED',
      recoverable: false,
    };
  }
  
  // Contract-specific errors
  if (message.includes('Project does not exist')) {
    return { message: 'Project not found', code: 'PROJECT_NOT_FOUND', recoverable: false };
  }
  
  if (message.includes('Project is not active')) {
    return { message: 'This project has been deactivated', code: 'PROJECT_INACTIVE', recoverable: false };
  }
  
  if (message.includes('Commit already recorded')) {
    return { message: 'This commit has already been recorded', code: 'COMMIT_EXISTS', recoverable: false };
  }
  
  if (message.includes('Not project owner')) {
    return { message: 'Only the project owner can perform this action', code: 'NOT_OWNER', recoverable: false };
  }
  
  if (message.includes('Name cannot be empty')) {
    return { message: 'Project name is required', code: 'VALIDATION_ERROR', recoverable: true };
  }
  
  if (message.includes('Name too long')) {
    return { message: 'Project name must be 100 characters or less', code: 'VALIDATION_ERROR', recoverable: true };
  }
  
  // Generic fallback
  return { 
    message: 'Something went wrong. Please try again.', 
    code: 'UNKNOWN_ERROR',
    recoverable: true,
    details: message.substring(0, 200),
  };
}

// Retry wrapper for read operations
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error?.code === 'CONFIG_MISSING' || error?.code === 'SIGNER_REQUIRED') {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

// ========================================
// FORMATTING UTILITIES
// ========================================

// Format hash for display
export function formatHash(hash, length = 8) {
  if (!hash) return '';
  const cleaned = hash.startsWith('0x') ? hash.slice(2) : hash;
  return cleaned.substring(0, length).toLowerCase();
}

// Format full hash (remove trailing zeros for commit hashes)
export function formatCommitHash(hash) {
  if (!hash) return '';
  const cleaned = hash.startsWith('0x') ? hash.slice(2) : hash;
  // Remove trailing zeros (git hashes are 40 chars, padded to 64)
  return cleaned.replace(/0+$/, '').substring(0, 40);
}

// Format address
export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '';
  return `${address.substring(0, startChars + 2)}...${address.substring(address.length - endChars)}`;
}

// Format timestamp to date string
export function formatTimestamp(timestamp, options = {}) {
  if (!timestamp) return '';
  
  const date = new Date(Number(timestamp) * 1000);
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

// Format relative time
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  
  const now = Date.now();
  const time = Number(timestamp) * 1000;
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);
  const months = Math.floor(diff / 2592000000);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  
  return formatTimestamp(timestamp, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format number with commas
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString();
}

// Format lines of code
export function formatLinesChanged(additions, deletions) {
  const parts = [];
  if (additions > 0) parts.push(`+${formatNumber(additions)}`);
  if (deletions > 0) parts.push(`-${formatNumber(deletions)}`);
  return parts.join(' / ') || '0 changes';
}

// ========================================
// DATA PARSING
// ========================================

// Parse project from contract response
export function parseProject(projectId, data) {
  return {
    id: projectId,
    name: data[0] || 'Unnamed Project',
    description: data[1] || '',
    owner: data[2],
    createdAt: Number(data[3]),
    isActive: data[4],
    contributorCount: Number(data[5]),
    commitCount: Number(data[6]),
  };
}

// Parse commit from contract response
export function parseCommit(data) {
  return {
    commitHash: data.commitHash,
    author: data.author,
    authorName: data.authorName || 'Unknown',
    authorEmail: data.authorEmail || '',
    timestamp: Number(data.timestamp),
    gitTimestamp: Number(data.gitTimestamp),
    message: data.message || 'No message',
    filesChanged: Number(data.filesChanged),
    additions: Number(data.additions),
    deletions: Number(data.deletions),
    repoName: data.repoName || '',
    branch: data.branch || 'main',
  };
}

// Parse contributor stats
export function parseStats(data) {
  return {
    totalCommits: Number(data.totalCommits || data[0] || 0),
    totalAdditions: Number(data.totalAdditions || data[1] || 0),
    totalDeletions: Number(data.totalDeletions || data[2] || 0),
    totalFilesChanged: Number(data.totalFilesChanged || data[3] || 0),
    firstContribution: Number(data.firstContribution || data[4] || 0),
    lastContribution: Number(data.lastContribution || data[5] || 0),
  };
}

// ========================================
// URL UTILITIES
// ========================================

// Get explorer URL for transaction
export function getExplorerTxUrl(txHash) {
  return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
}

// Get explorer URL for address
export function getExplorerAddressUrl(address) {
  return `${NETWORK_CONFIG.blockExplorer}/address/${address}`;
}

// Get explorer URL for contract
export function getContractExplorerUrl() {
  if (!isContractConfigured()) return null;
  return `${NETWORK_CONFIG.blockExplorer}/address/${CONTRACT_ADDRESS}`;
}

// ========================================
// COLOR UTILITIES
// ========================================

// Generate consistent color from address
export function addressToColor(address) {
  if (!address) return '#8247e5';
  
  const colors = [
    '#8247e5', // purple
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#3b82f6', // blue
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
    '#06b6d4', // cyan
    '#a855f7', // violet
  ];
  
  const index = parseInt(address.slice(-6), 16) % colors.length;
  return colors[index];
}

// Get initials from name or address
export function getInitials(name, address) {
  if (name && name.length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  if (address) {
    return address.substring(2, 4).toUpperCase();
  }
  
  return '??';
}

// ========================================
// VALIDATION
// ========================================

// Validate project name
export function validateProjectName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Project name must be 100 characters or less' };
  }
  return { valid: true };
}

// Validate Ethereum address
export function isValidAddress(address) {
  return address && /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Validate project ID (bytes32)
export function isValidProjectId(projectId) {
  return projectId && /^0x[a-fA-F0-9]{64}$/.test(projectId);
}
