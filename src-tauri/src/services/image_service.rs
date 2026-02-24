use std::path::Path;
use image::{DynamicImage, ImageFormat, imageops, Rgba, GenericImageView};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use std::io::Cursor;
use ab_glyph::{FontRef, Font, PxScale, ScaleFont};
use imageproc::drawing::draw_text_mut;

/// 加载字体 (尝试加载系统字体)
fn load_system_font() -> Option<Vec<u8>> {
    let paths = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ];

    for path in paths {
        if let Ok(bytes) = std::fs::read(path) {
            return Some(bytes);
        }
    }
    None
}

/// 加载图片
pub fn load_image(path: &Path) -> Result<DynamicImage, String> {
    image::open(path).map_err(|e| format!("无法打开图片: {}", e))
}

/// 内部处理逻辑 (作用于内存图片)
fn process_watermark_on_image(
    img: &mut DynamicImage,
    text: Option<String>,
    watermark_image: Option<String>,
    x_ratio: f32,
    y_ratio: f32,
    opacity: f32,
    size: f32,
    color: String,
    tiled: bool,
    gap: f32,
) -> Result<DynamicImage, String> {
    let mut img_rgba = img.to_rgba8();
    let width = img_rgba.width();
    let height = img_rgba.height();

    // 1. 文字水印
    if let Some(txt) = text {
        if let Some(font_data) = load_system_font() {
            if let Ok(font) = FontRef::try_from_slice(&font_data) {
                let r = u8::from_str_radix(&color[1..3], 16).unwrap_or(255);
                let g = u8::from_str_radix(&color[3..5], 16).unwrap_or(255);
                let b = u8::from_str_radix(&color[5..7], 16).unwrap_or(255);
                let alpha = (opacity * 255.0) as u8;
                let text_color = Rgba([r, g, b, alpha]);

                let scale = PxScale::from(size);
                
                if tiled {
                    let scaled_font = font.as_scaled(scale);
                    let mut text_w = 0.0;
                    for c in txt.chars() {
                        text_w += scaled_font.h_advance(scaled_font.glyph_id(c));
                    }
                    let text_h = size;
                    
                    let gap_x = text_w * gap;
                    let gap_y = text_h * gap;
                    
                    let step_x = (text_w + gap_x) as i32;
                    let step_y = (text_h + gap_y) as i32;
                    
                    if step_x > 0 && step_y > 0 {
                        for py in (0..height as i32).step_by(step_y as usize) {
                            for px in (0..width as i32).step_by(step_x as usize) {
                                draw_text_mut(&mut img_rgba, text_color, px, py, scale, &font, &txt);
                            }
                        }
                    }
                } else {
                    let x = (width as f32 * x_ratio) as i32;
                    let y = (height as f32 * y_ratio) as i32;
                    draw_text_mut(&mut img_rgba, text_color, x, y, scale, &font, &txt);
                }
            }
        }
    }

    // 2. 图片水印
    if let Some(wm_path) = watermark_image {
        let wm_path = Path::new(&wm_path);
        if let Ok(wm_img) = image::open(wm_path) {
            let wm_width = (wm_img.width() as f32 * size) as u32;
            let wm_height = (wm_img.height() as f32 * size) as u32;
            let wm_resized = wm_img.resize(wm_width, wm_height, imageops::FilterType::Lanczos3);

            let mut wm_rgba = wm_resized.to_rgba8();
            for pixel in wm_rgba.pixels_mut() {
                pixel.0[3] = (pixel.0[3] as f32 * opacity) as u8;
            }
            let wm_rgba_dynamic = DynamicImage::ImageRgba8(wm_rgba);

            if tiled {
                let gap_x = (wm_width as f32 * gap) as u32;
                let gap_y = (wm_height as f32 * gap) as u32;
                
                let step_x = wm_width + gap_x;
                let step_y = wm_height + gap_y;
                
                if step_x > 0 && step_y > 0 {
                    for py in (0..height).step_by(step_y as usize) {
                        for px in (0..width).step_by(step_x as usize) {
                            imageops::overlay(&mut img_rgba, &wm_rgba_dynamic, px as i64, py as i64);
                        }
                    }
                }
            } else {
                let x = (width as f32 * x_ratio) as i64;
                let y = (height as f32 * y_ratio) as i64;
                imageops::overlay(&mut img_rgba, &wm_rgba_dynamic, x, y);
            }
        }
    }

    Ok(DynamicImage::ImageRgba8(img_rgba))
}

/// 处理水印逻辑 (接收路径，用于批量处理)
pub fn process_watermark(
    path: &Path,
    text: Option<String>,
    watermark_image: Option<String>,
    x_ratio: f32,
    y_ratio: f32,
    opacity: f32,
    size: f32,
    color: String,
    tiled: bool,
    gap: f32,
) -> Result<DynamicImage, String> {
    let mut img = load_image(path)?;
    process_watermark_on_image(&mut img, text, watermark_image, x_ratio, y_ratio, opacity, size, color, tiled, gap)
}

