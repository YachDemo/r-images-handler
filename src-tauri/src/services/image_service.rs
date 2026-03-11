use std::path::Path;
use image::{DynamicImage, ImageFormat, imageops, Rgba, GenericImageView};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use std::io::Cursor;
use ab_glyph::{FontRef, Font, PxScale, ScaleFont};
use imageproc::drawing::draw_text_mut;
use imageproc::geometric_transformations::{rotate_about_center, Interpolation};
use font_kit::source::SystemSource;
use font_kit::family_name::FamilyName;
use font_kit::properties::Properties;

/// 加载字体
fn load_font(custom_path_or_name: Option<&str>) -> Option<Vec<u8>> {
    if let Some(s) = custom_path_or_name {
        // 1. 尝试作为文件路径加载
        if let Ok(bytes) = std::fs::read(s) {
            return Some(bytes);
        }
        
        // 2. 尝试作为字体家族名称加载 (System Font)
        let source = SystemSource::new();
        let family = FamilyName::Title(s.to_string());
        if let Ok(handle) = source.select_best_match(&[family], &Properties::new()) {
            if let Ok(font) = handle.load() {
                // copy_font_data returns Option<Arc<Vec<u8>>>
                if let Some(data) = font.copy_font_data() {
                    return Some(data.to_vec());
                }
            }
        }
    }

    // 3. Fallback list
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
    angle: f32, 
    font_path: Option<String>,
    is_bold: bool,
    line_height: f32, // New: Line height multiplier (e.g. 1.2)
) -> Result<DynamicImage, String> {
    let mut img_rgba = img.to_rgba8();
    let width = img_rgba.width();
    let height = img_rgba.height();

    let mut wm_layer: Option<image::RgbaImage> = None;

    // 1. 文字水印 (支持多行)
    if let Some(txt) = text {
        if let Some(font_data) = load_font(font_path.as_deref()) {
            if let Ok(font) = FontRef::try_from_slice(&font_data) {
                let r = u8::from_str_radix(&color[1..3], 16).unwrap_or(255);
                let g = u8::from_str_radix(&color[3..5], 16).unwrap_or(255);
                let b = u8::from_str_radix(&color[5..7], 16).unwrap_or(255);
                let alpha = (opacity * 255.0) as u8;
                let text_color = Rgba([r, g, b, alpha]);

                let scale = PxScale::from(size);
                let scaled_font = font.as_scaled(scale);
                
                // 计算多行尺寸
                let lines: Vec<&str> = txt.split('\n').collect();
                // 实际行间距像素值
                let line_spacing_px = size * line_height; 
                // 总高度 = 第一行高度(size) + (行数-1) * 行间距
                // 注意：imageproc draw_text 坐标是基线还是左上角？通常是左上角。
                // 字体高度 approximate. scaled_font.height() gives ascent - descent.
                let font_h = scaled_font.height();
                let text_h = if lines.is_empty() { 0.0 } else { font_h + (lines.len() as f32 - 1.0) * line_spacing_px };
                
                let mut max_w = 0.0;
                for line in &lines {
                    let mut w = 0.0;
                    for c in line.chars() {
                        w += scaled_font.h_advance(scaled_font.glyph_id(c));
                    }
                    if w > max_w { max_w = w; }
                }
                let text_w = max_w;
                
                // 创建大画布防止旋转裁切
                let diag = (text_w * text_w + text_h * text_h).sqrt();
                let canvas_size = (diag * 1.5).ceil() as u32;
                
                if canvas_size > 0 {
                    let mut temp_img = image::RgbaImage::new(canvas_size, canvas_size);
                    
                    // 垂直居中起始点
                    let start_y = (canvas_size as f32 - text_h) / 2.0;
                    
                    for (i, line) in lines.iter().enumerate() {
                        // 计算当前行 Y
                        let y = start_y + i as f32 * line_spacing_px;
                        
                        // 计算当前行宽度以水平居中
                        let mut line_w = 0.0;
                        for c in line.chars() { line_w += scaled_font.h_advance(scaled_font.glyph_id(c)); }
                        let x = (canvas_size as f32 - line_w) / 2.0;
                        
                        let x_i32 = x as i32;
                        let y_i32 = y as i32;

                        draw_text_mut(&mut temp_img, text_color, x_i32, y_i32, scale, &font, line);
                        
                        if is_bold {
                            draw_text_mut(&mut temp_img, text_color, x_i32 + 1, y_i32, scale, &font, line);
                        }
                    }

                    wm_layer = Some(temp_img);
                }
            }
        }
    }
    // 2. 图片水印
    else if let Some(wm_path) = watermark_image {
        let wm_path = Path::new(&wm_path);
        if let Ok(wm_img) = image::open(wm_path) {
            let wm_width = (wm_img.width() as f32 * size) as u32;
            let wm_height = (wm_img.height() as f32 * size) as u32;
            
            let diag = ((wm_width * wm_width + wm_height * wm_height) as f32).sqrt();
            let canvas_size = (diag * 1.2).ceil() as u32;
            
            let wm_resized = wm_img.resize(wm_width, wm_height, imageops::FilterType::Lanczos3);
            let mut wm_rgba = image::RgbaImage::new(canvas_size, canvas_size);
            
            let draw_x = (canvas_size - wm_width) / 2;
            let draw_y = (canvas_size - wm_height) / 2;
            
            imageops::overlay(&mut wm_rgba, &wm_resized, draw_x as i64, draw_y as i64);

            for pixel in wm_rgba.pixels_mut() {
                if pixel.0[3] > 0 {
                    pixel.0[3] = (pixel.0[3] as f32 * opacity) as u8;
                }
            }
            wm_layer = Some(wm_rgba);
        }
    }

    // 应用水印
    if let Some(layer) = wm_layer {
        let mut final_layer = layer;

        if angle != 0.0 {
            let radians = angle.to_radians();
            final_layer = rotate_about_center(&final_layer, radians, Interpolation::Bilinear, Rgba([0, 0, 0, 0]));
        }

        let wm_w = final_layer.width();
        let wm_h = final_layer.height();

        if tiled {
            let step_x = (wm_w as f32 * gap) as usize;
            let step_y = (wm_h as f32 * gap) as usize;
            
            if step_x > 0 && step_y > 0 {
                for py in (0..height).step_by(step_y) {
                    for px in (0..width).step_by(step_x) {
                        imageops::overlay(&mut img_rgba, &final_layer, px as i64, py as i64);
                    }
                }
            }
        } else {
            let center_x = (width as f32 * x_ratio) as i64;
            let center_y = (height as f32 * y_ratio) as i64;
            
            let top_left_x = center_x - (wm_w as i64 / 2);
            let top_left_y = center_y - (wm_h as i64 / 2);
            
            imageops::overlay(&mut img_rgba, &final_layer, top_left_x, top_left_y);
        }
    }

    Ok(DynamicImage::ImageRgba8(img_rgba))
}

