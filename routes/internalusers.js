// routes/internalusers.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../db/db'); // 导入数据库连接模块
const modifyResponseTimeFormat = require('../middleware/common');
// 用于生成 JWT 字符串的包
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('../middleware/jwt');
const WebSocket = require('ws');
// 引用Server类:
const WebSocketServer = WebSocket.Server;
// 实例化:
const wss = new WebSocketServer({
    port: 3001,
});
// 用于存储在线用户的WebSocket连接
let clients = {};
wss.on('connection', function (ws, req) {
    // 从请求的URL中提取id参数
    const userId = req.url.split('?id=')[1];
    if (userId) {
        clients[userId] = ws;
        console.log(`User ${userId} connected with WebSocket.`);
        ws.send(JSON.stringify({ welcome: `Welcome, User ${userId}!` }));
    }
    ws.on('message', async function (message) {
        console.log(`收到客户端的数据: ${message}`);
        ws.send(`服务端接收到数据，给客户端返回数据: ${message}`, err => {
            if (err) {
                console.log(`[SERVER] error: ${err}`);
            }
        });
    });
    ws.on('close', () => {
        // console.log(userId, 'userId');
        if (userId && clients[userId] === ws) {
            delete clients[userId];
            console.log(`User ${userId} disconnected.关闭连接`);
        }
    });
});

/**
 * 移除数组中每个对象的password属性。
 * @param {Array<Object>} rows - 包含用户数据的对象数组。
 */
function removePasswordFromRows(rows) {
    rows.forEach((row, index) => {
        // 删除当前对象的password属性
        delete row.password;
    });
}

