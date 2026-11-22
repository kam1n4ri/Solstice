use crate::pdf_engine::{normalize_path, FileRecord};
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfSelectFilesOptions {
    pub multiple: Option<bool>,
    pub title: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfSelectFilesResult {
    pub canceled: bool,
    pub files: Vec<FileRecord>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileToSave {
    #[serde(rename = "fileName")]
    pub file_name: String,
    pub data: Vec<u8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PdfSaveFilesToFolderResult {
    pub success: bool,
    pub canceled: Option<bool>,
    #[serde(rename = "folderPath")]
    pub folder_path: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn pdf_select_files(options: Option<PdfSelectFilesOptions>) -> Result<PdfSelectFilesResult, String> {
    let is_multiple = options.as_ref().and_then(|o| o.multiple).unwrap_or(true);
    let title = options
        .as_ref()
        .and_then(|o| o.title.as_deref())
        .unwrap_or("Select PDF Documents");

    let dialog = rfd::AsyncFileDialog::new()
        .add_filter("PDF Documents", &["pdf"])
        .set_title(title);

    if is_multiple {
        let handles = dialog.pick_files().await;
        match handles {
            Some(list) => {
                let files = list
                    .into_iter()
                    .map(|h| {
                        let path = h.path().to_path_buf();
                        let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
                        let name = path
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("Document.pdf")
                            .to_string();
                        FileRecord {
                            file_path: normalize_path(&path),
                            file_name: name,
                            file_size: size,
                        }
                    })
                    .collect();
                Ok(PdfSelectFilesResult {
                    canceled: false,
                    files,
                })
            }
            None => Ok(PdfSelectFilesResult {
                canceled: true,
                files: vec![],
            }),
        }
    } else {
        let handle = dialog.pick_file().await;
        match handle {
            Some(h) => {
                let path = h.path().to_path_buf();
                let size = fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
                let name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Document.pdf")
                    .to_string();
                Ok(PdfSelectFilesResult {
                    canceled: false,
                    files: vec![FileRecord {
                        file_path: normalize_path(&path),
                        file_name: name,
                        file_size: size,
                    }],
                })
            }
            None => Ok(PdfSelectFilesResult {
                canceled: true,
                files: vec![],
            }),
        }
    }
}

#[tauri::command]
pub async fn pdf_select_images() -> Result<Vec<String>, String> {
    let handles = rfd::AsyncFileDialog::new()
        .add_filter("Image Files", &["png", "jpg", "jpeg", "webp", "bmp"])
        .set_title("Select Images")
        .pick_files()
        .await;

    match handles {
        Some(list) => Ok(list
            .into_iter()
            .map(|h| normalize_path(h.path()))
            .collect()),
        None => Ok(vec![]),
    }
}

#[tauri::command]
pub async fn pdf_save_files_to_folder(files: Vec<FileToSave>) -> Result<PdfSaveFilesToFolderResult, String> {
    let folder = rfd::AsyncFileDialog::new()
        .set_title("Select Destination Folder")
        .pick_folder()
        .await;

    match folder {
        Some(f) => {
            let folder_path = f.path().to_path_buf();
            for item in files {
                let dest = folder_path.join(&item.file_name);
                let _ = fs::write(dest, item.data);
            }
            Ok(PdfSaveFilesToFolderResult {
                success: true,
                canceled: None,
                folder_path: Some(normalize_path(&folder_path)),
                error: None,
            })
        }
        None => Ok(PdfSaveFilesToFolderResult {
            success: false,
            canceled: Some(true),
            folder_path: None,
            error: None,
        }),
    }
}
