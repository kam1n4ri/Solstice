pub mod commands;
pub mod cutout_engine;
pub mod inpaint_engine;
pub mod photo_file_ops;
pub mod tone_engine;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_active_tools,
            open_tool_window,
            get_recent_files,
            get_installed_fonts,
            photo_get_directory,
            photo_open_file,
            photo_save_file,
            photo_export_file,
            photo_apply_tone,
            photo_refine_cutout,
            photo_inpaint,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
