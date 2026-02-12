import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const WalletContext = createContext(null);

// Polygon Amoy testnet configuration
const AMOY_CONFIG = {
  chainId: 80002,
  chainIdHex: '0x13882',
  name: 'Polygon Amoy Testnet',
  currency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrl: 'https://rpc-amoy.polygon.technology',
  blockExplorer: 'https://amoy.polygonscan.com',
};

// Wallet connection states
const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  WRONG_NETWORK: 'wrong_network',
  ERROR: 'error',
};

export function WalletProvider({ children }) {
  // Core state
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  
  // UI state
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
  const [error, setError] = useState(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  
  // Refs for cleanup
  const balanceIntervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Check MetaMask on mount
  useEffect(() => {
    mountedRef.current = true;
    const hasMetaMask = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
    setIsMetaMaskInstalled(hasMetaMask);
    
    if (hasMetaMask) {
      checkExistingConnection();
      setupEventListeners();
    }
    
    return () => {
      mountedRef.current = false;
      cleanupEventListeners();
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
      }
    };
  }, []);

  // Setup MetaMask event listeners
  const setupEventListeners = useCallback(() => {
    if (!window.ethereum) return;
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);
  }, []);

  const cleanupEventListeners = useCallback(() => {
    if (!window.ethereum) return;
    
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
    window.ethereum.removeListener('disconnect', handleDisconnect);
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback(async (accounts) => {
    if (!mountedRef.current) return;
    
    if (accounts.length === 0) {
      // User disconnected
      resetState();
      toast('Wallet disconnected', { icon: '👋' });
    } else if (accounts[0] !== account) {
      // Account switched
      setAccount(accounts[0]);
      await updateBalance(accounts[0]);
      toast.success('Account switched');
    }
  }, [account]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainIdHex) => {
    if (!mountedRef.current) return;
    
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    
    if (newChainId !== AMOY_CONFIG.chainId) {
      setConnectionState(ConnectionState.WRONG_NETWORK);
      toast.error('Please switch to Polygon Amoy network', {
        duration: 5000,
        id: 'wrong-network',
      });
    } else {
      setConnectionState(ConnectionState.CONNECTED);
      toast.success('Connected to Polygon Amoy', { id: 'network-switch' });
    }
  }, []);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    if (!mountedRef.current) return;
    resetState();
  }, []);

  // Reset all state
  const resetState = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance(null);
    setConnectionState(ConnectionState.DISCONNECTED);
    setError(null);
    
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }
  }, []);

  // Check for existing connection on mount
  const checkExistingConnection = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connectWallet(false);
      }
    } catch (err) {
      console.error('Error checking existing connection:', err);
    }
  }, []);

  // Update balance
  const updateBalance = useCallback(async (address) => {
    if (!provider || !address) return;
    
    try {
      const bal = await provider.getBalance(address);
      if (mountedRef.current) {
        setBalance(ethers.formatEther(bal));
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, [provider]);

  // Switch to Amoy network
  const switchToAmoy = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Try to switch
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AMOY_CONFIG.chainIdHex }],
      });
      return true;
    } catch (switchError) {
      // Chain not added (error code 4902)
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: AMOY_CONFIG.chainIdHex,
              chainName: AMOY_CONFIG.name,
              nativeCurrency: AMOY_CONFIG.currency,
              rpcUrls: [AMOY_CONFIG.rpcUrl],
              blockExplorerUrls: [AMOY_CONFIG.blockExplorer],
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw new Error('Failed to add Polygon Amoy network. Please add it manually.');
        }
      }
      
      // User rejected
      if (switchError.code === 4001) {
        throw new Error('Network switch was rejected');
      }
      
      throw switchError;
    }
  }, []);

  // Main connect function with comprehensive error handling
  const connectWallet = useCallback(async (showToasts = true) => {
    // Check MetaMask
    if (!window.ethereum) {
      const error = 'Please install MetaMask to use GroupProof';
      setError(error);
      setConnectionState(ConnectionState.ERROR);
      if (showToasts) toast.error(error);
      return false;
    }

    setConnectionState(ConnectionState.CONNECTING);
    setError(null);

    try {
      // Request accounts
      let accounts;
      try {
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
      } catch (requestError) {
        if (requestError.code === 4001) {
          throw new Error('Connection request was rejected');
        }
        if (requestError.code === -32002) {
          throw new Error('Connection request pending. Please check MetaMask.');
        }
        throw requestError;
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Check and switch network if needed
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainIdNum = parseInt(currentChainId, 16);
      
      if (currentChainIdNum !== AMOY_CONFIG.chainId) {
        if (showToasts) {
          toast.loading('Switching to Polygon Amoy...', { id: 'network-switch' });
        }
        
        try {
          await switchToAmoy();
        } catch (switchError) {
          toast.dismiss('network-switch');
          throw switchError;
        }
        
        toast.dismiss('network-switch');
      }

      // Set up provider and signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const browserSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      // Get initial balance
      const initialBalance = await browserProvider.getBalance(accounts[0]);

      // Update state
      if (mountedRef.current) {
        setProvider(browserProvider);
        setSigner(browserSigner);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        setBalance(ethers.formatEther(initialBalance));
        setConnectionState(ConnectionState.CONNECTED);
        setError(null);
      }

      // Set up balance polling (every 30 seconds)
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
      }
      balanceIntervalRef.current = setInterval(() => {
        if (mountedRef.current && accounts[0]) {
          updateBalance(accounts[0]);
        }
      }, 30000);

      if (showToasts) {
        toast.success('Wallet connected!');
      }

      return true;
    } catch (err) {
      console.error('Connection error:', err);
      
      const errorMessage = err.message || 'Failed to connect wallet';
      
      if (mountedRef.current) {
        setError(errorMessage);
        setConnectionState(ConnectionState.ERROR);
      }
      
      if (showToasts) {
        toast.error(errorMessage);
      }
      
      return false;
    }
  }, [switchToAmoy, updateBalance]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    resetState();
    toast('Wallet disconnected', { icon: '👋' });
  }, [resetState]);

  // Retry connection
  const retryConnection = useCallback(async () => {
    setError(null);
    return connectWallet(true);
  }, [connectWallet]);

  // Get explorer URL
  const getExplorerUrl = useCallback((hash, type = 'tx') => {
    return `${AMOY_CONFIG.blockExplorer}/${type}/${hash}`;
  }, []);

  // Check if low balance
  const isLowBalance = balance !== null && parseFloat(balance) < 0.01;

  // Context value
  const value = {
    // State
    account,
    provider,
    signer,
    chainId,
    balance,
    connectionState,
    error,
    isMetaMaskInstalled,
    
    // Computed
    isConnected: connectionState === ConnectionState.CONNECTED,
    isConnecting: connectionState === ConnectionState.CONNECTING,
    isWrongNetwork: connectionState === ConnectionState.WRONG_NETWORK,
    isAmoy: chainId === AMOY_CONFIG.chainId,
    isLowBalance,
    
    // Actions
    connectWallet,
    disconnect,
    switchToAmoy,
    retryConnection,
    updateBalance: () => updateBalance(account),
    getExplorerUrl,
    
    // Config
    networkConfig: AMOY_CONFIG,
    ConnectionState,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

// Custom hook for transaction handling
export function useTransaction() {
  const { signer, getExplorerUrl, isConnected, isAmoy } = useWallet();
  const [txState, setTxState] = useState({
    status: 'idle', // idle, pending, confirming, success, error
    hash: null,
    error: null,
    confirmations: 0,
  });

  const resetTx = useCallback(() => {
    setTxState({
      status: 'idle',
      hash: null,
      error: null,
      confirmations: 0,
    });
  }, []);

  const sendTransaction = useCallback(async (txPromise, options = {}) => {
    const { 
      confirmations = 1,
      onSubmit,
      onConfirm,
      onError,
    } = options;

    // Validation
    if (!isConnected) {
      const error = 'Wallet not connected';
      setTxState({ status: 'error', hash: null, error, confirmations: 0 });
      onError?.(new Error(error));
      return null;
    }

    if (!isAmoy) {
      const error = 'Please switch to Polygon Amoy network';
      setTxState({ status: 'error', hash: null, error, confirmations: 0 });
      onError?.(new Error(error));
      return null;
    }

    setTxState({ status: 'pending', hash: null, error: null, confirmations: 0 });

    try {
      // Send transaction
      const tx = await txPromise;
      
      setTxState({ status: 'confirming', hash: tx.hash, error: null, confirmations: 0 });
      onSubmit?.(tx);
      
      toast.loading(
        `Transaction submitted. Waiting for confirmation...`,
        { id: `tx-${tx.hash}` }
      );

      // Wait for confirmations
      const receipt = await tx.wait(confirmations);
      
      setTxState({ 
        status: 'success', 
        hash: tx.hash, 
        error: null, 
        confirmations: receipt.confirmations || confirmations,
      });
      
      toast.success('Transaction confirmed!', { id: `tx-${tx.hash}` });
      onConfirm?.(receipt);
      
      return receipt;
    } catch (err) {
      console.error('Transaction error:', err);
      
      let errorMessage = 'Transaction failed';
      
      // Parse common errors
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        errorMessage = 'Transaction was rejected';
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please try again.';
      } else if (err.code === 'NONCE_EXPIRED') {
        errorMessage = 'Transaction expired. Please try again.';
      } else if (err.code === 'REPLACEMENT_UNDERPRICED') {
        errorMessage = 'Gas price too low. Please try again.';
      } else if (err.message) {
        errorMessage = err.message.substring(0, 100);
      }
      
      setTxState({ status: 'error', hash: null, error: errorMessage, confirmations: 0 });
      
      toast.error(errorMessage, { id: txState.hash ? `tx-${txState.hash}` : undefined });
      onError?.(err);
      
      return null;
    }
  }, [isConnected, isAmoy, txState.hash]);

  return {
    ...txState,
    sendTransaction,
    resetTx,
    isPending: txState.status === 'pending',
    isConfirming: txState.status === 'confirming',
    isSuccess: txState.status === 'success',
    isError: txState.status === 'error',
  };
}
