use std::path::Path;
use walkdir::WalkDir;
use rayon::prelude::*;
use crate::models::{FileNode, ImageFileInfo, ExifInfo};
use exif::{In, Reader, Tag};

/// 支持的图片格式
const SUPPORTED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "gif", "webp", "bmp", "ico", "tiff", "tif", "heic", "heif"];

/// 检查是否为支持的图片格式
pub fn is_supported_image(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| SUPPORTED_EXTENSIONS.contains(&ext.to_lowercase().as_str()))
        .unwrap_or(false)
}

/// 读取 EXIF 信息
fn read_exif(path: &Path) -> Option<ExifInfo> {
    let file = std::fs::File::open(path).ok()?;
    let mut bufreader = std::io::BufReader::new(&file);
    let exif = Reader::new().read_from_container(&mut bufreader).ok()?;

    let get_value = |tag| {
        exif.get_field(tag, In::PRIMARY)
            .map(|f| f.display_value().with_unit(&exif).to_string())
            .map(|s| s.trim_matches('"').to_string()) // 去除可能存在的引号
    };

    Some(ExifInfo {
        camera_model: get_value(Tag::Model),
        f_number: get_value(Tag::FNumber),
        iso: get_value(Tag::PhotographicSensitivity),
        shutter_speed: get_value(Tag::ExposureTime),
        focal_length: get_value(Tag::FocalLength),
    })
}

/// 扫描目录，返回文件夹树结构
pub fn scan_directory(path: &Path) -> Result<FileNode, String> {
    if !path.exists() {
        return Err(format!("路径不存在: {:?}", path));
    }

    if !path.is_dir() {
        return Err(format!("不是目录: {:?}", path));
    }

    build_file_node(path, 0, 2) // 默认展开2层
}

fn build_file_node(path: &Path, current_depth: usize, max_depth: usize) -> Result<FileNode, String> {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("未知")
        .to_string();

    let is_dir = path.is_dir();

    let children = if is_dir && current_depth < max_depth {
        let mut child_nodes: Vec<FileNode> = Vec::new();

        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                // 只包含目录
                if entry_path.is_dir() {
                    // 跳过隐藏文件夹
                    if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                        if name.starts_with('.') {
                            continue;
                        }
                    }
                    if let Ok(child_node) = build_file_node(&entry_path, current_depth + 1, max_depth) {
                        child_nodes.push(child_node);
                    }
                }
            }
        }

        // 按名称排序
        child_nodes.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

        Some(child_nodes)
    } else {
        None
    };

    Ok(FileNode {
        path: path.to_string_lossy().to_string(),
        name,
        is_dir,
        children,
        expanded: current_depth < 1, // 只展开第一层
    })
}

/// 获取目录下的所有图片文件
pub fn list_images(dir: &Path) -> Result<Vec<ImageFileInfo>, String> {
    if !dir.exists() {
        return Err(format!("目录不存在: {:?}", dir));
    }

    // 1. 先收集所有文件路径 (串行但快速)
    let entries: Vec<_> = WalkDir::new(dir)
        .max_depth(1)
        .into_iter()
        .flatten()
        .filter(|e| e.path().is_file())
        .collect();

    // 2. 并行处理文件信息 (读取元数据和尺寸)
    let mut images: Vec<ImageFileInfo> = entries
        .par_iter()
        .filter(|entry| is_supported_image(entry.path()))
        .filter_map(|entry| get_image_info(entry.path()).ok())
        .collect();

    // 3. 按名称排序
    images.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(images)
}

/// 获取单个图片文件的信息
pub fn get_image_info(path: &Path) -> Result<ImageFileInfo, String> {
    let metadata = std::fs::metadata(path)
        .map_err(|e| format!("无法读取文件元数据: {}", e))?;

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("未知")
        .to_string();

    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let size = metadata.len();
    let size_formatted = format_size(size);

    // 获取图片尺寸
    let (width, height) = match image::image_dimensions(path) {
        Ok((w, h)) => (w, h),
        Err(_) => (0, 0),
    };

    // 获取 EXIF 信息 (尝试读取)
    let exif = read_exif(path);

    // 获取修改时间
    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let modified_formatted = chrono::DateTime::from_timestamp(modified, 0)
        .map(|dt| dt.format("%Y-%m-%d %H:%M").to_string())
        .unwrap_or_else(|| "未知".to_string());

    Ok(ImageFileInfo {
        path: path.to_string_lossy().to_string(),
        name,
        extension,
        size,
        size_formatted,
        width,
        height,
        modified,
        modified_formatted,
        thumbnail_path: None, // 稍后由缩略图服务填充
        exif,
    })
}

/// 格式化文件大小
fn format_size(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}
