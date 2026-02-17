module.exports = [
  "function createProject(string name, string description) external returns (bytes32)",
  "function recordCommit(bytes32 projectId, bytes32 commitHash, string authorName, string authorEmail, uint256 gitTimestamp, string message, uint16 filesChanged, uint32 additions, uint32 deletions, string repoName, string branch) external",
  "function recordCommitsBatch(bytes32 projectId, bytes32[] commitHashes, string[] authorNames, string[] authorEmails, uint256[] gitTimestamps, string[] messages, uint16[] filesChangedArr, uint32[] additionsArr, uint32[] deletionsArr, string repoName, string branch) external",
  "function deactivateProject(bytes32 projectId) external",
  "function getProject(bytes32 projectId) external view returns (string name, string description, address owner, uint256 createdAt, bool isActive, uint256 contributorCount, uint256 commitCount)",
  "function getCommits(bytes32 projectId, uint256 offset, uint256 limit) external view returns (tuple(bytes32 commitHash, address author, string authorName, string authorEmail, uint256 timestamp, uint256 gitTimestamp, string message, uint16 filesChanged, uint32 additions, uint32 deletions, string repoName, string branch)[])",
  "function getContributorStats(bytes32 projectId, address contributor) external view returns (tuple(uint256 totalCommits, uint256 totalAdditions, uint256 totalDeletions, uint256 totalFilesChanged, uint256 firstContribution, uint256 lastContribution))",
  "function getContributors(bytes32 projectId) external view returns (address[])",
  "function getUserProjects(address user) external view returns (bytes32[])",
  "function getTotalProjects() external view returns (uint256)",
  "function getAllProjects(uint256 offset, uint256 limit) external view returns (bytes32[])",
  "function isCommitRecorded(bytes32 projectId, bytes32 commitHash) external view returns (bool)",
  "function getCommitCount(bytes32 projectId) external view returns (uint256)",
  "event ProjectCreated(bytes32 indexed projectId, string name, address indexed owner, uint256 timestamp)",
  "event CommitRecorded(bytes32 indexed projectId, bytes32 indexed commitHash, address indexed author, string authorName, uint256 timestamp, uint16 filesChanged, uint32 additions, uint32 deletions)",
  "event ContributorAdded(bytes32 indexed projectId, address indexed contributor, uint256 timestamp)",
  "event ProjectDeactivated(bytes32 indexed projectId, uint256 timestamp)"
];
