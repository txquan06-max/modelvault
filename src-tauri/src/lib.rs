use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, State,
};

// ============================================================
// 11. Rust FS：素材文件夹路径状态
// ============================================================
struct AssetsDir(Mutex<Option<PathBuf>>);

/// 保存用户选择的素材文件夹路径到 Rust 状态（前端选完文件夹后调用）
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

/// 读取当前保存的素材文件夹路径（前端启动时可用来恢复状态）
#[tauri::command]
fn get_assets_dir(state: State<AssetsDir>) -> Option<String> {
    state
        .0
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|p| p.to_string_lossy().to_string()))
}

/// 清除素材文件夹路径（用户主动断开挂载时调用）
#[tauri::command]
fn clear_assets_dir(state: State<AssetsDir>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}

/// 把字节写入素材文件夹（覆盖同名文件）
/// 返回 `local://filename` 作为前端可直接引用的伪 URL
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

/// 从素材文件夹读取文件字节（前端转换成 Blob URL 渲染）
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
// 入口
// ============================================================
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .manage(AssetsDir(Mutex::new(None)))
        .setup(|app| {
            #[cfg(desktop)]
            {
                setup_tray(app)?;
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