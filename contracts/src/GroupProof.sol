// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title GroupProof
 * @author Shreya Srivastava
 * @notice A blockchain-based contribution tracker for group projects
 * @dev Stores git commits on Polygon for transparent contribution proof
 */
contract GroupProof {
    
    // ============ Structs ============
    
    struct Commit {
        bytes32 commitHash;      // Git commit SHA
        address author;          // Wallet address of contributor
        string authorName;       // Git author name
        string authorEmail;      // Git author email
        uint256 timestamp;       // Block timestamp when recorded
        uint256 gitTimestamp;    // Original git commit timestamp
        string message;          // Commit message
        uint16 filesChanged;     // Number of files changed
        uint32 additions;        // Lines added
        uint32 deletions;        // Lines deleted
        string repoName;         // Repository name
        string branch;           // Branch name
    }
    
    struct Project {
        string name;
        string description;
        address owner;
        uint256 createdAt;
        bool isActive;
        address[] contributors;
        uint256 commitCount;
    }
    
    struct ContributorStats {
        uint256 totalCommits;
        uint256 totalAdditions;
        uint256 totalDeletions;
        uint256 totalFilesChanged;
        uint256 firstContribution;
        uint256 lastContribution;
    }
    
    // ============ State Variables ============
    
    mapping(bytes32 => Project) public projects;           // projectId => Project
    mapping(bytes32 => Commit[]) public projectCommits;    // projectId => Commits
    mapping(bytes32 => mapping(address => ContributorStats)) public contributorStats; // projectId => contributor => stats
    mapping(bytes32 => mapping(bytes32 => bool)) public commitExists; // projectId => commitHash => exists
    mapping(address => bytes32[]) public userProjects;     // user => projectIds
    
    bytes32[] public allProjects;
    
    // ============ Events ============
    
    event ProjectCreated(
        bytes32 indexed projectId,
        string name,
        address indexed owner,
        uint256 timestamp
    );
    
    event CommitRecorded(
        bytes32 indexed projectId,
        bytes32 indexed commitHash,
        address indexed author,
        string authorName,
        uint256 timestamp,
        uint16 filesChanged,
        uint32 additions,
        uint32 deletions
    );
    
    event ContributorAdded(
        bytes32 indexed projectId,
        address indexed contributor,
        uint256 timestamp
    );
    
    event ProjectDeactivated(
        bytes32 indexed projectId,
        uint256 timestamp
    );
    
    // ============ Modifiers ============
    
    modifier projectExists(bytes32 projectId) {
        require(projects[projectId].createdAt > 0, "Project does not exist");
        _;
    }
    
    modifier projectActive(bytes32 projectId) {
        require(projects[projectId].isActive, "Project is not active");
        _;
    }
    
    modifier onlyProjectOwner(bytes32 projectId) {
        require(projects[projectId].owner == msg.sender, "Not project owner");
        _;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Create a new project
     * @param name Project name
     * @param description Project description
     * @return projectId The unique identifier for the project
     */
    function createProject(
        string calldata name,
        string calldata description
    ) external returns (bytes32 projectId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(name).length <= 100, "Name too long");
        
        projectId = keccak256(abi.encodePacked(name, msg.sender, block.timestamp));
        
        require(projects[projectId].createdAt == 0, "Project ID collision");
        
        Project storage newProject = projects[projectId];
        newProject.name = name;
        newProject.description = description;
        newProject.owner = msg.sender;
        newProject.createdAt = block.timestamp;
        newProject.isActive = true;
        newProject.contributors.push(msg.sender);
        
        allProjects.push(projectId);
        userProjects[msg.sender].push(projectId);
        
        emit ProjectCreated(projectId, name, msg.sender, block.timestamp);
        emit ContributorAdded(projectId, msg.sender, block.timestamp);
        
        return projectId;
    }
    
    /**
     * @notice Record a git commit to the blockchain
     * @param projectId The project identifier
     * @param commitHash Git commit SHA as bytes32
     * @param authorName Git author name
     * @param authorEmail Git author email
     * @param gitTimestamp Original git commit timestamp
     * @param message Commit message
     * @param filesChanged Number of files changed
     * @param additions Lines added
     * @param deletions Lines deleted
     * @param repoName Repository name
     * @param branch Branch name
     */
    function recordCommit(
        bytes32 projectId,
        bytes32 commitHash,
        string calldata authorName,
        string calldata authorEmail,
        uint256 gitTimestamp,
        string calldata message,
        uint16 filesChanged,
        uint32 additions,
        uint32 deletions,
        string calldata repoName,
        string calldata branch
    ) external projectExists(projectId) projectActive(projectId) {
        require(!commitExists[projectId][commitHash], "Commit already recorded");
        require(bytes(authorName).length > 0, "Author name required");
        
        // Record commit
        Commit memory newCommit = Commit({
            commitHash: commitHash,
            author: msg.sender,
            authorName: authorName,
            authorEmail: authorEmail,
            timestamp: block.timestamp,
            gitTimestamp: gitTimestamp,
            message: message,
            filesChanged: filesChanged,
            additions: additions,
            deletions: deletions,
            repoName: repoName,
            branch: branch
        });
        
        projectCommits[projectId].push(newCommit);
        commitExists[projectId][commitHash] = true;
        projects[projectId].commitCount++;
        
        // Update contributor stats
        ContributorStats storage stats = contributorStats[projectId][msg.sender];
        if (stats.firstContribution == 0) {
            stats.firstContribution = block.timestamp;
            projects[projectId].contributors.push(msg.sender);
            userProjects[msg.sender].push(projectId);
            emit ContributorAdded(projectId, msg.sender, block.timestamp);
        }
        
        stats.totalCommits++;
        stats.totalAdditions += additions;
        stats.totalDeletions += deletions;
        stats.totalFilesChanged += filesChanged;
        stats.lastContribution = block.timestamp;
        
        emit CommitRecorded(
            projectId,
            commitHash,
            msg.sender,
            authorName,
            block.timestamp,
            filesChanged,
            additions,
            deletions
        );
    }
    
    /**
     * @notice Batch record multiple commits (gas efficient)
     * @dev Useful for initial sync of existing repository
     */
    function recordCommitsBatch(
        bytes32 projectId,
        bytes32[] calldata commitHashes,
        string[] calldata authorNames,
        string[] calldata authorEmails,
        uint256[] calldata gitTimestamps,
        string[] calldata messages,
        uint16[] calldata filesChangedArr,
        uint32[] calldata additionsArr,
        uint32[] calldata deletionsArr,
        string calldata repoName,
        string calldata branch
    ) external projectExists(projectId) projectActive(projectId) {
        uint256 len = commitHashes.length;
        require(len > 0 && len <= 50, "Invalid batch size");
        require(
            authorNames.length == len &&
            authorEmails.length == len &&
            gitTimestamps.length == len &&
            messages.length == len &&
            filesChangedArr.length == len &&
            additionsArr.length == len &&
            deletionsArr.length == len,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < len; i++) {
            if (commitExists[projectId][commitHashes[i]]) continue;
            
            Commit memory newCommit = Commit({
                commitHash: commitHashes[i],
                author: msg.sender,
                authorName: authorNames[i],
                authorEmail: authorEmails[i],
                timestamp: block.timestamp,
                gitTimestamp: gitTimestamps[i],
                message: messages[i],
                filesChanged: filesChangedArr[i],
                additions: additionsArr[i],
                deletions: deletionsArr[i],
                repoName: repoName,
                branch: branch
            });
            
            projectCommits[projectId].push(newCommit);
            commitExists[projectId][commitHashes[i]] = true;
            projects[projectId].commitCount++;
            
            // Update stats
            ContributorStats storage stats = contributorStats[projectId][msg.sender];
            if (stats.firstContribution == 0) {
                stats.firstContribution = block.timestamp;
                projects[projectId].contributors.push(msg.sender);
                userProjects[msg.sender].push(projectId);
            }
            stats.totalCommits++;
            stats.totalAdditions += additionsArr[i];
            stats.totalDeletions += deletionsArr[i];
            stats.totalFilesChanged += filesChangedArr[i];
            stats.lastContribution = block.timestamp;
        }
    }
    
    /**
     * @notice Deactivate a project (owner only)
     */
    function deactivateProject(bytes32 projectId) 
        external 
        projectExists(projectId) 
        onlyProjectOwner(projectId) 
    {
        projects[projectId].isActive = false;
        emit ProjectDeactivated(projectId, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get project details
     */
    function getProject(bytes32 projectId) external view returns (
        string memory name,
        string memory description,
        address owner,
        uint256 createdAt,
        bool isActive,
        uint256 contributorCount,
        uint256 commitCount
    ) {
        Project storage p = projects[projectId];
        return (
            p.name,
            p.description,
            p.owner,
            p.createdAt,
            p.isActive,
            p.contributors.length,
            p.commitCount
        );
    }
    
    /**
     * @notice Get all commits for a project with pagination
     */
    function getCommits(
        bytes32 projectId, 
        uint256 offset, 
        uint256 limit
    ) external view returns (Commit[] memory) {
        Commit[] storage commits = projectCommits[projectId];
        uint256 total = commits.length;
        
        if (offset >= total) {
            return new Commit[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 resultLength = end - offset;
        
        Commit[] memory result = new Commit[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = commits[total - 1 - offset - i]; // Newest first
        }
        
        return result;
    }
    
    /**
     * @notice Get contributor statistics
     */
    function getContributorStats(
        bytes32 projectId,
        address contributor
    ) external view returns (ContributorStats memory) {
        return contributorStats[projectId][contributor];
    }
    
    /**
     * @notice Get all contributors for a project
     */
    function getContributors(bytes32 projectId) external view returns (address[] memory) {
        return projects[projectId].contributors;
    }
    
    /**
     * @notice Get all projects for a user
     */
    function getUserProjects(address user) external view returns (bytes32[] memory) {
        return userProjects[user];
    }
    
    /**
     * @notice Get total number of projects
     */
    function getTotalProjects() external view returns (uint256) {
        return allProjects.length;
    }
    
    /**
     * @notice Get project IDs with pagination
     */
    function getAllProjects(
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        uint256 total = allProjects.length;
        
        if (offset >= total) {
            return new bytes32[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 resultLength = end - offset;
        
        bytes32[] memory result = new bytes32[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allProjects[offset + i];
        }
        
        return result;
    }
    
    /**
     * @notice Check if a commit exists
     */
    function isCommitRecorded(
        bytes32 projectId,
        bytes32 commitHash
    ) external view returns (bool) {
        return commitExists[projectId][commitHash];
    }
    
    /**
     * @notice Get commit count for a project
     */
    function getCommitCount(bytes32 projectId) external view returns (uint256) {
        return projectCommits[projectId].length;
    }
}
