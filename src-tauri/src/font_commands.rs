use crate::font_engine::*;
use crate::font_types::*;
use std::fs;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub fn get_installed_fonts(app: AppHandle) -> Vec<InstalledFont> {
    let fonts_dir = get_solstice_fonts_dir(&app);
    let manifest = load_manifest(&app);
    let mut valid_fonts = Vec::with_capacity(manifest.len());
    let mut manifest_changed = false;

    for mut font in manifest {
        font.data_url = safe_font_path(&fonts_dir, &font.file_name)
            .ok()
            .and_then(|font_path| {
                let ext = font_path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("woff2");
                file_to_data_url(&font_path, ext)
            });

        if font.data_url.is_none() {
            manifest_changed = true;
            continue;
        }

        if let Some(ref bold_name) = font.bold_file_name.clone() {
            let bold_data_url = safe_font_path(&fonts_dir, bold_name)
                .ok()
                .and_then(|bold_path| {
                    let bold_ext = bold_path
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("woff2");
                    file_to_data_url(&bold_path, bold_ext)
                });
            if bold_data_url.is_none() {
                font.bold_file_name = None;
                font.bold_data_url = None;
                manifest_changed = true;
            } else {
                font.bold_data_url = bold_data_url;
            }
        } else {
            font.bold_data_url = None;
        }

        valid_fonts.push(font);
    }

    if manifest_changed {
        let _ = save_manifest(&app, &valid_fonts);
    }

    valid_fonts
}

#[tauri::command]
pub fn save_installed_font(
    app: AppHandle,
    mut font: InstalledFont,
    data: Vec<u8>,
    bold_data: Option<Vec<u8>>,
) -> Result<InstalledFont, String> {
    if data.is_empty() {
        return Err("Font file data is empty".to_string());
    }

    let fonts_dir = get_solstice_fonts_dir(&app);
    let safe_name = sanitize_font_filename(&font.file_name)?;
    font.file_name = safe_name.clone();
    let font_path = safe_font_path(&fonts_dir, &safe_name)?;
    fs::write(&font_path, &data).map_err(|e| format!("Failed to save font file: {}", e))?;

    match (font.bold_file_name.clone(), &bold_data) {
        (Some(raw_bold_name), Some(b_bytes)) if !b_bytes.is_empty() => {
            let safe_bold = sanitize_font_filename(&raw_bold_name)?;
            font.bold_file_name = Some(safe_bold.clone());
            let bold_path = safe_font_path(&fonts_dir, &safe_bold)?;
            fs::write(&bold_path, b_bytes)
                .map_err(|e| format!("Failed to save bold font file: {}", e))?;
        }
        _ => {
            font.bold_file_name = None;
            font.bold_data_url = None;
        }
    }

    let manifest = load_manifest(&app);
    let (mut kept, removed): (Vec<InstalledFont>, Vec<InstalledFont>) = manifest
        .into_iter()
        .partition(|f| !f.name.eq_ignore_ascii_case(&font.name) && f.id != font.id);
    kept.push(font.clone());
    save_manifest(&app, &kept)?;
    let _ = remove_orphan_font_files(&fonts_dir, &removed, &kept);

    let updated = get_installed_fonts(app.clone());
    let _ = app.emit("fonts-updated", &updated);

    Ok(font)
}

#[tauri::command]
pub async fn import_local_font(app: AppHandle) -> Result<ImportFontResult, String> {
    let handle = rfd::AsyncFileDialog::new()
        .set_title("Import Font File")
        .add_filter(
            "Font Files (*.ttf, *.otf, *.woff2)",
            &["ttf", "otf", "woff2", "woff"],
        )
        .pick_file()
        .await;

    let path = match handle {
        Some(h) => h.path().to_path_buf(),
        None => {
            return Ok(ImportFontResult {
                success: false,
                canceled: Some(true),
                font: None,
                error: None,
            });
        }
    };

    let base_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("CustomFont.ttf")
        .to_string();
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("ttf")
        .to_lowercase();
    let raw_stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Custom Font");
    let clean_title = raw_stem.replace('-', " ").replace('_', " ");

    let metadata = fs::metadata(&path).map_err(|e| format!("Failed to read font file: {}", e))?;
    if metadata.len() == 0 {
        return Ok(ImportFontResult {
            success: false,
            canceled: None,
            font: None,
            error: Some("Selected font file is empty".to_string()),
        });
    }

    let fonts_dir = get_solstice_fonts_dir(&app);
    let safe_base = sanitize_font_filename(&base_name)?;
    let dest_path = safe_font_path(&fonts_dir, &safe_base)?;
    let same_file = path
        .canonicalize()
        .ok()
        .zip(dest_path.canonicalize().ok())
        .map(|(a, b)| a == b)
        .unwrap_or_else(|| path == dest_path);
    if !same_file {
        fs::copy(&path, &dest_path).map_err(|e| e.to_string())?;
    }

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let data_url = file_to_data_url(&dest_path, &ext);
    if data_url.is_none() {
        return Ok(ImportFontResult {
            success: false,
            canceled: None,
            font: None,
            error: Some("Failed to load font data".to_string()),
        });
    }

    let new_font = InstalledFont {
        id: clean_title.clone(),
        name: clean_title,
        category: "sans-serif".to_string(),
        file_name: safe_base,
        bold_file_name: None,
        source: "custom".to_string(),
        date_added: now,
        data_url,
        bold_data_url: None,
    };

    let manifest = load_manifest(&app);
    let (mut kept, removed): (Vec<InstalledFont>, Vec<InstalledFont>) = manifest
        .into_iter()
        .partition(|f| !f.name.eq_ignore_ascii_case(&new_font.name) && f.id != new_font.id);
    kept.push(new_font.clone());
    save_manifest(&app, &kept)?;
    let _ = remove_orphan_font_files(&fonts_dir, &removed, &kept);

    let updated = get_installed_fonts(app.clone());
    let _ = app.emit("fonts-updated", &updated);

    Ok(ImportFontResult {
        success: true,
        canceled: None,
        font: Some(new_font),
        error: None,
    })
}

#[tauri::command]
pub fn delete_installed_font(app: AppHandle, font_id: String) -> Result<(), String> {
    let fonts_dir = get_solstice_fonts_dir(&app);
    let manifest = load_manifest(&app);
    let (kept, removed): (Vec<InstalledFont>, Vec<InstalledFont>) = manifest
        .into_iter()
        .partition(|f| f.id != font_id && !f.name.eq_ignore_ascii_case(&font_id));

    if !removed.is_empty() {
        remove_orphan_font_files(&fonts_dir, &removed, &kept)?;
        save_manifest(&app, &kept)?;
        let updated = get_installed_fonts(app.clone());
        let _ = app.emit("fonts-updated", &updated);
    }

    Ok(())
}
