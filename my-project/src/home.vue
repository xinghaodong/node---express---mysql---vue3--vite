<template>
    <el-container class="main">
        <el-aside :style="{ width: isCollapse ? '64px' : '200px' }" class="el-aside">
            <el-menu router :default-active="router.currentRoute.value.fullPath" @select="handleSelect" :collapse="isCollapse">
                <MenuItem v-for="(item, index) in userData" :key="index" :item="item" :isCollapse="isCollapse" />
            </el-menu>
        </el-aside>
        <el-container>
            <el-header style="text-align: right; font-size: 12px; height: 90px; padding: 0px">
                <div class="top">
                    <div class="flex flex-row">
                        <!-- 点击 折叠   -->
                        <el-icon style="display: block; line-height: 50px; font-size: 24px; cursor: pointer" @click="foldEvent"><Fold /></el-icon>

                        <el-breadcrumb :separator-icon="ArrowRight" style="line-height: 46px; padding-left: 20px">
                            <template v-for="(item, index) in breadList">
                                <!-- {{ item.path }} -->
                                <el-breadcrumb-item v-if="item.name" :key="index">{{ item.meta.title }}</el-breadcrumb-item>
                            </template>
                        </el-breadcrumb>
                    </div>
                </div>
                <!-- tab-click 事件名字 -->
                <el-tabs
                    @contextmenu.prevent="handleContextMenu($event)"
                    v-model="editableTabsValue"
                    type="card"
                    @tab-click="handleClick"
                    @tab-remove="removeTab"
                >
                    <el-tab-pane
                        :closable="item.url == activeTabArray[0].url ? false : true"
                        v-for="item in activeTabArray"
                        :label="item.name"
                        :key="item.url"
                        :name="item.url"
                    >
                    </el-tab-pane>
                </el-tabs>
            </el-header>
            <el-main>
                <!-- <transition name="sidebarLogoFade" mode="out-in"> -->
                <router-view v-if="isShowRouter"> </router-view>
                <!-- </transition> -->
            </el-main>
        </el-container>
        <ul v-if="contextMenuVisible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
            <!-- 右键点击的不是当当前路由将他隐藏 -->
            <li v-if="isActiveMenu" @click="refresh">刷新</li>
            <li v-if="isLeftMenu" @click="closeLeftAll">关闭左侧</li>
            <li v-if="isRightMenu" @click="closeRightAll">关闭右侧</li>
            <li @click="closeOtherAll">关闭其他</li>
            <li @click="closeAll">全部关闭</li>
        </ul>
    </el-container>
