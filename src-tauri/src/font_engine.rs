use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use crate::font_types::InstalledFont;
use base64::Engine;

pub fn sanitize_font_filename(raw: &str) -> Result<String, String> {
    let base = Path::new(raw)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| format!("Invalid font filename: {}", raw))?;

    let cleaned: String = base
        .chars()
        .map(|c| match c {
            '/' | '\\' | '?' | '%' | '*' | ':' | '|' | '"' | '<' | '>' | '\0' => '-',
            other => other,
        })
        .collect();
    let trimmed = cleaned.trim();
    if trimmed.is_empty() || trimmed == "." || trimmed == ".." {
        return Err(format!("Unsafe font filename: {}", raw));
    }
    Ok(trimmed.to_string())
}

pub fn safe_font_path(fonts_dir: &Path, raw_name: &str) -> Result<PathBuf, String> {
    let clean = sanitize_font_filename(raw_name)?;
    let joined = fonts_dir.join(&clean);
    if joined.parent() != Some(fonts_dir) {
        return Err("Font path escapes fonts directory".to_string());
    }
    Ok(joined)
}

pub fn get_solstice_fonts_dir(app: &AppHandle) -> PathBuf {
    let docs = app
        .path()
        .document_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let dir = docs.join("Solstice").join("Fonts");
    let _ = fs::create_dir_all(&dir);
    dir
}

pub fn get_manifest_path(app: &AppHandle) -> PathBuf {
    get_solstice_fonts_dir(app).join("fonts.json")
}

pub fn load_manifest(app: &AppHandle) -> Vec<InstalledFont> {
    let path = get_manifest_path(app);
    if path.exists() {
        if let Ok(raw) = fs::read_to_string(&path) {
            if let Ok(fonts) = serde_json::from_str::<Vec<InstalledFont>>(&raw) {
                return fonts;
            }
        }
    }
    vec![]
}

pub fn save_manifest(app: &AppHandle, fonts: &[InstalledFont]) -> Result<(), String> {
    let path = get_manifest_path(app);
    let stripped: Vec<InstalledFont> = fonts
        .iter()
        .map(|f| InstalledFont {
            data_url: None,
            bold_data_url: None,
            ..f.clone()
        })
        .collect();

    let json = serde_json::to_string_pretty(&stripped)
        .map_err(|e| format!("Failed to serialize font manifest: {}", e))?;
    fs::write(path, json).map_err(|e| format!("Failed to write font manifest: {}", e))
}

pub fn file_to_data_url(path: &PathBuf, ext: &str) -> Option<String> {
    if !path.exists() {
        return None;
    }
    if let Ok(bytes) = fs::read(path) {
        if bytes.is_empty() {
            return None;
        }
        let mime = match ext.to_lowercase().as_str() {
            "ttf" => "font/ttf",
            "otf" => "font/otf",
            "woff" => "font/woff",
            _ => "font/woff2",
        };
        let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
        Some(format!("data:{};base64,{}", mime, encoded))
    } else {
        None
    }
}

pub fn remove_orphan_font_files(
    fonts_dir: &Path,
    removed: &[InstalledFont],
    remaining: &[InstalledFont],
) -> Result<(), String> {
    let mut active_files = std::collections::HashSet::new();
    for entry in remaining {
        active_files.insert(entry.file_name.as_str());
        if let Some(ref bold) = entry.bold_file_name {
            active_files.insert(bold.as_str());
        }
    }

    let mut targets = std::collections::HashSet::new();
    for entry in removed {
        if !active_files.contains(entry.file_name.as_str()) {
            targets.insert(entry.file_name.as_str());
        }
        if let Some(ref bold) = entry.bold_file_name {
            if !active_files.contains(bold.as_str()) {
                targets.insert(bold.as_str());
            }
        }
    }

    for file_name in targets {
        if let Ok(path) = safe_font_path(fonts_dir, file_name) {
            if path.exists() {
                fs::remove_file(&path)
                    .map_err(|e| format!("Failed to delete font file {}: {}", file_name, e))?;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_test_dir(label: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "solstice_font_test_{}_{}",
            label,
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn sanitize_and_safe_path_rejects_traversal() {
        assert_eq!(sanitize_font_filename("../../Inter.woff2").unwrap(), "Inter.woff2");
        assert!(sanitize_font_filename("..").is_err());
        assert!(sanitize_font_filename(".").is_err());
        assert!(sanitize_font_filename("").is_err());

        let dir = temp_test_dir("safe_path");
        assert!(safe_font_path(&dir, "Roboto.ttf").is_ok());
        assert!(safe_font_path(&dir, "../escape.ttf").is_ok());
        assert!(safe_font_path(&dir, "..").is_err());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn data_url_maps_mimes_and_rejects_empty_files() {
        let dir = temp_test_dir("mime");
        let empty_path = dir.join("empty.woff2");
        fs::write(&empty_path, b"").unwrap();
        assert!(file_to_data_url(&empty_path, "woff2").is_none());

        for (ext, expected_prefix) in [
            ("ttf", "data:font/ttf;base64,"),
            ("otf", "data:font/otf;base64,"),
            ("woff", "data:font/woff;base64,"),
            ("woff2", "data:font/woff2;base64,"),
        ] {
            let p = dir.join(format!("sample.{}", ext));
            fs::write(&p, b"FONTBYTES").unwrap();
            let url = file_to_data_url(&p, ext).unwrap();
            assert!(url.starts_with(expected_prefix));
        }
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn orphan_cleanup_preserves_shared_files() {
        let dir = temp_test_dir("orphans");
        for name in ["a.woff2", "a-bold.woff2", "shared.woff2"] {
            fs::write(dir.join(name), b"123").unwrap();
        }
        let mk = |file: &str, bold: Option<&str>| InstalledFont {
            id: file.to_string(),
            name: file.to_string(),
            category: "sans-serif".to_string(),
            file_name: file.to_string(),
            bold_file_name: bold.map(str::to_string),
            source: "google".to_string(),
            date_added: 1,
            data_url: None,
            bold_data_url: None,
        };
        let removed = vec![mk("a.woff2", Some("a-bold.woff2")), mk("shared.woff2", None)];
        let remaining = vec![mk("shared.woff2", None)];
        remove_orphan_font_files(&dir, &removed, &remaining).unwrap();

        assert!(!dir.join("a.woff2").exists());
        assert!(!dir.join("a-bold.woff2").exists());
        assert!(dir.join("shared.woff2").exists());
        let _ = fs::remove_dir_all(&dir);
    }
}
