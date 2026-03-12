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

### 2.1 前后端通信 (IPC)
*   **Commands**: 所有的重型图片处理（缩略图生成、批量重命名、滤镜应用）均在 Rust 后端完成。
*   **Services**: 前端 `src/services/tauriApi.ts` 封装了所有 `invoke` 调用。

### 2.2 非破坏性编辑系统 (Non-Destructive Editing)
为了保证用户对图片的修改是“可追溯、可撤销”的，我们引入了本地数据库记录修改指令。

*   **存储位置**: 用户应用数据目录下的 `image_studio.db`（由 Tauri 插件自动管理）。
*   **核心逻辑**: 
    1.  **保存**: 当用户在编辑器修改参数（亮度、旋转等）并点击保存时，物理文件会被改写，同时当前的编辑状态以 JSON 格式存入 SQLite 数据库。
    2.  **加载**: 再次打开该文件时，`editorStore` 会通过 `hash` (优先) 和 `path` 异步从数据库加载历史参数并恢复滑块位置。
    3.  **另存为**: 另存为新文件时，系统会自动为新路径建立一份相同的编辑历史副本。
    4.  **路径追踪 (Path Tracking)**: 为了防止文件重命名或移动导致历史丢失，系统引入了 **文件采样指纹 (MD5)**。如果 `hash` 匹配但 `path` 变了，数据库会自动同步更新路径字段。
*   **关键文件**:
    *   `src/services/dbService.ts`: 处理数据库初始化及 SQL 执行。
    *   `src/stores/editorStore.ts`: 处理内存状态与持久化状态的同步逻辑。
    *   `src/components/layout/SettingsDialog.tsx`: 包含“存储管理”模块，允许清理缓存。

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

### 4.1 如何添加新的编辑功能（如“对比度”）
1.  **后端模型**: 在 `src-tauri/src/models/mod.rs` 的 `ColorAdjustParams` 或 `EditOperation` 中添加对应字段。
2.  **后端渲染**: 更新 `src-tauri/src/services/image_service.rs` 中的处理逻辑，确保 Rust 能渲染该效果。
3.  **前端 Store**: 更新 `src/stores/editorStore.ts` 中的 `initialEditState` 和接口定义。
4.  **自动持久化**: `saveCurrentEdits` 会自动捕捉新字段，无需修改 SQL。

### 4.2 权限管理 (Tauri 2.0 规范)
如果你添加了新的 Tauri 插件或需要访问特定的系统资源，必须修改权限配置文件：
*   **文件**: `src-tauri/capabilities/default.json`
*   **示例**: 目前已授权数据库操作：`"permissions": ["sql:default", ...]`

### 4.3 性能与安全
*   **数据爆炸防护**: 数据库记录会随时间增加。已在“设置”中提供手动清理功能。后续可考虑基于 `notify` 插件在文件删除时同步清理数据库。
*   **并行计算**: 所有的批量操作应继续使用 `rayon` 在后台线程执行，避免阻塞主进程。

---

## 5. 开发环境启动
```bash
# 1. 安装前端与插件依赖
pnpm install

# 2. 启动开发服务器 (自动编译 Rust 后端)
pnpm tauri dev
```

---

## 6. 待办事项 (Roadmap)
*   [ ] **文件指纹 (Content Hashing)**: 目前基于路径匹配历史，若用户在外部移动文件会丢失记录。建议引入 MD5/SHA 校验。
*   [ ] **无限撤销 (Action History)**: 将目前的单状态存储改为原子操作序列存储，实现类似 Photoshop 的历史记录面板。
*   [ ] **AI 增强**: 准备接入 ONNX Runtime 进行本地图片超分。
