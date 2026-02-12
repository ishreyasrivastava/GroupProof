import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const WalletContext = createContext(null);

// Polygon Amoy testnet config
const AMOY_CHAIN = {
  chainId: '0x13882', // 80002 in hex
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
};

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if already connected on mount
  useEffect(() => {
    checkConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet(false);
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      disconnect();
      toast('Wallet disconnected', { icon: '👋' });
    } else {
      setAccount(accounts[0]);
      await updateBalance(accounts[0]);
      toast.success('Account changed');
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const updateBalance = async (address) => {
    if (provider && address) {
      try {
        const bal = await provider.getBalance(address);
        setBalance(ethers.formatEther(bal));
      } catch (err) {
        console.error('Error getting balance:', err);
      }
    }
  };

  const switchToAmoy = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AMOY_CHAIN.chainId }],
      });
      return true;
    } catch (switchError) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [AMOY_CHAIN],
          });
          return true;
        } catch (addError) {
          console.error('Error adding chain:', addError);
          toast.error('Failed to add Polygon Amoy network');
          return false;
        }
      }
      console.error('Error switching chain:', switchError);
      return false;
    }
  };

  const connectWallet = useCallback(async (showToast = true) => {
    if (typeof window.ethereum === 'undefined') {
      const msg = 'Please install MetaMask to use GroupProof';
      setError(msg);
      toast.error(msg);
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Switch to Amoy if needed
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (currentChainId !== AMOY_CHAIN.chainId) {
        const switched = await switchToAmoy();
        if (!switched) {
          throw new Error('Please switch to Polygon Amoy testnet');
        }
      }

      // Set up provider and signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const browserSigner = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(browserSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      
      // Get balance
      const bal = await browserProvider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(bal));

      if (showToast) {
        toast.success('Wallet connected!');
      }

      return true;
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
      if (showToast) {
        toast.error(err.message || 'Failed to connect wallet');
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setBalance(null);
  }, []);

  const value = {
    account,
    provider,
    signer,
    chainId,
    balance,
    isConnecting,
    error,
    isConnected: !!account,
    isAmoy: chainId === 80002,
    connectWallet,
    disconnect,
    switchToAmoy,
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
