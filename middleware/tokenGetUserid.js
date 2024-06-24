const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader;
    if (token == null) return res.sendStatus(401); // 如果没有Token，则返回401 Unauthorized
    jwt.verify(token, '123456', (err, user) => {
        // 使用你的JWT密钥替换'your_jwt_secret_key_here'
        if (err) return res.sendStatus(403); // 如果Token无效，则返回403 Forbidden
        req.user = user; // 将解码后的用户信息（包含userId）挂载到req上
        next(); // Token有效，继续处理请求
    });
};
module.exports = authenticateToken;
