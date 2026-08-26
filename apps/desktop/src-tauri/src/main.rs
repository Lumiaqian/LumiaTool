#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
fn toggle_dev_tools(window: tauri::WebviewWindow) {
    if window.is_devtools_open() {
        window.close_devtools();
    } else {
        window.open_devtools();
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![toggle_dev_tools])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("");
                #[cfg(target_os = "macos")]
                {
                    let _ = window.set_title_bar_style(tauri::TitleBarStyle::Overlay);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running LumiaTool");
}
