const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 检查用户是否已存在
        const [existingUsers] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                error: '用户已存在' 
            });
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 创建新用户
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        // 生成 JWT
        const token = jwt.sign(
            { id: result.insertId, username, email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: '注册成功',
            userId: result.insertId,
            token
        });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 查找用户
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const user = users[0];

        // 验证密码
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 生成 JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        // 在实际应用中，你可能想要将 token 加入黑名单
        // 这里简单返回成功消息
        res.json({ message: '登出成功' });
    } catch (error) {
        console.error('登出失败:', error);
        res.status(500).json({ error: error.message });
    }
};
