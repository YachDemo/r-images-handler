use std::path::Path;
use image::{DynamicImage, ImageFormat, imageops};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use std::io::Cursor;

/// 加载图片
pub fn load_image(path: &Path) -> Result<DynamicImage, String> {
    image::open(path).map_err(|e| format!("无法打开图片: {}", e))
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
