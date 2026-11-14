use egui::{Color32, Stroke, Visuals, Margin, Theme};
use crate::colors::*;

/// Configures egui Context to Solstice's signature pale pastel theme.
/// Pale, low-opacity, light-valued hues strictly without harsh solid boxes.
pub fn apply_theme(ctx: &egui::Context) {
    let mut visuals = Visuals::light();

    // Window & Panel backgrounds
    visuals.panel_fill = BG_WINDOW;
    visuals.window_fill = BG_PANEL;
    visuals.window_stroke = Stroke::new(1.0, BORDER_SUBTLE);

    // Extreme widgets (text edit, sliders, text boxes)
    visuals.extreme_bg_color = BG_PANEL;

    // Normal non-interactive widget styling
    visuals.widgets.noninteractive.bg_fill = BG_PANEL;
    visuals.widgets.noninteractive.weak_bg_fill = BG_SUBTLE;
    visuals.widgets.noninteractive.bg_stroke = Stroke::new(1.0, BORDER_SUBTLE);
    visuals.widgets.noninteractive.fg_stroke = Stroke::new(1.0, TEXT_PRIMARY);

    // Inactive buttons / controls: soft, calm, restrained
    visuals.widgets.inactive.bg_fill = BG_PANEL;
    visuals.widgets.inactive.weak_bg_fill = Color32::TRANSPARENT;
    visuals.widgets.inactive.bg_stroke = Stroke::new(1.0, BORDER_SUBTLE);
    visuals.widgets.inactive.fg_stroke = Stroke::new(1.0, TEXT_PRIMARY);

    // Hovered buttons: gentle, pale highlight (Stone 100/70)
    visuals.widgets.hovered.bg_fill = BG_HOVER;
    visuals.widgets.hovered.weak_bg_fill = BG_HOVER;
    visuals.widgets.hovered.bg_stroke = Stroke::new(1.0, BORDER_LIGHT);
    visuals.widgets.hovered.fg_stroke = Stroke::new(1.0, TEXT_PRIMARY);

    // Active / Pressed buttons: soft pale tint
    visuals.widgets.active.bg_fill = ACCENT_BLUE_ACTIVE;
    visuals.widgets.active.weak_bg_fill = ACCENT_BLUE_ACTIVE;
    visuals.widgets.active.bg_stroke = Stroke::new(1.0, ACCENT_BLUE_BORDER);
    visuals.widgets.active.fg_stroke = Stroke::new(1.0, ACCENT_BLUE_TEXT);

    // Selection highlight: pale low-opacity blue, never saturated royal blue
    visuals.selection.bg_fill = ACCENT_BLUE_BG;
    visuals.selection.stroke = Stroke::new(1.0, ACCENT_BLUE_TEXT);

    // Hyperlinks
    visuals.hyperlink_color = ACCENT_BLUE_TEXT;

    ctx.set_theme(Theme::Light);
    ctx.set_visuals_of(Theme::Light, visuals);

    // Set gentle spacing and clean layout defaults
    ctx.style_mut_of(Theme::Light, |style| {
        style.spacing.item_spacing = egui::vec2(8.0, 8.0);
        style.spacing.button_padding = egui::vec2(10.0, 6.0);
        style.spacing.window_margin = Margin::same(12);
    });
}