/// 添加水印 (带缩放，用于预览)
pub fn apply_watermark_scaled(
    path: &Path,
    text: Option<String>,
    watermark_image: Option<String>,
    x_ratio: f32,
    y_ratio: f32,
    opacity: f32,
    size: f32,
    color: String,
    tiled: bool,
    gap: f32,
) -> Result<String, String> {
    let mut img = load_image(path)?;
    let (width, height) = img.dimensions();
    let max_dim = 1000;

    if width > max_dim || height > max_dim {
        let scale = if width > height {
            max_dim as f32 / width as f32
        } else {
            max_dim as f32 / height as f32
        };

        let new_width = (width as f32 * scale) as u32;
        let new_height = (height as f32 * scale) as u32;
        img = img.resize(new_width, new_height, imageops::FilterType::Lanczos3);
        
        let scaled_size = size * scale;
        
        return process_watermark_on_image(&mut img, text, watermark_image, x_ratio, y_ratio, opacity, scaled_size, color, tiled, gap)
            .and_then(|i| image_to_base64(&i));
    }

    // No resize needed
    process_watermark_on_image(&mut img, text, watermark_image, x_ratio, y_ratio, opacity, size, color, tiled, gap)
        .and_then(|i| image_to_base64(&i))
}

/// 添加水印 (旧接口兼容，或直接使用 scaled)
pub fn apply_watermark(
    path: &Path,
    text: Option<String>,
    watermark_image: Option<String>,
    x_ratio: f32,
    y_ratio: f32,
    opacity: f32,
    size: f32,
    color: String,
    tiled: bool,
    gap: f32,
) -> Result<String, String> {
    // 默认使用 scaled 版本以优化预览性能
    apply_watermark_scaled(path, text, watermark_image, x_ratio, y_ratio, opacity, size, color, tiled, gap)
}

/// 旋转图片
pub fn rotate_image(path: &Path, degrees: i32) -> Result<String, String> {
    let img = load_image(path)?;

    let rotated = match degrees {
        90 | -270 => img.rotate90(),
        180 | -180 => img.rotate180(),
        270 | -90 => img.rotate270(),
        _ => img,
    };

    image_to_base64(&rotated)
}

/// 翻转图片
pub fn flip_image(path: &Path, horizontal: bool) -> Result<String, String> {
    let img = load_image(path)?;

    let flipped = if horizontal {
        img.fliph()
    } else {
        img.flipv()
    };

    image_to_base64(&flipped)
}

