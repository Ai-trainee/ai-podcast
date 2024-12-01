const db = require('../config/db');

const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            // Get user roles
            const [userRoles] = await db.query(`
                SELECT r.* 
                FROM roles r
                JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = ?
            `, [req.user.id]);

            // Get permissions for these roles
            const [permissions] = await db.query(`
                SELECT DISTINCT p.name
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                JOIN user_roles ur ON rp.role_id = ur.role_id
                WHERE ur.user_id = ?
            `, [req.user.id]);

            // Check if user has required permission
            const hasPermission = permissions.some(p => p.name === requiredPermission);
            
            if (!hasPermission) {
                return res.status(403).json({ 
                    message: 'Access denied: Insufficient permissions' 
                });
            }

            // Add roles and permissions to request object for future use
            req.userRoles = userRoles;
            req.userPermissions = permissions;

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ message: 'Error checking permissions' });
        }
    };
};

// Helper middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        const [roles] = await db.query(`
            SELECT r.name 
            FROM roles r
            JOIN user_roles ur ON r.id = ur.role_id
            WHERE ur.user_id = ? AND r.name = 'admin'
        `, [req.user.id]);

        if (roles.length === 0) {
            return res.status(403).json({ 
                message: 'Access denied: Admin privileges required' 
            });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ message: 'Error checking admin status' });
    }
};

// Helper middleware to check resource ownership
const checkOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            // This is a placeholder. You need to implement the actual ownership check
            // based on your resource type and database structure
            const resourceId = req.params.id;
            const userId = req.user.id;

            // Example query (modify according to your database structure)
            const [resource] = await db.query(`
                SELECT * FROM ${resourceType} 
                WHERE id = ? AND user_id = ?
            `, [resourceId, userId]);

            if (resource.length === 0) {
                return res.status(403).json({ 
                    message: 'Access denied: Resource does not belong to user' 
                });
            }

            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).json({ message: 'Error checking resource ownership' });
        }
    };
};

module.exports = {
    checkPermission,
    isAdmin,
    checkOwnership
};
