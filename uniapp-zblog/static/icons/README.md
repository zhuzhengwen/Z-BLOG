# App 图标生成说明

源文件：`../logo.svg`（1024x1024 矢量图）

## 需要生成的尺寸

| 文件名          | 尺寸     | 用途            |
|----------------|----------|----------------|
| icon-40.png    | 40x40    | iOS 20x2       |
| icon-48.png    | 48x48    | Android mdpi   |
| icon-58.png    | 58x58    | iOS 29x2       |
| icon-60.png    | 60x60    | iOS 20x3       |
| icon-72.png    | 72x72    | Android hdpi   |
| icon-80.png    | 80x80    | iOS 40x2       |
| icon-87.png    | 87x87    | iOS 29x3       |
| icon-96.png    | 96x96    | Android xhdpi  |
| icon-120.png   | 120x120  | iOS 40x3/60x2  |
| icon-144.png   | 144x144  | Android xxhdpi |
| icon-180.png   | 180x180  | iOS 60x3       |
| icon-192.png   | 192x192  | Android xxxhdpi|
| icon-1024.png  | 1024x1024| iOS App Store  |

## 快速生成方式（推荐）

### 方式一：HBuilderX 自动生成
1. 打开 HBuilderX → manifest.json → 可视化界面
2. 点击「App 图标」→「浏览」选择 `static/logo.svg`
3. 点击「自动生成所有图标尺寸」

### 方式二：在线工具
上传 `logo.svg` 到以下任意网站自动生成：
- https://www.appicon.co（推荐，支持 Android+iOS）
- https://makeappicon.com

### 方式三：命令行（需安装 Inkscape 或 ImageMagick）
```bash
# ImageMagick
for size in 40 48 58 60 72 80 87 96 120 144 180 192 1024; do
  magick ../logo.svg -resize ${size}x${size} icon-${size}.png
done
```
