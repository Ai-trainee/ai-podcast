const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

describe('认证API测试', () => {
    let testUser;
    let authToken;

    beforeAll(async () => {
        // 清理测试数据
        await db.query('DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['test@example.com']);
        await db.query('DELETE FROM users WHERE email = ?', ['test@example.com']);
    });

    afterAll(async () => {
        // 清理测试数据
        await db.query('DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['test@example.com']);
        await db.query('DELETE FROM users WHERE email = ?', ['test@example.com']);
        await db.end();
    });

    describe('POST /api/auth/register', () => {
        it('应该成功注册新用户并分配默认角色', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('message', 'User registered successfully');
            expect(res.body.user).toHaveProperty('username', 'testuser');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
            expect(res.body.user.roles).toContain('user');
            expect(Array.isArray(res.body.user.permissions)).toBe(true);

            // 保存token供后续测试使用
            authToken = res.body.token;

            // 验证用户角色分配
            const [userRoles] = await db.query(`
                SELECT r.name 
                FROM roles r
                JOIN user_roles ur ON r.id = ur.role_id
                JOIN users u ON ur.user_id = u.id
                WHERE u.email = ?
            `, ['test@example.com']);

            expect(userRoles[0]).toHaveProperty('name', 'user');
        });

        it('应该拒绝使用已存在的邮箱注册', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('应该成功登录并返回用户角色和权限信息', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('message', 'Logged in successfully');
            expect(res.body.user).toHaveProperty('roles');
            expect(res.body.user).toHaveProperty('permissions');
            expect(Array.isArray(res.body.user.roles)).toBe(true);
            expect(Array.isArray(res.body.user.permissions)).toBe(true);

            // 更新token
            authToken = res.body.token;
        });

        it('应该拒绝错误的密码', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('应该成功登出用户并使token失效', async () => {
            // 先登录获取token
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            const token = loginRes.body.token;

            // 使用token登出
            const logoutRes = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(logoutRes.statusCode).toBe(200);
            expect(logoutRes.body).toHaveProperty('message', 'Logged out successfully');

            // 尝试使用已登出的token访问受保护的路由
            const profileRes = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(profileRes.statusCode).toBe(401);
            expect(profileRes.body).toHaveProperty('message', 'Token has been invalidated, please login again');
        });

        it('应该拒绝没有token的登出请求', async () => {
            const res = await request(app)
                .post('/api/auth/logout');

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('message', 'No authentication token, access denied');
        });
    });

    describe('GET /api/auth/profile', () => {
        beforeEach(async () => {
            // 在每个测试前重新登录获取新token
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });
            authToken = loginRes.body.token;
        });

        it('应该返回已认证用户的完整资料', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('username', 'testuser');
            expect(res.body.user).toHaveProperty('email', 'test@example.com');
            expect(res.body.user).toHaveProperty('roles');
            expect(res.body.user).toHaveProperty('permissions');
            expect(Array.isArray(res.body.user.roles)).toBe(true);
            expect(Array.isArray(res.body.user.permissions)).toBe(true);
        });

        it('应该拒绝未认证的请求', async () => {
            const res = await request(app)
                .get('/api/auth/profile');

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('message', 'No authentication token, access denied');
        });

        it('应该拒绝无效的token', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid_token');

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('message', 'Token verification failed, authorization denied');
        });
    });

    describe('权限测试', () => {
        beforeEach(async () => {
            // 在每个测试前重新登录获取新token
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });
            authToken = loginRes.body.token;
        });

        it('默认用户应该具有基本权限', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('permissions');
            
            const permissions = res.body.user.permissions;
            expect(permissions).toContain('create:own');
            expect(permissions).toContain('read:own');
            expect(permissions).toContain('update:own');
            expect(permissions).toContain('delete:own');
            expect(permissions).not.toContain('create:any');
            expect(permissions).not.toContain('read:any');
        });
    });
});
