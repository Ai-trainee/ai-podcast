const mysql = require('mysql2/promise');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功');
        connection.release();
    } catch (error) {
        console.error('数据库连接失败:', error);
        throw error;
    }
}

module.exports = {
    pool,
    testConnection
};
