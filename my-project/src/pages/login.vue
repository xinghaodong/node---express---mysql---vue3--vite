<template>
    <div class="box">
        <div class="content" :class="[`bg-${flag}`]">
            <div class="login-wrapper">
                <div class="mask"></div>
                <div class="login-content">
                    <h1>登 录</h1>
                    <div class="title-text">欢迎来到这个界面，您可以通过这个界面登录到系统，也可以选择其他的登录方式.</div>
                    <div v-show="false" class="other-login">
                        <img src="@/assets/QQ.png" alt="" />
                        <span>使用QQ登录</span>
                    </div>
                    <el-form ref="ruleFormRef" :rules="rules" :model="ruleForm" label-width="100px" size="mini">
                        <div class="login-form">
                            <el-form-item label="账号" prop="name">
                                <el-input class="user" v-model="ruleForm.name"></el-input>
                            </el-form-item>
                            <el-form-item label="密码" prop="password">
                                <el-input class="password" v-model="ruleForm.password"></el-input>
                            </el-form-item>
                        </div>
                        <el-button class="login-btn" @click="onSubmit(ruleFormRef)">登 录</el-button>
                    </el-form>
                    <!-- <div class="tips">
                        <span>还没有账号?</span>
                        <span>注册</span>
                    </div> -->
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import useUserInfoStore from '@/stortes/user'; //引入仓库
import menuStore from '@/stortes/menu'; //引入仓库
import { storeToRefs } from 'pinia'; //引入pinia转换
const userInfoStore = useUserInfoStore();
// const userdata = storeToRefs(userInfoStore); // 响应式
const { proxy } = getCurrentInstance();
const menuInfoStore = menuStore();
const { editableTabsValue } = storeToRefs(menuInfoStore); // 响应式
let intervalId = null;
let flag = ref(0);
onMounted(async () => {
    console.log(proxy.$api, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    changeBg();
    intervalId = setInterval(() => {
        // 定时器执行的逻辑
        changeBg();
    }, 5000);
    if (proxy.$websocket.socket) {
        proxy.$websocket.close();
    }
});
// 销毁
onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null; // 可选：重置intervalId为null，明确表示已清理
    }
});
const changeBg = () => {
    if (flag.value % 2 == 0) document.querySelector('.other-login').style.backgroundColor = 'rgb(248, 182, 217)';
    else document.querySelector('.other-login').style.backgroundColor = 'rgb(182, 211, 248)';
    if (flag.value == 4) flag.value = 1;
    else flag.value++;
    // document.querySelector('.content').style.background = `url(./assets/bg${flag}.png) no-repeat`;
    return changeBg;
};
const rules = {
    name: [
        {
            required: true,
            message: '请输入账号',
            trigger: 'blur',
        },
    ],
    password: [
        {
            required: true,
            message: '请输入密码',
            trigger: 'blur',
        },
    ],
};
const ruleForm = reactive({
    name: '',
    password: '',
});
const ruleFormRef = ref(null);

const onSubmit = formEl => {
    formEl.validate(async valid => {
        if (valid) {
            const data = await proxy.$api.login(ruleForm);
            if (data.code == 200) {
                userInfoStore.changeUserInfo(data.data);
                localStorage.setItem('token', data.token);
                localStorage.setItem('refresh', data.refresh);
                proxy.$router.push(editableTabsValue.value || '/index');
                proxy.$message.success(data.message);
            }
        } else {
            return false;
        }
    });
};
</script>

<style>
.el-input__wrapper {
    padding-left: 2px;
}
.bg-1 {
    background-image: url('@/assets/bg1.png');
    background-repeat: no-repeat;
}

.bg-2 {
    background-image: url('@/assets/bg2.png');
    background-repeat: no-repeat;
}
.bg-3 {
    background-image: url('@/assets/bg3.png');
    background-repeat: no-repeat;
}
.bg-4 {
    background-image: url('@/assets/bg4.png');
    background-repeat: no-repeat;
}
* {
    margin: 0;
    padding: 0;
}

.box {
    background-color: #fff;
    width: 100vw;
    height: 100vh;
}
.box .content {
    width: 85vw;
    height: 90vh;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 20px;
    -o-object-fit: cover;
    object-fit: cover;
    transition: 0.5s;
}
.box .content .login-wrapper {
    width: 500px;
    height: 100%;
    position: absolute;
    right: 0;
    box-sizing: border-box;
}
.box .content .login-wrapper .mask {
    width: 100%;
    height: 100%;
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
    position: absolute;
    background: rgba(255, 255, 255, 0.7);
    -webkit-backdrop-filter: blur(15.5px);
    backdrop-filter: blur(15.5px);
}
.box .content .login-wrapper .login-content {
    width: 80%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
}
.box .content .login-wrapper .login-content h1 {
    font-size: 45px;
    margin-bottom: 10px;
}
.box .content .login-wrapper .login-content .title-text {
    color: rgb(65, 63, 63);
    margin-bottom: 50px;
}
.box .content .login-wrapper .login-content .other-login {
    width: 100%;
    height: 50px;
    background-color: rgb(248, 182, 217);
    border-radius: 5px;
    transition: 1s;
    text-align: center;
    line-height: 50px;
    font-weight: 600;
    font-size: 20px;
    margin-bottom: 20px;
    color: rgb(41, 41, 41);
    cursor: pointer;
}
.box .content .login-wrapper .login-content .other-login img {
    width: 35px;
    height: 35px;
    vertical-align: middle;
}
.box .content .login-wrapper .login-content .login-form {
    margin-top: 40px;
}
.box .content .login-wrapper .login-content .login-form input {
    width: 100%;
    border-radius: 5px;
    border: 0;
    padding: 10px;
    box-sizing: border-box;
    font-weight: 100;
    font-size: 20px;
}
.box .content .login-wrapper .login-content .login-form input:focus {
    outline: none;
}
.box .content .login-wrapper .login-content .login-form input::-moz-placeholder {
    font-weight: 600;
    color: black;
}
.box .content .login-wrapper .login-content .login-form input:-ms-input-placeholder {
    font-weight: 600;
    color: black;
}
.box .content .login-wrapper .login-content .login-form input::placeholder {
    font-weight: 600;
    color: black;
}
.box .content .login-wrapper .login-content .login-btn {
    width: 100%;
    height: 45px;
    margin-top: 25px;
    border-radius: 5px;
    border: 0;
    background-color: rgb(54, 59, 197);
    color: #fff;
    font-size: 22px;
    font-weight: 600;
}
.box .content .login-wrapper .login-content .tips {
    margin: 5px 0;
    font-size: 14px;
    color: rgb(150, 152, 160);
}
.box .content .login-wrapper .login-content .tips span:nth-child(2) {
    color: rgb(54, 59, 197);
    font-weight: 600;
} /*# sourceMappingURL=style.css.map */
</style>
