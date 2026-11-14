pub mod commands;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
