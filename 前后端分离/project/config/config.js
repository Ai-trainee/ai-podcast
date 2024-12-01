require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql"
  },
  production: {
    username: "root",
    password: "4gc9vlhk",
    database: "auth_db",
    host: "test-db-mysql.ns-inb68q85.svc",
    port: 3306,
    dialect: "mysql",
    dialectOptions: {
      charset: 'utf8mb4',
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
}; 