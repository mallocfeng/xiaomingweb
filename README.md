# xiaomingweb

一个承载 `TS70_246K` 机台数据的全栈探索面板，后端负责从 SQL Server 拉取记录，前端提供动感的筛选/状态视图。

## 目录
- `server/`：Express 服务、数据库连接、查询构造器与简单测试
- `public/`：静态页面（CSS + JS）展示筛选与结果卡片
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

`PORT` 控制 Express 监听端口，其他值用于 `mssql` 连接池。

## 安装与调试

```bash
npm install        # 安装依赖
npm run dev        # 开发模式（NODE_ENV=development）
npm run test       # 执行所有 node:test 套件
npm run start      # 生产启动
```

## API 摘要

- `GET /api/status`：返回在线状态。
- `POST /api/search`：可传入 `rangeKey`、`startTime`、`stopTime`、`sn`、`orderName`、`stationFilters`、`limit`。
  - `stationFilters` 格式：`[{ key: 'OP10', status: 'OK' }]`。
  - 返回字段：`count` 与 `data`（直接来自 `TS70_246K`）。

## 前端特点

1. **时间范围控制**：右上角的下拉只能选择五种预设（最近 1/6/24/72 小时与当天），并会在说明栏里实时更新。请求体会把对应的 ISO 时间传到后端。
2. **工站 OK/NG 筛选**：每个工站提供两个按钮（OK/NG），点击可开启对应状态，二次点击则清除。当至少一个状态被选中时，前端会把对应记录化成 `stationFilters`。
3. **结果卡片**：返回的 SN/订单信息、时间与人员固化在卡片中，底部以动效出现的 badge 显示各工站的 OK/NG 状态。
4. **交互反馈**：查询时按钮禁用、状态提示变化，并在 `results` 区展示“无数据”提示。

## 数据库表结构（已有）

```sql
CREATE TABLE dbo.TS70_246K (...)
```

确保表已存在于目标数据库后再运行本程序。

## 技术栈

- Node.js 20+、Express、mssql
- 原生 `node:test` + `supertest`
- 纯前端 ES 模块 + CSS 动画

## 后续建议

- 在生产部署时为 `.env` 提供安全凭据（例如用 secrets 管理）。
- 可以加上缓存层或分页策略以应对大量数据。EOF