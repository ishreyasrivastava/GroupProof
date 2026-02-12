import { ethers } from 'ethers';

// Contract address - will be set after deployment
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Default RPC for read-only operations
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://rpc-amoy.polygon.technology';

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

// Get read-only contract instance
export function getReadOnlyContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

// Get writable contract instance (requires signer)
export function getContract(signer) {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// Helper to format commit hash for display
export function formatHash(hash, length = 8) {
  if (!hash) return '';
  const cleaned = hash.startsWith('0x') ? hash.slice(2) : hash;
  return cleaned.substring(0, length);
}

// Helper to format address
export function formatAddress(address, length = 6) {
  if (!address) return '';
  return `${address.substring(0, length + 2)}...${address.substring(address.length - 4)}`;
}

// Helper to format timestamp
export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper to format relative time
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const time = Number(timestamp) * 1000;
  const diff = now - time;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return formatTimestamp(timestamp);
}

// Parse project from contract response
export function parseProject(projectId, data) {
  return {
    id: projectId,
    name: data[0],
    description: data[1],
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
    authorName: data.authorName,
    authorEmail: data.authorEmail,
    timestamp: Number(data.timestamp),
    gitTimestamp: Number(data.gitTimestamp),
    message: data.message,
    filesChanged: Number(data.filesChanged),
    additions: Number(data.additions),
    deletions: Number(data.deletions),
    repoName: data.repoName,
    branch: data.branch,
  };
}

// Parse contributor stats
export function parseStats(data) {
  return {
    totalCommits: Number(data.totalCommits),
    totalAdditions: Number(data.totalAdditions),
    totalDeletions: Number(data.totalDeletions),
    totalFilesChanged: Number(data.totalFilesChanged),
    firstContribution: Number(data.firstContribution),
    lastContribution: Number(data.lastContribution),
  };
}

// Get explorer URL for transaction
export function getExplorerUrl(txHash, type = 'tx') {
  const baseUrl = 'https://amoy.polygonscan.com';
  return `${baseUrl}/${type}/${txHash}`;
}

// Generate color from address (for avatars)
export function addressToColor(address) {
  if (!address) return '#8247E5';
  const colors = [
    '#8247E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
  ];
  const index = parseInt(address.slice(-4), 16) % colors.length;
  return colors[index];
}
