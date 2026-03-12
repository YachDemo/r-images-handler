use std::path::Path;
use ab_glyph::{Font, FontRef, PxScale, ScaleFont};
use imageproc::drawing::draw_text_mut;
use crate::models::{FileNode, ImageFileInfo, TextOverlay, HistogramData};
use crate::services::{file_service, thumbnail_service, image_service, font_service};

/// 获取图片直方图
#[tauri::command]
pub async fn get_histogram(path: String) -> Result<HistogramData, String> {
    let source = Path::new(&path);
    image_service::get_histogram(source)
}

/// 扫描目录结构
#[tauri::command]
pub async fn scan_directory(path: String) -> Result<FileNode, String> {
    let path = Path::new(&path);
    file_service::scan_directory(path)
}

/// 获取系统字体列表
#[tauri::command]
pub async fn get_system_fonts() -> Result<Vec<String>, String> {
    Ok(font_service::get_system_fonts())
}

/// 获取目录下的图片列表
#[tauri::command]
pub async fn list_images(dir: String) -> Result<Vec<ImageFileInfo>, String> {
    let dir_path = Path::new(&dir);
    let mut images = file_service::list_images(dir_path)?;

    // 为每个图片添加缩略图路径
    for image in &mut images {
        let source = Path::new(&image.path);
        if let Ok(thumbnail_base64) = thumbnail_service::get_thumbnail_base64(source) {
            image.thumbnail_path = Some(thumbnail_base64);
        }
    }

    Ok(images)
}

/// 获取单个文件的信息
#[tauri::command]
pub async fn get_file_info(path: String) -> Result<ImageFileInfo, String> {
    let file_path = Path::new(&path);
    let mut info = file_service::get_image_info(file_path)?;

    // 添加缩略图
    if let Ok(thumbnail_base64) = thumbnail_service::get_thumbnail_base64(file_path) {
        info.thumbnail_path = Some(thumbnail_base64);
    }

    Ok(info)
}

/// 获取单个缩略图
#[tauri::command]
pub async fn get_thumbnail(path: String) -> Result<String, String> {
    let source = Path::new(&path);
    thumbnail_service::get_thumbnail_base64(source)
}

/// 选择文件夹
#[tauri::command]
pub async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let folder = app.dialog().file().blocking_pick_folder();

    Ok(folder.map(|f| f.to_string()))
}

/// 选择图片文件
#[tauri::command]
pub async fn select_files(app: tauri::AppHandle) -> Result<Vec<ImageFileInfo>, String> {
    use tauri_plugin_dialog::DialogExt;

    let files = app
        .dialog()
        .file()
        .add_filter("图片文件", &["jpg", "jpeg", "png", "gif", "webp", "bmp", "ico", "tiff", "tif"])
        .blocking_pick_files();

    match files {
        Some(paths) => {
            let mut images: Vec<ImageFileInfo> = Vec::new();
            for file_path in paths {
                let path_str = file_path.to_string();
                let path = Path::new(&path_str);
                if let Ok(mut info) = file_service::get_image_info(path) {
                    // 添加缩略图
                    if let Ok(thumbnail_base64) = thumbnail_service::get_thumbnail_base64(path) {
                        info.thumbnail_path = Some(thumbnail_base64);
                    }
                    images.push(info);
                }
            }
            Ok(images)
        }
        None => Ok(Vec::new()),
    }
}

/// 清理缩略图缓存
#[tauri::command]
pub async fn cleanup_thumbnail_cache(max_age_days: u32) -> Result<usize, String> {
    thumbnail_service::cleanup_cache(max_age_days)
}

/// 应用编辑预览
#[tauri::command]
pub async fn apply_edits_preview(
    path: String,
    rotation: i32,
    flip_h: bool,
    flip_v: bool,
    brightness: i32,
    contrast: i32,
    saturation: i32,
) -> Result<String, String> {
    let source = Path::new(&path);
    image_service::apply_edits_preview(source, rotation, flip_h, flip_v, brightness, contrast, saturation)
}

/// 保存编辑后的图片
#[tauri::command]
pub async fn save_edited_image(
    source: String,
    target: String,
    rotation: i32,
    flip_h: bool,
    flip_v: bool,
    brightness: i32,
    contrast: i32,
    saturation: i32,
    quality: u8,
) -> Result<(), String> {
    let source_path = Path::new(&source);
    let target_path = Path::new(&target);
    image_service::save_edited_image(
        source_path, target_path, rotation, flip_h, flip_v,
        brightness, contrast, saturation, quality
    )
}

