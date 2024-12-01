#!/bin/bash

# 从 .env 文件加载配置
source .env

# 使用 MySQL 命令行工具执行 SQL 文件
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD < scripts/init.sql

echo "数据库初始化完成" 