# xiaomingweb

一个承载 `TS70_246K` 机台数据的全栈探索面板，后端负责从 SQL Server 拉取记录，前端提供动感的筛选/状态视图。

## 目录
- `server/`：Express 服务、数据库连接、查询构造器与简单测试
- `public/`：静态页面（CSS + JS）展示筛选与结果卡片，并包含两个 Dashboard 版本
- `tests/`：纯前端逻辑测试（filterUtils）

## 环境变量
复制 `.env.example` 为 `.env` 并填入真实信息：

```env
DB_HOST=127.0.0.1
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=Admin12345
DB_NAME=xiaoming
PORT=3000
```

可选项（控制查询使用的表）：`DB_SCHEMA` 默认留空以避免自动加 `dbo`；填写后会拼接 `schema.table`，`DB_TABLE` 允许自定义具体表名，UI 和 API 一致使用该值。

额外 TLS 相关配置：`DB_ENCRYPT` 默认 `false`（避免 TLS 服务器名称限制），需要加密时设为 `true` 并配合正确的 `DB_SERVER_NAME`（例如 `localhost`、`db.mycorp.com`），否则可继续保持 `false`。

`PORT` 控制 Express 监听端口，其他值用于 `mssql` 连接池。

## 安装与调试

```bash
npm install        # 安装依赖
npm run dev        # 开发模式（NODE_ENV=development）
npm run test       # 执行所有 node:test 套件
npm run start      # 生产启动
```

## API 与前端摘要

- `GET /api/status`：返回在线状态。
- `POST /api/search`：可传入 `rangeKey`、`startTime`、`stopTime`、`sn`、`orderName`、`stationFilters`、`limit`。
  - `stationFilters` 格式：`[{ key: 'OP10', status: 'OK' }]`。
  - 返回字段：`count` 与 `data`（直接来自 `TS70_246K`）。

## 前端特点

1. **双版本界面**：
   - `public/index.html`（Aurora / Caramel 皮肤，可切换）内含更柔和的表单、结果卡片、阴影，适配 `styles.css`。
   - `public/production-dashboard.html`（已优化的 V1）和 `public/production-dashboard-v2.html`（JSON 驱动、10s 自动刷新）分别提供传统卡片视图与新配色的看板。
2. **时间范围快捷选择**：在查询面板顶部新增 1h/2h/8h/1d/7d 预设按钮，点击即更新两个 `datetime-local` 输入，提交时也带上序列化后的 ISO 时间。
3. **工站 OK/NG 筛选**：每个工站提供两个状态按钮，默认都选，点击会变色且不会同时取消两个状态。
4. **记录上限联动**：下拉 “最多记录” 会同步到右上“最大记录”展示。
5. **皮肤切换（Aurora/Caramel）**：右上按钮切换配色，Caramel 为默认主题且会保存到 `localStorage`。
6. **表格 + 图表自适应（production-dashboard-v2）**：表格会监测容器高度并缩放，Pie/Bar 图从 `production-dashboard-data.json` 读取内容，10 秒自动刷新，Legend、图例字体随主题调色。

> **不在 README 中保留任何生产数据库凭据或明文密码。**

## 技术栈

- Node.js 20+、Express、`mssql`
- 原生 `node:test` + `supertest`
- 纯前端 ES 模块 + CSS 动画

## 后续建议

- 生产环境可借助 `.env` 之外的 secret 管理工具（如 Vault/Secrets Manager）保护数据库凭证。
- 针对大数据量，建议在 `POST /api/search` 引入分页/缓存或在 API 端利用索引与 `TOP` 限制。
