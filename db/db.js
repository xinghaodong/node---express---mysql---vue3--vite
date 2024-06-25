const mysql = require('mysql2/promise');

// 创建数据库连接配置
const poolConfig = {
    host: '127.0.0.1', // 数据库地址
    user: 'root', // 数据库用户名
    password: '123456', // 数据库密码
    database: 'mydatabase', // 数据库名
    port: '3307', // 如果你的MySQL服务不是运行在默认端口，可以在这里指定
    // waitForConnections: true,
    // connectionLimit: 10, // 根据需要调整
    // queueLimit: 0,
};
// 创建连接池
const db = mysql.createPool(poolConfig);

// 一旦连接建立，打印消息
// db.on('connect', () => {
//     console.log('Connected to MySQL!');
// });

module.exports = db;
