use egui::Color32;

/// Pale, light-valued pastel colors strictly matching Solstice aesthetic rules.
/// No harsh, heavily saturated, or intense solid boxes.

// Backgrounds
pub const BG_WINDOW: Color32 = Color32::from_rgb(250, 250, 249); // Stone 50
pub const BG_PANEL: Color32 = Color32::from_rgb(255, 255, 255); // Pure White
pub const BG_SUBTLE: Color32 = Color32::from_rgb(245, 245, 244); // Stone 100
pub const BG_HOVER: Color32 = Color32::from_rgba_premultiplied(245, 245, 244, 200);

// Borders & Outlines
pub const BORDER_SUBTLE: Color32 = Color32::from_rgba_premultiplied(228, 228, 231, 140);
pub const BORDER_LIGHT: Color32 = Color32::from_rgba_premultiplied(214, 211, 209, 160);
pub const BORDER_FOCUS: Color32 = Color32::from_rgba_premultiplied(191, 219, 254, 220); // Blue 200

// Text Colors
pub const TEXT_PRIMARY: Color32 = Color32::from_rgb(28, 25, 23); // Stone 900
pub const TEXT_SECONDARY: Color32 = Color32::from_rgb(120, 113, 108); // Stone 500
pub const TEXT_MUTED: Color32 = Color32::from_rgb(168, 162, 158); // Stone 400

// Soft Pale Accents (Low Saturation & Pale Value Only)
pub const ACCENT_BLUE_BG: Color32 = Color32::from_rgba_premultiplied(239, 246, 255, 220); // Blue 50
pub const ACCENT_BLUE_ACTIVE: Color32 = Color32::from_rgba_premultiplied(219, 234, 254, 200); // Blue 100
pub const ACCENT_BLUE_BORDER: Color32 = Color32::from_rgba_premultiplied(191, 219, 254, 220); // Blue 200
pub const ACCENT_BLUE_TEXT: Color32 = Color32::from_rgb(37, 99, 235); // Blue 600

pub const ACCENT_EMERALD_BG: Color32 = Color32::from_rgba_premultiplied(236, 253, 245, 220); // Emerald 50
pub const ACCENT_EMERALD_BORDER: Color32 = Color32::from_rgba_premultiplied(167, 243, 208, 200);
pub const ACCENT_EMERALD_TEXT: Color32 = Color32::from_rgb(5, 150, 105);

pub const ACCENT_AMBER_BG: Color32 = Color32::from_rgba_premultiplied(254, 243, 199, 220); // Amber 100
pub const ACCENT_AMBER_BORDER: Color32 = Color32::from_rgba_premultiplied(253, 230, 138, 200);
pub const ACCENT_AMBER_TEXT: Color32 = Color32::from_rgb(217, 119, 6);

pub const ACCENT_ROSE_BG: Color32 = Color32::from_rgba_premultiplied(255, 241, 242, 220); // Rose 50
pub const ACCENT_ROSE_BORDER: Color32 = Color32::from_rgba_premultiplied(254, 205, 211, 200);
pub const ACCENT_ROSE_TEXT: Color32 = Color32::from_rgb(225, 29, 72);
