use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WhiteboardOpenResult {
    pub success: bool,
    pub canceled: Option<bool>,
    pub title: Option<String>,
    pub content: Option<String>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhiteboardSavePayload {
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub title: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhiteboardSaveResult {
    pub success: bool,
    pub canceled: Option<bool>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub title: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhiteboardAutoSavePayload {
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub title: String,
    pub content: String,
    #[serde(rename = "draftId")]
    pub draft_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhiteboardAutoSaveResult {
    pub success: bool,
    #[serde(rename = "filePath")]
    pub file_path: String,
    pub title: String,
    #[serde(rename = "lastSaved")]
    pub last_saved: u64,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhiteboardExportPayload {
    #[serde(rename = "defaultName")]
    pub default_name: Option<String>,
    pub format: String,
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhiteboardExportResult {
    pub success: bool,
    pub canceled: Option<bool>,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub error: Option<String>,
}
