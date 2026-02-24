import { invoke } from "@tauri-apps/api/core";
import type { FileNode, ImageFileInfo } from "../stores/fileStore";

/**
 * 扫描目录结构
 */
export async function scanDirectory(path: string): Promise<FileNode> {
  return invoke<FileNode>("scan_directory", { path });
}

/**
 * 获取目录下的图片列表
 */
export async function listImages(dir: string): Promise<ImageFileInfo[]> {
  return invoke<ImageFileInfo[]>("list_images", { dir });
}

/**
 * 获取单个文件信息
 */
export async function getFileInfo(path: string): Promise<ImageFileInfo> {
  return invoke<ImageFileInfo>("get_file_info", { path });
}

/**
 * 获取单个缩略图
 */
export async function getThumbnail(path: string): Promise<string> {
  return invoke<string>("get_thumbnail", { path });
}

/**
 * 选择文件夹
 */
export async function selectFolder(): Promise<string | null> {
  return invoke<string | null>("select_folder");
}

/**
 * 选择图片文件
 */
export async function selectFiles(): Promise<ImageFileInfo[]> {
  return invoke<ImageFileInfo[]>("select_files");
}

/**
 * 清理缩略图缓存
 */
export async function cleanupThumbnailCache(maxAgeDays: number): Promise<number> {
  return invoke<number>("cleanup_thumbnail_cache", { maxAgeDays });
}

/**
 * 应用编辑预览
 */
export async function applyEditsPreview(
  path: string,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  brightness: number,
  contrast: number,
  saturation: number
): Promise<string> {
  return invoke<string>("apply_edits_preview", {
    path,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
  });
}

/**
 * 保存编辑后的图片
 */
export async function saveEditedImage(
  source: string,
  target: string,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  brightness: number,
  contrast: number,
  saturation: number,
  quality: number
): Promise<void> {
  return invoke("save_edited_image", {
    source,
    target,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    quality,
  });
}

/**
 * 选择保存路径
 */
export async function selectSavePath(defaultName: string): Promise<string | null> {
  return invoke<string | null>("select_save_path", { defaultName });
}

/**
 * 获取用户主目录
 */
export async function getHomeDir(): Promise<string> {
  return invoke<string>("get_home_dir");
}

/**
 * 应用水印预览
 */
export async function applyWatermarkPreview(
  path: string,
  text: string | null,
  watermarkImage: string | null,
  x: number,
  y: number,
  opacity: number,
  size: number,
  color: string,
  tiled: boolean,
  gap: number,
): Promise<string> {
  return invoke<string>("apply_watermark_preview", {
    path,
    text,
    watermarkImage,
    x,
    y,
    opacity,
    size,
    color,
    tiled,
    gap,
  });
}

/**
 * 批量添加水印
 */
export async function batchWatermark(
  files: string[],
  text: string | null,
  watermarkImage: string | null,
  x: number,
  y: number,
  opacity: number,
  size: number,
  color: string,
  tiled: boolean,
  gap: number,
  outputDir?: string
): Promise<number> {
  return invoke<number>("batch_watermark", {
    files,
    text,
    watermarkImage,
    x,
    y,
    opacity,
    size,
    color,
    tiled,
    gap,
    outputDir,
  });
}

/**
 * 批量重命名预览
 */
export async function batchRenamePreview(
  files: string[],
  pattern: string,
  startNumber: number
): Promise<[string, string][]> {
  return invoke<[string, string][]>("batch_rename_preview", {
    files,
    pattern,
    startNumber,
  });
}

/**
 * 执行批量重命名
 */
export async function batchRenameExecute(
  renames: [string, string][]
): Promise<number> {
  return invoke<number>("batch_rename_execute", { renames });
}

/**
 * 批量格式转换
 */
export async function batchConvert(
  files: string[],
  targetFormat: string,
  quality: number,
  outputDir?: string
): Promise<number> {
  return invoke<number>("batch_convert", {
    files,
    targetFormat,
    quality,
    outputDir,
  });
}

/**
 * 批量调整尺寸
 */
export async function batchResize(
  files: string[],
  width: number | null,
  height: number | null,
  maintainAspect: boolean,
  outputDir?: string
): Promise<number> {
  return invoke<number>("batch_resize", {
    files,
    width,
    height,
    maintainAspect,
    outputDir,
  });
}

/**
 * 创建拼图
 */
export async function createCollage(
  files: string[],
  layout: [number, number, number, number][], // [x%, y%, width%, height%]
  canvasWidth: number,
  canvasHeight: number,
  spacing: number,
  borderRadius: number,
  canvasBorderRadius: number,
  bgColor: string,
  outputPath: string
): Promise<void> {
  return invoke("create_collage", {
    files,
    layout,
    canvasWidth,
    canvasHeight,
    spacing,
    borderRadius,
    canvasBorderRadius,
    bgColor,
    outputPath,
  });
}

/**
 * 在资源管理器中显示
 */
export async function revealInExplorer(path: string): Promise<void> {
  return invoke("reveal_in_explorer", { path });
}

/**
 * 删除文件
 */
export async function deleteFile(path: string): Promise<void> {
  return invoke("delete_file", { path });
}
