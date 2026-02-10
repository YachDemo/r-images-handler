# R-Image Studio (r-images-handler)

![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)
![Rust](https://img.shields.io/badge/Rust-2021-orange?logo=rust)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css)

**R-Image Studio** 是一款基于 Rust 和 Tauri 构建的高性能桌面图片处理工具。它结合了 Rust 的极致性能与现代前端的高效交互，旨在为用户提供快速、流畅的本地图片管理与批处理体验。

## 核心特性

- 🚀 **高性能后端**：基于 Rust `image` 库与 `rayon` 并行计算，充分利用多核 CPU。
- 🖼️ **全能编辑器**：支持色彩平衡、亮度/对比度调节、滤镜等实时预览编辑。
- 📦 **批量任务**：支持批量转换格式、批量重命名、批量调整尺寸及拼图功能。
- 📂 **智能管理**：内置文件浏览器，支持文件夹树导航、图片缩略图高效渲染。
- ⚡ **原生体验**：跨平台桌面应用，内存占用低，响应速度快。

---

## 操作手册 (User Guide)

### 1. 基础浏览
- **侧边栏**：左侧展示系统目录树，点击文件夹即可快速加载其中的图片。
- **视图切换**：主界面支持 **网格模式** (Grid) 和 **列表模式** (List)，通过工具栏图标快速切换。
- **快速预览**：在图片列表双击或点击预览图标，可进入大图预览模式。

### 2. 图片编辑
- **进入编辑器**：选中单张图片，点击工具栏的“编辑”按钮。
- **色彩调整**：
    - 使用右侧面板的滑块调整 **RGB**、**亮度**、**对比度** 等。
    - 编辑过程中可随时点击“撤销”或“重置”。
- **保存结果**：编辑完成后可选择覆盖原图或另存为新文件。

### 3. 批量处理 (Batch Operations)
点击工具栏的“批量任务”菜单，可开启以下功能：
- **批量转换**：支持 PNG, JPEG, WebP, AVIF 等格式互转。
- **批量重命名**：支持模板化重命名（如：`img_{index}_{date}`）。
- **批量缩放**：按百分比或固定宽高统一调整图片尺寸。
- **智能拼图 (Collage)**：选中多张图片，自动生成组合拼图。

### 4. 属性面板
选中图片后，右侧面板会显示该图片的详细 EXIF 信息（如拍摄设备、地理位置、分辨率、色彩空间等）。

---

## 技术架构

### 后端 (Rust / Tauri)
- **`image` & `imageproc`**：核心图像处理引擎。
- **`rayon`**：实现批量任务的并行化。
- **`notify`**：监听本地文件系统变更，实现同步更新。
- **`tokio`**：处理异步 I/O 任务。

### 前端 (TypeScript / React)
- **`Zustand`**：轻量级状态管理，处理选区、编辑器状态及 UI 交互。
- **`TanStack Virtual`**：实现海量图片的超长列表虚拟滚动。
- **`Lucide React`**：优雅的矢量图标库。
- **`Tailwind CSS`**：极速 UI 开发。

---

## 开发与构建

### 前提条件
- 已安装 [Rust](https://www.rust-lang.org/) (推荐 1.75+)
- 已安装 Node.js (推荐 20+) 及 [pnpm](https://pnpm.io/)
- 安装对应平台的 WebKit / WebView2 开发包

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm tauri dev
```

### 构建生产版本
```bash
pnpm tauri build
```

---

## 许可证
MIT License.