</template>
<script setup>
import MenuItem from './components/menuItem.vue';
import { ref, getCurrentInstance, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import menuStore from '@/stortes/menu'; //引入仓库
import { storeToRefs } from 'pinia'; //引入pinia转换
import { useRouter, useRoute } from 'vue-router';
import { ElNotification, ElTabs, ElTabPane } from 'element-plus';
let route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance();
const menuInfoStore = menuStore();
const { activeTabArray, editableTabsValue } = storeToRefs(menuInfoStore); // 响应式
const userData = ref(null);
const breadList = ref([]);
// 一定一个当前右键点击的 菜单对象不是函数
const rightMouseData = ref(null);
const rightMouseKey = ref(null);
// 一定一个波尔变量是否显示关闭右侧菜单
const isRightMenu = ref(false);
const isShowRouter = ref(true);
const isActiveMenu = ref(false);
const isLeftMenu = ref(false);
// 定义contextMenuVisible默认为 false
const contextMenuVisible = ref(false);
// 定义top和left默认都是空字符串
const left = ref('');
const top = ref('');
const contextMenuElement = ref(null);
const isCollapse = ref(false);
// 定义函数 foldEvent
const foldEvent = () => {
    // 折叠菜单
    isCollapse.value = !isCollapse.value;
};

const getMatched = () => {
    breadList.value = route.matched.filter(item => item.meta && item.meta.title);
};

// 定义点击外部关闭菜单的方法
const handleClickOutside = e => {
    // 确保 contextMenuElement 已经被赋值
    if (contextMenuElement.value && !contextMenuElement.value.contains(e.target)) {
        contextMenuVisible.value = false;
    }
};
// 定义函数 refresh
const refresh = () => {
    nextTick(async () => {
        isShowRouter.value = false;
        await proxy.$router.replace(rightMouseKey.value);
        isShowRouter.value = true;
        contextMenuVisible.value = false;
    });
};
// 定义上边的函数
const closeLeftAll = () => {
    menuInfoStore.changeRemoveLeftAll(rightMouseKey.value);
    contextMenuVisible.value = false;
    nextTick(() => {
        proxy.$router.push(editableTabsValue.value);
    });
};

const closeRightAll = () => {
    menuInfoStore.changeRemoveRightAll(rightMouseKey.value);
    contextMenuVisible.value = false;
};
const closeOtherAll = () => {
    menuInfoStore.changeRemoveOtherAll(rightMouseKey.value);
    contextMenuVisible.value = false;
    nextTick(() => {
        proxy.$router.push(editableTabsValue.value);
    });
};
const closeAll = () => {
    menuInfoStore.changeRemoveAll(rightMouseKey.value);
    contextMenuVisible.value = false;
    nextTick(() => {
        proxy.$router.push(editableTabsValue.value);
    });
};
const handleContextMenu = e => {
    let result = findNodeById(userData.value, e.srcElement.id.split('-')[1]);
    rightMouseKey.value = e.srcElement.id.split('-')[1];
    rightMouseData.value = result;
    // 判断当前右键点击的是否是第0或者是第一项
    let index = activeTabArray.value.findIndex(item => item.url === rightMouseKey.value);
    if (index == 0 || index == 1) {
        isLeftMenu.value = false;
    } else {
        isLeftMenu.value = true;
    }
    // 判断当前右键点击的菜单项是否是当前路由
    if (rightMouseKey.value == editableTabsValue.value) {
        isActiveMenu.value = true;
    } else {
        isActiveMenu.value = false;
    }
    // 如果当前右键点击的菜单项是最后一项那就就不显示 关闭右侧的li
    if (rightMouseKey.value == activeTabArray.value[activeTabArray.value.length - 1].url) {
        // isRightMenu 设置为false
        isRightMenu.value = false;
    } else {
        isRightMenu.value = true;
    }
    e.preventDefault();
    contextMenuVisible.value = true;
    left.value = e.clientX - 10;
    top.value = e.clientY + 15;
};

const removeTab = pane => {
    menuInfoStore.changeRemoveTab(pane);
    proxy.$router.push(editableTabsValue.value);
};
const handleClick = (pane, ev) => {
    // 路由跳转
    proxy.$router.push(pane.paneName);
};

const handleSelect = (key, keyPath) => {
    menuInfoStore.changeTabsValue(key);
    let obj = findNodeById(userData.value, key);
    menuInfoStore.changeMenu(obj);
};
const getSocketData = res => {
    let data = JSON.parse(res.detail.data.data);
    if (data.action == 'logout') {
        let mesg = {
            message: data.reason,
            type: 'error',
            duration: 2000,
        };
        ElNotification(mesg);
        // proxy.$websocket.close();
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        setTimeout(() => {
            proxy.$router.push('/login');
        }, 500);
    }
};
const getscoket = () => {
    // 从本地缓存里取登录人id
    const loginId = JSON.parse(localStorage.getItem('piniaStore'));
    let url = `ws://localhost:3001?id=${loginId.userInfo.id}`;
    proxy.$websocket.initWebSocket(url);
    window.addEventListener('onmessageWS', getSocketData);
};

/**
 * 根据ID查找树中的对象
 * @param {Array} tree - 树结构数据
 * @param {Number|String} targetId - 目标ID
 * @return {Object|null} - 找到的对象或null
 */
const findNodeById = (tree, targetId) => {
    for (const node of tree) {
        if (node.url === targetId) {
            return node;
        }
        if (node.children) {
            // 如果节点有子节点，继续递归查找
            const foundNode = findNodeById(node.children, targetId);
            if (foundNode) {
                return foundNode;
            }
        }
    }
    return null; // 没有找到对应ID的节点
};
watch(
    () => route.path,
    (newValue, oldValue) => {
        //监听路由路径是否发生变化，之后更改面包屑
        breadList.value = route.matched.filter(item => item.meta && item.meta.title);
    }
);
onMounted(async () => {
    console.log(router, proxy.$router);
    contextMenuElement.value = document.querySelector('.contextmenu');
    document.addEventListener('click', handleClickOutside);
    getMatched();
    try {
        const res = await proxy.$api.menus();
        userData.value = res.data;
        getscoket();
    } catch (error) {
        console.error('失败信息:', error);
    }
});
onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('onmessageWS', getSocketData);
    proxy.$websocket.close();
});
</script>
<style>
.el-aside {
    height: 100vh;
    background-color: #ffffff;
    transition: width 0.3s ease;
    border-right: 1px solid #e2e7ec;
    overflow: hidden !important;
}
.contextmenu {
    position: absolute;
    z-index: 1001;
    border: solid 1px #e4e7ed;
    border-radius: 4px;
    background-color: #ffffff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    margin: 5px 0;
    width: 150px;
    padding: 6px 0;
}

.contextmenu li {
    font-size: 13px;
    padding: 0 20px;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #606266;
    height: 34px;
    line-height: 34px;
    box-sizing: border-box;
    cursor: pointer;
}

.contextmenu li:hover {
    background: #f5f7fa;
    cursor: pointer;
}

.sidebarLogoFade-enter-active {
    transition: all 0.8s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
    transform: translateX(-30px);
    opacity: 0;
}
.el-menu-demo {
    height: auto;
    height: 100%;
}
.el-menu {
    border: 0px !important;
}
.mb-2 {
    height: 60px;
    background: aquamarine;
    margin: 0;
    line-height: 60px;
}

.common-layout {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

.el-container {
    height: 100%;
}

.top {
    height: 50px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    justify-content: space-between;
    border-bottom: 1px solid #e2e7ec;
}

.el-header {
    padding: 0;
}

.el-main {
    background: #f5f5fb;
    padding: 16px 16px 0;
    position: relative;
}

.main_box {
    position: relative;
    overflow: auto;
    height: 100%;
    background: #ffffff;
}

.contextmenu {
    position: absolute;
    z-index: 1001;
    border: solid 1px #e4e7ed;
    border-radius: 4px;
    background-color: #ffffff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    margin: 5px 0;
    width: 150px;
    padding: 6px 0;
}

.contextmenu li {
    font-size: 13px;
    padding: 0 20px;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #606266;
    height: 34px;
    line-height: 34px;
    box-sizing: border-box;
    cursor: pointer;
}

.contextmenu li:hover {
    background: #f5f7fa;
    cursor: pointer;
}

.el-dropdown-link {
    display: flex;
    align-items: center;

    > p {
        margin: 0 10px;
    }
}
</style>
