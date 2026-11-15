use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use crate::photo_file_ops;
use crate::tone_engine;
use crate::cutout_engine;

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
        Ok(_) => Ok(WindowOpenResult {
            success: true,
            tool_id,
            error: None,
        }),
        Err(e) => Ok(WindowOpenResult {
            success: false,
            tool_id,
            error: Some(e.to_string()),
        }),
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

#[tauri::command]
pub fn photo_get_directory() -> String {
    photo_file_ops::get_photo_working_copy_dir()
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
pub fn photo_open_file(requested_path: Option<String>) -> Result<Value, String> {
    let source_path: PathBuf = match requested_path {
        Some(ref p) if !p.trim().is_empty() => PathBuf::from(p),
        _ => {
            let dialog = rfd::FileDialog::new()
                .set_title("Open Photo in Solstice")
                .add_filter("Images", &["png", "jpg", "jpeg", "webp", "gif"]);
            match dialog.pick_file() {
                Some(p) => p,
                None => return Ok(json!({ "success": false, "canceled": true })),
            }
        }
    };

    let working_path = photo_file_ops::ensure_photo_working_copy(&source_path)?;
    let data_url = photo_file_ops::read_image_to_data_url(&working_path)?;
    let file_name = working_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("image.png")
        .to_string();

    Ok(json!({
        "success": true,
        "filePath": working_path.to_string_lossy(),
        "fileName": file_name,
        "dataUrl": data_url,
        "canceled": false
    }))
}

#[tauri::command]
pub fn photo_save_file(payload: Value) -> Result<Value, String> {
    let file_path_str = payload
        .get("filePath")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing filePath in save payload".to_string())?;
    let data_url = payload
        .get("dataUrl")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing dataUrl in save payload".to_string())?;

    photo_file_ops::save_working_copy_data_url(Path::new(file_path_str), data_url)?;

    Ok(json!({
        "success": true,
        "filePath": file_path_str
    }))
}

#[tauri::command]
pub fn photo_export_file(payload: Value) -> Result<Value, String> {
    let raw_data_url = payload
        .get("dataUrl")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Missing dataUrl in export payload".to_string())?;
    let default_name = payload
        .get("defaultName")
        .and_then(|v| v.as_str())
        .unwrap_or("export.png");

    let final_data_url = if let Some(adj_val) = payload.get("adjustments") {
        if let Ok(params) = serde_json::from_value::<tone_engine::PhotoToneParams>(adj_val.clone()) {
            if !params.is_identity() {
                tone_engine::process_data_url(raw_data_url, &params, None)?
            } else {
                raw_data_url.to_string()
            }
        } else {
            raw_data_url.to_string()
        }
    } else {
        raw_data_url.to_string()
    };

    let target_path = photo_file_ops::export_photo_file(&final_data_url, default_name)?;

    match target_path {
        Some(path) => Ok(json!({
            "success": true,
            "filePath": path.to_string_lossy(),
            "canceled": false
        })),
        None => Ok(json!({
            "success": false,
            "canceled": true
        })),
    }
}

#[tauri::command]
pub fn photo_apply_tone(
    data_url: Option<String>,
    file_path: Option<String>,
    params: tone_engine::PhotoToneParams,
) -> Result<String, String> {
    if let Some(path_str) = file_path {
        let path = Path::new(&path_str);
        if path.exists() {
            return tone_engine::process_file_to_data_url(path, &params);
        }
    }

    if let Some(url) = data_url {
        return tone_engine::process_data_url(&url, &params, None);
    }

    Err("Either data_url or file_path must be provided".to_string())
}

#[tauri::command]
pub fn photo_refine_cutout(
    image_data_url: String,
    mask_data_url: String,
    choke: Option<i32>,
    feather: Option<u32>,
) -> Result<String, String> {
    let params = cutout_engine::CutoutEdgeParams {
        choke: choke.unwrap_or(0),
        feather: feather.unwrap_or(0),
    };
    cutout_engine::process_cutout(&image_data_url, &mask_data_url, &params)
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}
