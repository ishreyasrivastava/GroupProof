#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const ora = require('ora');
const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABI (minimal for our needs)
const CONTRACT_ABI = [
  "function recordCommit(bytes32 projectId, bytes32 commitHash, string authorName, string authorEmail, uint256 gitTimestamp, string message, uint16 filesChanged, uint32 additions, uint32 deletions, string repoName, string branch) external",
  "function createProject(string name, string description) external returns (bytes32)",
  "function isCommitRecorded(bytes32 projectId, bytes32 commitHash) external view returns (bool)",
  "function getProject(bytes32 projectId) external view returns (string name, string description, address owner, uint256 createdAt, bool isActive, uint256 contributorCount, uint256 commitCount)",
  "event ProjectCreated(bytes32 indexed projectId, string name, address indexed owner, uint256 timestamp)",
  "event CommitRecorded(bytes32 indexed projectId, bytes32 indexed commitHash, address indexed author, string authorName, uint256 timestamp, uint16 filesChanged, uint32 additions, uint32 deletions)"
];

const CONFIG_FILE = '.groupproof.json';
const DEFAULT_RPC = 'https://rpc-amoy.polygon.technology';
const DEFAULT_CONTRACT = process.env.GROUPPROOF_CONTRACT || '';

program
  .name('groupproof')
  .description('Record git commits to blockchain for transparent contribution tracking')
  .version('1.0.0');

// Init command
program
  .command('init')
  .description('Initialize GroupProof in current repository')
  .action(async () => {
    console.log(chalk.cyan('\n🔗 GroupProof Initialization\n'));
    
    // Check if we're in a git repo
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch {
      console.log(chalk.red('❌ Not a git repository. Please run this in a git project.'));
      process.exit(1);
    }
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: path.basename(process.cwd())
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'A collaborative project tracked with GroupProof'
      },
      {
        type: 'input',
        name: 'rpcUrl',
        message: 'Polygon RPC URL:',
        default: DEFAULT_RPC
      },
      {
        type: 'input',
        name: 'contractAddress',
        message: 'GroupProof contract address:',
        default: DEFAULT_CONTRACT
      },
      {
        type: 'password',
        name: 'privateKey',
        message: 'Your wallet private key (stored locally, never shared):',
        validate: (input) => {
          if (!input || input.length < 64) {
            return 'Please enter a valid private key';
          }
          return true;
        }
      }
    ]);
    
    // Create project on blockchain
    const spinner = ora('Creating project on blockchain...').start();
    
    try {
      const provider = new ethers.JsonRpcProvider(answers.rpcUrl);
      const wallet = new ethers.Wallet(answers.privateKey, provider);
      const contract = new ethers.Contract(answers.contractAddress, CONTRACT_ABI, wallet);
      
      const tx = await contract.createProject(answers.projectName, answers.description);
      spinner.text = 'Waiting for confirmation...';
      const receipt = await tx.wait();
      
      // Get project ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'ProjectCreated';
        } catch { return false; }
      });
      
      const projectId = event ? contract.interface.parseLog(event).args[0] : null;
      
      if (!projectId) {
        throw new Error('Could not get project ID from transaction');
      }
      
      // Save config (without private key in repo)
      const config = {
        projectId: projectId,
        projectName: answers.projectName,
        contractAddress: answers.contractAddress,
        rpcUrl: answers.rpcUrl,
        createdAt: new Date().toISOString(),
        walletAddress: wallet.address
      };
      
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      
      // Save private key to .env (gitignored)
      const envContent = `GROUPPROOF_PRIVATE_KEY=${answers.privateKey}\n`;
      fs.appendFileSync('.env', envContent);
      
      // Add .env to gitignore if not present
      const gitignorePath = '.gitignore';
      let gitignore = '';
      if (fs.existsSync(gitignorePath)) {
        gitignore = fs.readFileSync(gitignorePath, 'utf8');
      }
      if (!gitignore.includes('.env')) {
        fs.appendFileSync(gitignorePath, '\n.env\n');
      }
      
      spinner.succeed(chalk.green('Project created successfully!'));
      
      console.log('\n' + chalk.cyan('Project Details:'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`  Name:     ${chalk.white(answers.projectName)}`);
      console.log(`  ID:       ${chalk.yellow(projectId)}`);
      console.log(`  Wallet:   ${chalk.white(wallet.address)}`);
      console.log(`  Contract: ${chalk.white(answers.contractAddress)}`);
      console.log(`  TX:       ${chalk.blue(receipt.hash)}`);
      console.log(chalk.gray('─'.repeat(40)));
      
      console.log('\n' + chalk.cyan('Next steps:'));
      console.log('  1. Run ' + chalk.yellow('groupproof install') + ' to install git hooks');
      console.log('  2. Share ' + chalk.yellow('.groupproof.json') + ' with team members');
      console.log('  3. Each member runs ' + chalk.yellow('groupproof join') + ' with their wallet\n');
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to create project'));
      console.log(chalk.red('\nError: ' + error.message));
      if (error.message.includes('insufficient funds')) {
        console.log(chalk.yellow('\nYou need MATIC tokens. Get free testnet MATIC from:'));
        console.log(chalk.blue('  https://faucet.polygon.technology/'));
      }
      process.exit(1);
    }
  });

