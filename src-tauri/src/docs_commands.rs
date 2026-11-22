use crate::docs_engine::*;
use crate::docs_types::*;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[tauri::command]
pub async fn docs_open_file(
    _app: AppHandle,
    file_path: Option<String>,
) -> Result<DocsOpenResult, String> {
    let path = match file_path {
        Some(p) => PathBuf::from(p),
        None => {
            let handle = rfd::AsyncFileDialog::new()
                .set_title("Open Document")
                .add_filter("Supported Documents", &["html", "htm", "md", "txt", "docx"])
                .add_filter("HTML Document", &["html", "htm"])
                .add_filter("Markdown Document", &["md"])
                .add_filter("Plain Text Document", &["txt"])
                .add_filter("Word Document", &["docx"])
                .pick_file()
                .await;

            match handle {
                Some(h) => h.path().to_path_buf(),
                None => {
                    return Ok(DocsOpenResult {
                        success: false,
                        canceled: Some(true),
                        title: None,
                        content: None,
                        file_path: None,
                        format: None,
                        data: None,
                        error: None,
                    });
                }
            }
        }
    };

    if !path.exists() {
        return Ok(DocsOpenResult {
            success: false,
            canceled: None,
            title: None,
            content: None,
            file_path: Some(path.to_string_lossy().to_string()),
            format: None,
            data: None,
            error: Some("File does not exist on disk".to_string()),
        });
    }

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_else(|| "html".to_string());

    let title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Untitled document")
        .to_string();

    if ext == "docx" {
        match fs::read(&path) {
            Ok(bytes) => Ok(DocsOpenResult {
                success: true,
                canceled: None,
                title: Some(title),
                content: None,
                file_path: Some(path.to_string_lossy().to_string()),
                format: Some("docx".to_string()),
                data: Some(bytes),
                error: None,
            }),
            Err(e) => Ok(DocsOpenResult {
                success: false,
                canceled: None,
                title: Some(title),
                content: None,
                file_path: Some(path.to_string_lossy().to_string()),
                format: Some("docx".to_string()),
                data: None,
                error: Some(format!("Failed to read Word document: {}", e)),
            }),
        }
    } else {
        match fs::read_to_string(&path) {
            Ok(content) => Ok(DocsOpenResult {
                success: true,
                canceled: None,
                title: Some(title),
                content: Some(content),
                file_path: Some(path.to_string_lossy().to_string()),
                format: Some(ext),
                data: None,
                error: None,
            }),
            Err(e) => Ok(DocsOpenResult {
                success: false,
                canceled: None,
                title: Some(title),
                content: None,
                file_path: Some(path.to_string_lossy().to_string()),
                format: Some(ext),
                data: None,
                error: Some(format!("Failed to read document: {}", e)),
            }),
        }
    }
}

#[tauri::command]
pub async fn docs_save_file(
    _app: AppHandle,
    payload: DocsSavePayload,
) -> Result<DocsSaveResult, String> {
    let is_save_as = payload.is_save_as.unwrap_or(false);
    let target_path = if is_save_as || payload.file_path.is_none() {
        let clean_title = sanitize_doc_title(&payload.title);
        let default_name = format!("{}.html", clean_title);

        let handle = rfd::AsyncFileDialog::new()
            .set_title("Save Document As")
            .set_file_name(&default_name)
            .add_filter("HTML Document", &["html", "htm"])
            .add_filter("Markdown Document", &["md"])
            .add_filter("Plain Text Document", &["txt"])
            .save_file()
            .await;

        match handle {
            Some(h) => h.path().to_path_buf(),
            None => {
                return Ok(DocsSaveResult {
                    success: false,
                    canceled: Some(true),
                    file_path: None,
                    title: None,
                    error: None,
                })
            }
        }
    } else {
        PathBuf::from(payload.file_path.unwrap())
    };

    if let Some(parent) = target_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    if let Some(data) = payload.data {
        fs::write(&target_path, data)
            .map_err(|e| format!("Failed to save file: {}", e))?;
    } else {
        fs::write(&target_path, &payload.content)
            .map_err(|e| format!("Failed to save file: {}", e))?;
    }

    let file_title = target_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(&payload.title)
        .to_string();

    Ok(DocsSaveResult {
        success: true,
        canceled: None,
        file_path: Some(target_path.to_string_lossy().to_string()),
        title: Some(file_title),
        error: None,
    })
}

#[tauri::command]
pub async fn docs_auto_save(
    app: AppHandle,
    payload: DocsAutoSavePayload,
) -> Result<DocsAutoSaveResult, String> {
    let draft_id = payload.draft_id.unwrap_or_else(|| "draft-000000".to_string());
    match save_working_doc(
        &app,
        &payload.title,
        &payload.content,
        payload.file_path.as_deref(),
        &draft_id,
    ) {
        Ok(saved_path) => Ok(DocsAutoSaveResult {
            success: true,
            file_path: Some(saved_path.to_string_lossy().to_string()),
            draft_id: Some(draft_id),
            error: None,
        }),
        Err(e) => Ok(DocsAutoSaveResult {
            success: false,
            file_path: None,
            draft_id: Some(draft_id),
            error: Some(e),
        }),
    }
}

#[tauri::command]
pub async fn docs_export_file(
    _app: AppHandle,
    payload: DocsExportPayload,
) -> Result<DocsExportResult, String> {
    let ext = payload.format.to_lowercase();
    let default_name = format!("{}.{}", sanitize_doc_title(&payload.title), ext);

    let mut dialog = rfd::AsyncFileDialog::new()
        .set_title("Export Document")
        .set_file_name(&default_name);

    dialog = match ext.as_str() {
        "md" => dialog.add_filter("Markdown Document", &["md"]),
        "txt" => dialog.add_filter("Plain Text Document", &["txt"]),
        "pdf" => dialog.add_filter("PDF Document", &["pdf"]),
        "docx" => dialog.add_filter("Word Document", &["docx", "doc"]),
        _ => dialog.add_filter("HTML Document", &["html", "htm"]),
    };

    let handle = dialog.save_file().await;
    let path = match handle {
        Some(h) => h.path().to_path_buf(),
        None => {
            return Ok(DocsExportResult {
                success: false,
                canceled: Some(true),
                file_path: None,
                error: None,
            })
        }
    };

    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    if let Some(data) = payload.data {
        fs::write(&path, data)
            .map_err(|e| format!("Failed to export document: {}", e))?;
    } else {
        let write_content = if ext == "md" || ext == "txt" {
            payload.content.as_bytes().to_vec()
        } else {
            payload.html_content.as_bytes().to_vec()
        };

        fs::write(&path, write_content)
            .map_err(|e| format!("Failed to export document: {}", e))?;
    }

    Ok(DocsExportResult {
        success: true,
        canceled: None,
        file_path: Some(path.to_string_lossy().to_string()),
        error: None,
    })
}
