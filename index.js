const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
// // 使用cors中间件，允许所有来源的跨域请求
// app.use(cors());
// 引入 path
const path = require('path');
const db = require('./db/db'); // 导入数据库连接模块
const jwtMiddleware = require('./middleware/jwt');
const usersRouter = require('./routes/internalusers');

const upload = require('./routes/upload');
// 设置静态文件目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const port = process.env.PORT || 3000;
//  使用body-parser中间件
app.use(bodyParser.json()); // 解析JSON格式的请求体
app.use(bodyParser.urlencoded({ extended: false })); // 解析URL编码的数据
app.use(jwtMiddleware.jwtMiddleware);
// 使用用户路由
app.use('/api/internalusers', usersRouter);
app.use('/api/upload', upload);
app.listen(port, () => console.log(`启动成功端口：${port}`));
/**
 * 获取用户列表
 */
app.get('/api/user', async (req, res) => {
    const userId = req.query.id;
    const connection = await db.getConnection();
    if (!userId) {
        const sql = 'SELECT * FROM users';
        const [rows] = await connection.query(sql);
        res.status(200).send(rows); // 将查询结果以JSON格式返回
    } else {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const [rows] = await connection.query(sql, [userId]);
        console.log(rows, 'rows');
        res.status(200).send(rows); // 将查询结果以JSON格式返回
    }
    connection.release(); // 查询完毕后释放连接
});
/**
 * 添加用户
 */
app.post('/api/add', async (req, res) => {
    if (req.body && req.body.name && req.body.age) {
        const issuccess = await addUser(req.body);
        if (issuccess) {
            res.status(200).send('添加成功');
        } else {
            res.status(400).send('添加失败');
        }
    } else {
        res.status(400).send('参数错误');
    }
});
/**
 * 新增用户
 * @param {name, age} body
 * @returns
 */
async function addUser(body) {
    const connection = await db.getConnection();
    const { name, age } = body;
    const sql = 'INSERT INTO users (name, age) VALUES (?, ?)';
    const [result] = await connection.query(sql, [name, age]);
    connection.release(); // 查询完毕后释放连接
    return result;
}
/**
 *
 * 获取菜单
 */
const getMuenus = async () => {
    const connection = await db.getConnection();
    // 查询所有根菜单项（即 parent_id 为 NULL 的项）
    let [rootMenus] = await connection.query('SELECT * FROM menus WHERE parent_id IS NULL');
    rootMenus = rootMenus.map(menu => {
        menu.parent_id = 0;
        return menu;
    });
    // 递归函数，用于构建子菜单
    async function buildSubMenus(menus) {
        const subMenusPromises = menus.map(async menu => {
            // 查询子菜单项
            const [subMenus] = await connection.query('SELECT * FROM menus WHERE parent_id = ?', [menu.id]);
            // 递归构建子菜单树
            if (subMenus.length > 0) {
                menu.children = await buildSubMenus(subMenus);
            }
            return menu;
        });
        // 等待所有子菜单项构建完成
        return Promise.all(subMenusPromises);
    }
    // 构建根菜单的子菜单树
    const menuTree = await buildSubMenus(rootMenus);
    connection.release(); // 查询完毕后释放连接
    return menuTree;
};
// 查询菜单
app.get('/api/menus', async (req, res) => {
    try {
        const issuccess = await getMuenus();
        if (issuccess) {
            res.status(200).json({ message: '获取成功', data: issuccess, code: 200 });
        } else {
            res.status(200).json('获取失败');
        }
    } catch {
        res.status(400).json({
            message: '获取失败',
            error: '服务器错误',
        });
    }
});

async function addMenu(body) {
    let connection;
    try {
        connection = await db.getConnection();
        let { name, url, parent_id } = body;
        parent_id = parent_id ? parent_id : null;
        console.log(name, url, parent_id, 'name, url, parent_id');
        const sql = 'INSERT INTO menus (name, url, parent_id) VALUES (?, ?, ?)';
        const [result] = await connection.query(sql, [name, url, parent_id]);
        connection.release(); // 查询完毕后释放连接
        return result;
    } catch (error) {
        console.error('添加菜单失败:', error);
    }
}

// 创建菜单
app.post('/api/addmenu', async (req, res) => {
    if (req.body && req.body.name && (req.body.parent_id || req.body.parent_id == 0)) {
        const issuccess = await addMenu(req.body);
        if (issuccess) {
            res.status(200).json({
                message: '添加成功',
                code: 200,
            });
        } else {
            console.log(issuccess);
            res.status(400).send('添加失败');
        }
    } else {
        res.status(400).send('参数错误');
    }
});
// 删除菜单
app.post('/api/deletemenu', async (req, res) => {
    const id = req.body.id;
    const connection = await db.getConnection();
    const sql = 'DELETE FROM menus WHERE id = ?';
    const [result] = await connection.query(sql, [id]);
    connection.release(); // 查询完毕后释放连接
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
});
// 更新菜单
app.post('/api/updatemenu', async (req, res) => {
    try {
        let { id, name, parent_id, url } = req.body;
        parent_id = parent_id ? parent_id : null;
        const connection = await db.getConnection();
        const sql = 'UPDATE menus SET name = ?,url = ?, parent_id = ? WHERE id = ?';
        const [result] = await connection.query(sql, [name, url, parent_id, id]);
        connection.release();
        if (result.affectedRows > 0) {
            res.status(200).json({
                message: '更新成功',
                code: 200,
            });
        }
        if (result.affectedRows === 0) {
            res.status(400).json({
                message: '更新失败',
                code: 400,
            });
        }
    } catch (error) {
        console.error('更新菜单失败:', error);
    }
});
