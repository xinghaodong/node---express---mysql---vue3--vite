import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import home from '@/home.vue';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
NProgress.configure({
    easing: 'ease', // 动画方式
    speed: 500, // 递增进度条的速度
    showSpinner: false, // 是否显示加载 icon
    trickleSpeed: 200, // 自动递增间隔
    minimum: 0.3, // 初始化时的最小百分比
});
const router = createRouter({
    history: createWebHashHistory(),
    // #好哈希路由模式
    // #history模式
    // history: createWebHistory(process.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: home,
            redirect: '/home',
            name: '/',
        },
        {
            path: '/home',
            name: 'home',
            component: home,
            redirect: '/index',
            meta: { title: '首页' },
            name: 'index',
            children: [
                {
                    path: '/index',
                    component: () => import('@/pages/index.vue'),
                },
                {
                    path: '/internalusers',
                    redirect: '/internalusers',
                    name: 'internalusers',
                    meta: { title: '系统设置' },
                    children: [
                        {
                            path: '/internalusers',
                            component: () => import('@/pages/systemSetting/internalusers.vue'),
                            meta: { title: '用户管理' },
                            name: 'internalusers',
                        },
                        {
                            path: '/787',
                            redirect: '/787',
                            name: '787',
                            meta: { title: '二级菜单' },
                            children: [
                                {
                                    path: '/787',
                                    component: () => import('@/pages/product/product.vue'),
                                    meta: { title: '三级菜单' },
                                    name: '787',
                                },
                            ],
                        },
                    ],
                },
                {
                    path: '/cp',
                    component: () => import('@/pages/product/product.vue'),
                    meta: { title: 'cp' },
                    name: 'cp',
                },
                {
                    path: '/9999',
                    component: () => import('@/pages/he.vue'),
                    meta: { title: '14141' },
                    name: '14141',
                },
                {
                    path: '/er',
                    name: 'er',
                    redirect: '/er',
                    meta: { title: '二级菜单1' },
                    children: [
                        {
                            path: '/er',
                            component: () => import('@/pages/er.vue'),
                            meta: { title: '二级菜单页面' },
                            name: 'er',
                        },
                    ],
                },
            ],
        },
        {
            path: '/login',
            component: () => import('@/pages/login.vue'),
        },
    ],
});

router.beforeEach((to, from, next) => {
    NProgress.start(); // 进度条开始
    next();
});

router.afterEach(() => {
    NProgress.done(); // 进度条结束
});

export default router;
