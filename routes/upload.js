// 引入express
const express = require('express');
const router = express.Router();
const multer = require('multer');
const tokenGetUserid = require('../middleware/tokenGetUserid');
// 引入db
const db = require('../db/db');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 获取当前文件的绝对路径
        const currentDir = __dirname;
        // 计算上两层目录的绝对路径
        const parentDir = path.resolve(currentDir, '..');
        // 结合上两层目录和uploads子目录作为存储路径
        const uploadPath = path.join(parentDir, 'uploads');

        // 确保uploads目录存在，并且Express有权限写入
        // 注意：这里仅示例代码，实际应用中你可能需要添加目录检查和创建逻辑
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // 生成文件名，避免重名
    },
});

const upload = multer({ storage: storage });
router.post('/uploadFile', tokenGetUserid, upload.single('file'), async (req, res) => {
    try {
        const avatarPath = req.file.filename;
        // 是谁操作的
        const userId = req.user.id;
        // 要修改的用户id
        const id = req.body.id;
        // 存入数据库中
        await saveAvatarToDatabase(userId, avatarPath, id);

        // 这里需要将avatarPath存储到数据库中，稍后会详细介绍
        res.status(200).json({
            data: {
                avatarPath: avatarPath,
            },
            code: 200,
            success: true,
            message: '上传成功！',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed.' });
    }
});
const saveAvatarToDatabase = async (userId, avatarPath, id) => {
    try {
        //存在的用户更新图片
        const [result] = await db.query('UPDATE internalusers SET avatar_url = ? WHERE id = ?', [avatarPath, id]);
        // 如果更新成功
        if (result.affectedRows > 0) {
            // res.status(200).json({ code: 200, success: true, message: '上传成功！' });
        } else if (result.affectedRows === 0) {
            throw new Error('No user found with the provided ID.');
        }
    } catch (error) {
        console.error(error);
        return false;
    }
};
router.get('/uploads/:imageName', async (req, res) => {
    try {
        const imageName = req.params.imageName; // 获取图片名或ID
        // 假设你有一个函数从数据库获取图片的实际路径
        const imagePath = await getImagePathFromDB(imageName);
        if (!imagePath) {
            return res.status(404).send('Image not found');
        }
        // 使用res.sendFile()发送图片文件到前端
        res.sendFile(imagePath, { root: __dirname }, err => {
            if (err) {
                console.error(err);
                res.status(500).send('Error retrieving the image.');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving the image from the database.');
    }
});

const getImagePathFromDB = async imageName => {
    try {
        // 查询数据库，根据imageName获取图片路径
        const [rows] = await db.query('SELECT path FROM internalusers WHERE avatar_url = ?', [imageName]);
        if (rows.length > 0) {
            // 返回第一条匹配的结果，假设imageName是唯一的
            return rows[0].path;
        } else {
            // 如果没有找到对应图片，返回null或抛出错误，根据需求选择
            return null;
            // 或者 throw new Error('Image not found in the database.');
        }
    } catch (error) {
        console.error('Error querying the database:', error);
        throw error;
    }
};
module.exports = router;
