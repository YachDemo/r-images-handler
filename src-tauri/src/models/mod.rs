use serde::{Deserialize, Serialize};

/// 文件节点（用于文件夹树）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileNode>>,
    pub expanded: bool,
}

/// EXIF 信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExifInfo {
    pub camera_model: Option<String>,
    pub f_number: Option<String>,
    pub iso: Option<String>,
    pub shutter_speed: Option<String>,
    pub focal_length: Option<String>,
}

/// 图片文件信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageFileInfo {
    pub path: String,
    pub name: String,
    pub extension: String,
    pub size: u64,
    pub size_formatted: String,
    pub width: u32,
    pub height: u32,
    pub modified: i64,
    pub modified_formatted: String,
    pub thumbnail_path: Option<String>,
    pub exif: Option<ExifInfo>,
}

/// 裁剪参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CropParams {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

/// 调整尺寸参数
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResizeParams {
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub maintain_aspect: bool,
}

/// 色彩调整参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorAdjustParams {
    pub brightness: f32,
    pub contrast: f32,
    pub saturation: f32,
}

/// 编辑操作
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum EditOperation {
    Crop(CropParams),
    Rotate { degrees: i32 },
    FlipHorizontal,
    FlipVertical,
    Resize(ResizeParams),
    AdjustColors(ColorAdjustParams),
}

/// 拼图文字叠加参数
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextOverlay {
    pub text: String,
    pub x: f32,
    pub y: f32,
    pub size: f32,
    pub color: String,
    pub opacity: f32,
    pub font_path: Option<String>,
    // 新增装饰属性
    pub stroke_color: Option<String>,
    pub stroke_width: Option<f32>,
    pub shadow_color: Option<String>,
    pub shadow_offset: Option<(f32, f32)>,
    pub bg_color: Option<String>,
    pub bg_padding: Option<f32>,
}

/// 批量处理进度载荷
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchProgressPayload {
    pub task_id: String,
    pub progress: u32,
    pub total: u32,
    pub message: String,
}
