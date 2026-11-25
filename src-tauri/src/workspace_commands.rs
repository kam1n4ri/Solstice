use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct SolsticeStorageInfo {
    #[serde(rename = "rootPath")]
    pub root_path: String,
    #[serde(rename = "totalBytes")]
    pub total_bytes: u64,
    #[serde(rename = "fileCount")]
    pub file_count: usize,
}

fn get_solstice_root_dir(app: &AppHandle) -> PathBuf {
    let docs = app
        .path()
        .document_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let root = docs.join("Solstice");
    let _ = fs::create_dir_all(&root);
    root
}

fn collect_dir_stats(dir: &Path, total_bytes: &mut u64, file_count: &mut usize) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_dir_stats(&path, total_bytes, file_count);
            } else if path.is_file() {
                *file_count += 1;
                if let Ok(meta) = entry.metadata() {
                    *total_bytes += meta.len();
                }
            }
        }
    }
}

#[tauri::command]
pub fn get_solstice_storage_info(app: AppHandle) -> SolsticeStorageInfo {
    let root = get_solstice_root_dir(&app);
    let mut total_bytes = 0u64;
    let mut file_count = 0usize;
    collect_dir_stats(&root, &mut total_bytes, &mut file_count);

    SolsticeStorageInfo {
        root_path: root.to_string_lossy().to_string(),
        total_bytes,
        file_count,
    }
}

#[tauri::command]
pub fn open_solstice_folder(app: AppHandle) -> Result<(), String> {
    let root = get_solstice_root_dir(&app);

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&root)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&root)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&root)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn collect_dir_stats_counts_nested_files_and_bytes() {
        let root = std::env::temp_dir().join(format!("solstice_ws_test_{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        let sub = root.join("Documents");
        fs::create_dir_all(&sub).unwrap();
        fs::write(root.join("a.pdf"), b"12345").unwrap();
        fs::write(sub.join("b.docx"), b"1234567").unwrap();

        let mut total_bytes = 0;
        let mut file_count = 0;
        collect_dir_stats(&root, &mut total_bytes, &mut file_count);

        assert_eq!(file_count, 2);
        assert_eq!(total_bytes, 12);
        let _ = fs::remove_dir_all(&root);
    }
}