/// 处理水印逻辑
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
    angle: f32,
    font_path: Option<String>,
    is_bold: bool,
    line_height: f32,
) -> Result<DynamicImage, String> {
    let mut img = load_image(path)?;
    process_watermark_on_image(&mut img, text, watermark_image, x_ratio, y_ratio, opacity, size, color, tiled, gap, angle, font_path, is_bold, line_height)
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
    angle: f32,
    font_path: Option<String>,
    is_bold: bool,
    line_height: f32,
) -> Result<String, String> {
    let mut img = load_image(path)?;
    let (width, height) = img.dimensions();
    let max_dim = 800;

    if width > max_dim || height > max_dim {
        let scale = if width > height {
            max_dim as f32 / width as f32
        } else {
            max_dim as f32 / height as f32
        };

        let new_width = (width as f32 * scale) as u32;
        let new_height = (height as f32 * scale) as u32;
        img = img.resize(new_width, new_height, imageops::FilterType::Triangle);
        
        let scaled_size = size * scale;
        
        return process_watermark_on_image(&mut img, text, watermark_image, x_ratio, y_ratio, opacity, scaled_size, color, tiled, gap, angle, font_path, is_bold, line_height)
            .and_then(|i| image_to_base64(&i));
    }

    process_watermark_on_image(&mut img, text, watermark_image, x_ratio, y_ratio, opacity, size, color, tiled, gap, angle, font_path, is_bold, line_height)
        .and_then(|i| image_to_base64(&i))
}

