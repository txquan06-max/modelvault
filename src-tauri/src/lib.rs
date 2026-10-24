// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 🌟 注册 fs 插件：提供文件/文件夹读写
        .plugin(tauri_plugin_fs::init())
        // 🌟 注册 dialog 插件：提供原生文件夹选择弹窗
        .plugin(tauri_plugin_dialog::init())
        // 🌟 注册 process 插件：配合 updater 实现升级后重启
        .plugin(tauri_plugin_process::init())
        // 🌟 注册 updater 插件：桌面端自动更新
        .plugin(tauri_plugin_updater::Builder::new().build())
        // 原有的日志插件
        .plugin(tauri_plugin_log::Builder::new().build())
        .setup(|app| {
            // 可选：初始化时打印版本信息
            let version = app.package_info().version.to_string();
            println!("🚀 ModelJourney 已启动，当前版本: v{}", version);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}