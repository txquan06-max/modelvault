use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, State, WindowEvent,
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

#[tauri::command]
fn save_local_file(
    state: State<AssetsDir>,
    filename: String,
    bytes: Vec<u8>,
) -> Result<String, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let dir = guard.as_ref().ok_or("assets_dir_not_mounted")?;
    let file_path = dir.join(&filename);
    std::fs::write(&file_path, &bytes).map_err(|e| e.to_string())?;
    Ok(format!("local://{}", filename))
}

#[tauri::command]
fn read_local_file(state: State<AssetsDir>, filename: String) -> Result<Vec<u8>, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    let dir = guard.as_ref().ok_or("assets_dir_not_mounted")?;
    let file_path = dir.join(&filename);
    std::fs::read(&file_path).map_err(|e| e.to_string())
}

// ============================================================
// 7C. 系统托盘初始化
// ============================================================
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

// ============================================================
// 选项 A - 2：全局快捷键 Ctrl+Shift+S
// ------------------------------------------------------------
// 统一构造方式，避免闭包捕获时类型不匹配
// ============================================================
#[cfg(desktop)]
fn build_toggle_shortcut() -> tauri_plugin_global_shortcut::Shortcut {
    use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};
    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyS)
}

// ============================================================
// 选项 A - 1：窗口关闭前尺寸防护
// ------------------------------------------------------------
// 问题：极简模式下（525×300）直接关闭窗口，window-state 插件会把 525×300
//       记为下次启动尺寸，导致下次打开看不见正常 UI。
// 方案：捕获 CloseRequested，检测是否极简尺寸，是则 prevent_close，
//       恢复 1100×800 后延迟 120ms 再真正关闭，让 window-state 记录新尺寸。
// ============================================================
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

                    // 极简模式 ≈ 525 × 300（±10 宽容度适配不同 DPI）
                    let is_mini = (logical_w - 525.0).abs() < 10.0
                        && (logical_h - 300.0).abs() < 10.0;

                    if is_mini {
                        api.prevent_close();
                        let win_a = win_for_event.clone();
                        let win_b = win_for_event.clone();
                        // 恢复标准尺寸 + 取消置顶，让 window-state 保存正常尺寸
                        let _ = win_a.set_size(tauri::LogicalSize::new(1100.0, 800.0));
                        let _ = win_a.set_always_on_top(false);
                        // 延迟关闭：让窗口尺寸变化事件完全抵达 window-state 监听器
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
        // 自动更新插件（原有）
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());

        // 选项 A - 1：窗口状态记忆
        builder = builder.plugin(tauri_plugin_window_state::Builder::default().build());

        // 选项 A - 2：全局快捷键（Ctrl+Shift+S 发出 shortcut:toggle-timer 事件）
        builder = builder.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    use tauri_plugin_global_shortcut::ShortcutState;
                    if event.state() == ShortcutState::Pressed {
                        let target = build_toggle_shortcut();
                        if shortcut == &target {
                            // 交由前端根据当前 timerState 决定 start / pause / resume
                            let _ = app.emit("shortcut:toggle-timer", ());
                        }
                    }
                })
                .build(),
        );

        // 选项 A - 3：原生通知
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
                // 托盘
                setup_tray(app)?;
                // 窗口关闭前尺寸防护
                setup_window_close_guard(app);

                // 注册全局快捷键
                use tauri_plugin_global_shortcut::GlobalShortcutExt;
                let shortcut = build_toggle_shortcut();
                if let Err(e) = app.global_shortcut().register(shortcut) {
                    log::warn!("[Shortcut] 全局快捷键 Ctrl+Shift+S 注册失败：{}", e);
                } else {
                    log::info!("[Shortcut] 已注册 Ctrl+Shift+S 全局快捷键");
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_local_file,
            read_local_file,
            set_assets_dir,
            get_assets_dir,
            clear_assets_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}