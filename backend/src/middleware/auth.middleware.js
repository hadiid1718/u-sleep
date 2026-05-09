import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import User from '../models/user.model.js';

const authorize = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];

      if (!token) return res.status(401).json({ message: 'Unauthorized' });

      const decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.userId) {
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        // Check account status
        if (user.accountStatus === 'blocked') {
          return res.status(403).json({
            success: false,
            message: 'Account has been permanently blocked',
            code: 'ACCOUNT_BLOCKED',
          });
        }

        // Check if account is suspended
        if (user.accountStatus === 'suspended') {
          // Allow access but mark as suspended
          req.user = user;
          req.accountSuspended = true;
          return next();
        }

        req.user = user;
      }

      next();
    } else {
      return res
        .status(401)
        .json({ message: 'Unauthorized - No token provided' });
    }
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export default authorize;
