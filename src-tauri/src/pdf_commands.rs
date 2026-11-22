use crate::pdf_engine::*;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfOpenResult {
    pub success: bool,
    pub canceled: Option<bool>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    #[serde(rename = "fileName")]
    pub file_name: Option<String>,
    #[serde(rename = "fileSize")]
    pub file_size: Option<u64>,
    pub data: Option<Vec<u8>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfSavePayload {
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    #[serde(rename = "fileName")]
    pub file_name: Option<String>,
    pub title: Option<String>,
    pub data: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfSaveResult {
    pub success: bool,
    pub canceled: Option<bool>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    #[serde(rename = "fileName")]
    pub file_name: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfReadResult {
    pub success: bool,
    #[serde(rename = "filePath")]
    pub file_path: String,
    pub data: Option<Vec<u8>>,
    #[serde(rename = "fileSize")]
    pub file_size: Option<u64>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfRenamePayload {
    #[serde(rename = "oldPath")]
    pub old_path: String,
    #[serde(rename = "newTitle")]
    pub new_title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfRenameResult {
    pub success: bool,
    #[serde(rename = "newPath")]
    pub new_path: Option<String>,
    #[serde(rename = "newFileName")]
    pub new_file_name: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn pdf_open_file(app: AppHandle, file_path: Option<String>) -> Result<PdfOpenResult, String> {
    let source_path_str = match file_path {
        Some(p) if !p.is_empty() => p,
        _ => {
            let file = rfd::AsyncFileDialog::new()
                .add_filter("PDF Documents", &["pdf"])
                .set_title("Open PDF Document")
                .pick_file()
                .await;

            match file {
                Some(f) => f.path().to_string_lossy().to_string(),
                None => {
                    return Ok(PdfOpenResult {
                        success: false,
                        canceled: Some(true),
                        file_path: None,
                        file_name: None,
                        file_size: None,
                        data: None,
                        error: None,
                    });
                }
            }
        }
    };

    let working_path = match ensure_working_copy(&app, &source_path_str) {
        Ok(p) => p,
        Err(e) => {
            return Ok(PdfOpenResult {
                success: false,
                canceled: None,
                file_path: None,
                file_name: None,
                file_size: None,
                data: None,
                error: Some(e),
            });
        }
    };

    let data = match fs::read(&working_path) {
        Ok(d) => d,
        Err(e) => {
            return Ok(PdfOpenResult {
                success: false,
                canceled: None,
                file_path: Some(normalize_path(&working_path)),
                file_name: None,
                file_size: None,
                data: None,
                error: Some(format!("Failed to read PDF file: {}", e)),
            });
        }
    };

    let file_size = data.len() as u64;
    let file_name = working_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Document.pdf")
        .to_string();

    Ok(PdfOpenResult {
        success: true,
        canceled: None,
        file_path: Some(normalize_path(&working_path)),
        file_name: Some(file_name),
        file_size: Some(file_size),
        data: Some(data),
        error: None,
    })
}

#[tauri::command]
pub fn pdf_read_file(file_path: String) -> Result<PdfReadResult, String> {
    let path = PathBuf::from(&file_path);
    match fs::read(&path) {
        Ok(data) => {
            let size = data.len() as u64;
            Ok(PdfReadResult {
                success: true,
                file_path,
                data: Some(data),
                file_size: Some(size),
                error: None,
            })
        }
        Err(e) => Ok(PdfReadResult {
            success: false,
            file_path,
            data: None,
            file_size: None,
            error: Some(e.to_string()),
        }),
    }
}

#[tauri::command]
pub fn pdf_save_file(app: AppHandle, payload: PdfSavePayload) -> Result<PdfSaveResult, String> {
    match save_working_pdf(
        &app,
        payload.file_path,
        payload.file_name,
        payload.title,
        &payload.data,
    ) {
        Ok((saved_path, final_name)) => Ok(PdfSaveResult {
            success: true,
            canceled: None,
            file_path: Some(saved_path),
            file_name: Some(final_name),
            error: None,
        }),
        Err(e) => Ok(PdfSaveResult {
            success: false,
            canceled: None,
            file_path: None,
            file_name: None,
            error: Some(e),
        }),
    }
}

#[tauri::command]
pub async fn pdf_export_file(data: Vec<u8>, default_name: Option<String>) -> Result<PdfSaveResult, String> {
    let def_name = default_name.unwrap_or_else(|| "Exported_Document.pdf".to_string());
    let dialog = rfd::AsyncFileDialog::new()
        .add_filter("PDF Documents", &["pdf"])
        .set_file_name(&def_name)
        .set_title("Export PDF Document");

    let file = dialog.save_file().await;
    match file {
        Some(handle) => {
            let path = handle.path().to_path_buf();
            match fs::write(&path, data) {
                Ok(_) => {
                    let file_name = path
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or(&def_name)
                        .to_string();
                    Ok(PdfSaveResult {
                        success: true,
                        canceled: None,
                        file_path: Some(normalize_path(&path)),
                        file_name: Some(file_name),
                        error: None,
                    })
                }
                Err(e) => Ok(PdfSaveResult {
                    success: false,
                    canceled: None,
                    file_path: None,
                    file_name: None,
                    error: Some(format!("Failed to write exported PDF: {}", e)),
                }),
            }
        }
        None => Ok(PdfSaveResult {
            success: false,
            canceled: Some(true),
            file_path: None,
            file_name: None,
            error: None,
        }),
    }
}

#[tauri::command]
pub fn pdf_rename_file(app: AppHandle, payload: PdfRenamePayload) -> Result<PdfRenameResult, String> {
    match rename_working_pdf(&app, &payload.old_path, &payload.new_title) {
        Ok((new_path, new_file_name)) => Ok(PdfRenameResult {
            success: true,
            new_path: Some(new_path),
            new_file_name: Some(new_file_name),
            error: None,
        }),
        Err(e) => Ok(PdfRenameResult {
            success: false,
            new_path: None,
            new_file_name: None,
            error: Some(e),
        }),
    }
}

#[tauri::command]
pub fn reveal_in_folder(file_path: String) -> Result<(), String> {
    let path = PathBuf::from(&file_path);
    let target = if path.is_file() {
        path.parent().unwrap_or(&path)
    } else {
        &path
    };

    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer")
            .arg(format!("/select,\"{}\"", path.display()))
            .spawn();
    }

    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn();
    }

    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(target)
            .spawn();
    }

    Ok(())
}
