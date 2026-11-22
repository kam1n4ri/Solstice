use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub fn get_solstice_docs_dir(app: &AppHandle) -> PathBuf {
    let docs = app
        .path()
        .document_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let dir = docs.join("Solstice").join("Documents");
    let _ = fs::create_dir_all(&dir);
    dir
}

pub fn sanitize_doc_title(title: &str) -> String {
    let cleaned: String = title
        .trim()
        .chars()
        .map(|c| match c {
            '/' | '\\' | '?' | '%' | '*' | ':' | '|' | '"' | '<' | '>' => '-',
            other => other,
        })
        .collect();

    let stripped = cleaned
        .trim_end_matches(".html")
        .trim_end_matches(".HTML")
        .trim_end_matches(".md")
        .trim_end_matches(".MD")
        .trim_end_matches(".txt")
        .trim_end_matches(".TXT")
        .trim_end_matches(".docx")
        .trim_end_matches(".DOCX")
        .trim();

    if stripped.is_empty() {
        "Untitled document".to_string()
    } else {
        stripped.to_string()
    }
}

pub fn get_unique_doc_path(
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
        let candidate = dir.join(format!("{}-{} {}", base_name, counter, clean_ext));
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

pub fn save_working_doc(
    app: &AppHandle,
    title: &str,
    content: &str,
    active_path: Option<&str>,
    draft_id: &str,
) -> Result<PathBuf, String> {
    let docs_dir = get_solstice_docs_dir(app);
    let safe_base = sanitize_doc_title(title);

    let is_custom_title = !title.trim().is_empty() && title.trim() != "Untitled document";
    let base_title = if is_custom_title {
        safe_base
    } else if let Some(p) = active_path {
        Path::new(p)
            .file_stem()
            .and_then(|s| s.to_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                let suffix = if draft_id.len() >= 6 {
                    &draft_id[draft_id.len() - 6..]
                } else {
                    draft_id
                };
                format!("Untitled_{}", suffix)
            })
    } else {
        let suffix = if draft_id.len() >= 6 {
            &draft_id[draft_id.len() - 6..]
        } else {
            draft_id
        };
        format!("Untitled_{}", suffix)
    };

    let target_path = if let Some(existing) = active_path {
        let existing_path = PathBuf::from(existing);
        let ext = existing_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("html");
        let desired_filename = format!("{}.{}", base_title, ext);

        if existing_path.parent() == Some(&docs_dir)
            && existing_path.file_name().and_then(|f| f.to_str()) != Some(&desired_filename)
        {
            let unique = get_unique_doc_path(&docs_dir, &base_title, ext, Some(existing));
            if existing_path.exists() && unique != existing_path {
                let _ = fs::rename(&existing_path, &unique);
            }
            unique
        } else {
            existing_path
        }
    } else {
        get_unique_doc_path(&docs_dir, &base_title, ".html", None)
    };

    fs::write(&target_path, content).map_err(|e| format!("Failed to save document: {}", e))?;
    Ok(target_path)
}