// Join command (for team members)
program
  .command('join')
  .description('Join an existing GroupProof project')
  .action(async () => {
    console.log(chalk.cyan('\n🔗 Join GroupProof Project\n'));
    
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log(chalk.red('❌ No .groupproof.json found. Ask project owner to share it.'));
      process.exit(1);
    }
    
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'privateKey',
        message: 'Your wallet private key:',
        validate: (input) => input && input.length >= 64
      }
    ]);
    
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(answers.privateKey, provider);
    
    // Save to .env
    fs.appendFileSync('.env', `GROUPPROOF_PRIVATE_KEY=${answers.privateKey}\n`);
    
    console.log(chalk.green('\n✅ Joined project: ' + config.projectName));
    console.log(chalk.gray('   Your wallet: ' + wallet.address));
    console.log(chalk.gray('\n   Run ' + chalk.yellow('groupproof install') + ' to set up git hooks\n'));
  });

// Install hook command
program
  .command('install')
  .description('Install git post-commit hook')
  .action(() => {
    console.log(chalk.cyan('\n🔧 Installing Git Hook\n'));
    
    const gitHooksDir = '.git/hooks';
    
    if (!fs.existsSync(gitHooksDir)) {
      console.log(chalk.red('❌ Not a git repository'));
      process.exit(1);
    }
    
    const hookContent = `#!/bin/sh
# GroupProof post-commit hook
# Records commits to Polygon blockchain

# Run in background to not block commit
(groupproof record &) 2>/dev/null

exit 0
`;
    
    const hookPath = path.join(gitHooksDir, 'post-commit');
    
    // Backup existing hook
    if (fs.existsSync(hookPath)) {
      const backup = hookPath + '.backup.' + Date.now();
      fs.copyFileSync(hookPath, backup);
      console.log(chalk.gray('   Backed up existing hook to: ' + backup));
    }
    
    fs.writeFileSync(hookPath, hookContent);
    fs.chmodSync(hookPath, '755');
    
    console.log(chalk.green('✅ Git hook installed successfully!\n'));
    console.log(chalk.gray('   Every commit will now be recorded on the blockchain.'));
    console.log(chalk.gray('   View contributions at: https://groupproof.vercel.app\n'));
  });

