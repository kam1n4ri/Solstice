use eframe::egui::{
    self, epaint::Shadow, Align, Color32, CornerRadius, Frame, Layout, Margin, RichText, Stroke, Ui,
};
use solstice_theme::{
    apply_theme, pale_button, pill_badge, section_heading, BadgeTone,
    ACCENT_AMBER_BG, ACCENT_AMBER_TEXT, ACCENT_BLUE_BG, ACCENT_BLUE_TEXT,
    ACCENT_EMERALD_BG, ACCENT_EMERALD_TEXT, ACCENT_ROSE_BG, ACCENT_ROSE_TEXT,
    BG_PANEL, BG_WINDOW, BORDER_LIGHT, BORDER_SUBTLE,
    TEXT_MUTED, TEXT_PRIMARY, TEXT_SECONDARY,
};

fn main() -> eframe::Result<()> {
    let native_options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1180.0, 740.0])
            .with_min_inner_size([900.0, 580.0])
            .with_title("Solstice Native Hub"),
        ..Default::default()
    };

    eframe::run_native(
        "Solstice Native",
        native_options,
        Box::new(|cc| {
            apply_theme(&cc.egui_ctx);
            // High-DPI UI scaling so fonts and widgets are sharp & proportional
            cc.egui_ctx.set_zoom_factor(1.35);
            Ok(Box::new(SolsticeLauncherApp::default()))
        }),
    )
}

#[derive(Clone)]
struct AppCardData {
    id: &'static str,
    name: &'static str,
    tag: &'static str,
    desc: &'static str,
    badge: &'static str,
    tone: BadgeTone,
    monogram: &'static str,
    accent_bg: Color32,
    accent_text: Color32,
}

struct SolsticeLauncherApp {
    apps: Vec<AppCardData>,
    active_nav: String,
    status_msg: String,
}

impl Default for SolsticeLauncherApp {
    fn default() -> Self {
        Self {
            apps: vec![
                AppCardData {
                    id: "photo",
                    name: "Photo Studio",
                    tag: "Creative Imaging",
                    desc: "GPU canvas, 32-bit float color, and local AI cutout with restore/erase brushes.",
                    badge: "In Planning",
                    tone: BadgeTone::Blue,
                    monogram: "PH",
                    accent_bg: ACCENT_BLUE_BG,
                    accent_text: ACCENT_BLUE_TEXT,
                },
                AppCardData {
                    id: "docs",
                    name: "Docs",
                    tag: "Word Processing",
                    desc: "WordCraft engine with native .docx support, typography, and PDF export.",
                    badge: "Engine Ready",
                    tone: BadgeTone::Emerald,
                    monogram: "DOC",
                    accent_bg: ACCENT_EMERALD_BG,
                    accent_text: ACCENT_EMERALD_TEXT,
                },
                AppCardData {
                    id: "sheets",
                    name: "Sheets",
                    tag: "Data & Analysis",
                    desc: "GridCraft engine with .xlsx compatibility, formula graph, and charts.",
                    badge: "Engine Ready",
                    tone: BadgeTone::Amber,
                    monogram: "SHT",
                    accent_bg: ACCENT_AMBER_BG,
                    accent_text: ACCENT_AMBER_TEXT,
                },
                AppCardData {
                    id: "pdf",
                    name: "PDF Studio",
                    tag: "Document Workbench",
                    desc: "PdfCraft engine for native reading, visual page organizing, and forms.",
                    badge: "Engine Ready",
                    tone: BadgeTone::Rose,
                    monogram: "PDF",
                    accent_bg: ACCENT_ROSE_BG,
                    accent_text: ACCENT_ROSE_TEXT,
                },
            ],
            active_nav: "Workspace".to_string(),
            status_msg: "Ready".to_string(),
        }
    }
}

impl eframe::App for SolsticeLauncherApp {
    fn ui(&mut self, ui: &mut Ui, _frame: &mut eframe::Frame) {
        egui::CentralPanel::default()
            .frame(Frame::new().fill(BG_WINDOW))
            .show(ui, |ui| {
                ui.horizontal(|ui| {
                    self.render_sidebar(ui);
                    ui.add_space(2.0);
                    self.render_main_area(ui);
                });
            });
    }
}

