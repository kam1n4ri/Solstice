use base64::Engine;
use image::ImageFormat;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::io::Cursor;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CutoutEdgeParams {
    pub choke: i32,    // -10 to +10 pixels (negative = erode/choke, positive = expand)
    pub feather: u32,  // 0 to 15 pixels blur radius
}

impl Default for CutoutEdgeParams {
    fn default() -> Self {
        Self { choke: 0, feather: 0 }
    }
}

/// Contracts (erodes) or expands (dilates) a 1-channel alpha mask.
/// Positive amount dilates (expands kept foreground).
/// Negative amount erodes (chokes fringe/halos inward).
pub fn apply_mask_choke(mask: &[u8], width: u32, height: u32, choke: i32) -> Vec<u8> {
    if choke == 0 || mask.is_empty() {
        return mask.to_vec();
    }

    let r = choke.unsigned_abs() as usize;
    let is_erode = choke < 0;
    let w = width as usize;
    let h = height as usize;
    let mut output = vec![0u8; mask.len()];

    output
        .par_chunks_exact_mut(w)
        .enumerate()
        .for_each(|(y, row)| {
            let y_min = y.saturating_sub(r);
            let y_max = (y + r).min(h - 1);

            for (x, out_val) in row.iter_mut().enumerate() {
                let x_min = x.saturating_sub(r);
                let x_max = (x + r).min(w - 1);

                if is_erode {
                    let mut min_val = 255u8;
                    'outer_erode: for ny in y_min..=y_max {
                        let row_offset = ny * w;
                        for nx in x_min..=x_max {
                            let v = mask[row_offset + nx];
                            if v < min_val {
                                min_val = v;
                                if min_val == 0 {
                                    break 'outer_erode;
                                }
                            }
                        }
                    }
                    *out_val = min_val;
                } else {
                    let mut max_val = 0u8;
                    'outer_dilate: for ny in y_min..=y_max {
                        let row_offset = ny * w;
                        for nx in x_min..=x_max {
                            let v = mask[row_offset + nx];
                            if v > max_val {
                                max_val = v;
                                if max_val == 255 {
                                    break 'outer_dilate;
                                }
                            }
                        }
                    }
                    *out_val = max_val;
                }
            }
        });

    output
}

/// Applies a 2-pass separable box feather (blur) to soft-blend cutout edges.
pub fn apply_mask_feather(mask: &[u8], width: u32, height: u32, radius: u32) -> Vec<u8> {
    if radius == 0 || mask.is_empty() {
        return mask.to_vec();
    }

    let r = radius as usize;
    let w = width as usize;
    let h = height as usize;

    // Horizontal pass
    let mut temp = vec![0u8; mask.len()];
    temp.par_chunks_exact_mut(w)
        .enumerate()
        .for_each(|(y, row)| {
            let row_offset = y * w;
            let mut sum: u32 = 0;
            let window_size = r * 2 + 1;

            for x in 0..r.min(w) {
                sum += mask[row_offset + x] as u32;
            }

            for x in 0..w {
                let add_x = (x + r).min(w - 1);
                let sub_x = x.saturating_sub(r + 1);
                sum += mask[row_offset + add_x] as u32;
                if x > r {
                    sum -= mask[row_offset + sub_x] as u32;
                }
                row[x] = (sum / window_size as u32).min(255) as u8;
            }
        });

    // Vertical pass
    let output = vec![0u8; mask.len()];
    (0..w).into_par_iter().for_each(|x| {
        let mut sum: u32 = 0;
        let window_size = r * 2 + 1;

        for y in 0..r.min(h) {
            sum += temp[y * w + x] as u32;
        }

        for y in 0..h {
            let add_y = (y + r).min(h - 1);
            let sub_y = y.saturating_sub(r + 1);
            sum += temp[add_y * w + x] as u32;
            if y > r {
                sum -= temp[sub_y * w + x] as u32;
            }
            // Direct write to unique column index
            let idx = y * w + x;
            unsafe {
                let ptr = output.as_ptr() as *mut u8;
                *ptr.add(idx) = (sum / window_size as u32).min(255) as u8;
            }
        }
    });

    output
}

/// Applies high-speed multi-threaded edge post-processing (choke + feather).
pub fn refine_mask(mask: &[u8], width: u32, height: u32, params: &CutoutEdgeParams) -> Vec<u8> {
    let mut refined = if params.choke != 0 {
        apply_mask_choke(mask, width, height, params.choke)
    } else {
        mask.to_vec()
    };

    if params.feather > 0 {
        refined = apply_mask_feather(&refined, width, height, params.feather);
    }

    refined
}

/// Applies refined alpha mask to an RGBA image and encodes as a PNG Data URL.
pub fn composite_cutout_rgba(
    rgba_pixels: &mut [u8],
    mask: &[u8],
    width: u32,
    height: u32,
    params: &CutoutEdgeParams,
) {
    let refined_mask = refine_mask(mask, width, height, params);

    rgba_pixels
        .par_chunks_exact_mut(4)
        .zip(refined_mask.par_iter())
        .for_each(|(px, &m)| {
            // Multiply existing alpha with mask alpha
            let orig_a = px[3] as u32;
            let m_a = m as u32;
            px[3] = ((orig_a * m_a) / 255) as u8;
        });
}

pub fn process_cutout(
    image_data_url: &str,
    mask_data_url: &str,
    params: &CutoutEdgeParams,
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

    let mut rgba = dynamic_img.to_rgba8();
    let (width, height) = (rgba.width(), rgba.height());

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
    let (m_w, m_h) = (mask_rgba.width(), mask_rgba.height());

    // Solstice convention: maskCanvas alpha = 255 means erased; alpha = 0 means kept.
    let mut keep_mask = vec![255u8; (width * height) as usize];
    for y in 0..height {
        let my = (y * m_h) / height;
        for x in 0..width {
            let mx = (x * m_w) / width;
            let mask_pixel = mask_rgba.get_pixel(mx, my);
            let erased_alpha = mask_pixel[3];
            keep_mask[(y * width + x) as usize] = 255u8.saturating_sub(erased_alpha);
        }
    }

    composite_cutout_rgba(rgba.as_mut(), &keep_mask, width, height, params);

    let mut out_bytes = Vec::new();
    let mut cursor = Cursor::new(&mut out_bytes);
    rgba.write_to(&mut cursor, ImageFormat::Png)
        .map_err(|e| format!("Failed to encode output PNG: {}", e))?;

    let out_b64 = base64::engine::general_purpose::STANDARD.encode(&out_bytes);
    Ok(format!("data:image/png;base64,{}", out_b64))
}