// Record command (called by hook)
program
  .command('record')
  .description('Record the latest commit to blockchain')
  .option('--commit <hash>', 'Specific commit hash to record')
  .action(async (options) => {
    // Load config
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log(chalk.red('Not initialized. Run: groupproof init'));
      process.exit(1);
    }
    
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    
    // Load private key from env
    require('dotenv').config();
    const privateKey = process.env.GROUPPROOF_PRIVATE_KEY;
    
    if (!privateKey) {
      console.log(chalk.red('No private key found. Run: groupproof join'));
      process.exit(1);
    }
    
    try {
      // Get commit info
      const commitHash = options.commit || execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const authorName = execSync('git log -1 --format=%an', { encoding: 'utf8' }).trim();
      const authorEmail = execSync('git log -1 --format=%ae', { encoding: 'utf8' }).trim();
      const message = execSync('git log -1 --format=%s', { encoding: 'utf8' }).trim();
      const timestamp = parseInt(execSync('git log -1 --format=%ct', { encoding: 'utf8' }).trim());
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      const repoName = path.basename(execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim());
      
      // Get diff stats
      let filesChanged = 0, additions = 0, deletions = 0;
      try {
        const stats = execSync('git diff --shortstat HEAD~1 HEAD', { encoding: 'utf8' });
        const filesMatch = stats.match(/(\d+) files? changed/);
        const addMatch = stats.match(/(\d+) insertions?\(\+\)/);
        const delMatch = stats.match(/(\d+) deletions?\(-\)/);
        filesChanged = filesMatch ? parseInt(filesMatch[1]) : 0;
        additions = addMatch ? parseInt(addMatch[1]) : 0;
        deletions = delMatch ? parseInt(delMatch[1]) : 0;
      } catch {
        // First commit, no parent
        const stats = execSync('git diff --shortstat --cached HEAD', { encoding: 'utf8' });
        filesChanged = 1;
      }
      
      // Convert commit hash to bytes32
      const commitBytes32 = '0x' + commitHash.padEnd(64, '0');
      
      // Connect to blockchain
      const provider = new ethers.JsonRpcProvider(config.rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(config.contractAddress, CONTRACT_ABI, wallet);
      
      // Check if already recorded
      const exists = await contract.isCommitRecorded(config.projectId, commitBytes32);
      if (exists) {
        console.log(chalk.yellow('⚠️  Commit already recorded: ' + commitHash.substring(0, 8)));
        return;
      }
      
      // Record commit
      console.log(chalk.cyan('📝 Recording commit: ' + commitHash.substring(0, 8) + '...'));
      
      const tx = await contract.recordCommit(
        config.projectId,
        commitBytes32,
        authorName,
        authorEmail,
        timestamp,
        message.substring(0, 200), // Limit message length
        filesChanged,
        additions,
        deletions,
        repoName,
        branch
      );
      
      console.log(chalk.gray('   TX: ' + tx.hash));
      await tx.wait();
      
      console.log(chalk.green('✅ Commit recorded on blockchain!'));
      console.log(chalk.gray(`   +${additions} -${deletions} in ${filesChanged} files`));
      
    } catch (error) {
      // Silent fail for background execution
      fs.appendFileSync('.groupproof.log', `${new Date().toISOString()} ERROR: ${error.message}\n`);
      
      if (error.message.includes('insufficient funds')) {
        console.log(chalk.yellow('⚠️  Insufficient MATIC. Get testnet tokens from faucet.polygon.technology'));
      }
    }
  });

