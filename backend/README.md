# Sci-Demo Hub Backend

基于 SQLite 的 RESTful API 后端服务。

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

### 3. 启动服务器

```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3001` 启动。

## API 端点

### 认证 (Auth)
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/me` - 获取当前用户信息

### 演示 (Demos)
- `GET /api/v1/demos` - 获取演示列表（支持筛选）
- `POST /api/v1/demos` - 创建新演示
- `GET /api/v1/demos/:id` - 获取单个演示
- `PATCH /api/v1/demos/:id/status` - 更新演示状态
- `PATCH /api/v1/demos/:id/cover` - 更新演示封面
- `DELETE /api/v1/demos/:id` - 删除演示

### 社区 (Communities)
- `GET /api/v1/communities` - 获取社区列表
- `POST /api/v1/communities` - 创建社区
- `PATCH /api/v1/communities/:id/status` - 更新社区状态
- `POST /api/v1/communities/join-by-code` - 通过邀请码加入
- `POST /api/v1/communities/:id/join-request` - 申请加入社区
- `POST /api/v1/communities/:id/members/manage` - 管理成员
- `GET /api/v1/communities/:id/members` - 获取成员列表
- `PATCH /api/v1/communities/:id/code` - 重置邀请码
- `DELETE /api/v1/communities/:id` - 删除社区

### 分类 (Categories)
- `GET /api/v1/categories` - 获取分类列表
- `POST /api/v1/categories` - 创建分类
- `DELETE /api/v1/categories/:id` - 删除分类

### 悬赏 (Bounties)
- `GET /api/v1/bounties` - 获取悬赏列表
- `POST /api/v1/bounties` - 创建悬赏
- `PATCH /api/v1/bounties/:id/status` - 更新悬赏状态
- `DELETE /api/v1/bounties/:id` - 删除悬赏

## 数据库结构

### 表
- `users` - 用户表
- `communities` - 社区表
- `community_members` - 社区成员关联表
- `categories` - 分类表
- `demos` - 演示表
- `bounties` - 悬赏表

### 默认账号
- 管理员: `admin` / 任意密码
- 普通用户: 任意用户名 / 任意密码

## 响应格式

所有 API 响应遵循统一格式：

```json
{
  "code": 200,
  "message": "Success",
  "data": { ... }
}
```
