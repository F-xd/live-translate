# 实时同声传译系统

一个基于 Vue 3 + Vite 构建的实时语音转写与翻译系统，支持多语言实时翻译。

## Demo 视频

[[同声传译助手功能演示_哔哩哔哩_bilibili](https://www.bilibili.com/video/BV1RDE86sEKe/?vd_source=3e1570022839bf2e3a4307034b5edc77)

## 功能特性

- 🎤 **实时语音转写**：使用讯飞星火 RTASR API 实现实时语音识别
- 🌐 **多语言翻译**：支持 15+ 种语言翻译
- 💬 **智能对话界面**：消息气泡展示，支持实时中间结果显示
- 🎯 **智能滚动**：仅在用户处于底部时自动滚动，不打断阅读体验

## 支持语言

**识别语言**：

- 实现了中英自动识别
- 其余语种暂不能识别 (API额外付费功能暂未开启)

**翻译语言**：

- 中文、英语、日语、韩语、法语、德语
- 西班牙语、俄语、意大利语、葡萄牙语
- 越南语、泰语、马来语、印尼语、阿拉伯语

## 技术栈

| 分类      | 技术         | 版本 |
| --------- | ------------ | ---- |
| 前端框架  | Vue          | 3.x  |
| 构建工具  | Vite         | 8.x  |
| UI 组件库 | Element Plus | 2.x  |
| 语言      | JavaScript   | ES6+ |
| 后端服务  | Node.js      | 20+  |

## 第三方库

| 库             | 用途                 |
| -------------- | -------------------- |
| `crypto-js`    | HMAC-SHA256 签名生成 |
| `dotenv`       | 环境变量管理         |
| `element-plus` | UI 组件              |
| `vue`          | 前端框架             |
| `vite`         | 构建工具             |

## 项目结构

```
live-translate/
├── src/                    # 前端源码
│   ├── components/         # 通用组件
│   │   └── Waveform.vue    # 音频波形动画组件
│   ├── config/             # 配置文件
│   │   └── xfyun.js        # 讯飞 API 配置
│   ├── page/               # 页面组件
│   │   └── home/           # 首页
│   │       ├── components/ # 首页子组件
│   │       │   ├── MessageItem.vue      # 消息项组件
│   │       │   └── TranslateArea/       # 翻译区域
│   │       └── Home.vue    # 首页布局
│   ├── utils/              # 工具函数
│   │   ├── xfyun-rtasr.js  # 讯飞 RTASR 客户端
│   │   └── xfyun-translate.js # 翻译工具
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── service/                # 后端服务
│   ├── server.js           # 翻译 API 代理服务
│   └── package.json        # 后端依赖
├── .env                    # 环境变量配置
├── vite.config.js          # Vite 配置
└── package.json            # 前端依赖
```

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm >= 10.0.0

### 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd service && npm install
```

### 配置 API 密钥

编辑 `.env` 文件，填写你的讯飞 API 密钥：

```env
# 讯飞 API 配置
VITE_XFYUN_APPID=your_appid_here
VITE_XFYUN_ACCESSKEYID=your_accesskeyid_here
VITE_XFYUN_ACCESSKEYSECRET=your_accesskeysecret_here
```

### 启动服务

```bash
# 启动后端翻译服务（终端1）
cd service && node server.js

# 启动前端开发服务器（终端2）
npm run dev
```

### 访问地址

- 前端页面：http://localhost:5173
- 后端服务：http://localhost:3000

## 核心功能说明

### 1. 语音识别流程

1. 用户点击"开始同声传译"按钮
2. 持续采集麦克风音频数据
3. 建立 WebSocket 连接到讯飞 RTASR(实时语音识别) 服务
4. 实时发送音频帧到服务器
5. 接收中间识别结果并显示
6. 识别完成后发送翻译请求

### 2. 静音检测

系统会自动检测静音状态，避免发送无效的空音频数据，节省 API 调用次数。

### 3. 智能滚动

- 用户阅读历史消息时，不会自动滚动
- 只有当用户滚动到底部时，新消息才会自动滚动显示
