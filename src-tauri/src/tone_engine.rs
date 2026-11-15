use base64::Engine;
use image::{ImageFormat, RgbaImage};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhotoToneParams {
    pub brightness: f32, // -100 to 100 or -1.0 to 1.0
    pub contrast: f32,   // -100 to 100 or -1.0 to 1.0
    pub saturation: f32, // -100 to 100 or -1.0 to 1.0
    pub warmth: f32,     // -100 to 100 or -1.0 to 1.0
    pub highlights: f32, // -100 to 100 or -1.0 to 1.0
    pub shadows: f32,    // -100 to 100 or -1.0 to 1.0
    pub vignette: f32,   // 0 to 100 or 0.0 to 1.0
}

impl Default for PhotoToneParams {
    fn default() -> Self {
        Self {
            brightness: 0.0,
            contrast: 0.0,
            saturation: 0.0,
            warmth: 0.0,
            highlights: 0.0,
            shadows: 0.0,
            vignette: 0.0,
        }
    }
}

impl PhotoToneParams {
    pub fn is_identity(&self) -> bool {
        self.brightness == 0.0
            && self.contrast == 0.0
            && self.saturation == 0.0
            && self.warmth == 0.0
            && self.highlights == 0.0
            && self.shadows == 0.0
            && self.vignette == 0.0
    }

    pub fn normalized(&self) -> Self {
        let is_percent = self.brightness.abs() > 1.0
            || self.contrast.abs() > 1.0
            || self.saturation.abs() > 1.0
            || self.warmth.abs() > 1.0
            || self.highlights.abs() > 1.0
            || self.shadows.abs() > 1.0
            || self.vignette > 1.0;

        let scale = if is_percent { 0.01 } else { 1.0 };
        Self {
            brightness: (self.brightness * scale).clamp(-1.0, 1.0),
            contrast: (self.contrast * scale).clamp(-1.0, 1.0),
            saturation: (self.saturation * scale).clamp(-1.0, 1.0),
            warmth: (self.warmth * scale).clamp(-1.0, 1.0),
            highlights: (self.highlights * scale).clamp(-1.0, 1.0),
            shadows: (self.shadows * scale).clamp(-1.0, 1.0),
            vignette: (self.vignette * scale).clamp(0.0, 1.0),
        }
    }
}

fn get_srgb_to_linear_lut() -> &'static [f32; 256] {
    static LUT: std::sync::OnceLock<[f32; 256]> = std::sync::OnceLock::new();
    LUT.get_or_init(|| {
        let mut lut = [0.0f32; 256];
        for (i, val) in lut.iter_mut().enumerate() {
            *val = (i as f32 / 255.0).powf(2.2);
        }
        lut
    })
}