// Status command
program
  .command('status')
  .description('Check GroupProof status')
  .action(async () => {
    console.log(chalk.cyan('\n📊 GroupProof Status\n'));
    
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log(chalk.yellow('Not initialized. Run: groupproof init'));
      return;
    }
    
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    require('dotenv').config();
    
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  Project:    ${chalk.white(config.projectName)}`);
    console.log(`  Project ID: ${chalk.yellow(config.projectId.substring(0, 18))}...`);
    console.log(`  Contract:   ${chalk.white(config.contractAddress.substring(0, 18))}...`);
    console.log(`  Network:    ${chalk.blue(config.rpcUrl.includes('amoy') ? 'Polygon Amoy' : 'Polygon')}`);
    
    // Check wallet
    const privateKey = process.env.GROUPPROOF_PRIVATE_KEY;
    if (privateKey) {
      try {
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const balance = await provider.getBalance(wallet.address);
        
        console.log(`  Wallet:     ${chalk.white(wallet.address.substring(0, 18))}...`);
        console.log(`  Balance:    ${chalk.green(ethers.formatEther(balance))} MATIC`);
        
        // Get project stats from contract
        const contract = new ethers.Contract(config.contractAddress, CONTRACT_ABI, provider);
        const project = await contract.getProject(config.projectId);
        
        console.log(chalk.gray('─'.repeat(50)));
        console.log(`  Commits:    ${chalk.cyan(project[6].toString())}`);
        console.log(`  Contributors: ${chalk.cyan(project[5].toString())}`);
        console.log(`  Active:     ${project[4] ? chalk.green('Yes') : chalk.red('No')}`);
        
      } catch (error) {
        console.log(chalk.red('\n  Error connecting: ' + error.message));
      }
    } else {
      console.log(chalk.yellow('\n  ⚠️  No wallet configured. Run: groupproof join'));
    }
    
    // Check git hook
    const hookPath = '.git/hooks/post-commit';
    if (fs.existsSync(hookPath)) {
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      if (hookContent.includes('groupproof')) {
        console.log(`  Git Hook:   ${chalk.green('✓ Installed')}`);
      } else {
        console.log(`  Git Hook:   ${chalk.yellow('⚠️  Not GroupProof hook')}`);
      }
    } else {
      console.log(`  Git Hook:   ${chalk.red('✗ Not installed')} (run: groupproof install)`);
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`\n  Dashboard:  ${chalk.blue('https://groupproof.vercel.app')}\n`);
  });

// Sync command - record all unrecorded commits
program
  .command('sync')
  .description('Sync all unrecorded commits to blockchain')
  .option('--limit <n>', 'Maximum commits to sync', '50')
  .action(async (options) => {
    console.log(chalk.cyan('\n🔄 Syncing commits to blockchain...\n'));
    
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log(chalk.red('Not initialized. Run: groupproof init'));
      process.exit(1);
    }
    
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    require('dotenv').config();
    const privateKey = process.env.GROUPPROOF_PRIVATE_KEY;
    
    if (!privateKey) {
      console.log(chalk.red('No private key. Run: groupproof join'));
      process.exit(1);
    }
    
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(config.contractAddress, CONTRACT_ABI, wallet);
    
    // Get recent commits
    const limit = parseInt(options.limit);
    const commits = execSync(`git log --format="%H|%an|%ae|%ct|%s" -n ${limit}`, { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const [hash, name, email, ts, ...msg] = line.split('|');
        return { hash, name, email, timestamp: parseInt(ts), message: msg.join('|') };
      });
    
    let synced = 0, skipped = 0;
    
    for (const commit of commits) {
      const commitBytes32 = '0x' + commit.hash.padEnd(64, '0');
      
      const exists = await contract.isCommitRecorded(config.projectId, commitBytes32);
      if (exists) {
        skipped++;
        continue;
      }
      
      console.log(chalk.gray(`  Recording: ${commit.hash.substring(0, 8)} - ${commit.message.substring(0, 40)}...`));
      
      try {
        const tx = await contract.recordCommit(
          config.projectId,
          commitBytes32,
          commit.name,
          commit.email,
          commit.timestamp,
          commit.message.substring(0, 200),
          1, 0, 0, // Simplified stats for bulk sync
          path.basename(process.cwd()),
          'main'
        );
        await tx.wait();
        synced++;
      } catch (error) {
        console.log(chalk.red(`  Failed: ${error.message}`));
      }
    }
    
    console.log(chalk.green(`\n✅ Synced ${synced} commits, ${skipped} already recorded\n`));
  });

program.parse();
