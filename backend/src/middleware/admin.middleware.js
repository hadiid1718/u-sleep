import jwt from 'jsonwebtoken';
import { ADMIN_EMAIL, JWT_SECRET } from '../config/env.js';

const normalizeEmail = email =>
  String(email || '')
    .trim()
    .toLowerCase();
const ADMIN_EMAIL_NORMALIZED = normalizeEmail(ADMIN_EMAIL);

const adminAuthorize = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Unauthorized - No token provided' });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (ADMIN_EMAIL_NORMALIZED && decoded.email !== ADMIN_EMAIL_NORMALIZED) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    req.admin = {
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: error.message || 'Unauthorized' });
  }
};

export default adminAuthorize;