/// 添加水印
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
    angle: f32,
    font_path: Option<String>,
    is_bold: bool,
    line_height: f32,
) -> Result<String, String> {
    apply_watermark_scaled(path, text, watermark_image, x_ratio, y_ratio, opacity, size, color, tiled, gap, angle, font_path, is_bold, line_height)
}

// ... Rest of file ...
pub fn rotate_image(path: &Path, degrees: i32) -> Result<String, String> {
    let img = load_image(path)?;
    let rotated = match degrees { 90 | -270 => img.rotate90(), 180 | -180 => img.rotate180(), 270 | -90 => img.rotate270(), _ => img };
    image_to_base64(&rotated)
}
pub fn flip_image(path: &Path, horizontal: bool) -> Result<String, String> {
    let img = load_image(path)?;
    let flipped = if horizontal { img.fliph() } else { img.flipv() };
    image_to_base64(&flipped)
}
pub fn adjust_colors(path: &Path, brightness: i32, contrast: i32, saturation: i32) -> Result<String, String> {
    let img = load_image(path)?;
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
            pixel.0 = [(rf * 255.0) as u8, (gf * 255.0) as u8, (bf * 255.0) as u8, a];
        }
    }
    let result = DynamicImage::ImageRgba8(rgba);
    image_to_base64(&result)
}
pub fn apply_edits_preview(path: &Path, rotation: i32, flip_h: bool, flip_v: bool, brightness: i32, contrast: i32, saturation: i32) -> Result<String, String> {
    let mut img = load_image(path)?;
    img = match rotation { 90 => img.rotate90(), 180 => img.rotate180(), 270 => img.rotate270(), _ => img };
    if flip_h { img = img.fliph(); }
    if flip_v { img = img.flipv(); }
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
                pixel.0 = [(rf * 255.0) as u8, (gf * 255.0) as u8, (bf * 255.0) as u8, a];
            }
        }
        img = DynamicImage::ImageRgba8(rgba);
    }
    let max_size = 1200;
    if img.width() > max_size || img.height() > max_size { img = img.thumbnail(max_size, max_size); }
    image_to_base64(&img)
}
pub fn save_edited_image(source: &Path, target: &Path, rotation: i32, flip_h: bool, flip_v: bool, brightness: i32, contrast: i32, saturation: i32, quality: u8) -> Result<(), String> {
    let mut img = load_image(source)?;
    img = match rotation { 90 => img.rotate90(), 180 => img.rotate180(), 270 => img.rotate270(), _ => img };
    if flip_h { img = img.fliph(); }
    if flip_v { img = img.flipv(); }
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
                pixel.0 = [(rf * 255.0) as u8, (gf * 255.0) as u8, (bf * 255.0) as u8, a];
            }
        }
        img = DynamicImage::ImageRgba8(rgba);
    }
    let format = target.extension().and_then(|e| e.to_str()).map(|e| match e.to_lowercase().as_str() { "png" => ImageFormat::Png, "gif" => ImageFormat::Gif, "webp" => ImageFormat::WebP, "bmp" => ImageFormat::Bmp, _ => ImageFormat::Jpeg }).unwrap_or(ImageFormat::Jpeg);
    img.save(target).map_err(|e| format!("保存失败: {}", e))
}
fn image_to_base64(img: &DynamicImage) -> Result<String, String> {
    let mut buffer = Cursor::new(Vec::new());
    img.write_to(&mut buffer, ImageFormat::Jpeg).map_err(|e| format!("编码失败: {}", e))?;
    let base64_str = BASE64.encode(buffer.get_ref());
    Ok(format!("data:image/jpeg;base64,{}", base64_str))
}
