const { ethers } = require('ethers');
const { AppError } = require('../utils/helpers');

/**
 * EIP-191 wallet signature verification middleware.
 * Expects headers: x-wallet-address, x-signature, x-message
 */
function verifyWalletSignature(req, res, next) {
  try {
    const address = req.headers['x-wallet-address'];
    const signature = req.headers['x-signature'];
    const message = req.headers['x-message'];

    if (!address || !signature || !message) {
      throw new AppError('Missing authentication headers (x-wallet-address, x-signature, x-message)', 401);
    }

    if (!ethers.isAddress(address)) {
      throw new AppError('Invalid wallet address', 401);
    }

    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new AppError('Signature verification failed', 401);
    }

    // Check message freshness (within 5 minutes)
    const parsed = JSON.parse(message);
    if (parsed.timestamp) {
      const age = Date.now() - parsed.timestamp;
      if (age > 5 * 60 * 1000) {
        throw new AppError('Signature expired', 401);
      }
    }

    req.walletAddress = ethers.getAddress(address); // checksummed
    next();
  } catch (err) {
    if (err.isOperational) return next(err);
    next(new AppError('Authentication failed: ' + err.message, 401));
  }
}

module.exports = { verifyWalletSignature };
