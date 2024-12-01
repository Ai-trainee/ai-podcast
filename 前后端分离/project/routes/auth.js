const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { register, login, logout } = require('../controllers/auth');

// 验证规则
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('用户名至少需要3个字符'),
  body('email')
    .isEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符')
    .matches(/\d/)
    .withMessage('密码必须包含数字')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('请提供有效的邮箱地址'),
  body('password')
    .exists()
    .withMessage('请提供密码')
];

// 注册路由
router.post('/register', registerValidation, register);

// 登录路由
router.post('/login', loginValidation, login);

// 登出路由
router.post('/logout', auth, logout);

module.exports = router;
