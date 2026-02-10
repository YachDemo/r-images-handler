use std::path::{Path, PathBuf};
use std::fs;
use image::GenericImageView;
use rayon::prelude::*;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

const THUMBNAIL_SIZE: u32 = 400;

/// 获取缓存目录
fn get_cache_dir() -> PathBuf {
    let cache_dir = dirs::cache_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("r-images-handler")
        .join("thumbnails");

    if !cache_dir.exists() {
        let _ = fs::create_dir_all(&cache_dir);
    }

    cache_dir
}

/// 计算缓存路径
fn get_cache_path(source: &Path) -> PathBuf {
    let hash = md5::compute(source.to_string_lossy().as_bytes());
    get_cache_dir().join(format!("{:x}.jpg", hash))
}

/// 检查缓存是否有效
fn is_cache_valid(source: &Path, cached: &Path) -> bool {
    if !cached.exists() {
        return false;
    }

    let source_modified = fs::metadata(source)
        .and_then(|m| m.modified())
        .ok();
    let cached_modified = fs::metadata(cached)
        .and_then(|m| m.modified())
        .ok();

    match (source_modified, cached_modified) {
        (Some(src), Some(cache)) => cache > src,
        _ => false,
    }
}

/// 生成单个缩略图
pub fn generate_thumbnail(source: &Path) -> Result<PathBuf, String> {
    let cache_path = get_cache_path(source);

    // 检查缓存
    if is_cache_valid(source, &cache_path) {
        return Ok(cache_path);
    }

    // 加载图片
    let img = image::open(source)
        .map_err(|e| format!("无法打开图片: {}", e))?;

    // 生成缩略图
    let thumbnail = img.thumbnail(THUMBNAIL_SIZE, THUMBNAIL_SIZE);

    // 保存缩略图
    thumbnail
        .save(&cache_path)
        .map_err(|e| format!("无法保存缩略图: {}", e))?;

    Ok(cache_path)
}

/// 获取缩略图的 base64 编码
pub fn get_thumbnail_base64(source: &Path) -> Result<String, String> {
    let cache_path = generate_thumbnail(source)?;

    let bytes = fs::read(&cache_path)
        .map_err(|e| format!("无法读取缩略图: {}", e))?;

    let base64_str = BASE64.encode(&bytes);
    Ok(format!("data:image/jpeg;base64,{}", base64_str))
}

/// 批量生成缩略图（并行处理）
pub fn generate_thumbnails_batch(sources: &[PathBuf]) -> Vec<Result<PathBuf, String>> {
    sources
        .par_iter()
        .map(|source| generate_thumbnail(source))
        .collect()
}

/// 清理过期缓存
pub fn cleanup_cache(max_age_days: u32) -> Result<usize, String> {
    let cache_dir = get_cache_dir();
    let mut removed_count = 0;

    let max_age = std::time::Duration::from_secs(max_age_days as u64 * 24 * 60 * 60);
    let now = std::time::SystemTime::now();

    if let Ok(entries) = fs::read_dir(&cache_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Ok(metadata) = fs::metadata(&path) {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(age) = now.duration_since(modified) {
                        if age > max_age {
                            if fs::remove_file(&path).is_ok() {
                                removed_count += 1;
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(removed_count)
}
