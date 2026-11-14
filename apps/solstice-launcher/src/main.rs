use eframe::egui::{self, CornerRadius, Frame, Margin, RichText, Stroke, Ui};
use solstice_theme::{
    apply_theme, pale_button, pill_badge, section_heading, BadgeTone,
    ACCENT_AMBER_BG, ACCENT_BLUE_BG, ACCENT_EMERALD_BG, ACCENT_ROSE_BG,
    BG_PANEL, BG_WINDOW, BORDER_LIGHT, BORDER_SUBTLE, TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY,
};

fn main() -> eframe::Result<()> {
    let native_options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1120.0, 720.0])
            .with_min_inner_size([800.0, 540.0])
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

#[derive(Clone)]
struct AppMeta {
    id: &'static str,
    name: &'static str,
    category: &'static str,
    desc: &'static str,
    badge: &'static str,
    tone: BadgeTone,
    icon: &'static str,
    icon_bg: egui::Color32,
}

struct SolsticeLauncherApp {
    apps: Vec<AppMeta>,
    status_msg: String,
}

impl Default for SolsticeLauncherApp {
    fn default() -> Self {
        Self {
            apps: vec![
                AppMeta {
                    id: "photo",
                    name: "Photo Studio",
                    category: "Creative Imaging",
                    desc: "GPU canvas, 32-bit color pipeline, and local AI cutout & object healing.",
                    badge: "In Planning",
                    tone: BadgeTone::Blue,
                    icon: "🎨",
                    icon_bg: ACCENT_BLUE_BG,
                },
                AppMeta {
                    id: "docs",
                    name: "Docs",
                    category: "Word Processing",
                    desc: "WordCraft engine with native .docx support, rich typography, and export.",
                    badge: "Engine Ready",
                    tone: BadgeTone::Emerald,
                    icon: "📝",
                    icon_bg: ACCENT_EMERALD_BG,
                },
                AppMeta {
                    id: "sheets",
                    name: "Sheets",
                    category: "Data & Analysis",
                    desc: "GridCraft engine with .xlsx compatibility, formula graph, and charts.",
                    badge: "Engine Ready",
                    tone: BadgeTone::Amber,
                    icon: "📊",
                    icon_bg: ACCENT_AMBER_BG,
                },
                AppMeta {
                    id: "pdf",
                    name: "PDF Studio",
                    category: "Document Workbench",
                    desc: "PdfCraft engine for native reading, visual page organizing, and forms.",
                    badge: "Engine Ready",
                    tone: BadgeTone::Rose,
                    icon: "📑",
                    icon_bg: ACCENT_ROSE_BG,
                },
            ],
            status_msg: "Ready to launch".to_string(),
        }
    }
}

impl eframe::App for SolsticeLauncherApp {
    fn ui(&mut self, ui: &mut Ui, _frame: &mut eframe::Frame) {
        // CentralPanel fills the entire window edge-to-edge
        egui::CentralPanel::default()
            .frame(Frame::new().fill(BG_WINDOW))
            .show(ui, |ui| {
                egui::ScrollArea::vertical().show(ui, |ui| {
                    ui.add_space(24.0);
                    self.render_centered_content(ui);
                    ui.add_space(32.0);
                });
            });
    }
}

impl SolsticeLauncherApp {
    fn render_centered_content(&mut self, ui: &mut Ui) {
        let max_content_width = 1040.0;
        let available = ui.available_width();
        let margin_x = ((available - max_content_width) / 2.0).max(28.0);

        ui.horizontal(|ui| {
            ui.add_space(margin_x);
            ui.vertical(|ui| {
                ui.set_max_width(max_content_width);
                self.render_header(ui);
                ui.add_space(28.0);
                self.render_catalog(ui);
                ui.add_space(28.0);
                self.render_footer_status(ui);
            });
            ui.add_space(margin_x);
        });
    }

    fn render_header(&self, ui: &mut Ui) {
        ui.horizontal(|ui| {
            ui.label(RichText::new("Solstice").size(28.0).strong().color(TEXT_PRIMARY));
            ui.add_space(10.0);
            pill_badge(ui, "Native 144Hz", BadgeTone::Emerald);
            pill_badge(ui, "Pale Pastel Theme", BadgeTone::Blue);
            pill_badge(ui, "Rust + wgpu", BadgeTone::Neutral);
        });

        ui.add_space(4.0);
        ui.label(
            RichText::new("Private, GPU-accelerated creative and productivity workstation")
                .color(TEXT_SECONDARY)
                .size(14.0),
        );
    }

    fn render_catalog(&mut self, ui: &mut Ui) {
        section_heading(ui, "Applications", Some("Native tools built for focus and speed"));
        ui.add_space(14.0);

        let apps = self.apps.clone();
        let mut clicked_app: Option<String> = None;

        ui.columns(4, |cols| {
            for (idx, app) in apps.iter().enumerate() {
                let col = &mut cols[idx];
                render_app_card(col, app, &mut clicked_app);
            }
        });

        if let Some(app_name) = clicked_app {
            self.status_msg = format!("Selected {}", app_name);
        }
    }

    fn render_footer_status(&self, ui: &mut Ui) {
        Frame::canvas(&ui.style())
            .fill(BG_PANEL)
            .stroke(Stroke::new(1.0, BORDER_SUBTLE))
            .corner_radius(CornerRadius::same(8))
            .inner_margin(Margin::symmetric(14, 10))
            .show(ui, |ui| {
                ui.horizontal(|ui| {
                    ui.label(RichText::new("Status:").color(TEXT_MUTED).size(12.0));
                    ui.label(RichText::new(&self.status_msg).color(TEXT_PRIMARY).size(12.0));
                });
            });
    }
}

fn render_app_card(ui: &mut Ui, app: &AppMeta, clicked_app: &mut Option<String>) {
    Frame::canvas(&ui.style())
        .fill(BG_PANEL)
        .stroke(Stroke::new(1.0, BORDER_SUBTLE))
        .corner_radius(CornerRadius::same(12))
        .inner_margin(Margin::same(16))
        .show(ui, |ui| {
            ui.set_min_height(240.0);
            ui.vertical(|ui| {
                ui.horizontal(|h| {
                    Frame::canvas(&h.style())
                        .fill(app.icon_bg)
                        .stroke(Stroke::new(1.0, BORDER_LIGHT))
                        .corner_radius(CornerRadius::same(10))
                        .inner_margin(Margin::same(8))
                        .show(h, |h| {
                            h.label(RichText::new(app.icon).size(20.0));
                        });

                    h.with_layout(egui::Layout::right_to_left(egui::Align::Center), |r| {
                        pill_badge(r, app.badge, app.tone);
                    });
                });

                ui.add_space(12.0);
                ui.label(RichText::new(app.name).strong().color(TEXT_PRIMARY).size(16.0));
                ui.label(RichText::new(app.category).color(TEXT_MUTED).size(11.0));

                ui.add_space(8.0);
                ui.label(RichText::new(app.desc).color(TEXT_SECONDARY).size(12.0));

                ui.add_space(14.0);
                ui.with_layout(egui::Layout::bottom_up(egui::Align::LEFT), |b| {
                    let btn_label = if app.id == "photo" { "Open Studio" } else { "Open Tool" };
                    if pale_button(b, btn_label, app.id == "photo").clicked() {
                        *clicked_app = Some(app.name.to_string());
                    }
                });
            });
        });
}
