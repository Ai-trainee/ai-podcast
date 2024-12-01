const { Sequelize } = require('sequelize');
const config = require('../config/config.js');

async function testConnection() {
  const env = process.env.NODE_ENV || 'development';
  const sequelize = new Sequelize(config[env]);

  try {
    await sequelize.authenticate();
    console.log('数据库连接成功！');
  } catch (error) {
    console.error('无法连接到数据库:', error);
  } finally {
    await sequelize.close();
  }
}

testConnection(); 