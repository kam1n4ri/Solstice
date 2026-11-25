pub mod commands;
pub mod workspace_commands;
pub mod window_close;
pub mod pdf_engine;
pub mod pdf_commands;
pub mod pdf_tool_commands;
pub mod docs_types;
pub mod docs_engine;
pub mod docs_save;
pub mod docs_commands;
pub mod whiteboard_types;
pub mod whiteboard_engine;
pub mod whiteboard_commands;
pub mod font_types;
pub mod font_engine;
pub mod font_commands;

use commands::*;
use workspace_commands::{get_solstice_storage_info, open_solstice_folder};
use window_close::{cancel_close, close_window, handle_window_event, CloseHandshakeState};
use pdf_commands::*;
use pdf_tool_commands::*;
use docs_commands::*;
use whiteboard_commands::*;
use font_commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(CloseHandshakeState::default())
        .on_window_event(|window, event| {
            handle_window_event(window, event);
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            get_solstice_storage_info,
            open_solstice_folder,
            get_active_tools,
            open_tool_window,
            close_window,
            cancel_close,
            minimize_window,
            maximize_window,
            get_recent_files,
            get_installed_fonts,
            pdf_open_file,
            pdf_read_file,
            pdf_save_file,
            pdf_export_file,
            pdf_rename_file,
            pdf_select_files,
            pdf_select_images,
            pdf_save_files_to_folder,
            reveal_in_folder,
            delete_file,
            docs_open_file,
            docs_save_file,
            docs_auto_save,
            docs_export_file,
            whiteboard_open_file,
            whiteboard_save_file,
            whiteboard_auto_save,
            whiteboard_export_file,
            save_installed_font,
            import_local_font,
            delete_installed_font,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
