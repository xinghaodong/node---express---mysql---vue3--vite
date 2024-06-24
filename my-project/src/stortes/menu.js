import { defineStore } from 'pinia';

const menuStore = defineStore('menu', {
    // defineStore('menu',{})  menu就是这个仓库的名称name
    state: () => ({
        activeTabArray: [
            {
                name: '首页',
                url: '/index',
            },
        ],
        editableTabsValue: '/index',
    }),
    // 修改
    actions: {
        /**
         * 添加一个新的菜单项到活跃菜单数组中。
         * 如果新菜单项的URL已经存在于活跃菜单数组中，则不执行任何操作。
         * 这个函数用于管理用户界面中的活跃菜单，确保用户可以切换和追踪不同的菜单项。
         * @param {Object} obj 要添加到活跃菜单数组的菜单项对象。
         * 对象应包含一个URL属性，用于唯一标识菜单项。
         */
        changeMenu(obj) {
            // 检查新的菜单项是否已经存在于活跃菜单数组中
            if (this.activeTabArray.some(item => item.url == obj.url)) {
                return;
            }
            // 如果新菜单项不存在于活跃菜单数组中，则将其添加到数组中
            this.activeTabArray.push(obj);
        },
        // 当前选中的tab页签
        changeTabsValue(key) {
            this.editableTabsValue = key;
        },
        /**
         * 根据url移除激活标签页中的某个标签页
         * @param {string} key 要移除的标签页的url
         * 此函数首先查找当前激活标签数组中是否存在url与传入key相同的标签页。
         * 如果找到，它将从数组中移除该标签页。如果被移除的标签页是当前编辑的标签页，
         * 则将当前编辑标签页的url更新为新的活跃标签页的url，或如果不存在下一个标签页，
         * 则更新为前一个标签页的url。
         */
        changeRemoveTab(key) {
            let index = this.activeTabArray.findIndex(item => item.url === key);
            // 从活跃标签数组中移除对应的标签页
            this.activeTabArray.splice(index, 1);
            // 如果被移除的标签页是当前编辑的标签页
            if (this.editableTabsValue == key) {
                // 如果不存在下一个标签页，则更新为前一个标签页的url
                this.editableTabsValue = this.activeTabArray[index] ? this.activeTabArray[index].url : this.activeTabArray[index - 1].url;
            }
        },
        // 关闭右侧tabs标签页
        changeRemoveRightAll(key) {
            let index = this.activeTabArray.findIndex(item => item.url === key);
            // 删除当前点的的右侧tabs标签
            this.activeTabArray.splice(index + 1, this.activeTabArray.length - index - 1);
        },
        // 关闭其他tabs标签页
        changeRemoveOtherAll(key) {
            let index = this.activeTabArray.findIndex(item => item.url === key);
            // 删除除了当前点的tabs标签以及首页url: '/index'的标签
            // this.activeTabArray.splice(index + 1);
            // this.activeTabArray.splice(1, index - 1);
            this.activeTabArray = [this.activeTabArray[0], this.activeTabArray[index]];
            this.editableTabsValue = key;
        },
        // 关闭左侧tabs标签页
        changeRemoveLeftAll(key) {
            let index = this.activeTabArray.findIndex(item => item.url === key);
            // 删除当前点击项目左侧的tabs标签
            this.activeTabArray.splice(1, index - 1);
            // 当前选中项目 editableTabsValue 不存在于 activeTabArray中那么默认选中index的下一个activeTabArray
            if (!this.activeTabArray.some(item => item.url === this.editableTabsValue)) {
                this.editableTabsValue = key;
            }
        },
        // 关闭全部tabs标签页除了首页
        changeRemoveAll() {
            this.activeTabArray = [this.activeTabArray[0]];
            this.editableTabsValue = this.activeTabArray[0].url;
        },
    },
    persist: {
        key: 'piniaMenuStore', //存储名称
        storage: localStorage, // 存储方式
        paths: ['activeTabArray', 'editableTabsValue'], //指定 state 中哪些数据需要被持久化。[] 表示不持久化任何状态，undefined 或 null 表示持久化整个 state
    },
});

export default menuStore;
