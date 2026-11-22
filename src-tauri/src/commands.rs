use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

#[derive(Debug, Serialize, Deserialize)]
pub struct WindowOpenResult {
    pub success: bool,
    #[serde(rename = "toolId")]
    pub tool_id: String,
    pub error: Option<String>,
}

#[tauri::command]
pub fn get_app_version() -> String {
    "0.1.0-native".to_string()
}

#[tauri::command]
pub fn get_active_tools(app: AppHandle) -> Vec<String> {
    app.webview_windows()
        .keys()
        .filter_map(|key| {
            if key.starts_with("tool-") {
                Some(key.trim_start_matches("tool-").to_string())
            } else {
                None
            }
        })
        .collect()
}

#[tauri::command]
pub async fn open_tool_window(
    app: AppHandle,
    tool_id: String,
    initial_path: Option<String>,
) -> Result<WindowOpenResult, String> {
    let win_label = format!("tool-{}", tool_id);

    // If window already exists, focus it
    if let Some(existing_window) = app.get_webview_window(&win_label) {
        let _ = existing_window.unminimize();
        let _ = existing_window.show();
        let _ = existing_window.set_focus();
        return Ok(WindowOpenResult {
            success: true,
            tool_id,
            error: None,
        });
    }

    // Build URL query string
    let url_str = match initial_path {
        Some(path) => format!("/?tool={}&file={}", tool_id, urlencoding::encode(&path)),
        None => format!("/?tool={}", tool_id),
    };

    let title = format!("Solstice — {}", capitalize(&tool_id));

    let window_res = WebviewWindowBuilder::new(
        &app,
        &win_label,
        WebviewUrl::App(url_str.into()),
    )
    .title(&title)
    .inner_size(1280.0, 840.0)
    .min_inner_size(900.0, 600.0)
    .build();

    match window_res {
        Ok(_) => {
            let _ = app.emit(
                "tool-window-state-changed",
                serde_json::json!({
                    "toolId": &tool_id,
                    "isOpen": true,
                    "isFocused": true
                }),
            );
            Ok(WindowOpenResult {
                success: true,
                tool_id,
                error: None,
            })
        }
        Err(e) => Ok(WindowOpenResult {
            success: false,
            tool_id,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub fn close_window(window: WebviewWindow) -> Result<(), String> {
    let label = window.label().to_string();
    let app = window.app_handle().clone();
    if let Some(tool_id) = label.strip_prefix("tool-") {
        let _ = app.emit(
            "tool-window-state-changed",
            serde_json::json!({
                "toolId": tool_id,
                "isOpen": false,
                "isFocused": false
            }),
        );
    }
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn minimize_window(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn maximize_window(window: WebviewWindow) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn get_recent_files() -> Vec<Value> {
    vec![]
}

#[tauri::command]
pub fn get_installed_fonts() -> Vec<Value> {
    vec![]
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}
