<?php
// 定义常量存储图片路径，提高代码可维护性
const PC_PATH = 'landscape';
const MOBILE_PATH = 'portrait';

// 从目录中获取图片列表的函数
function getImagesFromDir(string $path): array {
    // 若目录不存在，直接返回空数组
    if (!is_dir($path)) {
        return [];
    }
    $images = [];
    // 打开目录
    $dirHandle = opendir($path);
    if ($dirHandle === false) {
        return [];
    }
    while (($file = readdir($dirHandle)) !== false) {
        // 过滤隐藏文件，并检查文件是否为指定格式的图片
        if (!str_starts_with($file, '.') && preg_match('/\.(webp|jpg|jpeg|png|gif)$/i', $file)) {
            $images[] = $file;
        }
    }
    // 关闭目录句柄
    closedir($dirHandle);
    return $images;
}

// 生成完整图片路径的函数
function generateImagePath(string $path, string $img): string {
    // 去除路径末尾和文件名开头的斜杠，确保路径格式正确
    return rtrim($path, '/') . '/' . ltrim($img, '/');
}

// 检测用户设备是否为移动设备的函数
function isMobileDevice(): bool {
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    return preg_match('/(android|iphone|ipad|ipod|blackberry|windows phone)/i', $userAgent);
}

// 根据设备类型选择图片目录
$imagePath = isMobileDevice() ? MOBILE_PATH : PC_PATH;

// 获取图片列表
$imgList = getImagesFromDir($imagePath);
// 若图片列表为空，返回 404 错误并终止脚本
if (empty($imgList)) {
    http_response_code(404);
    exit('No images found.');
}

// 随机选择一张图片，使用 array_rand 替代 shuffle 提高效率
$randomImage = $imgList[array_rand($imgList)];

// 获取图片的文件扩展名并转换为小写
$imgExtension = strtolower(pathinfo($randomImage, PATHINFO_EXTENSION));
// 定义文件扩展名与 Content - Type 的映射关系
$contentTypeMap = [
    'webp' => 'image/webp',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
];
// 根据文件扩展名获取对应的 Content - Type，若不匹配则使用默认值
$contentType = $contentTypeMap[$imgExtension] ?? 'application/octet - stream';
// 设置响应头的 Content - Type
header("Content - Type: $contentType");

// 生成完整的图片路径
$fullImagePath = generateImagePath($imagePath, $randomImage);
// 检查图片文件是否存在
if (!file_exists($fullImagePath)) {
    http_response_code(404);
    exit('Image not found.');
}
// 读取并输出图片内容
if (!readfile($fullImagePath)) {
    http_response_code(500);
    exit('Error reading image file.');
}
?>