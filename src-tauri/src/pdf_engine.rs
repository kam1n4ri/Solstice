use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const WORKING_COPY_MAP_FILE: &str = "pdf-working-copies.json";

#[derive(Debug, Serialize, Deserialize)]
pub struct FileRecord {
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "fileSize")]
    pub file_size: u64,
}

pub fn get_solstice_pdf_dir(app: &AppHandle) -> PathBuf {
    let docs = app
        .path()
        .document_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let pdf_dir = docs.join("Solstice").join("PDFs");
    let _ = fs::create_dir_all(&pdf_dir);
    pdf_dir
}

fn get_working_copy_map_path(app: &AppHandle) -> PathBuf {
    let data_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| get_solstice_pdf_dir(app));
    let _ = fs::create_dir_all(&data_dir);
    data_dir.join(WORKING_COPY_MAP_FILE)
}

fn load_working_copy_map(app: &AppHandle) -> HashMap<String, String> {
    let map_path = get_working_copy_map_path(app);
    if let Ok(content) = fs::read_to_string(&map_path) {
        if let Ok(map) = serde_json::from_str(&content) {
            return map;
        }
    }
    HashMap::new()
}

fn save_working_copy_map(app: &AppHandle, map: &HashMap<String, String>) -> Result<(), String> {
    let map_path = get_working_copy_map_path(app);
    let content = serde_json::to_string_pretty(map)
        .map_err(|e| format!("Failed to serialize PDF working copy map: {}", e))?;
    fs::write(map_path, content)
        .map_err(|e| format!("Failed to persist PDF working copy map: {}", e))
}

pub fn normalize_path(p: &Path) -> String {
    p.canonicalize()
        .unwrap_or_else(|_| p.to_path_buf())
        .to_string_lossy()
        .to_string()
}

pub fn is_inside_dir(path: &Path, dir: &Path) -> bool {
    let norm_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
    let norm_dir = dir.canonicalize().unwrap_or_else(|_| dir.to_path_buf());
    norm_path.starts_with(&norm_dir)
}

fn sanitize_pdf_title(raw: &str) -> String {
    let cleaned: String = raw
        .trim_end_matches(".pdf")
        .trim_end_matches(".PDF")
        .chars()
        .map(|c| match c {
            '/' | '\\' | '?' | '%' | '*' | ':' | '|' | '"' | '<' | '>' | '\0' => '-',
            other => other,
        })
        .collect();
    let trimmed = cleaned.trim();
    if trimmed.is_empty() || trimmed == "." || trimmed == ".." {
        "Document".to_string()
    } else {
        trimmed.to_string()
    }
}

/// Ensures an external PDF is isolated in ~/Documents/Solstice/PDFs/
/// External files are NEVER mutated. Reuses existing mapped working copy without duplicates.
pub fn ensure_working_copy(app: &AppHandle, source_path_str: &str) -> Result<PathBuf, String> {
    let source_path = PathBuf::from(source_path_str);
    if !source_path.exists() {
        return Err(format!("Source PDF file does not exist: {}", source_path_str));
    }

    let solstice_dir = get_solstice_pdf_dir(app);
    if is_inside_dir(&source_path, &solstice_dir) {
        return Ok(source_path);
    }

    let norm_source = normalize_path(&source_path);
    let mut map = load_working_copy_map(app);
    if let Some(existing_working_path_str) = map.get(&norm_source) {
        let existing_path = PathBuf::from(existing_working_path_str);
        if existing_path.exists() {
            return Ok(existing_path);
        }
    }

    let file_stem = source_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(sanitize_pdf_title)
        .unwrap_or_else(|| "Document".to_string());
    let ext = source_path
        .extension()
        .and_then(|e| e.to_str())
        .filter(|e| e.eq_ignore_ascii_case("pdf"))
        .unwrap_or("pdf");

    let mut target_path = solstice_dir.join(format!("{}.{}", file_stem, ext));
    let mut counter = 1;
    while target_path.exists() {
        target_path = solstice_dir.join(format!("{}-{}.{}", file_stem, counter, ext));
        counter += 1;
    }

    fs::copy(&source_path, &target_path)
        .map_err(|e| format!("Failed to copy PDF to working copy directory: {}", e))?;

    map.insert(norm_source, normalize_path(&target_path));
    save_working_copy_map(app, &map)?;

    Ok(target_path)
}

pub fn save_working_pdf(
    app: &AppHandle,
    file_path: Option<String>,
    file_name: Option<String>,
    title: Option<String>,
    data: &[u8],
) -> Result<(String, String), String> {
    let solstice_dir = get_solstice_pdf_dir(app);

    let raw_title = title.or(file_name).unwrap_or_else(|| "Untitled.pdf".to_string());
    let clean_title = raw_title
        .trim_end_matches(".pdf")
        .trim_end_matches(".PDF")
        .replace(['/', '\\', '?', '%', '*', ':', '|', '"', '<', '>'], "-")
        .trim()
        .to_string();
    let clean_title = if clean_title.is_empty() { "Untitled".to_string() } else { clean_title };
    let desired_name = format!("{}.pdf", clean_title);

    let target_path = match file_path {
        Some(path_str) => {
            let path = PathBuf::from(&path_str);
            if is_inside_dir(&path, &solstice_dir) {
                path
            } else {
                ensure_working_copy(app, &path_str)?
            }
        }
        None => {
            let mut target = solstice_dir.join(&desired_name);
            let mut counter = 1;
            while target.exists() {
                target = solstice_dir.join(format!("{}-{}.pdf", clean_title, counter));
                counter += 1;
            }
            target
        }
    };

    fs::write(&target_path, data)
        .map_err(|e| format!("Failed to write PDF working copy: {}", e))?;

    let final_name = target_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Document.pdf")
        .to_string();

    Ok((normalize_path(&target_path), final_name))
}

pub fn rename_working_pdf(
    app: &AppHandle,
    old_path_str: &str,
    new_title: &str,
) -> Result<(String, String), String> {
    let old_path = PathBuf::from(old_path_str);
    if !old_path.exists() {
        return Err("File to rename does not exist".to_string());
    }

    let solstice_dir = get_solstice_pdf_dir(app);
    if !is_inside_dir(&old_path, &solstice_dir) {
        return Err("Cannot rename files outside the Solstice PDF working directory".to_string());
    }

    let clean_title = sanitize_pdf_title(new_title);
    if clean_title == "Document" && new_title.trim().is_empty() {
        return Err("Title cannot be empty".to_string());
    }

    let mut new_path = solstice_dir.join(format!("{}.pdf", clean_title));
    let mut counter = 1;

    while new_path.exists() && normalize_path(&new_path) != normalize_path(&old_path) {
        new_path = solstice_dir.join(format!("{}-{}.pdf", clean_title, counter));
        counter += 1;
    }

    if normalize_path(&new_path) != normalize_path(&old_path) {
        fs::rename(&old_path, &new_path)
            .map_err(|e| format!("Failed to rename PDF: {}", e))?;

        let mut map = load_working_copy_map(app);
        let norm_old = normalize_path(&old_path);
        let norm_new = normalize_path(&new_path);

        for (_, dest) in map.iter_mut() {
            if dest == &norm_old {
                *dest = norm_new.clone();
            }
        }
        save_working_copy_map(app, &map)?;
    }

    let final_name = new_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Document.pdf")
        .to_string();

    Ok((normalize_path(&new_path), final_name))
}
