import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import User from '../models/user.model.js';
import Admin from '../models/admin.model.js';

const authorize = async(req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];

            if (!token) return res.status(401).json({ message: 'Unauthorized' });
            
            const decoded = jwt.verify(token, JWT_SECRET);

            // Check if it's an admin token
            if (decoded.adminId) {
                const admin = await Admin.findById(decoded.adminId).select('-password');
                if (!admin) return res.status(401).json({ message: 'Unauthorized' });
                req.admin = admin;
                req.adminId = admin._id;
            } 
            // Check if it's a user token
            else if (decoded.userId) {
                const user = await User.findById(decoded.userId).select('-password');
                if (!user) return res.status(401).json({ message: 'Unauthorized' });
                req.user = user;
            }

            next();
        }
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

export default authorize;