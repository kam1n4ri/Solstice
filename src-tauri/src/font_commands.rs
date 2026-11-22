use crate::font_engine::*;
use crate::font_types::*;
use std::fs;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub fn get_installed_fonts(app: AppHandle) -> Vec<InstalledFont> {
    let fonts_dir = get_solstice_fonts_dir(&app);
    let mut manifest = load_manifest(&app);

    for font in &mut manifest {
        let font_path = fonts_dir.join(&font.file_name);
        let ext = font_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("woff2");
        font.data_url = file_to_data_url(&font_path, ext);

        if let Some(ref bold_name) = font.bold_file_name {
            let bold_path = fonts_dir.join(bold_name);
            let bold_ext = bold_path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("woff2");
            font.bold_data_url = file_to_data_url(&bold_path, bold_ext);
        }
    }

    manifest
}

#[tauri::command]
pub fn save_installed_font(
    app: AppHandle,
    font: InstalledFont,
    data: Vec<u8>,
    bold_data: Option<Vec<u8>>,
) -> Result<InstalledFont, String> {
    let fonts_dir = get_solstice_fonts_dir(&app);
    let font_path = fonts_dir.join(&font.file_name);
    fs::write(&font_path, &data).map_err(|e| e.to_string())?;

    if let (Some(ref bold_name), Some(ref b_bytes)) = (&font.bold_file_name, &bold_data) {
        let bold_path = fonts_dir.join(bold_name);
        let _ = fs::write(&bold_path, b_bytes);
    }

    let mut manifest = load_manifest(&app);
    manifest.retain(|f| f.name.to_lowercase() != font.name.to_lowercase() && f.id != font.id);
    manifest.push(font.clone());
    save_manifest(&app, &manifest);

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

    let fonts_dir = get_solstice_fonts_dir(&app);
    let dest_path = fonts_dir.join(&base_name);
    fs::copy(&path, &dest_path).map_err(|e| e.to_string())?;

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let data_url = file_to_data_url(&dest_path, &ext);

    let new_font = InstalledFont {
        id: clean_title.clone(),
        name: clean_title,
        category: "sans-serif".to_string(),
        file_name: base_name,
        bold_file_name: None,
        source: "custom".to_string(),
        date_added: now,
        data_url,
        bold_data_url: None,
    };

    let mut manifest = load_manifest(&app);
    manifest.retain(|f| f.name.to_lowercase() != new_font.name.to_lowercase());
    manifest.push(new_font.clone());
    save_manifest(&app, &manifest);

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
    let mut manifest = load_manifest(&app);

    if let Some(pos) = manifest.iter().position(|f| f.id == font_id || f.name == font_id) {
        let removed = manifest.remove(pos);
        let _ = fs::remove_file(fonts_dir.join(&removed.file_name));
        if let Some(ref bold_name) = removed.bold_file_name {
            let _ = fs::remove_file(fonts_dir.join(bold_name));
        }
        save_manifest(&app, &manifest);
        let updated = get_installed_fonts(app.clone());
        let _ = app.emit("fonts-updated", &updated);
    }

    Ok(())
}
