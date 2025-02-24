### 搭建一个简单的随机图片API，支持Docker部署

### 更新

#### 2025.02.23

### 特性

- 图片随机展示
- 设备适配：通过检测用户代理字符串，判断访问设备是手机还是电脑，并根据设备类型选择对应的图片文件夹路径。
- 图片格式支持：web,jpg,jpeg,png,gif

### 使用方法

1. 克隆本项目
```bash
git clone https://github.com/meimolihan/random-pic-api.git
```

2. 进入项目
```bash
cd random-pic-api
```

3. 运行容器
```bash
docker-compose up -d
```

4. 本地看效果
* 自适应随机壁纸：http://localhost:8588
* 横屏随机壁纸：http://localhost:8588/pc
* 竖屏随机壁纸：http://localhost:8588/mobile


### 使用docker镜像离线包

* 下载 `neixin/random-pic-api` 离线包
```bash
wget -c -O ~/random-pic-api-amd64.tar.gz https://github.com/meimolihan/DockerTarBuilder/releases/download/DockerTarBuilder-AMD64/neixin_random-pic-api-amd64.tar.gz
```

* 加载本地镜像
```bash
docker load -i ~/random-pic-api-amd64.tar.gz
```

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

### 感谢作者 [Nei-Xin](https://github.com/Nei-Xin/random-pic-api)

我又做出了自己的修改