/// Applies a 32-bit floating-point non-destructive tone pipeline to RGBA pixels.
/// Multi-threaded using Rayon across all available CPU cores.
pub fn apply_tone_pipeline_simd(
    pixels: &mut [u8],
    width: u32,
    height: u32,
    raw_params: &PhotoToneParams,
) {
    if raw_params.is_identity() || pixels.len() < (width * height * 4) as usize {
        return;
    }

    let params = raw_params.normalized();
    let lut = get_srgb_to_linear_lut();

    let b_offset = params.brightness * 0.35;
    let c_factor = (1.0 + params.contrast).max(0.0);
    let s_factor = (1.0 + params.saturation).max(0.0);
    let w_offset = params.warmth * 0.15;
    let h_factor = params.highlights * 0.45;
    let sh_factor = params.shadows * 0.45;
    let vig_intensity = params.vignette.clamp(0.0, 1.0);

    let cx = width as f32 * 0.5;
    let cy = height as f32 * 0.5;
    let max_radius = (cx * cx + cy * cy).sqrt().max(1.0);

    // Process rows in parallel across CPU threads
    pixels
        .par_chunks_exact_mut((width * 4) as usize)
        .enumerate()
        .for_each(|(y_idx, row)| {
            let y = y_idx as f32;
            let dy = y - cy;

            for (x_idx, px) in row.chunks_exact_mut(4).enumerate() {
                let x = x_idx as f32;
                let dx = x - cx;

                // 1. sRGB [0..255] -> Linear [0.0..1.0] via LUT
                let mut r = lut[px[0] as usize];
                let mut g = lut[px[1] as usize];
                let mut b = lut[px[2] as usize];

                // 2. Brightness
                r += b_offset;
                g += b_offset;
                b += b_offset;

                // 3. Highlights & Shadows recovery
                let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                let h_weight = (lum - 0.4).max(0.0) * 1.67;
                let sh_weight = (0.6 - lum).max(0.0) * 1.67;

                let tone_scale = 1.0 + (h_factor * h_weight) + (sh_factor * sh_weight);
                r *= tone_scale;
                g *= tone_scale;
                b *= tone_scale;

                // 4. Contrast (pivot around mid-gray 0.18 linear)
                r = 0.18 + (r - 0.18) * c_factor;
                g = 0.18 + (g - 0.18) * c_factor;
                b = 0.18 + (b - 0.18) * c_factor;

                // 5. Warmth (Kelvin temperature shift)
                r += w_offset;
                b -= w_offset;

                // 6. Saturation
                let new_lum = (0.2126 * r + 0.7152 * g + 0.0722 * b).max(0.0);
                r = new_lum + (r - new_lum) * s_factor;
                g = new_lum + (g - new_lum) * s_factor;
                b = new_lum + (b - new_lum) * s_factor;

                // 7. Vignette
                if vig_intensity > 0.001 {
                    let dist = (dx * dx + dy * dy).sqrt() / max_radius;
                    let v_falloff = 1.0 - (dist * dist * vig_intensity * 0.85);
                    r *= v_falloff;
                    g *= v_falloff;
                    b *= v_falloff;
                }

                // 8. Linear -> sRGB [0..255]
                px[0] = (r.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0 + 0.5) as u8;
                px[1] = (g.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0 + 0.5) as u8;
                px[2] = (b.clamp(0.0, 1.0).powf(1.0 / 2.2) * 255.0 + 0.5) as u8;
                // px[3] (Alpha) is preserved untouched
            }
        });
}

pub fn process_image_bytes(
    image_bytes: &[u8],
    params: &PhotoToneParams,
    output_format: ImageFormat,
) -> Result<Vec<u8>, String> {
    let dynamic_img = image::load_from_memory(image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    let mut rgba: RgbaImage = dynamic_img.to_rgba8();
    let (width, height) = (rgba.width(), rgba.height());
    apply_tone_pipeline_simd(rgba.as_mut(), width, height, params);

    let mut out_bytes = Vec::new();
    let mut cursor = Cursor::new(&mut out_bytes);

    rgba.write_to(&mut cursor, output_format)
        .map_err(|e| format!("Failed to encode image: {}", e))?;

    Ok(out_bytes)
}

pub fn process_data_url(
    data_url: &str,
    params: &PhotoToneParams,
    format_opt: Option<&str>,
) -> Result<String, String> {
    let (mime, raw_b64) = if let Some(idx) = data_url.find(',') {
        let prefix = &data_url[..idx];
        let mime = if prefix.contains("image/jpeg") || prefix.contains("image/jpg") {
            "image/jpeg"
        } else if prefix.contains("image/webp") {
            "image/webp"
        } else {
            "image/png"
        };
        (mime, &data_url[(idx + 1)..])
    } else {
        ("image/png", data_url)
    };

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(raw_b64.trim())
        .map_err(|e| format!("Base64 decode failed: {}", e))?;

    let out_format = match format_opt.unwrap_or(mime) {
        "jpeg" | "jpg" | "image/jpeg" => ImageFormat::Jpeg,
        "webp" | "image/webp" => ImageFormat::WebP,
        _ => ImageFormat::Png,
    };

    let processed = process_image_bytes(&bytes, params, out_format)?;
    let out_mime = match out_format {
        ImageFormat::Jpeg => "image/jpeg",
        ImageFormat::WebP => "image/webp",
        _ => "image/png",
    };

    let out_b64 = base64::engine::general_purpose::STANDARD.encode(&processed);
    Ok(format!("data:{};base64,{}", out_mime, out_b64))
}

pub fn process_file_to_data_url(
    file_path: &Path,
    params: &PhotoToneParams,
) -> Result<String, String> {
    let bytes = std::fs::read(file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path.display(), e))?;
    let processed = process_image_bytes(&bytes, params, ImageFormat::Png)?;
    let out_b64 = base64::engine::general_purpose::STANDARD.encode(&processed);
    Ok(format!("data:image/png;base64,{}", out_b64))
}
