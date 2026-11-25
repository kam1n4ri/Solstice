use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use tauri::{Emitter, Manager, WebviewWindow, Window, WindowEvent};

#[derive(Default)]
pub struct CloseHandshakeState {
    pub in_flight: Mutex<HashMap<String, u64>>,
    pub allowed_close: Mutex<HashSet<String>>,
    pub next_token: AtomicU64,
}

fn should_flush_before_close(label: &str) -> bool {
    matches!(label, "tool-docs" | "tool-whiteboard" | "tool-pdf")
}

pub fn emit_tool_closed(window: &Window) {
    let label = window.label();
    if let Some(tool_id) = label.strip_prefix("tool-") {
        let _ = window.app_handle().emit(
            "tool-window-state-changed",
            serde_json::json!({
                "toolId": tool_id,
                "isOpen": false,
                "isFocused": false
            }),
        );
    }
}

pub fn handle_window_event(window: &Window, event: &WindowEvent) {
    let label = window.label().to_string();
    match event {
        WindowEvent::CloseRequested { api, .. } => {
            if let Some(state) = window.try_state::<CloseHandshakeState>() {
                let is_allowed = state
                    .allowed_close
                    .lock()
                    .map(|mut set| set.remove(&label))
                    .unwrap_or(false);
                if is_allowed {
                    emit_tool_closed(window);
                    return;
                }

                if should_flush_before_close(&label) {
                    api.prevent_close();
                    let already_closing = state
                        .in_flight
                        .lock()
                        .map(|map| map.contains_key(&label))
                        .unwrap_or(false);
                    if already_closing {
                        return;
                    }

                    let token = state.next_token.fetch_add(1, Ordering::Relaxed) + 1;
                    if let Ok(mut map) = state.in_flight.lock() {
                        map.insert(label.clone(), token);
                    }
                    let _ = window.emit("save-and-close-requested", ());

                    let app_handle = window.app_handle().clone();
                    let label_clone = label.clone();
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(5000));
                        let still_pending = app_handle
                            .try_state::<CloseHandshakeState>()
                            .and_then(|st| {
                                st.in_flight.lock().ok().map(|mut map| {
                                    if map.get(&label_clone) == Some(&token) {
                                        map.remove(&label_clone);
                                        true
                                    } else {
                                        false
                                    }
                                })
                            })
                            .unwrap_or(false);

                        if still_pending {
                            if let Some(st) = app_handle.try_state::<CloseHandshakeState>() {
                                if let Ok(mut set) = st.allowed_close.lock() {
                                    set.insert(label_clone.clone());
                                }
                            }
                            if let Some(win) = app_handle.get_webview_window(&label_clone) {
                                let _ = win.destroy();
                            }
                        }
                    });
                    return;
                }
            }
            emit_tool_closed(window);
        }
        WindowEvent::Destroyed => {
            if let Some(state) = window.try_state::<CloseHandshakeState>() {
                if let Ok(mut map) = state.in_flight.lock() {
                    map.remove(&label);
                }
                if let Ok(mut set) = state.allowed_close.lock() {
                    set.remove(&label);
                }
            }
            emit_tool_closed(window);
        }
        _ => {}
    }
}

#[tauri::command]
pub fn close_window(
    window: WebviewWindow,
    force: Option<bool>,
    state: tauri::State<'_, CloseHandshakeState>,
) -> Result<(), String> {
    let label = window.label().to_string();
    if force.unwrap_or(false) {
        if let Ok(mut map) = state.in_flight.lock() {
            map.remove(&label);
        }
        if let Ok(mut set) = state.allowed_close.lock() {
            set.insert(label);
        }
    }
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cancel_close(
    window: WebviewWindow,
    state: tauri::State<'_, CloseHandshakeState>,
) -> Result<(), String> {
    let label = window.label().to_string();
    if let Ok(mut map) = state.in_flight.lock() {
        map.remove(&label);
    }
    if let Ok(mut set) = state.allowed_close.lock() {
        set.remove(&label);
    }
    Ok(())
}