impl SolsticeLauncherApp {
    fn render_sidebar(&mut self, ui: &mut Ui) {
        Frame::canvas(&ui.style())
            .fill(BG_PANEL)
            .stroke(Stroke::new(1.0, BORDER_SUBTLE))
            .inner_margin(Margin::same(16))
            .show(ui, |ui| {
                ui.set_width(180.0);
                ui.set_min_height(ui.available_height());

                ui.vertical(|ui| {
                    ui.horizontal(|h| {
                        Frame::canvas(&h.style())
                            .fill(ACCENT_BLUE_BG)
                            .stroke(Stroke::new(1.0, BORDER_LIGHT))
                            .corner_radius(CornerRadius::same(8))
                            .inner_margin(Margin::same(6))
                            .show(h, |h| {
                                h.label(RichText::new("✦").color(ACCENT_BLUE_TEXT).strong().size(14.0));
                            });
                        h.label(RichText::new("Solstice").size(18.0).strong().color(TEXT_PRIMARY));
                    });

                    ui.add_space(20.0);
                    let navs = ["Workspace", "Performance", "Settings"];
                    for nav in navs {
                        let is_active = self.active_nav == nav;
                        if pale_button(ui, nav, is_active).clicked() {
                            self.active_nav = nav.to_string();
                        }
                        ui.add_space(4.0);
                    }

                    ui.with_layout(Layout::bottom_up(Align::LEFT), |b| {
                        b.add_space(8.0);
                        pill_badge(b, "42 MB RAM • 144Hz", BadgeTone::Emerald);
                        b.add_space(4.0);
                        b.label(RichText::new("Vulkan Native").color(TEXT_MUTED).size(11.0));
                    });
                });
            });
    }

    fn render_main_area(&mut self, ui: &mut Ui) {
        egui::ScrollArea::vertical().show(ui, |ui| {
            ui.add_space(20.0);
            let available = ui.available_width();
            let content_width = 860.0_f32.min(available - 48.0);
            let pad_x = ((available - content_width) / 2.0).max(24.0);

            ui.horizontal(|ui| {
                ui.add_space(pad_x);
                ui.vertical(|ui| {
                    ui.set_max_width(content_width);
                    self.render_hero(ui);
                    ui.add_space(24.0);
                    self.render_cards_grid(ui);
                });
                ui.add_space(pad_x);
            });
            ui.add_space(32.0);
        });
    }

    fn render_hero(&self, ui: &mut Ui) {
        ui.label(RichText::new("Workspace").size(22.0).strong().color(TEXT_PRIMARY));
        ui.add_space(2.0);
        ui.label(
            RichText::new("High-performance native suite powered by Storytold engines and local AI")
                .color(TEXT_SECONDARY)
                .size(13.0),
        );
    }

    fn render_cards_grid(&mut self, ui: &mut Ui) {
        section_heading(ui, "Applications", Some("Select an app to open"));
        ui.add_space(12.0);

        let apps = self.apps.clone();
        let mut launched: Option<String> = None;

        ui.columns(2, |cols| {
            for (idx, app) in apps.iter().enumerate() {
                let col = &mut cols[idx % 2];
                render_app_card(col, app, &mut launched);
                col.add_space(14.0);
            }
        });

        if let Some(name) = launched {
            self.status_msg = format!("Selected {}", name);
        }
    }
}

fn render_app_card(ui: &mut Ui, app: &AppCardData, launched: &mut Option<String>) {
    let shadow = Shadow {
        offset: [0, 2],
        blur: 8,
        spread: 0,
        color: Color32::from_black_alpha(10),
    };

    Frame::canvas(&ui.style())
        .fill(BG_PANEL)
        .stroke(Stroke::new(1.0, BORDER_SUBTLE))
        .corner_radius(CornerRadius::same(12))
        .shadow(shadow)
        .inner_margin(Margin::same(16))
        .show(ui, |ui| {
            ui.set_min_height(175.0);
            ui.vertical(|ui| {
                ui.horizontal(|h| {
                    Frame::canvas(&h.style())
                        .fill(app.accent_bg)
                        .stroke(Stroke::new(1.0, BORDER_LIGHT))
                        .corner_radius(CornerRadius::same(8))
                        .inner_margin(Margin::symmetric(10, 6))
                        .show(h, |h| {
                            h.label(RichText::new(app.monogram).color(app.accent_text).strong().size(12.0));
                        });

                    h.add_space(4.0);
                    h.vertical(|v| {
                        v.label(RichText::new(app.name).strong().color(TEXT_PRIMARY).size(15.0));
                        v.label(RichText::new(app.tag).color(TEXT_MUTED).size(11.0));
                    });

                    h.with_layout(Layout::right_to_left(Align::Center), |r| {
                        pill_badge(r, app.badge, app.tone);
                    });
                });

                ui.add_space(8.0);
                ui.label(RichText::new(app.desc).color(TEXT_SECONDARY).size(12.0));

                ui.add_space(10.0);
                ui.with_layout(Layout::bottom_up(Align::LEFT), |b| {
                    let is_photo = app.id == "photo";
                    if pale_button(b, if is_photo { "Open Studio" } else { "Open Tool" }, is_photo).clicked() {
                        *launched = Some(app.name.to_string());
                    }
                });
            });
        });
}
