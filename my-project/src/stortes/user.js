import { defineStore } from 'pinia';

const useUserInfoStore = defineStore('userInfo', {
    // defineStore('userInfo',{})  userInfo就是这个仓库的名称name
    state: () => ({
        userInfo: {},
    }),
    // 修改
    actions: {
        changeUserInfo(obj) {
            this.userInfo = obj;
        },
    },
    persist: {
        key: 'piniaStore', //存储名称
        storage: localStorage, // 存储方式
        paths: ['userInfo'], //指定 state 中哪些数据需要被持久化。[] 表示不持久化任何状态，undefined 或 null 表示持久化整个 state
    },
});

export default useUserInfoStore;
