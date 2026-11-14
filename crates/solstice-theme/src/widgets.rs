use egui::{Response, Ui, WidgetText, Stroke, Frame, Margin, CornerRadius};
use crate::colors::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BadgeTone {
    Neutral,
    Blue,
    Emerald,
    Amber,
    Rose,
}

/// A soft, pale button following Solstice's aesthetic rules.
/// Avoids heavy saturated blocks; uses gentle low-opacity tones.
pub fn pale_button(ui: &mut Ui, label: impl Into<WidgetText>, is_active: bool) -> Response {
    let (bg_fill, border_color, text_color) = if is_active {
        (ACCENT_BLUE_BG, ACCENT_BLUE_BORDER, ACCENT_BLUE_TEXT)
    } else {
        (BG_PANEL, BORDER_SUBTLE, TEXT_PRIMARY)
    };

    let button = egui::Button::new(label.into().color(text_color))
        .fill(bg_fill)
        .stroke(Stroke::new(1.0, border_color))
        .corner_radius(CornerRadius::same(6));

    ui.add(button)
}

/// A subtle, pale pill badge for tool states or tags.
pub fn pill_badge(ui: &mut Ui, text: &str, tone: BadgeTone) {
    let (bg_fill, border_stroke, text_color) = match tone {
        BadgeTone::Neutral => (BG_SUBTLE, BORDER_SUBTLE, TEXT_SECONDARY),
        BadgeTone::Blue => (ACCENT_BLUE_BG, ACCENT_BLUE_BORDER, ACCENT_BLUE_TEXT),
        BadgeTone::Emerald => (ACCENT_EMERALD_BG, ACCENT_EMERALD_BORDER, ACCENT_EMERALD_TEXT),
        BadgeTone::Amber => (ACCENT_AMBER_BG, ACCENT_AMBER_BORDER, ACCENT_AMBER_TEXT),
        BadgeTone::Rose => (ACCENT_ROSE_BG, ACCENT_ROSE_BORDER, ACCENT_ROSE_TEXT),
    };

    Frame::canvas(&ui.style())
        .fill(bg_fill)
        .stroke(Stroke::new(1.0, border_stroke))
        .corner_radius(CornerRadius::same(10))
        .inner_margin(Margin::symmetric(8, 3))
        .show(ui, |ui| {
            ui.colored_label(text_color, text);
        });
}

/// Clean container frame with a subtle outline and white/pale background.
pub fn panel_card<R>(ui: &mut Ui, add_contents: impl FnOnce(&mut Ui) -> R) -> R {
    Frame::canvas(&ui.style())
        .fill(BG_PANEL)
        .stroke(Stroke::new(1.0, BORDER_SUBTLE))
        .corner_radius(CornerRadius::same(8))
        .inner_margin(Margin::same(12))
        .show(ui, add_contents)
        .inner
}

/// A calm section heading with primary title and secondary hint.
pub fn section_heading(ui: &mut Ui, title: &str, hint: Option<&str>) {
    ui.horizontal(|ui| {
        ui.label(egui::RichText::new(title).strong().color(TEXT_PRIMARY).size(15.0));
        if let Some(hint_text) = hint {
            ui.label(egui::RichText::new(hint_text).color(TEXT_MUTED).size(12.0));
        }
    });
}