/// 选择保存路径
#[tauri::command]
pub async fn select_save_path(app: tauri::AppHandle, default_name: String) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file = app
        .dialog()
        .file()
        .set_file_name(&default_name)
        .add_filter("JPEG", &["jpg", "jpeg"])
        .add_filter("PNG", &["png"])
        .add_filter("WebP", &["webp"])
        .blocking_save_file();

    Ok(file.map(|f| f.to_string()))
}

/// 获取用户主目录
#[tauri::command]
pub async fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "无法获取主目录".to_string())
}

/// 批量重命名预览
#[tauri::command]
pub async fn batch_rename_preview(
    files: Vec<String>,
    pattern: String,
    start_number: u32,
) -> Result<Vec<(String, String)>, String> {
    let mut results = Vec::new();

    for (index, file_path) in files.iter().enumerate() {
        let path = Path::new(file_path);
        let parent = path.parent().unwrap_or(Path::new(""));
        let extension = path.extension().and_then(|e| e.to_str()).unwrap_or("");

        // 替换模式中的占位符
        let new_name = pattern
            .replace("{n}", &format!("{:03}", start_number + index as u32))
            .replace("{name}", path.file_stem().and_then(|s| s.to_str()).unwrap_or(""))
            + if extension.is_empty() { "".to_string() } else { format!(".{}", extension) }.as_str();

        let new_path = parent.join(&new_name);
        results.push((file_path.clone(), new_path.to_string_lossy().to_string()));
    }

    Ok(results)
}

/// 执行批量重命名
#[tauri::command]
pub async fn batch_rename_execute(
    app: tauri::AppHandle,
    task_id: String,
    renames: Vec<(String, String)>
) -> Result<u32, String> {
    use crate::models::BatchProgressPayload;
    use tauri::Emitter;

    let mut success_count = 0;
    let total = renames.len() as u32;

    for (index, (old_path, new_path)) in renames.iter().enumerate() {
        if std::fs::rename(old_path, new_path).is_ok() {
            success_count += 1;
        }

        let _ = app.emit("batch-progress", BatchProgressPayload {
            task_id: task_id.clone(),
            progress: (index + 1) as u32,
            total,
            message: format!("正在重命名: {}", Path::new(new_path).file_name().unwrap_or_default().to_string_lossy()),
        });
    }

    Ok(success_count)
}

/// 批量格式转换
#[tauri::command]
pub async fn batch_convert(
    app: tauri::AppHandle,
    task_id: String,
    files: Vec<String>,
    target_format: String,
    quality: u8,
    output_dir: Option<String>,
) -> Result<u32, String> {
    use crate::models::BatchProgressPayload;
    use tauri::Emitter;
    use image::ImageFormat;

    let format = match target_format.to_lowercase().as_str() {
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "png" => ImageFormat::Png,
        "webp" => ImageFormat::WebP,
        "bmp" => ImageFormat::Bmp,
        _ => return Err("不支持的格式".to_string()),
    };

    let mut success_count = 0;
    let total = files.len() as u32;

    for (index, file_path) in files.iter().enumerate() {
        let source = Path::new(file_path);
        let file_name = source.file_name().unwrap_or_default().to_string_lossy();
        
        if let Ok(img) = image::open(source) {
            let file_stem = source.file_stem().and_then(|s| s.to_str()).unwrap_or("image");
            let new_name = format!("{}.{}", file_stem, target_format.to_lowercase());

            let target = if let Some(ref dir) = output_dir {
                Path::new(dir).join(&new_name)
            } else {
                source.parent().unwrap_or(Path::new("")).join(&new_name)
            };

            if img.save(&target).is_ok() {
                success_count += 1;
            }
        }

        let _ = app.emit("batch-progress", BatchProgressPayload {
            task_id: task_id.clone(),
            progress: (index + 1) as u32,
            total,
            message: format!("正在转换: {}", file_name),
        });
    }

    Ok(success_count)
}

