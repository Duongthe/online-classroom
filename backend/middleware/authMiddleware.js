const jwt = require('jsonwebtoken');

// 1. Kiểm tra xem người dùng đã đăng nhập chưa (có Token hợp lệ không)
exports.verifyToken = (req, res, next) => {
    // Lấy token từ header của request
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Từ chối truy cập! Không tìm thấy Token.' });

    try {
        // Token thường có dạng "Bearer <chuỗi_token>", ta cần cắt bỏ chữ Bearer đi
        const token = authHeader.replace('Bearer ', '');
        
        // Giải mã token để lấy thông tin user (id, role)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin này vào req để các bước sau sử dụng
        next(); // Cho phép đi tiếp vào Controller
    } catch (error) {
        res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// 2. Phân quyền (Chỉ cho phép những Role nhất định được đi tiếp)
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Quyền truy cập bị từ chối! Bạn là ${req.user.role} nên không thể dùng chức năng này.` 
            });
        }
        next();
    };
};