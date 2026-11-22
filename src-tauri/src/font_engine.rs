use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use crate::font_types::InstalledFont;
use base64::Engine;

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

pub fn save_manifest(app: &AppHandle, fonts: &[InstalledFont]) {
    let path = get_manifest_path(app);
    let stripped: Vec<InstalledFont> = fonts
        .iter()
        .map(|f| InstalledFont {
            data_url: None,
            bold_data_url: None,
            ..f.clone()
        })
        .collect();

    if let Ok(json) = serde_json::to_string_pretty(&stripped) {
        let _ = fs::write(path, json);
    }
}

pub fn file_to_data_url(path: &PathBuf, ext: &str) -> Option<String> {
    if !path.exists() {
        return None;
    }
    if let Ok(bytes) = fs::read(path) {
        let mime = match ext {
            "ttf" => "font/ttf",
            "otf" => "font/otf",
            _ => "font/woff2",
        };
        let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
        Some(format!("data:{};base64,{}", mime, encoded))
    } else {
        None
    }
}