/// 批量调整尺寸
#[tauri::command]
pub async fn batch_resize(
    app: tauri::AppHandle,
    task_id: String,
    files: Vec<String>,
    width: Option<u32>,
    height: Option<u32>,
    maintain_aspect: bool,
    output_dir: Option<String>,
) -> Result<u32, String> {
    use crate::models::BatchProgressPayload;
    use tauri::Emitter;

    let mut success_count = 0;
    let total = files.len() as u32;

    for (index, file_path) in files.iter().enumerate() {
        let source = Path::new(file_path);
        let file_name = source.file_name().unwrap_or_default().to_string_lossy();

        if let Ok(img) = image::open(source) {
            let resized = if maintain_aspect {
                let max_dim = width.unwrap_or(height.unwrap_or(1000));
                img.thumbnail(max_dim, max_dim)
            } else {
                let w = width.unwrap_or(img.width());
                let h = height.unwrap_or(img.height());
                img.resize_exact(w, h, image::imageops::FilterType::Lanczos3)
            };

            let target = if let Some(ref dir) = output_dir {
                let file_name = source.file_name().unwrap_or_default();
                Path::new(dir).join(file_name)
            } else {
                source.to_path_buf()
            };

            if resized.save(&target).is_ok() {
                success_count += 1;
            }
        }

        let _ = app.emit("batch-progress", BatchProgressPayload {
            task_id: task_id.clone(),
            progress: (index + 1) as u32,
            total,
            message: format!("正在调整尺寸: {}", file_name),
        });
    }

    Ok(success_count)
}

