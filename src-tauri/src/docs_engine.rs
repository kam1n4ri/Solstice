use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

const WORKING_COPY_MAP_FILE: &str = "docs-working-copies.json";

pub fn get_solstice_docs_dir(app: &AppHandle) -> PathBuf {
    let docs = app
        .path()
        .document_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let dir = docs.join("Solstice").join("Documents");
    let _ = fs::create_dir_all(&dir);
    dir
}

fn get_working_copy_map_path(app: &AppHandle) -> PathBuf {
    let data_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| get_solstice_docs_dir(app));
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

fn save_working_copy_map(app: &AppHandle, map: &HashMap<String, String>) {
    let map_path = get_working_copy_map_path(app);
    if let Ok(content) = serde_json::to_string_pretty(map) {
        let _ = fs::write(map_path, content);
    }
}

fn normalize_path(p: &Path) -> PathBuf {
    p.canonicalize().unwrap_or_else(|_| p.to_path_buf())
}

fn is_inside_dir(path: &Path, dir: &Path) -> bool {
    normalize_path(path).starts_with(normalize_path(dir))
}

/// Ensures an external document is isolated in ~/Documents/Solstice/Documents/.
/// External files are NEVER mutated; reuses existing mapped working copies without duplicates.
pub fn ensure_working_doc(app: &AppHandle, source_path_str: &str) -> Result<PathBuf, String> {
    let source_path = PathBuf::from(source_path_str);
    if !source_path.exists() {
        return Err("File does not exist on disk".to_string());
    }

    let docs_dir = get_solstice_docs_dir(app);
    if is_inside_dir(&source_path, &docs_dir) {
        return Ok(source_path);
    }

    let norm_source = normalize_path(&source_path).to_string_lossy().to_string();
    let mut map = load_working_copy_map(app);

    if let Some(existing_str) = map.get(&norm_source) {
        let existing_path = PathBuf::from(existing_str);
        if existing_path.exists() {
            return Ok(existing_path);
        }
    }

    let file_stem = source_path
        .file_stem()
        .and_then(|s| s.to_str())
        .map(sanitize_doc_title)
        .unwrap_or_else(|| "Untitled document".to_string());
    let ext = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("html");

    let target_path = get_unique_doc_path(&docs_dir, &file_stem, ext, None);
    fs::copy(&source_path, &target_path)
        .map_err(|e| format!("Failed to create working copy in Documents: {}", e))?;

    let norm_target = normalize_path(&target_path).to_string_lossy().to_string();
    map.insert(norm_source, norm_target);
    save_working_copy_map(app, &map);

    Ok(target_path)
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
    let trimmed_base = base_name.trim();
    let clean_base = if trimmed_base.is_empty() {
        "Untitled document"
    } else {
        trimmed_base
    };
    let trimmed_ext = ext.trim();
    let clean_ext = if trimmed_ext.is_empty() {
        ".html".to_string()
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
        let candidate = dir.join(format!("{}-{}{}", clean_base, counter, clean_ext));
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
    data: Option<&[u8]>,
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
        let working_path = resolve_working_doc_path(app, existing, &base_title)?;

        let ext = working_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("html");
        let desired_filename = format!("{}.{}", base_title, ext);

        if working_path.file_name().and_then(|f| f.to_str()) != Some(&desired_filename) {
            let working_str = working_path.to_string_lossy().to_string();
            let unique = get_unique_doc_path(&docs_dir, &base_title, ext, Some(&working_str));
            if working_path.exists() && unique != working_path {
                if fs::rename(&working_path, &unique).is_ok() {
                    let norm_old = normalize_path(&working_path).to_string_lossy().to_string();
                    let norm_new = normalize_path(&unique).to_string_lossy().to_string();
                    let mut map = load_working_copy_map(app);
                    let mut updated = false;
                    for (_, dest) in map.iter_mut() {
                        if dest == &norm_old {
                            *dest = norm_new.clone();
                            updated = true;
                        }
                    }
                    if updated {
                        save_working_copy_map(app, &map);
                    }
                }
            }
            unique
        } else {
            working_path
        }
    } else {
        get_unique_doc_path(&docs_dir, &base_title, ".html", None)
    };

    let is_docx = target_path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("docx"))
        .unwrap_or(false);

    if let Some(bytes) = data {
        fs::write(&target_path, bytes).map_err(|e| format!("Failed to save document: {}", e))?;
    } else if is_docx {
        return Err("Refusing to overwrite binary .docx file with plain text content".to_string());
    } else {
        fs::write(&target_path, content).map_err(|e| format!("Failed to save document: {}", e))?;
    }

    Ok(target_path)
}

/// Resolves an active path into an isolated working copy path inside ~/Documents/Solstice/Documents/
/// without ever returning an external path for mutation.
pub fn resolve_working_doc_path(
    app: &AppHandle,
    active_path: &str,
    fallback_title: &str,
) -> Result<PathBuf, String> {
    let docs_dir = get_solstice_docs_dir(app);
    let existing_path = PathBuf::from(active_path);
    if is_inside_dir(&existing_path, &docs_dir) {
        Ok(existing_path)
    } else if existing_path.exists() {
        ensure_working_doc(app, active_path)
    } else {
        let safe_base = sanitize_doc_title(fallback_title);
        let ext = existing_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("html");
        Ok(get_unique_doc_path(&docs_dir, &safe_base, ext, None))
    }
}
