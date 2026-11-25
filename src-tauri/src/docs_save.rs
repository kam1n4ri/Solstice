use crate::docs_engine::{resolve_working_doc_path, sanitize_doc_title};
use crate::docs_types::{DocsSavePayload, DocsSaveResult};
use std::fs;
use tauri::AppHandle;

const DOC_FILTERS: [(&str, &str, &[&str]); 4] = [
    ("html", "HTML Document", &["html", "htm"]),
    ("docx", "Word Document", &["docx"]),
    ("md", "Markdown Document", &["md"]),
    ("txt", "Plain Text Document", &["txt"]),
];

pub async fn execute_docs_save(
    app: &AppHandle,
    payload: DocsSavePayload,
) -> Result<DocsSaveResult, String> {
    let is_save_as = payload.is_save_as.unwrap_or(false);
    let target_path = if is_save_as || payload.file_path.is_none() {
        let clean_title = sanitize_doc_title(&payload.title);
        let default_ext = match payload.format.as_deref() {
            Some("docx") => "docx",
            Some("md") => "md",
            Some("txt") => "txt",
            _ => "html",
        };
        let default_name = format!("{}.{}", clean_title, default_ext);

        let mut dialog = rfd::AsyncFileDialog::new()
            .set_title(if is_save_as { "Save Document As" } else { "Save Document" })
            .set_file_name(&default_name);

        if let Some((_, label, exts)) = DOC_FILTERS.iter().find(|(id, _, _)| *id == default_ext) {
            dialog = dialog.add_filter(*label, exts);
        }
        for (id, label, exts) in DOC_FILTERS {
            if id != default_ext {
                dialog = dialog.add_filter(label, exts);
            }
        }
        dialog = dialog.add_filter("All Supported Documents", &["html", "htm", "docx", "md", "txt"]);

        match dialog.save_file().await {
            Some(h) => h.path().to_path_buf(),
            None => {
                return Ok(DocsSaveResult {
                    success: false,
                    canceled: Some(true),
                    file_path: None,
                    title: None,
                    error: None,
                })
            }
        }
    } else {
        resolve_working_doc_path(app, payload.file_path.as_deref().unwrap(), &payload.title)?
    };

    if let Some(parent) = target_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let target_ext = target_path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    if target_ext == "docx" {
        let data = payload
            .data
            .ok_or_else(|| "Missing binary Word (.docx) payload for .docx target".to_string())?;
        fs::write(&target_path, data).map_err(|e| format!("Failed to save file: {}", e))?;
    } else {
        let text = match target_ext.as_str() {
            "md" => payload.md_content.as_deref().unwrap_or(&payload.content),
            "txt" => payload.txt_content.as_deref().unwrap_or(&payload.content),
            _ => &payload.content,
        };
        fs::write(&target_path, text).map_err(|e| format!("Failed to save file: {}", e))?;
    }

    let file_title = target_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(&payload.title)
        .to_string();

    Ok(DocsSaveResult {
        success: true,
        canceled: None,
        file_path: Some(target_path.to_string_lossy().to_string()),
        title: Some(file_title),
        error: None,
    })
}