/// 创建拼图
#[tauri::command]
pub async fn create_collage(
    files: Vec<String>,
    layout: Vec<(f32, f32, f32, f32)>, // (x%, y%, width%, height%) 相对位置
    text_overlays: Vec<TextOverlay>,
    canvas_width: u32,
    canvas_height: u32,
    spacing: u32,
    border_radius: u32,
    canvas_border_radius: u32,
    bg_color: String,
    output_path: String,
) -> Result<(), String> {
    use image::{Rgba, RgbaImage, GenericImageView};

    if files.is_empty() {
        return Err("没有选择图片".to_string());
    }

    // 解析背景颜色 (格式: #RRGGBB)
    let bg = if bg_color.starts_with('#') && bg_color.len() == 7 {
        let r = u8::from_str_radix(&bg_color[1..3], 16).unwrap_or(30);
        let g = u8::from_str_radix(&bg_color[3..5], 16).unwrap_or(30);
        let b = u8::from_str_radix(&bg_color[5..7], 16).unwrap_or(30);
        Rgba([r, g, b, 255])
    } else {
        Rgba([30, 30, 30, 255])
    };

    // 创建画布
    let mut canvas = RgbaImage::from_pixel(canvas_width, canvas_height, bg);

    // 放置图片
    for (i, file_path) in files.iter().enumerate() {
        if i >= layout.len() {
            break;
        }

        let (x_pct, y_pct, w_pct, h_pct) = layout[i];

        // 计算实际像素位置和尺寸
        let x = ((x_pct / 100.0) * canvas_width as f32) as u32 + spacing;
        let y = ((y_pct / 100.0) * canvas_height as f32) as u32 + spacing;
        let target_w = ((w_pct / 100.0) * canvas_width as f32) as u32 - spacing * 2;
        let target_h = ((h_pct / 100.0) * canvas_height as f32) as u32 - spacing * 2;

        if target_w == 0 || target_h == 0 {
            continue;
        }

        // 加载并调整图片大小
        match image::open(file_path) {
            Ok(img) => {
                // 调整图片大小以填充目标区域，保持比例
                let resized = img.resize_to_fill(target_w, target_h, image::imageops::FilterType::Lanczos3);
                let rgba_img = resized.to_rgba8();

                // 复制像素到画布，带圆角处理
                for (px, py, pixel) in rgba_img.enumerate_pixels() {
                    let target_x = x + px;
                    let target_y = y + py;

                    if target_x >= canvas_width || target_y >= canvas_height {
                        continue;
                    }

                    // 图片圆角裁剪逻辑
                    if border_radius > 0 {
                        let r = border_radius as f32;
                        let w = target_w as f32;
                        let h = target_h as f32;
                        let px_f = px as f32;
                        let py_f = py as f32;

                        let mut is_outside = false;

                        // 左上角
                        if px_f < r && py_f < r {
                            if (px_f - r).powi(2) + (py_f - r).powi(2) > r.powi(2) {
                                is_outside = true;
                            }
                        }
                        // 右上角
                        else if px_f > w - r && py_f < r {
                            if (px_f - (w - r)).powi(2) + (py_f - r).powi(2) > r.powi(2) {
                                is_outside = true;
                            }
                        }
                        // 左下角
                        else if px_f < r && py_f > h - r {
                            if (px_f - r).powi(2) + (py_f - (h - r)).powi(2) > r.powi(2) {
                                is_outside = true;
                            }
                        }
                        // 右下角
                        else if px_f > w - r && py_f > h - r {
                            if (px_f - (w - r)).powi(2) + (py_f - (h - r)).powi(2) > r.powi(2) {
                                is_outside = true;
                            }
                        }

                        if is_outside {
                            continue;
                        }
                    }

                    canvas.put_pixel(target_x, target_y, *pixel);
                }
            }
            Err(e) => {
                eprintln!("无法打开图片 {}: {}", file_path, e);
            }
        }
    }

    // 画布圆角裁剪逻辑
    if canvas_border_radius > 0 {
        let r = canvas_border_radius as f32;
        let w = canvas_width as f32;
        let h = canvas_height as f32;

        for x in 0..canvas_width {
            for y in 0..canvas_height {
                let x_f = x as f32;
                let y_f = y as f32;
                let mut is_outside = false;

                // 左上角
                if x_f < r && y_f < r {
                    if (x_f - r).powi(2) + (y_f - r).powi(2) > r.powi(2) {
                        is_outside = true;
                    }
                }
                // 右上角
                else if x_f > w - r && y_f < r {
                    if (x_f - (w - r)).powi(2) + (y_f - r).powi(2) > r.powi(2) {
                        is_outside = true;
                    }
                }
                // 左下角
                else if x_f < r && y_f > h - r {
                    if (x_f - r).powi(2) + (y_f - (h - r)).powi(2) > r.powi(2) {
                        is_outside = true;
                    }
                }
                // 右下角
                else if x_f > w - r && y_f > h - r {
                    if (x_f - (w - r)).powi(2) + (y_f - (h - r)).powi(2) > r.powi(2) {
                        is_outside = true;
                    }
                }

                if is_outside {
                    canvas.put_pixel(x, y, Rgba([0, 0, 0, 0])); // 透明
                }
            }
        }
    }

    // 绘制文字叠加
    for overlay in text_overlays {
        if let Some(font_data) = image_service::load_font(overlay.font_path.as_deref()) {
            if let Ok(font) = FontRef::try_from_slice(&font_data) {
                let r = u8::from_str_radix(&overlay.color[1..3], 16).unwrap_or(255);
                let g = u8::from_str_radix(&overlay.color[3..5], 16).unwrap_or(255);
                let b = u8::from_str_radix(&overlay.color[5..7], 16).unwrap_or(255);
                let alpha = (overlay.opacity * 255.0) as u8;
                let text_color = Rgba([r, g, b, alpha]);

                let scale = PxScale::from(overlay.size);
                
                let x = ((overlay.x / 100.0) * canvas_width as f32) as i32;
                let y = ((overlay.y / 100.0) * canvas_height as f32) as i32;

                // 1. 绘制背景块
                if let Some(bg_hex) = overlay.bg_color {
                    let br = u8::from_str_radix(&bg_hex[1..3], 16).unwrap_or(0);
                    let bg = u8::from_str_radix(&bg_hex[3..5], 16).unwrap_or(0);
                    let bb = u8::from_str_radix(&bg_hex[5..7], 16).unwrap_or(0);
                    let bg_color = Rgba([br, bg, bb, alpha]);
                    
                    let padding = overlay.bg_padding.unwrap_or(10.0);
                    
                    // 计算文本包围盒
                    let scaled_font = font.as_scaled(scale);
                    let mut text_w = 0.0;
                    for c in overlay.text.chars() {
                        text_w += scaled_font.h_advance(scaled_font.glyph_id(c));
                    }
                    let text_h = scaled_font.height();
                    
                    let bg_w = text_w + padding * 2.0;
                    let bg_h = text_h + padding * 2.0;
                    
                    // 绘制简单矩形背景 (可选增强为圆角)
                    for px in 0..(bg_w as u32) {
                        for py in 0..(bg_h as u32) {
                            let tx = (x + px as i32 - padding as i32) as u32;
                            let ty = (y + py as i32 - (scaled_font.ascent() as i32 / 4)) as u32;
                            if tx < canvas_width && ty < canvas_height {
                                canvas.put_pixel(tx, ty, bg_color);
                            }
                        }
                    }
                }

                // 2. 绘制阴影
                if let Some(sh_hex) = overlay.shadow_color {
                    if let Some((sx, sy)) = overlay.shadow_offset {
                        let sr = u8::from_str_radix(&sh_hex[1..3], 16).unwrap_or(0);
                        let sg = u8::from_str_radix(&sh_hex[3..5], 16).unwrap_or(0);
                        let sb = u8::from_str_radix(&sh_hex[5..7], 16).unwrap_or(0);
                        let sh_color = Rgba([sr, sg, sb, alpha]);
                        draw_text_mut(&mut canvas, sh_color, x + sx as i32, y + sy as i32, scale, &font, &overlay.text);
                    }
                }

                // 3. 绘制描边 (多方向偏移)
                if let Some(st_hex) = overlay.stroke_color {
                    let sw = overlay.stroke_width.unwrap_or(2.0) as i32;
                    let str_r = u8::from_str_radix(&st_hex[1..3], 16).unwrap_or(0);
                    let str_g = u8::from_str_radix(&st_hex[3..5], 16).unwrap_or(0);
                    let str_b = u8::from_str_radix(&st_hex[5..7], 16).unwrap_or(0);
                    let st_color = Rgba([str_r, str_g, str_b, alpha]);
                    
                    for dx in -sw..=sw {
                        for dy in -sw..=sw {
                            if dx != 0 || dy != 0 {
                                draw_text_mut(&mut canvas, st_color, x + dx, y + dy, scale, &font, &overlay.text);
                            }
                        }
                    }
                }

                // 4. 绘制主体文字
                draw_text_mut(&mut canvas, text_color, x, y, scale, &font, &overlay.text);
            }
        }
    }

    // 保存结果
    canvas.save(&output_path)
        .map_err(|e| format!("保存失败: {}", e))?;

    Ok(())
}

