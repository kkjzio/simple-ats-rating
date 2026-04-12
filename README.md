# Simple ATS Rating — 面试评分系统

一个轻量、易用的面试现场打分系统。面试官无需安装任何软件，扫码或打开链接即可在手机/电脑上完成评分；管理员可在大屏实时查看汇总结果。

---

## 功能亮点

### 面试官侧
- **零门槛进入**：扫描场次二维码或通过链接直接访问，手机、平板、电脑均可使用
- **候选人信息一键查阅**：评分页面直接展示候选人基本信息与简历，无需切换系统
- **结构化评分表单**：按维度逐项打分，界面简洁，操作流畅

### 管理员侧
- **大屏实时看板**：综合评分、候选人排名、各维度得分分布实时更新，适合投屏展示
- **自定义评分维度**：通过评分模板灵活配置评分项、权重和评分范围，满足不同岗位需求
- **简历管理**：支持上传 PDF/Word 简历，在线预览与下载
- **多角色权限**：管理员负责配置和统览，面试官专注评分，权限互不干扰

### 数据管理
- **批量导入**：支持 Excel 批量导入候选人和面试官账号
- **数据导出**：评分结果、候选人排名一键导出为 Excel
- **统计分析**：候选人排名、面试官评分分布、维度雷达图等多维分析
- **操作日志**：关键操作全程记录，便于审计追溯
- **候选人自注册**：可开放候选人自助填写信息入口

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 后端框架 | Python 3.13+ / FastAPI |
| 数据库 | MongoDB（Motor 异步驱动） |
| 认证 | JWT（python-jose） |
| 后端包管理 | [uv](https://github.com/astral-sh/uv) |
| 前端框架 | React 19 / TypeScript |
| 样式 | Tailwind CSS v4 |
| 状态管理 | Zustand + TanStack Query |
| 前端包管理 | [Bun](https://bun.sh) |

---

## 快速开始

### 环境要求

- Python >= 3.13
- [uv](https://github.com/astral-sh/uv) >= 0.4
- [Bun](https://bun.sh) >= 1.0
- MongoDB >= 6.0（本地或远程均可）

### 1. 克隆项目

```bash
git clone <repo-url>
cd simple-ats-rating
```

### 2. 后端启动

```bash
# 复制环境变量配置
cp .env.example .env
# 按需修改 .env 中的 MongoDB 连接地址、JWT 密钥等

# 安装依赖并启动（uv 会自动创建虚拟环境）
uv run main.py
```

服务默认运行在 `http://localhost:8000`，API 文档访问 `http://localhost:8000/docs`。

### 3. 前端启动

```bash
cd simple-ats-rating-ui

# 复制环境变量配置
cp .env.example .env
# 修改 .env 中的 VITE_API_URL，指向后端服务地址
# 例如：VITE_API_URL=http://localhost:8000/api/v1

# 安装依赖
bun install

# 开发模式启动
bun dev
```

前端默认运行在 `http://localhost:3000`。

### 4. 默认管理员账户

系统初始化后会创建默认管理员账号：

| 账号 | 密码 |
|------|------|
| `admin` | `Admin@123` |

> **安全提示**：部署到生产环境后，请立即登录并修改默认密码。

---

## 项目结构

```
simple-ats-rating/
├── app/
│   ├── api/v1/          # API 路由（认证、候选人、场次、评分、模板、统计等）
│   ├── core/            # 配置、安全、异常处理
│   ├── db/              # MongoDB 连接管理
│   ├── models/          # 数据模型
│   ├── schemas/         # Pydantic 数据验证
│   └── services/        # 业务逻辑层
├── simple-ats-rating-ui/
│   └── src/
│       ├── pages/       # 页面（管理员、面试官、认证）
│       ├── components/  # 组件库
│       ├── stores/      # 全局状态
│       └── services/    # API 调用层
├── uploads/             # 简历文件存储目录
├── main.py              # 后端入口
└── pyproject.toml       # 后端项目配置
```

---

## 角色说明

| 角色 | 权限说明 |
|------|----------|
| **管理员** | 管理用户、候选人、面试场次、评分模板；查看全部统计和日志；导入导出数据 |
| **面试官** | 查看分配的面试场次；查阅候选人信息和简历；提交和修改本人评分 |

---

## 后端环境变量说明

参考 `.env.example`，关键配置项如下：

```env
# MongoDB
MONGODB_URL=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=ats_system

# JWT 密钥（生产环境务必修改）
JWT_SECRET_KEY=your-secret-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# 允许的前端域名（CORS）
CORS_ORIGINS=http://localhost:3000

# 文件上传限制（默认 10MB）
MAX_UPLOAD_SIZE=10485760
ALLOWED_FILE_EXTENSIONS=.pdf,.doc,.docx
```

---

## License

MIT
