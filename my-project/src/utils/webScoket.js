import { ElNotification } from 'element-plus';
// import { getToken } from "../utils/token";

var socket = null; //实例对象
var lockReconnect = false; //是否真正建立连接
var timeout = 20 * 1000; //20秒一次心跳
var timeoutObj = null; //心跳倒计时
var serverTimeoutObj = null; //服务心跳倒计时
var timeoutnum = null; //断开 重连倒计时

let isClosing = false;

const initWebSocket = async url => {
    if ('WebSocket' in window) {
        const wsUrl = url;
        socket = new WebSocket(wsUrl);
        socket.onerror = webSocketOnError;
        socket.onmessage = webSocketOnMessage;
        socket.onclose = closeWebsocket;
        socket.onopen = openWebsocket;
    } else {
        ElNotification.error({
            title: '错误',
            message: '您的浏览器不支持websocket，请更换Chrome或者Firefox',
        });
    }
};

//建立连接
const openWebsocket = e => {
    // console.log('连接成功', e);
    // start();
};

const start = () => {
    //开启心跳
    timeoutObj && clearTimeout(timeoutObj);
    serverTimeoutObj && clearTimeout(serverTimeoutObj);
    timeoutObj = setTimeout(function () {
        //这里发送一个心跳，后端收到后，返回一个心跳消息
        if (socket.readyState == 1) {
            //如果连接正常
            // socket.send("heartbeat");
        } else {
            //否则重连
            reconnect();
        }
        serverTimeoutObj = setTimeout(function () {
            //超时关闭
            socket.close();
        }, timeout);
    }, timeout);
};

//重新连接
const reconnect = () => {
    if (lockReconnect || isClosing) {
        return;
    }
    lockReconnect = true;
    //没连接上会一直重连，设置延迟避免请求过多
    timeoutnum && clearTimeout(timeoutnum);
    timeoutnum = setTimeout(function () {
        //新连接
        initWebSocket();
        lockReconnect = false;
    }, 5000);
};

//重置心跳
const reset = () => {
    //清除时间
    clearTimeout(timeoutObj);
    clearTimeout(serverTimeoutObj);
    //重启心跳
    // start();
};

const sendWebsocket = e => {
    console.log(e, 'ee');
    socket.send(e);
};

const webSocketOnError = e => {
    initWebSocket();
    // reconnect();
};

//服务器返回的数据
const webSocketOnMessage = e => {
    //window自定义事件[下面有说明]
    window.dispatchEvent(
        new CustomEvent('onmessageWS', {
            detail: {
                data: e,
            },
        })
    );
    reset();
};

const closeWebsocket = e => {
    reconnect();
};

//断开连接
const close = () => {
    isClosing = true; // 设置关闭标志
    clearTimeout(timeoutObj);
    clearTimeout(serverTimeoutObj);
    clearTimeout(timeoutnum);
    //WebSocket对象也有发送和关闭的两个方法，只需要在自定义方法中分别调用send()和close()即可实现。
    socket.close();
    setTimeout(() => {
        if (socket.readyState === WebSocket.CLOSED) {
            console.log('连接已完全关闭');
        } else {
            console.log('连接仍在关闭过程中或未完全关闭');
        }
    }, 200); // 延时时间根据实际情况调整，这里以100毫秒为例
};
//具体问题具体分析,把需要用到的方法暴露出去
export default { initWebSocket, sendWebsocket, webSocketOnMessage, close, socket };
