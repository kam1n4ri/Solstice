pub mod commands;

use commands::*;
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::Destroyed | tauri::WindowEvent::CloseRequested { .. } => {
                    let label = window.label();
                    if let Some(tool_id) = label.strip_prefix("tool-") {
                        let _ = window.app_handle().emit(
                            "tool-window-state-changed",
                            serde_json::json!({
                                "toolId": tool_id,
                                "isOpen": false,
                                "isFocused": false
                            }),
                        );
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_active_tools,
            open_tool_window,
            close_window,
            minimize_window,
            maximize_window,
            get_recent_files,
            get_installed_fonts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
