'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 用户表
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 角色表
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 权限表
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 用户角色关联表
    await queryInterface.createTable('user_roles', {
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      role_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      primaryKey: true,
      fields: ['user_id', 'role_id']
    });

    // 角色权限关联表
    await queryInterface.createTable('role_permissions', {
      role_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, {
      primaryKey: true,
      fields: ['role_id', 'permission_id']
    });

    // 黑名单令牌表
    await queryInterface.createTable('blacklisted_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      blacklisted_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 添加索引
    await queryInterface.addIndex('blacklisted_tokens', ['token'], {
      name: 'idx_token',
      length: { token: 255 }
    });
    await queryInterface.addIndex('blacklisted_tokens', ['expires_at'], {
      name: 'idx_expires_at'
    });

    // 插入默认角色
    await queryInterface.bulkInsert('roles', [
      {
        name: 'admin',
        description: 'System administrator with full access',
        created_at: new Date()
      },
      {
        name: 'user',
        description: 'Regular user with basic access',
        created_at: new Date()
      }
    ]);

    // 插入默认权限
    const permissions = [
      'create:any', 'read:any', 'update:any', 'delete:any',
      'create:own', 'read:own', 'update:own', 'delete:own'
    ].map(name => ({
      name,
      description: `Can ${name.split(':')[0]} ${name.split(':')[1]} resource`,
      created_at: new Date()
    }));

    await queryInterface.bulkInsert('permissions', permissions);
  },

  down: async (queryInterface, Sequelize) => {
    // 按照相反的顺序删除表
    await queryInterface.dropTable('blacklisted_tokens');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('users');
  }
}; 