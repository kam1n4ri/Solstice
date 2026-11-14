use eframe::egui;
use solstice_theme::{
    apply_theme, pale_button, panel_card, pill_badge, section_heading, BadgeTone,
    BG_WINDOW, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY,
};

fn main() -> eframe::Result<()> {
    let native_options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([880.0, 620.0])
            .with_min_inner_size([720.0, 480.0])
            .with_title("Solstice Native"),
        ..Default::default()
    };

    eframe::run_native(
        "Solstice Native",
        native_options,
        Box::new(|cc| {
            apply_theme(&cc.egui_ctx);
            Ok(Box::new(SolsticeLauncherApp::default()))
        }),
    )
}

struct SolsticeLauncherApp {
    selected_tool: String,
    demo_slider_val: f32,
    demo_text: String,
}

impl Default for SolsticeLauncherApp {
    fn default() -> Self {
        Self {
            selected_tool: "photo".to_string(),
            demo_slider_val: 50.0,
            demo_text: "Solstice Native Studio".to_string(),
        }
    }
}

impl eframe::App for SolsticeLauncherApp {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        egui::Frame::canvas(&ui.style())
            .fill(BG_WINDOW)
            .inner_margin(egui::Margin::same(16))
            .show(ui, |ui| {
                ui.add_space(8.0);
                self.render_header(ui);
                ui.add_space(16.0);
                self.render_app_cards(ui);
                ui.add_space(20.0);
                self.render_preview_panel(ui);
            });
    }
}

impl SolsticeLauncherApp {
    fn render_header(&self, ui: &mut egui::Ui) {
        ui.horizontal(|ui| {
            ui.label(
                egui::RichText::new("Solstice")
                    .size(24.0)
                    .strong()
                    .color(TEXT_PRIMARY),
            );
            ui.add_space(8.0);
            pill_badge(ui, "Native 144Hz", BadgeTone::Emerald);
            pill_badge(ui, "Pale Theme", BadgeTone::Blue);
            pill_badge(ui, "wgpu + egui", BadgeTone::Neutral);
        });

        ui.label(
            egui::RichText::new("High-performance native creative & productivity suite")
                .color(TEXT_SECONDARY)
                .size(13.0),
        );
    }

    fn render_app_cards(&mut self, ui: &mut egui::Ui) {
        section_heading(ui, "Creative & Productivity Apps", Some("Select an app to test"));
        ui.add_space(6.0);

        ui.columns(4, |cols| {
            let apps = [
                ("photo", "Photo Studio", "wgpu canvas & AI cutout", BadgeTone::Blue, "Active"),
                ("docs", "Docs", "WordCraft .docx engine", BadgeTone::Emerald, "Engine Ready"),
                ("sheets", "Sheets", "GridCraft .xlsx engine", BadgeTone::Amber, "Engine Ready"),
                ("pdf", "PDF Studio", "PdfCraft engine", BadgeTone::Rose, "Engine Ready"),
            ];

            for (i, (id, title, desc, tone, badge_lbl)) in apps.iter().enumerate() {
                let is_active = self.selected_tool == *id;
                panel_card(&mut cols[i], |col| {
                    col.vertical(|c| {
                        c.horizontal(|h| {
                            pill_badge(h, badge_lbl, *tone);
                        });
                        c.add_space(4.0);
                        c.label(egui::RichText::new(*title).strong().color(TEXT_PRIMARY).size(14.0));
                        c.label(egui::RichText::new(*desc).color(TEXT_MUTED).size(11.0));
                        c.add_space(8.0);
                        if pale_button(c, if is_active { "Selected" } else { "Open" }, is_active).clicked() {
                            self.selected_tool = id.to_string();
                        }
                    });
                });
            }
        });
    }

    fn render_preview_panel(&mut self, ui: &mut egui::Ui) {
        panel_card(ui, |ui| {
            ui.vertical(|ui| {
                section_heading(
                    ui,
                    &format!("Active App: {}", self.selected_tool.to_uppercase()),
                    Some("Demonstrating pale pastel inputs, buttons, and state"),
                );
                ui.add_space(10.0);

                ui.horizontal(|ui| {
                    ui.label(egui::RichText::new("Sample Slider:").color(TEXT_SECONDARY));
                    ui.add(egui::Slider::new(&mut self.demo_slider_val, 0.0..=100.0).text("%"));
                });

                ui.add_space(6.0);
                ui.horizontal(|ui| {
                    ui.label(egui::RichText::new("Title Input:").color(TEXT_SECONDARY));
                    ui.text_edit_singleline(&mut self.demo_text);
                });

                ui.add_space(12.0);
                ui.horizontal(|ui| {
                    if pale_button(ui, "Action A", false).clicked() {}
                    if pale_button(ui, "Action B", false).clicked() {}
                    if pale_button(ui, "Selected Action", true).clicked() {}
                });
            });
        });
    }
}
