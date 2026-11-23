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

    // If window already exists, focus it and emit file open request if provided
    if let Some(existing_window) = app.get_webview_window(&win_label) {
        let _ = existing_window.unminimize();
        let _ = existing_window.show();
        let _ = existing_window.set_focus();
        if let Some(ref path) = initial_path {
            let _ = existing_window.emit("open-file-requested", path);
        }
        return Ok(WindowOpenResult {
            success: true,
            tool_id,
            error: None,
        });
    }

    // Build URL query string (provide both filePath and file for universal compatibility)
    let url_str = match initial_path {
        Some(path) => {
            let enc = urlencoding::encode(&path);
            format!("/?tool={}&filePath={}&file={}", tool_id, enc, enc)
        }
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
pub fn get_recent_files(app: AppHandle) -> Vec<Value> {
    let mut results = vec![];

    // 1. Scan PDFs directory
    let pdf_dir = crate::pdf_engine::get_solstice_pdf_dir(&app);
    if let Ok(entries) = std::fs::read_dir(pdf_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file()
                && path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| e.eq_ignore_ascii_case("pdf"))
                    .unwrap_or(false)
            {
                let meta = entry.metadata().ok();
                let file_size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                let last_modified = meta
                    .and_then(|m| m.modified().ok())
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_millis() as u64)
                    .unwrap_or(0);
                let file_name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Document.pdf")
                    .to_string();
                results.push(serde_json::json!({
                    "filePath": path.to_string_lossy(),
                    "fileName": file_name,
                    "fileSize": file_size,
                    "lastModified": last_modified,
                    "tool": "pdf"
                }));
            }
        }
    }

    // 2. Scan Documents directory
    let docs_dir = crate::docs_engine::get_solstice_docs_dir(&app);
    if let Ok(entries) = std::fs::read_dir(docs_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| e.to_lowercase())
                    .unwrap_or_default();
                if ["html", "htm", "md", "txt", "docx"].contains(&ext.as_str()) {
                    let meta = entry.metadata().ok();
                    let file_size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                    let last_modified = meta
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_millis() as u64)
                        .unwrap_or(0);
                    let file_name = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("Untitled.html")
                        .to_string();
                    results.push(serde_json::json!({
                        "filePath": path.to_string_lossy(),
                        "fileName": file_name,
                        "fileSize": file_size,
                        "lastModified": last_modified,
                        "tool": "docs"
                    }));
                }
            }
        }
    }

    // 3. Scan Whiteboards directory
    let whiteboards_dir = crate::whiteboard_engine::get_solstice_whiteboards_dir(&app);
    if let Ok(entries) = std::fs::read_dir(whiteboards_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|e| e.to_lowercase())
                    .unwrap_or_default();
                if ["excalidraw", "json", "tldr", "solstice"].contains(&ext.as_str()) {
                    let meta = entry.metadata().ok();
                    let file_size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                    let last_modified = meta
                        .and_then(|m| m.modified().ok())
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_millis() as u64)
                        .unwrap_or(0);
                    let file_name = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("Whiteboard.excalidraw")
                        .to_string();
                    results.push(serde_json::json!({
                        "filePath": path.to_string_lossy(),
                        "fileName": file_name,
                        "fileSize": file_size,
                        "lastModified": last_modified,
                        "tool": "whiteboard"
                    }));
                }
            }
        }
    }

    // Sort recent files descending by lastModified
    results.sort_by(|a, b| {
        let b_time = b.get("lastModified").and_then(|v| v.as_u64()).unwrap_or(0);
        let a_time = a.get("lastModified").and_then(|v| v.as_u64()).unwrap_or(0);
        b_time.cmp(&a_time)
    });
    results
}

#[tauri::command]
pub fn delete_file(file_path: String) -> Result<(), String> {
    let path = std::path::PathBuf::from(&file_path);
    if path.exists() {
        std::fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}
