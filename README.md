### 搭建一个简单的随机图片API，支持Docker部署

### 更新

#### 2025.02.23

##### 新增

- /pc路径，显示横屏图片，例如：[https://api.neix.in/random/pc](https://api.neix.in/random/pc)

![https://api.neix.in/random/pc](https://api.neix.in/random/pc)

- /mobile路径，显示竖屏图片，例如：[https://api.neix.in/random/mobile](https://api.neix.in/random/mobile)

![https://api.neix.in/random/mobile](https://api.neix.in/random/mobile)

- 镜像大小减小了

#### 简介

随机图片 API 是一种允许开发者从一个图片库或者指定的目录中获取随机图片的接口。这种 API 通常用于网站、移动应用程序或其他软件中，以便动态地展示随机图片，例如用作背景图片、占位图、或者其他需要随机化内容的场景。

### 在线体验

[https://api.neix.in/random](https://api.zzii.de/random)

![https://api.neix.in/random](https://api.neix.in/random)

### 特性

- 图片随机展示
- 设备适配：通过检测用户代理字符串，判断访问设备是手机还是电脑，并根据设备类型选择对应的图片文件夹路径。
- 图片格式支持：web,jpg,jpeg,png,gif

### 部署

#### docker-compose.yml

```yml
services:
   random-api:
      container_name: random-api
      image: neixin/random-pic-api
      volumes:
         - ./portrait:/var/www/html/portrait # 竖屏图片
         - ./landscape:/var/www/html/landscape # 横屏图片
      ports:
         - 8588:80
   php_app:
      build: .
      container_name: php_app
      volumes:
         - ./:/var/www/html
      ports:
         - 8586:80
      depends_on:
         - random-api
```

* **本地访问测试：<http://localhost:8588/index.php>**

### 图片处理

#### 代码

```py
from PIL import Image
import os

# 检查图片方向
def get_image_orientation(image_path):
    with Image.open(image_path) as img:
        width, height = img.size
        return "landscape" if width > height else "portrait"

# 转换图片为 WebP 格式
def convert_to_webp(image_path, output_folder, max_pixels=178956970):
    try:
        with Image.open(image_path) as img:
            # Check image size
            width, height = img.size
            if width * height > max_pixels:
                print(f"Skipping {image_path} because it exceeds the size limit.")
                return
            
            # Save the image as WebP
            output_path = os.path.join(output_folder, os.path.splitext(os.path.basename(image_path))[0] + ".webp")
            img.save(output_path, "webp")
    except Exception as e:
        print(f"Failed to convert {image_path}: {e}")

# 遍历文件夹中的图片
def process_images(input_folder, output_folder_landscape, output_folder_portrait):
    for filename in os.listdir(input_folder):
        if filename.endswith(('.jpg', '.jpeg', '.png')):
            image_path = os.path.join(input_folder, filename)
            orientation = get_image_orientation(image_path)
            try:
                if orientation == "landscape":
                    convert_to_webp(image_path, output_folder_landscape)
                else:
                    convert_to_webp(image_path, output_folder_portrait)
            except Exception as e:
                print(f"Error processing {image_path}: {e}. Skipping this image.")

# 指定输入和输出文件夹
input_folder = "./photos"
output_folder_landscape = "./landscape"
output_folder_portrait = "./portrait"

# 执行转换
process_images(input_folder, output_folder_landscape, output_folder_portrait)
```

#### 作用

将横屏和竖屏的图片分开，并转化为webp格式，使用时注意修改文件路径

* **目录结构**

```
.
├── classify.py
├── landscape # 整理出的横屏壁纸目录
│   ├── test1.webp
│   ├── test2.webp
│   └── test3.webp
├── photos # 未整理的图片目录
│   ├── test1.jpg
│   ├── test2.jpg
│   ├── test3.jpg
│   ├── test4.jpg
│   ├── test5.jpg
│   └── test6.jpg
└── portrait # 整理出的竖屏壁纸目录
    ├── test4.webp
    ├── test5.webp
    └── test6.webp
```

### 配置 nginx
```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name api.example.com;

    ssl_certificate /etc/nginx/keyfile/cert.pem;  
    ssl_certificate_key /etc/nginx/keyfile/key.pem;  
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:8588; 
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $http_host;
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;
        proxy_redirect off;
        proxy_buffering on;
        proxy_http_version 1.1;
    }
        charset utf-8;
        error_page 404 500 502 503 504 /50x.html;
        location = /50x.html {
            root   /var/www/html;
    }
}
```
