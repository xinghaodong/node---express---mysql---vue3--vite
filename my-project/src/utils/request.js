import axios from 'axios';
import QS from 'qs';
import { ElMessage } from 'element-plus';
import router from '@/router';
const { VITE_PROXY_DOMAIN_REAL, VITE_STATIC_URL, VITE_PROXY_DOMAIN } = import.meta.env;
const baseUrl = VITE_PROXY_DOMAIN;
const img_url = VITE_STATIC_URL;
axios.defaults.baseURL = baseUrl;
console.log('当前环境：', VITE_PROXY_DOMAIN_REAL, '当前图片资源：', VITE_STATIC_URL);
// axios.defaults.headers['Content-Type'] = 'application/json';
/**
 * 控制当前是否处于刷新状态的标志变量。
 */
let isRefreshing = false;

/**
 * 用于存储在刷新期间需要延迟执行的请求的数组。
 * 刷新过程中，新来的请求会被加入到这个数组中，等待刷新完成后逐一处理。
 */
let requests = [];
/**
 * 配置axios请求拦截器
 *
 * 该拦截器用于在每个HTTP请求发送前添加Authorization头，该头用于验证请求的授权状态。
 * 它从本地存储中获取令牌（如果存在），并将其添加到请求头中。如果不存在令牌，则不添加。
 * 此外，拦截器还处理了请求错误，将错误封装成Promise.reject形式，以便进一步的错误处理。
 *
 * @param {Object} config - axios请求配置对象
 * @returns {Object} - 处理后的请求配置对象
 */
axios.interceptors.request.use(
    async config => {
        // 从本地存储中获取令牌，并设置到请求头中
        config.headers.Authorization = localStorage.getItem('token') || '';
        return config;
    },
    error => {
        // 错误处理：将错误封装成Promise.reject形式
        return Promise.reject(error);
    }
);
// 响应拦截器
axios.interceptors.response.use(
    response => {
        if (response.data.code === 401) {
            if (!isRefreshing) {
                isRefreshing = true;
                //调用刷新token的接口
                return axios
                    .post('/api/internalusers/refresh', {
                        refresh: localStorage.getItem('refresh') || '',
                    })
                    .then(res => {
                        const { token, refresh } = res.data;
                        // 替换token
                        localStorage.setItem('token', token);
                        localStorage.setItem('refresh', refresh);
                        response.headers.Authorization = `${token}`;
                        // token 刷新后将数组的方法重新执行
                        requests.forEach(cb => cb(token));
                        requests = []; // 重新请求完清空
                        return axios(response.config);
                    })
                    .catch(err => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('refresh');
                        router.push('/login');
                        return Promise.reject(err);
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            } else {
                // 返回未执行 resolve 的 Promise
                return new Promise(resolve => {
                    // 用函数形式将 resolve 存入，等待刷新后再执行
                    requests.push(token => {
                        response.headers.Authorization = `${token}`;
                        resolve(axios(response.config));
                    });
                });
            }
        }
        if (response.data.code === 400) {
            // 400 无token 跳转登录
            console.log('token消失了');
            router.push('/login');
            // return Promise.resolve(response); //进行中
        }
        if (response.data.code !== 200) {
            ElMessage.warning(response.data.message);
        }

        // return response && response.data;
        return Promise.resolve(response); //进行中
    },
    // 服务器状态码不是200的情况
    async error => {
        console.log(error, 'error');
        ElMessage.warning(error.response.data.message);
        if (error.response.status) {
            return Promise.reject(error.response);
        }
    }
);

/**
 * get方法，对应get请求
 * @param {String} url 请求的url地址
 * @param {Object} params 请求时携带的参数
 */
export const oGet = (url, params) => {
    return new Promise((resolve, reject) => {
        axios
            .get(url, {
                params: params,
            })
            .then(res => {
                resolve(res.data);
            })
            .catch(err => {
                reject(err.data);
            });
    });
};
/**
 * post方法，对应post请求
 * @param {String} url 请求的url地址
 * @param {Object} params 请求时携带的参数
 */
export const oPost = (url, params) => {
    return new Promise((resolve, reject) => {
        axios
            .post(url, QS.stringify(params))
            .then(res => {
                resolve(res.data);
            })
            .catch(err => {
                reject(err.data);
            });
    });
};

//接口方法 地址
export default {
    baseUrl,
    img_url,
    //登录
    login(params) {
        return oPost(baseUrl + '/internalusers/login', params);
    },
    //更新菜单
    updatemenu(params) {
        return oPost(baseUrl + '/updatemenu', params);
    },
    // 删除菜单
    deletemenu(params) {
        return oPost(baseUrl + '/deletemenu', params);
    },
    // 添加菜单
    addmenu(params) {
        return oPost(baseUrl + '/addmenu', params);
    },
    // 获取菜单列表
    menus(params) {
        return oGet(baseUrl + '/menus', params);
    },
    // 修改菜单
    updatemenu(params) {
        return oPost(baseUrl + '/updatemenu', params);
    },
    //用户管理查询
    find(params) {
        return oGet(baseUrl + '/internalusers/find', params);
    },
    //新增用户
    add(params) {
        return oPost(baseUrl + '/internalusers/add', params);
    },
    // 更新用户
    update(params) {
        return oPost(baseUrl + '/internalusers/update', params);
    },
    // 删除用户
    delete(params) {
        return oPost(baseUrl + '/internalusers/delete', params);
    },
    // 禁用
    ban(params) {
        return oPost(baseUrl + '/internalusers/ban', params);
    },
};

//封装post/get请求
// export default {
//     post(url, data) {
//         return new Promise((resolve, reject) => {
//             axios({
//                 method: 'post',
//                 url,
//                 // data,
//                 data: QS.stringify(data), //参数序列化
//             })
//                 .then(res => {
//                     if (res) {
//                         resolve(res.data);
//                     }
//                 })
//                 .catch(err => {
//                     reject(err);
//                 });
//         });
//     },
//     get(url, data) {
//         return new Promise((resolve, reject) => {
//             axios({
//                 method: 'get',
//                 url,
//                 params: data,
//             })
//                 .then(res => {
//                     if (res) {
//                         resolve(res.data);
//                     }
//                 })
//                 .catch(err => {
//                     reject(err);
//                 });
//         });
//     },
//     baseURL: axios.defaults.baseURL,
//     img_url,
// };
