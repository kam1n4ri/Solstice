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

    let mut base = cleaned.trim().to_string();
    loop {
        let lower = base.to_lowercase();
        let mut stripped_any = false;
        for ext in [".excalidraw", ".tldr", ".json", ".solstice"] {
            if lower.ends_with(ext) {
                base.truncate(base.len() - ext.len());
                base = base.trim().to_string();
                stripped_any = true;
                break;
            }
        }
        if !stripped_any {
            break;
        }
    }

    if base.is_empty() {
        "Untitled whiteboard".to_string()
    } else {
        base
    }
}

pub fn get_unique_whiteboard_path(
    dir: &Path,
    base_name: &str,
    ext: &str,
    current_path: Option<&str>,
) -> PathBuf {
    let trimmed_base = base_name.trim();
    let clean_base = if trimmed_base.is_empty() {
        "Untitled whiteboard"
    } else {
        trimmed_base
    };
    let trimmed_ext = ext.trim();
    let clean_ext = if trimmed_ext.is_empty() {
        ".excalidraw".to_string()
    } else if trimmed_ext.starts_with('.') {
        trimmed_ext.to_string()
    } else {
        format!(".{}", trimmed_ext)
    };

    let initial = dir.join(format!("{}{}", clean_base, clean_ext));
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
        let candidate = dir.join(format!("{} ({}){}", clean_base, counter, clean_ext));
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
