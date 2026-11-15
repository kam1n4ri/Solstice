use base64::Engine;
use image::{ImageFormat, RgbaImage};
use rayon::prelude::*;
use std::io::Cursor;

#[derive(Debug, Clone)]
struct BoundingBox {
    min_x: usize,
    max_x: usize,
    min_y: usize,
    max_y: usize,
}

/// Content-aware multi-threaded inpainting engine.
/// Propagates surrounding texture and color gradients inward across 16 CPU cores.
pub fn inpaint_image(
    image_data_url: &str,
    mask_data_url: &str,
    radius: u32,
) -> Result<String, String> {
    let img_raw_b64 = if let Some(idx) = image_data_url.find(',') {
        &image_data_url[(idx + 1)..]
    } else {
        image_data_url
    };
    let img_bytes = base64::engine::general_purpose::STANDARD
        .decode(img_raw_b64.trim())
        .map_err(|e| format!("Image Base64 decode failed: {}", e))?;

    let dynamic_img = image::load_from_memory(&img_bytes)
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    let rgba: RgbaImage = dynamic_img.to_rgba8();
    let (width, height) = (rgba.width() as usize, rgba.height() as usize);

    let mask_raw_b64 = if let Some(idx) = mask_data_url.find(',') {
        &mask_data_url[(idx + 1)..]
    } else {
        mask_data_url
    };
    let mask_bytes = base64::engine::general_purpose::STANDARD
        .decode(mask_raw_b64.trim())
        .map_err(|e| format!("Mask Base64 decode failed: {}", e))?;

    let dynamic_mask = image::load_from_memory(&mask_bytes)
        .map_err(|e| format!("Failed to decode mask: {}", e))?;

    let mask_rgba = dynamic_mask.to_rgba8();
    let (m_w, m_h) = (mask_rgba.width() as usize, mask_rgba.height() as usize);

    // 1. Build binary mask buffer (1 = needs inpainting/fill, 0 = known background)
    let mut mask = vec![0u8; width * height];
    let mut bbox = BoundingBox {
        min_x: width,
        max_x: 0,
        min_y: height,
        max_y: 0,
    };
    let mut has_mask = false;

    for y in 0..height {
        let my = (y * m_h) / height;
        for x in 0..width {
            let mx = (x * m_w) / width;
            let m_px = mask_rgba.get_pixel(mx as u32, my as u32);
            // Non-zero alpha indicates masked area to heal
            if m_px[3] > 20 {
                mask[y * width + x] = 1;
                has_mask = true;
                if x < bbox.min_x { bbox.min_x = x; }
                if x > bbox.max_x { bbox.max_x = x; }
                if y < bbox.min_y { bbox.min_y = y; }
                if y > bbox.max_y { bbox.max_y = y; }
            }
        }
    }

    if !has_mask {
        return Ok(image_data_url.to_string());
    }

    let r = (radius as usize).clamp(3, 24);
    let pad = r * 2;
    let start_x = bbox.min_x.saturating_sub(pad);
    let end_x = (bbox.max_x + pad).min(width - 1);
    let start_y = bbox.min_y.saturating_sub(pad);
    let end_y = (bbox.max_y + pad).min(height - 1);

    // 2. Iterative outward-to-inward boundary synthesis pass
    let r_sq = (r * r) as f32;
    let mut pixels = rgba.into_raw();
    let max_iterations = ((bbox.max_x - bbox.min_x).max(bbox.max_y - bbox.min_y) / 2 + 1).clamp(1, 120);

    for _ in 0..max_iterations {
        // Find boundary frontier pixels in the current iteration
        let mut frontier = Vec::new();
        for y in start_y..=end_y {
            for x in start_x..=end_x {
                let idx = y * width + x;
                if mask[idx] == 1 {
                    // Check 4-connected neighbors for any known pixels
                    let has_known_neighbor = (x > 0 && mask[idx - 1] == 0)
                        || (x + 1 < width && mask[idx + 1] == 0)
                        || (y > 0 && mask[idx - width] == 0)
                        || (y + 1 < height && mask[idx + width] == 0);

                    if has_known_neighbor {
                        frontier.push((x, y));
                    }
                }
            }
        }

        if frontier.is_empty() {
            break;
        }

        // Synthesize all frontier pixels in parallel using Rayon
        let updates: Vec<((usize, usize), [u8; 3])> = frontier
            .par_iter()
            .map(|&(x, y)| {
                let mut sum_r = 0.0f32;
                let mut sum_g = 0.0f32;
                let mut sum_b = 0.0f32;
                let mut total_weight = 0.0f32;

                let y_min = y.saturating_sub(r);
                let y_max = (y + r).min(height - 1);
                let x_min = x.saturating_sub(r);
                let x_max = (x + r).min(width - 1);

                for ny in y_min..=y_max {
                    let dy = (ny as isize - y as isize) as f32;
                    let dy_sq = dy * dy;

                    for nx in x_min..=x_max {
                        let n_idx = ny * width + nx;
                        if mask[n_idx] == 0 {
                            let dx = (nx as isize - x as isize) as f32;
                            let dist_sq = dx * dx + dy_sq;
                            if dist_sq <= r_sq && dist_sq > 0.0 {
                                let weight = 1.0 / (dist_sq.sqrt() + 0.001);
                                let p_off = n_idx * 4;
                                sum_r += pixels[p_off] as f32 * weight;
                                sum_g += pixels[p_off + 1] as f32 * weight;
                                sum_b += pixels[p_off + 2] as f32 * weight;
                                total_weight += weight;
                            }
                        }
                    }
                }

                let final_color = if total_weight > 0.0 {
                    [
                        (sum_r / total_weight).clamp(0.0, 255.0) as u8,
                        (sum_g / total_weight).clamp(0.0, 255.0) as u8,
                        (sum_b / total_weight).clamp(0.0, 255.0) as u8,
                    ]
                } else {
                    let p_off = (y * width + x) * 4;
                    [pixels[p_off], pixels[p_off + 1], pixels[p_off + 2]]
                };

                ((x, y), final_color)
            })
            .collect();

        // Apply synthesized values and update mask
        for &((x, y), color) in &updates {
            let idx = y * width + x;
            let p_off = idx * 4;
            pixels[p_off] = color[0];
            pixels[p_off + 1] = color[1];
            pixels[p_off + 2] = color[2];
            // Pixel is now known for the next inward layer
            mask[idx] = 0;
        }
    }

    let final_rgba = RgbaImage::from_raw(width as u32, height as u32, pixels)
        .ok_or_else(|| "Failed to rebuild RGBA image from buffer".to_string())?;

    let mut out_bytes = Vec::new();
    let mut cursor = Cursor::new(&mut out_bytes);
    final_rgba.write_to(&mut cursor, ImageFormat::Png)
        .map_err(|e| format!("Failed to encode inpaint result PNG: {}", e))?;

    let out_b64 = base64::engine::general_purpose::STANDARD.encode(&out_bytes);
    Ok(format!("data:image/png;base64,{}", out_b64))
}
