use std::path::PathBuf;
use std::sync::Mutex;

// 🌟 1. 核心通用导入（桌面端和移动端都有）
use tauri::{Emitter, Manager, State};

// 🌟 2. 桌面端专属导入（用 cfg 隔离，避免 Android 报错）
#[cfg(desktop)]
use std::time::Duration;
#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    WindowEvent,
};

// ============================================================
// 11. Rust FS：素材文件夹路径状态
// ============================================================
struct AssetsDir(Mutex<Option<PathBuf>>);

#[tauri::command]
fn set_assets_dir(state: State<AssetsDir>, path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        std::fs::create_dir_all(&path_buf).map_err(|e| e.to_string())?;
    }
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = Some(path_buf);
    Ok(())
}

#[tauri::command]
fn get_assets_dir(state: State<AssetsDir>) -> Option<String> {
    state
        .0
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
fn clear_assets_dir(state: State<AssetsDir>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}

// ============================================================
// 11b. save_local_file：支持子目录自动创建 + 路径安全
// ============================================================
#[tauri::command]
fn save_local_file(
    state: State<AssetsDir>,
    filename: String,
    bytes: Vec<u8>,
) -> Result<String, String> {
    if filename.contains("..") {
        return Err("invalid_filename_path_traversal".to_string());
    }

    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let dir = guard.as_ref().ok_or("assets_dir_not_mounted")?;
    let file_path = dir.join(&filename);

    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    std::fs::write(&file_path, &bytes).map_err(|e| e.to_string())?;
    Ok(format!("local://{}", filename))
}

// ============================================================
// 11c. read_local_file：支持子目录路径
// ============================================================
#[tauri::command]
fn read_local_file(state: State<AssetsDir>, filename: String) -> Result<Vec<u8>, String> {
    if filename.contains("..") {
        return Err("invalid_filename_path_traversal".to_string());
    }

    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let dir = guard.as_ref().ok_or("assets_dir_not_mounted")?;
    let file_path = dir.join(&filename);
    std::fs::read(&file_path).map_err(|e| e.to_string())
}

// ============================================================
// 11d. delete_local_file：安全删除本地文件（幂等）
// ============================================================
#[tauri::command]
fn delete_local_file(state: State<AssetsDir>, filename: String) -> Result<(), String> {
    if filename.contains("..") {
        return Err("invalid_filename_path_traversal".to_string());
    }

    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let dir = guard.as_ref().ok_or("assets_dir_not_mounted")?;
    let file_path = dir.join(&filename);

    if file_path.exists() && file_path.is_file() {
        std::fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }
    
    // 如果文件不存在，直接返回 Ok，保证幂等性
    Ok(())
}

// ============================================================
// 🌟 桌面端专属：系统托盘、全局快捷键、窗口防护
// ============================================================

#[cfg(desktop)]
fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "显示主窗口 / Show Window", true, None::<&str>)?;
    let start_item = MenuItem::with_id(app, "start", "开始计时 / Start Timer", true, None::<&str>)?;
    let pause_item = MenuItem::with_id(app, "pause", "暂停计时 / Pause Timer", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出 / Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_item, &start_item, &pause_item, &quit_item])?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
            "start" => {
                let _ = app.emit("tray:action", "start");
            }
            "pause" => {
                let _ = app.emit("tray:action", "pause");
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

#[cfg(desktop)]
fn build_toggle_shortcut() -> tauri_plugin_global_shortcut::Shortcut {
    use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};
    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyS)
}

#[cfg(desktop)]
fn setup_window_close_guard(app: &tauri::App) {
    if let Some(window) = app.get_webview_window("main") {
        let win_for_event = window.clone();
        window.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if let Ok(size) = win_for_event.inner_size() {
                    let scale = win_for_event.scale_factor().unwrap_or(1.0);
                    let logical_w = size.width as f64 / scale;
                    let logical_h = size.height as f64 / scale;

                    let is_mini = (logical_w - 525.0).abs() < 10.0
                        && (logical_h - 300.0).abs() < 10.0;

                    if is_mini {
                        api.prevent_close();
                        let win_a = win_for_event.clone();
                        let win_b = win_for_event.clone();
                        let _ = win_a.set_size(tauri::LogicalSize::new(1100.0, 800.0));
                        let _ = win_a.set_always_on_top(false);
                        tauri::async_runtime::spawn(async move {
                            std::thread::sleep(Duration::from_millis(120));
                            let _ = win_b.close();
                        });
                    }
                }
            }
        });
    }
}

// ============================================================
// 入口
// ============================================================
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
        builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

        builder = builder.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    use tauri_plugin_global_shortcut::ShortcutState;
                    if event.state() == ShortcutState::Pressed {
                        let target = build_toggle_shortcut();
                        if shortcut == &target {
                            let _ = app.emit("shortcut:toggle-timer", ());
                        }
                    }
                })
                .build(),
        );

        builder = builder.plugin(tauri_plugin_notification::init());
    }

    builder
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .manage(AssetsDir(Mutex::new(None)))
        .setup(|app| {
            #[cfg(desktop)]
            {
                setup_tray(app)?;
                setup_window_close_guard(app);

                use tauri_plugin_global_shortcut::GlobalShortcutExt;
                let shortcut = build_toggle_shortcut();
                if let Err(e) = app.global_shortcut().register(shortcut) {
                    log::warn!("[Shortcut] 全局快捷键 Ctrl+Shift+S 注册失败：{}", e);
                } else {
                    log::info!("[Shortcut] 已注册 Ctrl+Shift+S 全局快捷键");
                }
            }
            
            // 🌟 消除 Android 下未使用变量的警告
            #[cfg(mobile)]
            {
                let _ = app;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_local_file,
            read_local_file,
            delete_local_file,
            set_assets_dir,
            get_assets_dir,
            clear_assets_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}