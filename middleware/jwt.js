// const jwt = require('jsonwebtoken');

const expressJWT = require('jsonwebtoken');
const secretKey = '123456'; // secret 密钥
// token 过期时间（自定义）
const expiresIn = '12h';
// refresh token 过期时间（自定义）
const expiresInRefresh = '24h';
// 创建JWT中间件
const jwtMiddleware = (req, res, next) => {
    // 排除的路由数组
    const excludedRoutes = ['/api/internalusers/login', '/api/internalusers/refresh'];
    // 检查请求是否在排除路由之列
    if (excludedRoutes.includes(req.path)) {
        next(); // 跳过Token验证
    } else {
        // 获取Token
        const token = req.headers['authorization'];
        if (token) {
            expressJWT.verify(token, secretKey, (err, decoded) => {
                if (err) {
                    res.status(200).json({ message: 'token过期了', code: 401 });
                } else {
                    req.decoded = decoded;
                    next(); // 验证通过，继续
                }
            });
        } else {
            res.status(200).json({ message: '无token', code: 400 });
        }
    }
};
module.exports = { jwtMiddleware, expiresIn, secretKey, expiresInRefresh };
//export default jwtMiddleware;
