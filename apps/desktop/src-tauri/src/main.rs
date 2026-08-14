#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
        .run(tauri::generate_context!())
        .expect("error while running LumiaTool");
}
