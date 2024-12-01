const { Sequelize } = require('sequelize');
const config = require('../config/config.js');

async function testConnection() {
  const env = process.env.NODE_ENV || 'development';
  const dbConfig = config[env];
  
  console.log('使用的数据库配置:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    username: dbConfig.username
  });

  const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: console.log
    }
  );

  try {
    await sequelize.authenticate();
    console.log('数据库连接测试成功！');
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection(); 