/// 在资源管理器中显示
#[tauri::command]
pub async fn reveal_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .args(["/select,", &path]) // The comma after select is important
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        // Try dbus-send or xdg-open (xdg-open usually opens the file, not reveals it, unless it's a directory)
        // A common trick is to open the parent directory.
        if let Some(parent) = std::path::Path::new(&path).parent() {
             Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    
    Ok(())
}

/// 水印预览
#[tauri::command]
pub async fn apply_watermark_preview(
    path: String,
    text: Option<String>,
    watermark_image: Option<String>,
    x: f32,
    y: f32,
    opacity: f32,
    size: f32,
    color: String,
    tiled: bool,
    gap: f32,
    angle: f32,
    font_path: Option<String>,
    is_bold: bool,
    line_height: f32,
) -> Result<String, String> {
    let source = Path::new(&path);
    image_service::apply_watermark(source, text, watermark_image, x, y, opacity, size, color, tiled, gap, angle, font_path, is_bold, line_height)
}

/// 批量添加水印
#[tauri::command]
pub async fn batch_watermark(
    app: tauri::AppHandle,
    task_id: String,
    files: Vec<String>,
    text: Option<String>,
    watermark_image: Option<String>,
    x: f32,
    y: f32,
    opacity: f32,
    size: f32,
    color: String,
    tiled: bool,
    gap: f32,
    angle: f32,
    font_path: Option<String>,
    is_bold: bool,
    line_height: f32,
    output_dir: Option<String>,
) -> Result<u32, String> {
    use crate::models::BatchProgressPayload;
    use tauri::Emitter;

    let mut success_count = 0;
    let total = files.len() as u32;

    for (index, file_path) in files.iter().enumerate() {
        let source = Path::new(file_path);
        let file_name = source.file_name().unwrap_or_default().to_string_lossy();
        
        match image_service::process_watermark(
            source,
            text.clone(),
            watermark_image.clone(),
            x, y, opacity, size, color.clone(),
            tiled, gap, angle, font_path.clone(),
            is_bold, line_height,
        ) {
            Ok(img) => {
                let target = if let Some(ref dir) = output_dir {
                    let file_name = source.file_name().unwrap_or_default();
                    Path::new(dir).join(file_name)
                } else {
                    source.to_path_buf()
                };

                if img.save(&target).is_ok() {
                    success_count += 1;
                }
            },
            Err(e) => eprintln!("水印添加失败 {}: {}", file_path, e),
        }

        let _ = app.emit("batch-progress", BatchProgressPayload {
            task_id: task_id.clone(),
            progress: (index + 1) as u32,
            total,
            message: format!("正在添加水印: {}", file_name),
        });
    }
    
    Ok(success_count)
}

/// 删除文件 (永久删除)
#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path).map_err(|e| e.to_string())
}

/// 检查路径类型
#[tauri::command]
pub async fn check_path_type(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Ok("none".to_string());
    }
    if p.is_dir() {
        Ok("dir".to_string())
    } else {
        Ok("file".to_string())
    }
}
