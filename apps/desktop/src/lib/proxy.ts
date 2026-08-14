import axiosLibrary from "axios";

// 桌面 WebView 直接访问网络，不再经过 Web 版的同源代理。
export const axios = () => axiosLibrary.create();