/// 调整色彩
pub fn adjust_colors(
    path: &Path,
    brightness: i32,
    contrast: i32,
    saturation: i32,
) -> Result<String, String> {
    let img = load_image(path)?;
    let mut rgba = img.to_rgba8();

    let width = rgba.width();
    let height = rgba.height();

    for y in 0..height {
        for x in 0..width {
            let pixel = rgba.get_pixel_mut(x, y);
            let [r, g, b, a] = pixel.0;

            // 转换为浮点数处理
            let mut rf = r as f32 / 255.0;
            let mut gf = g as f32 / 255.0;
            let mut bf = b as f32 / 255.0;

            // 应用亮度 (-100 到 100)
            let brightness_factor = brightness as f32 / 100.0;
            rf = (rf + brightness_factor).clamp(0.0, 1.0);
            gf = (gf + brightness_factor).clamp(0.0, 1.0);
            bf = (bf + brightness_factor).clamp(0.0, 1.0);

            // 应用对比度 (-100 到 100)
            let contrast_factor = (contrast as f32 + 100.0) / 100.0;
            rf = ((rf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);
            gf = ((gf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);
            bf = ((bf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);

            // 应用饱和度 (-100 到 100)
            let saturation_factor = (saturation as f32 + 100.0) / 100.0;
            let gray = 0.299 * rf + 0.587 * gf + 0.114 * bf;
            rf = (gray + (rf - gray) * saturation_factor).clamp(0.0, 1.0);
            gf = (gray + (gf - gray) * saturation_factor).clamp(0.0, 1.0);
            bf = (gray + (bf - gray) * saturation_factor).clamp(0.0, 1.0);

            // 转回 u8
            pixel.0 = [
                (rf * 255.0) as u8,
                (gf * 255.0) as u8,
                (bf * 255.0) as u8,
                a,
            ];
        }
    }

    let result = DynamicImage::ImageRgba8(rgba);
    image_to_base64(&result)
}

/// 应用所有编辑操作并返回预览
pub fn apply_edits_preview(
    path: &Path,
    rotation: i32,
    flip_h: bool,
    flip_v: bool,
    brightness: i32,
    contrast: i32,
    saturation: i32,
) -> Result<String, String> {
    let mut img = load_image(path)?;

    // 应用旋转
    img = match rotation {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => img,
    };

    // 应用翻转
    if flip_h {
        img = img.fliph();
    }
    if flip_v {
        img = img.flipv();
    }

    // 应用色彩调整
    if brightness != 0 || contrast != 0 || saturation != 0 {
        let mut rgba = img.to_rgba8();
        let width = rgba.width();
        let height = rgba.height();

        for y in 0..height {
            for x in 0..width {
                let pixel = rgba.get_pixel_mut(x, y);
                let [r, g, b, a] = pixel.0;

                let mut rf = r as f32 / 255.0;
                let mut gf = g as f32 / 255.0;
                let mut bf = b as f32 / 255.0;

                // 亮度
                let brightness_factor = brightness as f32 / 100.0;
                rf = (rf + brightness_factor).clamp(0.0, 1.0);
                gf = (gf + brightness_factor).clamp(0.0, 1.0);
                bf = (bf + brightness_factor).clamp(0.0, 1.0);

                // 对比度
                let contrast_factor = (contrast as f32 + 100.0) / 100.0;
                rf = ((rf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);
                gf = ((gf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);
                bf = ((bf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);

                // 饱和度
                let saturation_factor = (saturation as f32 + 100.0) / 100.0;
                let gray = 0.299 * rf + 0.587 * gf + 0.114 * bf;
                rf = (gray + (rf - gray) * saturation_factor).clamp(0.0, 1.0);
                gf = (gray + (gf - gray) * saturation_factor).clamp(0.0, 1.0);
                bf = (gray + (bf - gray) * saturation_factor).clamp(0.0, 1.0);

                pixel.0 = [
                    (rf * 255.0) as u8,
                    (gf * 255.0) as u8,
                    (bf * 255.0) as u8,
                    a,
                ];
            }
        }
        img = DynamicImage::ImageRgba8(rgba);
    }

    // 生成预览（缩小尺寸以提高性能）
    let max_size = 1200;
    if img.width() > max_size || img.height() > max_size {
        img = img.thumbnail(max_size, max_size);
    }

    image_to_base64(&img)
}

/// 保存编辑后的图片
pub fn save_edited_image(
    source: &Path,
    target: &Path,
    rotation: i32,
    flip_h: bool,
    flip_v: bool,
    brightness: i32,
    contrast: i32,
    saturation: i32,
    quality: u8,
) -> Result<(), String> {
    let mut img = load_image(source)?;

    // 应用旋转
    img = match rotation {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => img,
    };

    // 应用翻转
    if flip_h {
        img = img.fliph();
    }
    if flip_v {
        img = img.flipv();
    }

    // 应用色彩调整
    if brightness != 0 || contrast != 0 || saturation != 0 {
        let mut rgba = img.to_rgba8();
        let width = rgba.width();
        let height = rgba.height();

        for y in 0..height {
            for x in 0..width {
                let pixel = rgba.get_pixel_mut(x, y);
                let [r, g, b, a] = pixel.0;

                let mut rf = r as f32 / 255.0;
                let mut gf = g as f32 / 255.0;
                let mut bf = b as f32 / 255.0;

                let brightness_factor = brightness as f32 / 100.0;
                rf = (rf + brightness_factor).clamp(0.0, 1.0);
                gf = (gf + brightness_factor).clamp(0.0, 1.0);
                bf = (bf + brightness_factor).clamp(0.0, 1.0);

                let contrast_factor = (contrast as f32 + 100.0) / 100.0;
                rf = ((rf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);
                gf = ((gf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);
                bf = ((bf - 0.5) * contrast_factor + 0.5).clamp(0.0, 1.0);

                let saturation_factor = (saturation as f32 + 100.0) / 100.0;
                let gray = 0.299 * rf + 0.587 * gf + 0.114 * bf;
                rf = (gray + (rf - gray) * saturation_factor).clamp(0.0, 1.0);
                gf = (gray + (gf - gray) * saturation_factor).clamp(0.0, 1.0);
                bf = (gray + (bf - gray) * saturation_factor).clamp(0.0, 1.0);

                pixel.0 = [
                    (rf * 255.0) as u8,
                    (gf * 255.0) as u8,
                    (bf * 255.0) as u8,
                    a,
                ];
            }
        }
        img = DynamicImage::ImageRgba8(rgba);
    }

    // 根据扩展名确定格式
    let format = target
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| match e.to_lowercase().as_str() {
            "png" => ImageFormat::Png,
            "gif" => ImageFormat::Gif,
            "webp" => ImageFormat::WebP,
            "bmp" => ImageFormat::Bmp,
            _ => ImageFormat::Jpeg,
        })
        .unwrap_or(ImageFormat::Jpeg);

    img.save(target).map_err(|e| format!("保存失败: {}", e))
}

/// 将图片转换为 base64
fn image_to_base64(img: &DynamicImage) -> Result<String, String> {
    let mut buffer = Cursor::new(Vec::new());
    img.write_to(&mut buffer, ImageFormat::Jpeg)
        .map_err(|e| format!("编码失败: {}", e))?;

    let base64_str = BASE64.encode(buffer.get_ref());
    Ok(format!("data:image/jpeg;base64,{}", base64_str))
}