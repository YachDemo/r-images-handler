# R-Image Studio 开发维护手册

## 1. 技术栈概览
*   **跨平台框架**: Tauri 2.0 (Stable)
*   **前端**: React 19 + TypeScript + TailwindCSS 4.0
*   **状态管理**: Zustand 5.0 (切片式存储)
*   **后端**: Rust (Edition 2021)
*   **持久化**: SQLite (通过 `tauri-plugin-sql`)
*   **图片引擎**: `image` + `imageproc` + `rayon` (并行处理)

---

## 2. 核心架构设计

### 2.1 格式支持策略 (跨平台兼容性优先)
为了保证项目在 Windows、macOS 和 Linux 上都能实现“零配置编译”，我们优先使用纯 Rust 实现的解码器：

*   **常规格式 (JPG, PNG, WebP等)**: 使用 `image` crate 原生支持。
*   **RAW 格式**: 集成 **`rawloader`** (纯 Rust)。目前支持读取元数据和相机型号识别。
*   **HEIC 格式**: 由于 Rust 生态目前缺乏稳定的纯 Rust 解码器，本项目暂时对 HEIC 采取“提示建议”策略。
    *   *未来计划*: 考虑引入 **Tauri Sidecar** (如静态编译的 `ffmpeg` 或 `magick`) 来实现跨平台的格式转换，而不破坏 Rust 项目的纯净性。

### 2.2 非破坏性编辑系统 (Non-Destructive Editing)
*   **路径追踪 (Path Tracking)**: 为了防止文件重命名或移动导致历史丢失，系统引入了 **文件采样指纹 (MD5)**。如果 `hash` 匹配但 `path` 变了，数据库会自动同步更新路径字段。
*   **存储位置**: 用户应用数据目录下的 `image_studio.db`（由 Tauri 插件自动管理）。

---

## 3. 数据库 Schema
目前包含 `image_edits` 表：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | INTEGER (PK) | 自增主键 |
| `path` | TEXT | 图片的绝对路径 |
| `hash` | TEXT | 图片内容的 MD5 采样指纹 (前 1MB) |
| `edit_sequence` | TEXT | JSON 序列化后的编辑指令 |
| `last_modified` | DATETIME | 记录更新时间 |

---

## 4. 后续开发者指南

### 4.1 如何添加新的编辑功能
1.  **后端模型**: 在 `src-tauri/src/models/mod.rs` 中添加字段。
2.  **后端渲染**: 更新 `src-tauri/src/services/image_service.rs` 中的处理逻辑。
3.  **前端 Store**: 更新 `src/stores/editorStore.ts` 接口。

### 4.2 权限管理 (Tauri 2.0 规范)
*   **文件**: `src-tauri/capabilities/default.json`
*   **权限**: 目前已授权 `sql:default`, `fs:default`, `opener:default` 等。

---

## 5. 开发环境启动
```bash
# 1. 安装前端与插件依赖
pnpm install

# 2. 启动开发服务器
pnpm tauri dev
```

---

## 6. 待办事项 (Roadmap)
*   [ ] **跨平台格式转换 Sidecar**: 引入一个轻量级的二进制转换工具，用于支持 HEIC 和 高级 RAW 开发。
*   [ ] **无限撤销 (Action History)**: 将目前的单状态存储改为原子操作序列存储。
*   [ ] **AI 增强**: 准备接入 ONNX Runtime 进行本地图片超分 (ESRGAN)。
