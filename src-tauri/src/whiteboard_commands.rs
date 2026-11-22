use crate::whiteboard_engine::*;
use crate::whiteboard_types::*;
use base64::Engine;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn whiteboard_open_file(
    app: AppHandle,
    file_path: Option<String>,
) -> Result<WhiteboardOpenResult, String> {
    let path = match file_path {
        Some(p) => PathBuf::from(p),
        None => {
            let whiteboards_dir = get_solstice_whiteboards_dir(&app);
            let handle = rfd::AsyncFileDialog::new()
                .set_title("Open Whiteboard")
                .set_directory(&whiteboards_dir)
                .add_filter(
                    "Solstice Whiteboard",
                    &["excalidraw", "json", "tldr", "solstice"],
                )
                .add_filter("All Files", &["*"])
                .pick_file()
                .await;

            match handle {
                Some(h) => h.path().to_path_buf(),
                None => {
                    return Ok(WhiteboardOpenResult {
                        success: false,
                        canceled: Some(true),
                        title: None,
                        content: None,
                        file_path: None,
                        error: None,
                    });
                }
            }
        }
    };

    if !path.exists() {
        return Ok(WhiteboardOpenResult {
            success: false,
            canceled: None,
            title: None,
            content: None,
            file_path: Some(path.to_string_lossy().to_string()),
            error: Some("Whiteboard file does not exist on disk".to_string()),
        });
    }

    match fs::read_to_string(&path) {
        Ok(content) => {
            let raw_stem = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Untitled whiteboard");
            let title = sanitize_whiteboard_title(raw_stem);

            Ok(WhiteboardOpenResult {
                success: true,
                canceled: None,
                title: Some(title),
                content: Some(content),
                file_path: Some(path.to_string_lossy().to_string()),
                error: None,
            })
        }
        Err(err) => Ok(WhiteboardOpenResult {
            success: false,
            canceled: None,
            title: None,
            content: None,
            file_path: Some(path.to_string_lossy().to_string()),
            error: Some(format!("Failed to read whiteboard file: {}", err)),
        }),
    }
}

#[tauri::command]
pub async fn whiteboard_auto_save(
    app: AppHandle,
    payload: WhiteboardAutoSavePayload,
) -> Result<WhiteboardAutoSaveResult, String> {
    let whiteboards_dir = get_solstice_whiteboards_dir(&app);
    let raw_title = if payload.title.trim().is_empty() || payload.title == "Untitled whiteboard" {
        let draft_suffix = payload
            .draft_id
            .as_deref()
            .and_then(|id| id.get(id.len().saturating_sub(6)..))
            .unwrap_or("board");
        format!("Untitled_{}", draft_suffix)
    } else {
        payload.title.trim().to_string()
    };
    let clean_title = sanitize_whiteboard_title(&raw_title);

    let target_path = match payload.file_path {
        Some(ref fp) if !fp.is_empty() => {
            let path = PathBuf::from(fp);
            if path.parent() == Some(&whiteboards_dir) {
                let current_ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("excalidraw");
                let desired_name = format!("{}.{}", clean_title, current_ext);
                if path.file_name().and_then(|n| n.to_str()) != Some(&desired_name) {
                    let unique = get_unique_whiteboard_path(
                        &whiteboards_dir,
                        &clean_title,
                        current_ext,
                        Some(fp),
                    );
                    if unique != path {
                        let _ = fs::rename(&path, &unique);
                        unique
                    } else {
                        path
                    }
                } else {
                    path
                }
            } else {
                path
            }
        }
        _ => get_unique_whiteboard_path(&whiteboards_dir, &clean_title, ".excalidraw", None),
    };

    fs::write(&target_path, payload.content.as_bytes()).map_err(|e| e.to_string())?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    Ok(WhiteboardAutoSaveResult {
        success: true,
        file_path: target_path.to_string_lossy().to_string(),
        title: clean_title,
        last_saved: now,
        error: None,
    })
}

#[tauri::command]
pub async fn whiteboard_save_file(
    app: AppHandle,
    payload: WhiteboardSavePayload,
) -> Result<WhiteboardSaveResult, String> {
    let clean_title = sanitize_whiteboard_title(&payload.title);
    let default_file_name = format!("{}.excalidraw", clean_title);

    let default_dir = match payload.file_path {
        Some(ref fp) => PathBuf::from(fp)
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| get_solstice_whiteboards_dir(&app)),
        None => get_solstice_whiteboards_dir(&app),
    };

    let handle = rfd::AsyncFileDialog::new()
        .set_title("Save Whiteboard As")
        .set_directory(&default_dir)
        .set_file_name(&default_file_name)
        .add_filter("Solstice Whiteboard (*.excalidraw)", &["excalidraw"])
        .add_filter("JSON Document (*.json)", &["json"])
        .save_file()
        .await;

    match handle {
        Some(h) => {
            let path = h.path().to_path_buf();
            fs::write(&path, payload.content.as_bytes()).map_err(|e| e.to_string())?;
            let title = path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or(&clean_title)
                .to_string();

            Ok(WhiteboardSaveResult {
                success: true,
                canceled: None,
                file_path: Some(path.to_string_lossy().to_string()),
                title: Some(title),
                error: None,
            })
        }
        None => Ok(WhiteboardSaveResult {
            success: false,
            canceled: Some(true),
            file_path: None,
            title: None,
            error: None,
        }),
    }
}

#[tauri::command]
pub async fn whiteboard_export_file(
    app: AppHandle,
    payload: WhiteboardExportPayload,
) -> Result<WhiteboardExportResult, String> {
    let format = payload.format.to_lowercase();
    let ext = match format.as_str() {
        "png" => "png",
        "svg" => "svg",
        "json" => "json",
        _ => "png",
    };

    let default_name = payload
        .default_name
        .unwrap_or_else(|| "whiteboard".to_string());
    let clean_name = sanitize_whiteboard_title(&default_name);
    let file_name = format!("{}.{}", clean_name, ext);

    let downloads_dir = app
        .path()
        .download_dir()
        .unwrap_or_else(|_| get_solstice_whiteboards_dir(&app));

    let mut dialog = rfd::AsyncFileDialog::new()
        .set_title(format!("Export Whiteboard as {}", format.to_uppercase()))
        .set_directory(&downloads_dir)
        .set_file_name(&file_name);

    dialog = match ext {
        "png" => dialog.add_filter("PNG Image (*.png)", &["png"]),
        "svg" => dialog.add_filter("SVG Vector (*.svg)", &["svg"]),
        "json" => dialog.add_filter("JSON Document (*.json)", &["json"]),
        _ => dialog.add_filter("All Files", &["*"]),
    };

    let handle = dialog.save_file().await;

    match handle {
        Some(h) => {
            let path = h.path().to_path_buf();
            if ext == "png" {
                let raw_data = if let Some(idx) = payload.data.find(',') {
                    &payload.data[idx + 1..]
                } else {
                    &payload.data
                };
                let bytes = base64::engine::general_purpose::STANDARD
                    .decode(raw_data)
                    .map_err(|e| format!("Base64 decoding failed: {}", e))?;
                fs::write(&path, bytes).map_err(|e| e.to_string())?;
            } else {
                fs::write(&path, payload.data.as_bytes()).map_err(|e| e.to_string())?;
            }

            Ok(WhiteboardExportResult {
                success: true,
                canceled: None,
                file_path: Some(path.to_string_lossy().to_string()),
                error: None,
            })
        }
        None => Ok(WhiteboardExportResult {
            success: false,
            canceled: Some(true),
            file_path: None,
            error: None,
        }),
    }
}
