<?php
// 定义常量存储图片路径，提高代码可维护性
const PC_IMAGE_DIR = 'landscape';
const MOBILE_IMAGE_DIR = 'portrait';
// 日志文件路径
const ERROR_LOG_FILE = __DIR__ . '/error.log';

// 支持的图片文件扩展名
const SUPPORTED_IMAGE_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'gif'];

// 文件扩展名与 Content-Type 的映射关系
const CONTENT_TYPE_MAP = [
    'webp' => 'image/webp',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
];

// 错误响应函数，用于统一处理错误
function throwErrorResponse(int $code, string $message): void {
    http_response_code($code);
    // 记录错误日志到指定文件
    error_log("[" . date('Y-m-d H:i:s') . "] Error $code: $message\n", 3, ERROR_LOG_FILE);
    exit($message);
}

// 从目录中获取图片列表的函数
function getImagesFromDir(string $path): array {
    // 若目录不存在，直接返回空数组
    if (!is_dir($path)) {
        return [];
    }
    $files = [];
    foreach (SUPPORTED_IMAGE_EXTENSIONS as $ext) {
        $pattern = $path . "/*." . $ext;
        $files = array_merge($files, glob($pattern));
    }
    // 获取文件名
    return array_map('basename', $files);
}

// 生成完整图片路径的函数
function generateImagePath(string $path, string $img): string {
    // 去除路径末尾和文件名开头的斜杠，确保路径格式正确
    return rtrim($path, '/') . '/' . ltrim($img, '/');
}

// 检测用户设备是否为移动设备的函数
function isMobileDevice(): bool {
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    return preg_match('/(android|iphone|ipad|ipod|blackberry|windows phone)|mobile/i', $userAgent);
}

// 根据设备类型选择图片目录
$imageDir = isMobileDevice() ? MOBILE_IMAGE_DIR : PC_IMAGE_DIR;

// 获取图片列表
$imageList = getImagesFromDir($imageDir);

// 若图片列表为空，返回 404 错误并终止脚本
if (empty($imageList)) {
    throwErrorResponse(404, 'No images found.');
}

// 随机选择一张图片，使用 array_rand 替代 shuffle 提高效率
$randomImage = $imageList[array_rand($imageList)];

// 获取图片的文件扩展名并转换为小写
$imageExtension = strtolower(pathinfo($randomImage, PATHINFO_EXTENSION));

// 根据文件扩展名获取对应的 Content-Type，若不匹配则使用默认值
$contentType = CONTENT_TYPE_MAP[$imageExtension] ?? 'application/octet-stream';

// 设置响应头的 Content-Type
header("Content-Type: $contentType");

// 添加缓存控制头信息，缓存 1 小时
$cacheExpiration = 3600;
header("Cache-Control: max-age=$cacheExpiration");
header("Expires: " . gmdate('D, d M Y H:i:s', time() + $cacheExpiration) . ' GMT');

// 生成完整的图片路径
$fullImagePath = generateImagePath($imageDir, $randomImage);

// 检查图片文件是否存在
if (!file_exists($fullImagePath)) {
    throwErrorResponse(404, 'Image not found.');
}

// 输出图片内容
if (!readfile($fullImagePath)) {
    throwErrorResponse(500, 'Error reading image file.');
}
?>