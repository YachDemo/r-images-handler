pub mod commands;
pub mod models;
pub mod services;

use commands::{
    scan_directory, list_images, get_file_info,
    get_thumbnail, select_folder, select_files, cleanup_thumbnail_cache,
    apply_edits_preview, save_edited_image, select_save_path, get_home_dir,
    batch_rename_preview, batch_rename_execute, batch_convert, batch_resize,
    create_collage, reveal_in_explorer, delete_file, check_path_type,
    apply_watermark_preview, batch_watermark, get_system_fonts, get_histogram
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            list_images,
            get_file_info,
            get_thumbnail,
            select_folder,
            select_files,
            cleanup_thumbnail_cache,
            apply_edits_preview,
            save_edited_image,
            select_save_path,
            get_home_dir,
            batch_rename_preview,
            batch_rename_execute,
            batch_convert,
            batch_resize,
            create_collage,
            reveal_in_explorer,
            delete_file,
            check_path_type,
            apply_watermark_preview,
            batch_watermark,
            get_system_fonts,
            get_histogram
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
