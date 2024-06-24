import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

import Unocss from 'unocss/vite';
export default defineConfig(({ mode }) => {
    const { VITE_PORT, VITE_BASE_URL, VITE_PROXY_DOMAIN_REAL } = loadEnv(mode, process.cwd());
    console.log(mode, 'mode');
    const alias = {
        // 设置路径
        // '~': path.resolve(__dirname, './'),
        // 设置别名
        '@': path.resolve(__dirname, './src'),
    };
    return {
        base: VITE_BASE_URL,
        plugins: [vue(), Unocss()],
        server: {
            // 端口号
            port: VITE_PORT,
            proxy: {
                // 代理路径
                '/api': {
                    // 目标地址
                    target: VITE_PROXY_DOMAIN_REAL,
                    // 是否改变请求的源地址，这里设置为 true，表示强制使用绝对路径
                    changeOrigin: true,
                    // 路径重写规则，这里将 /api 开头的请求路径替换为空字符串，即去掉 /api 前缀
                    rewrite: path => path.replace(/^\/api/, ''),
                },
            },
        },
        resolve: {
            // 配置路径别名， @就代表当前项目的绝对路径
            // __dirname是一个全局变量，表示当前模块所属目录的绝对路径
            // path.resolve返回一个以相对于当前的工作目录（working directory）的绝对路径,
            // 比如当前工作目录为 D:\205\wms-web 那么 @ 就代表 D:\205\wms-web\src
            alias: alias,
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
        },
    };
});
