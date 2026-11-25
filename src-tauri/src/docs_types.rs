use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DocsOpenResult {
    pub success: bool,
    pub canceled: Option<bool>,
    pub title: Option<String>,
    pub content: Option<String>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub format: Option<String>,
    pub data: Option<Vec<u8>>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocsSavePayload {
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub title: String,
    pub content: String,
    #[serde(rename = "mdContent")]
    pub md_content: Option<String>,
    #[serde(rename = "txtContent")]
    pub txt_content: Option<String>,
    pub format: Option<String>,
    #[serde(rename = "isSaveAs")]
    pub is_save_as: Option<bool>,
    pub data: Option<Vec<u8>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocsSaveResult {
    pub success: bool,
    pub canceled: Option<bool>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub title: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocsAutoSavePayload {
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    #[serde(rename = "draftId")]
    pub draft_id: Option<String>,
    pub title: String,
    pub content: String,
    pub data: Option<Vec<u8>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocsAutoSaveResult {
    pub success: bool,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    #[serde(rename = "draftId")]
    pub draft_id: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocsExportPayload {
    pub format: String,
    pub title: String,
    pub content: String,
    #[serde(rename = "htmlContent")]
    pub html_content: String,
    pub data: Option<Vec<u8>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocsExportResult {
    pub success: bool,
    pub canceled: Option<bool>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub error: Option<String>,
}
