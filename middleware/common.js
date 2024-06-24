function convertTimeFormat(originalTime) {
    const date = new Date(originalTime);
    return `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)} ${('0' + date.getHours()).slice(
        -2
    )}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}`;
}
/**
 * 修改响应中的时间格式。
 * 该中间件用于处理响应中的JSON数据，特别是对其中的created_at和updated_at字段进行时间格式转换。
 * 它确保了前端接收到的时间格式一致，便于前端处理和展示。
 *
 * @param {Object} req 请求对象。
 * @param {Object} res 响应对象。
 * @param {Function} next 中间件的下一个函数。
 */
const modifyResponseTimeFormat = (req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json;
    // 重写res.json方法
    res.json = function (data) {
        if (Array.isArray(data.data) && data.data.length > 0) {
            data.data.forEach(item => {
                if (item && item.created_at) {
                    item.created_at = convertTimeFormat(item.created_at);
                }
                if (item && item.updated_at) {
                    item.updated_at = convertTimeFormat(item.updated_at);
                }
            });
        }
        // 调用原始的res.json方法发送处理后的数据
        originalJson.call(this, data);
    };

    // 继续处理后续中间件或路由
    next();
};
module.exports = {
    modifyResponseTimeFormat,
};