// 查询用户的接口
router.get('/find', modifyResponseTimeFormat.modifyResponseTimeFormat, async (req, res) => {
    try {
        const { username } = req.query;
        const connection = await db.getConnection();
        if (!username) {
            const sql = 'SELECT * FROM internalusers';
            let [rows] = await connection.query(sql);
            removePasswordFromRows(rows);
            connection.release();
            return res.status(200).json({ message: '查询成功', code: 200, data: rows }); // 将查询结果以JSON格式返回
        }
        const findUserQuery = 'SELECT * FROM internalusers WHERE username = ?';
        let [rows] = await connection.query(findUserQuery, [username]);
        if (rows.length > 0) {
            // 找到了用户，返回用户信息
            removePasswordFromRows(rows);
            res.status(200).json({ message: '查询成功', code: 200, data: rows }); // 假设只返回第一条匹配的记录
        } else {
            // 没有找到用户
            res.status(404).json({ message: '未找到用户' });
        }
        connection.release();
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// 新增用户的接口
router.post('/add', async (req, res) => {
    try {
        const connection = await db.getConnection();
        let { name, username, email, avatar_url } = req.body; // 假设前端传入这些字段
        email = email ? email : null;
        // 查询邮箱已经用户名是否存在
        const findUserQuery = 'SELECT * FROM internalusers WHERE name = ? OR email = ?';
        let [rows] = await connection.query(findUserQuery, [name, email]);
        if (rows.length > 0) {
            res.status(400).json({
                message: '用户名或者邮箱重复',
                code: 400,
            });
            connection.release();
            return;
        }
        // 注意：这里需要对密码进行加密处理，此处省略
        const saltRounds = 10; // 盐的轮数，可以根据需要调整
        const defaultPassword = '666666';
        const passwordToStore = await bcrypt.hash(defaultPassword, saltRounds);
        const createUserQuery = 'INSERT INTO internalusers (name,username,email,password,avatar_url) VALUES (?, ?, ?, ?, ?)';
        await connection.query(createUserQuery, [name, username, email, passwordToStore, avatar_url]);
        connection.release();
        res.status(200).json({ message: '新增成功', code: 200 });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create user' });
    }
});
// 删除用户接口
router.post('/delete', async (req, res) => {
    try {
        const { id } = req.body;
        console.log;
        const connection = await db.getConnection();
        const sql = 'DELETE FROM internalusers WHERE id = ?';
        const [result] = await connection.query(sql, [id]);
        connection.release;
        if (result.affectedRows > 0) {
            res.status(200).json({
                message: '删除成功',
                code: 200,
            });
        }
        if (result.affectedRows === 0) {
            res.status(400).json({
                message: '删除失败',
                code: 400,
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to create user' });
    }
});
// 修改用户接口
router.post('/update', async (req, res) => {
    let connection;
    try {
        let { id, name, username, email } = req.body;
        email = email ? email : null;
        connection = await db.getConnection();
        // 查询原始用户信息，确保id有效
        const originalUserQuery = 'SELECT * FROM internalusers WHERE id = ?';
        let [originalRows] = await connection.query(originalUserQuery, [id]);
        if (originalRows.length === 0) {
            res.status(404).json({
                message: '用户不存在',
                code: 404,
            });
            connection.release();
            return;
        }
        // 构建查询条件，只检查非null的email
        let duplicateCheckQuery = 'SELECT * FROM internalusers WHERE name = ? AND id != ?';
        let duplicateCheckParams = [name, id];
        if (email !== null) {
            duplicateCheckQuery += 'OR (email = ? AND id != ? AND email IS NOT NULL)';
            duplicateCheckParams.push(email, id);
        }
        duplicateCheckQuery += ';';
        // 执行重复检查
        let [duplicateRows] = await connection.query(duplicateCheckQuery, duplicateCheckParams);
        if (duplicateRows.length > 0) {
            res.status(409).json({
                message: '用户名或邮箱已存在',
                code: 409,
            });
            connection.release();
            return;
        }
        // 更新用户信息
        const updateUserQuery = 'UPDATE internalusers SET name = ?, username = ?, email = ? WHERE id = ?';
        await connection.query(updateUserQuery, [name, username, email, id]);
        connection.release();
        res.status(200).json({
            message: '修改成功',
            code: 200,
        });
    } catch (error) {
        console.error('Error occurred during user update:', error);
        res.status(500).json({
            message: '服务器内部错误',
            code: 500,
        });
    } finally {
        connection.release();
    }
});

// 用户登录接口
router.post('/login', async (req, res) => {
    let connection;
    try {
        const { name, password } = req.body;
        connection = await db.getConnection();
        const findUserQuery = 'SELECT * FROM internalusers WHERE name = ?';
        let [rows] = await connection.query(findUserQuery, [name]);
        if (rows.length === 0) {
            return res.status(404).json({ message: '用户不存在' });
        }
        const user = rows[0];
        let hashedPasswordFromDB = user.password;
        const isMatch = await bcrypt.compare(password, hashedPasswordFromDB);
        if (!isMatch) {
            return res.status(401).json({ message: '密码不正确' });
        }
        if (user.is_active == 0) {
            return res.status(200).json({ message: '当前用户已被禁用，请联系管理员' });
        }
        // 找到了用户，返回用户信息
        res.status(200).json({
            success: true,
            code: 200,
            message: '登录成功',
            data: user,
            // 生成 JWT 字符串，三个参数：用户信息对象、加密密钥、配置对象
            token: jwt.sign({ name: user.name, id: user.id }, jwtMiddleware.secretKey, { expiresIn: jwtMiddleware.expiresIn }),
            refresh: jwt.sign({ name: user.name, id: user.id }, jwtMiddleware.secretKey, { expiresIn: jwtMiddleware.expiresInRefresh }),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});
/**
 *
 * @param {*} res
 * @param {*} status
 * @param {*} message
 * @param {*} code
 */
function buildResponse(res, status, message, code) {
    res.status(status).json({
        message,
        code,
    });
}
// 禁止用户登录接口
router.post('/ban', async (req, res) => {
    const { id, is_active } = req.body;
    let connection = await db.getConnection();
    const sql = 'UPDATE internalusers SET is_active = 1 WHERE id = ?';
    const sql1 = 'UPDATE internalusers SET is_active = 0 WHERE id = ?';
    try {
        if (is_active == 1) {
            const [result] = await connection.query(sql, [id]);
            if (result.affectedRows > 0) {
                buildResponse(res, 200, '解除成功', 200);
            }
            return;
        }
        const [result] = await connection.query(sql1, [id]);
        if (result.affectedRows > 0) {
            const userId = id;
            if (clients[userId] && clients[userId].readyState == WebSocket.OPEN) {
                try {
                    clients[userId].send(JSON.stringify({ action: 'logout', reason: '您被管理员强制下线' }));
                    delete clients[userId];
                } catch (error) {
                    console.error(`Error sending message to client ${userId}:`, error);
                }
            }
            buildResponse(res, 200, '禁用成功', 200);
        }
    } finally {
        connection.release();
    }
});

// 刷新token
router.post('/refresh', async (req, res) => {
    try {
        const { refresh } = req.body;
        if (!refresh) {
            return res.status(200).json({ message: 'refresh token 不存在' });
        }
        jwt.verify(refresh, jwtMiddleware.secretKey, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: '令牌失效，请重新登录' });
            }
            const token = jwt.sign({ name: decoded.name, id: decoded.id }, jwtMiddleware.secretKey, { expiresIn: jwtMiddleware.expiresIn });
            const refresh = jwt.sign({ name: decoded.name, id: decoded.id }, jwtMiddleware.secretKey, { expiresIn: jwtMiddleware.expiresInRefresh });
            res.status(200).json({
                success: true,
                code: 200,
                message: 'token 刷新成功',
                token,
                refresh,
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'token 内部错误' });
    }
});

module.exports = router;
