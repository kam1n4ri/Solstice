use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub fn get_solstice_whiteboards_dir(app: &AppHandle) -> PathBuf {
    let docs = app
        .path()
        .document_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let dir = docs.join("Solstice").join("Whiteboards");
    let _ = fs::create_dir_all(&dir);
    dir
}

pub fn sanitize_whiteboard_title(title: &str) -> String {
    let cleaned: String = title
        .trim()
        .chars()
        .map(|c| match c {
            '/' | '\\' | '?' | '%' | '*' | ':' | '|' | '"' | '<' | '>' => '-',
            other => other,
        })
        .collect();

    let stripped = cleaned
        .trim_end_matches(".excalidraw")
        .trim_end_matches(".EXCALIDRAW")
        .trim_end_matches(".tldr")
        .trim_end_matches(".json")
        .trim_end_matches(".JSON")
        .trim_end_matches(".solstice")
        .trim();

    if stripped.is_empty() {
        "Untitled whiteboard".to_string()
    } else {
        stripped.to_string()
    }
}

pub fn get_unique_whiteboard_path(
    dir: &Path,
    base_name: &str,
    ext: &str,
    current_path: Option<&str>,
) -> PathBuf {
    let clean_ext = if ext.starts_with('.') {
        ext.to_string()
    } else {
        format!(".{}", ext)
    };

    let initial = dir.join(format!("{}{}", base_name, clean_ext));
    if let Some(cp) = current_path {
        if cp == initial.to_string_lossy() {
            return initial;
        }
    }

    if !initial.exists() {
        return initial;
    }

    let mut counter = 1;
    loop {
        let candidate = dir.join(format!("{} ({}){}", base_name, counter, clean_ext));
        if let Some(cp) = current_path {
            if cp == candidate.to_string_lossy() {
                return candidate;
            }
        }
        if !candidate.exists() {
            return candidate;
        }
        counter += 1;
    }
}
