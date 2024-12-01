# Podcast API 文档
公网地址:
https://emwqkjwavfgx.sealosbja.site(注意实际调，用这个地址替换下面的api)
## 项目概述

这是一个基于 Node.js 的播客生成和管理系统的后端 API 服务。系统支持用户认证、文本转语音、文件上传等功能。

## 基础信息

- 基础URL: `http://localhost:8080/api`
- 所有需要认证的接口都需要在请求头中携带 token：
  ```
  Authorization: Bearer <your_token>
  ```
- 所有响应都是 JSON 格式

## 认证相关接口

### 1. 用户注册

```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "string",     // 必需，3-50个字符
    "email": "string",        // 必需，有效的邮箱格式
    "password": "string"      // 必需，6-100个字符，必须包含数字
}
```

**成功响应 (201)**
```json
{
    "message": "注册成功",
    "userId": "number",
    "token": "string",
    "user": {
        "id": "number",
        "username": "string",
        "email": "string"
    }
}
```

**错误响应**
- 400: 输入无效或用户已存在
- 500: 服务器错误

### 2. 用户登录

```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "string",        // 必需
    "password": "string"      // 必需
}
```

**成功响应 (200)**
```json
{
    "message": "登录成功",
    "token": "string",
    "user": {
        "id": "number",
        "username": "string",
        "email": "string"
    }
}
```

**错误响应**
- 401: 用户名或密码错误
- 500: 服务器错误

### 3. 用户登出

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**成功响应 (200)**
```json
{
    "message": "登出成功"
}
```

**错误响应**
- 401: 未认证或 token 无效
- 500: 服务器错误

## 播客相关接口

### 1. 文本转播客

```http
POST /api/podcast/generate
Authorization: Bearer <token>
Content-Type: application/json

{
    "text": "string"         // 必需，要转换的文本内容
}
```

**成功响应 (200)**
```json
{
    "taskId": "string"       // 任务ID，用于查询状态
}
```

**错误响应**
- 400: 文本内容为空
- 401: 未认证
- 500: 服务器错误

### 2. 上传文件转播客

```http
POST /api/podcast/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: File                   // 必需，文件大小限制 10MB
```

**成功响应 (200)**
```json
{
    "taskId": "string"       // 任务ID，用于查询状态
}
```

**错误响应**
- 400: 文件未上传或格式错误
- 401: 未认证
- 413: 文件太大
- 500: 服务器错误

### 3. 查询任务状态

```http
GET /api/podcast/status/:taskId
Authorization: Bearer <token>
```

**成功响应 (200)**
```json
{
    "taskId": "string",
    "status": "string",      // 任务状态：pending/processing/completed/failed
    "progress": "string",    // 进度信息
    "audioUrl": "string"     // 如果完成，返回音频URL
}
```

**错误响应**
- 401: 未认证
- 404: 任务不存在
- 500: 服务器错误

### 4. 获取用户播客列表

```http
GET /api/podcast/my-podcasts
Authorization: Bearer <token>
```

**成功响应 (200)**
```json
[
    {
        "taskId": "string",
        "status": "string",
        "progress": "string",
        "audioUrl": "string",
        "createdAt": "string"
    }
]
```

**错误响应**
- 401: 未认证
- 500: 服务器错误

### 5. 删除播客

```http
DELETE /api/podcast/:taskId
Authorization: Bearer <token>
```

**成功响应 (200)**
```json
{
    "message": "删除成功"
}
```

**错误响应**
- 401: 未认证
- 403: 无权限
- 404: 播客不存在
- 500: 服务器错误

## 错误响应格式

所有的错误响应都遵循以下格式：

```json
{
    "error": "错误信息"
}
```

## 注意事项

1. 文件上传限制
   - 支持的文件格式：文本文件
   - 最大文件大小：10MB

2. 认证
   - Token 有效期为 24 小时
   - 需要在所有受保护的路由中包含 token

3. 任务状态
   - pending: 等待处理
   - processing: 处理中
   - completed: 已完成
   - failed: 失败

4. 音频文件
   - 生成的音频文件通过 /output 路径访问
   - URL 格式：`http://localhost:8080/output/{taskId}/{filename}`
