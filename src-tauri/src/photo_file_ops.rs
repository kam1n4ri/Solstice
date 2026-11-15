use base64::prelude::*;
use std::fs;
use std::path::{Path, PathBuf};

/// Returns the isolated Solstice Photos directory: ~/Documents/Solstice/Photos
pub fn get_photo_working_copy_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    PathBuf::from(home).join("Documents").join("Solstice").join("Photos")
}

/// Ensures an external photo is copied into ~/Documents/Solstice/Photos before editing.
/// External originals are NEVER mutated in-place.
pub fn ensure_photo_working_copy(source: &Path) -> Result<PathBuf, String> {
    let target_dir = get_photo_working_copy_dir();
    fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;

    let canonical_source = source.canonicalize().unwrap_or_else(|_| source.to_path_buf());
    let canonical_target_dir = target_dir.canonicalize().unwrap_or_else(|_| target_dir.clone());

    // If already inside Solstice working copy directory, reuse it directly
    if canonical_source.starts_with(&canonical_target_dir) {
        return Ok(canonical_source);
    }

    let file_name = source
        .file_name()
        .ok_or_else(|| "Invalid file name".to_string())?;
    let target_path = target_dir.join(file_name);

    // Copy external pristine original to working copy location
    fs::copy(source, &target_path).map_err(|e| format!("Failed to copy to working directory: {}", e))?;

    Ok(target_path)
}

/// Reads a local image file and formats it as a Data URL for fast webview rendering.
pub fn read_image_to_data_url(path: &Path) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|e| format!("Failed to read image file: {}", e))?;
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "gif" => "image/gif",
        _ => "image/png",
    };

    let b64 = BASE64_STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
}

/// Saves a Base64 data URL to the specified photo working copy path.
pub fn save_working_copy_data_url(path: &Path, data_url: &str) -> Result<(), String> {
    let parts: Vec<&str> = data_url.splitn(2, ',').collect();
    if parts.len() < 2 {
        return Err("Invalid data URL format".to_string());
    }

    let base64_data = parts[1];
    let decoded = BASE64_STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    fs::write(path, decoded).map_err(|e| format!("Failed to write working copy: {}", e))?;
    Ok(())
}

/// Prompts user with native save dialog to export photo to external disk location.
pub fn export_photo_file(data_url: &str, default_name: &str) -> Result<Option<PathBuf>, String> {
    let dialog = rfd::FileDialog::new()
        .set_file_name(default_name)
        .add_filter("PNG Image", &["png"])
        .add_filter("JPEG Image", &["jpg", "jpeg"])
        .add_filter("WebP Image", &["webp"]);

    if let Some(target_path) = dialog.save_file() {
        save_working_copy_data_url(&target_path, data_url)?;
        Ok(Some(target_path))
    } else {
        Ok(None)
    }
}
