use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledFont {
    pub id: String,
    pub name: String,
    pub category: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "boldFileName")]
    pub bold_file_name: Option<String>,
    pub source: String,
    #[serde(rename = "dateAdded")]
    pub date_added: u64,
    #[serde(rename = "dataUrl")]
    pub data_url: Option<String>,
    #[serde(rename = "boldDataUrl")]
    pub bold_data_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportFontResult {
    pub success: bool,
    pub canceled: Option<bool>,
    pub font: Option<InstalledFont>,
    pub error: Option<String>,
}
