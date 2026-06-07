/**
 * 讯飞翻译后端服务
 * 运行方式: node server.js
 * 端口: 3000
 */

const http = require("http");
const https = require("https");
const CryptoJS = require("crypto-js");
const path = require("path");

// 从项目根目录加载环境变量
try {
  const dotenv = require("dotenv");
  const envPath = path.join(__dirname, "..", ".env");
  console.log("【调试】尝试加载环境变量:", envPath);

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn("【警告】无法加载 .env 文件:", result.error.message);
  } else {
    console.log("【环境变量】已从", envPath, "加载配置");
    console.log(
      "【调试】VITE_XFYUN_APPID:",
      process.env.VITE_XFYUN_APPID ? "已设置" : "未设置",
    );
    console.log(
      "【调试】VITE_XFYUN_ACCESSKEYID:",
      process.env.VITE_XFYUN_ACCESSKEYID ? "已设置" : "未设置",
    );
  }
} catch (e) {
  console.warn("【警告】未安装 dotenv，将使用系统环境变量");
}

// 从环境变量获取配置（支持 VITE_ 前缀和无前缀两种格式）
const getEnv = (key, defaultValue = "") => {
  return process.env[`VITE_${key}`] || process.env[key] || defaultValue;
};

// 讯飞API配置（从环境变量读取）
const config = {
  hostUrl: "https://ntrans.xfyun.cn/v2/ots",
  host: "ntrans.xfyun.cn",
  appid: getEnv("XFYUN_APPID", "your_appid_here"),
  apiSecret: getEnv("XFYUN_ACCESSKEYSECRET", "your_accesskeysecret_here"),
  apiKey: getEnv("XFYUN_ACCESSKEYID", "your_accesskeyid_here"),
  uri: "/v2/ots",
};

// 端口配置（从环境变量读取，默认3000）
const PORT = getEnv("SERVICE_PORT", "3000");

console.log("【配置】appid:", config.appid);
console.log("【配置】apiKey:", config.apiKey);
console.log("【配置】apiSecret:", config.apiSecret ? "已设置" : "未设置");

/**
 * 生成请求body
 */
function getPostBody(text, from, to) {
  return {
    common: { app_id: config.appid },
    business: { from: from, to: to },
    data: {
      text: CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text)),
    },
  };
}

/**
 * 请求获取请求体签名
 */
function getDigest(body) {
  return (
    "SHA-256=" +
    CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(body)))
  );
}

/**
 * 鉴权签名
 */
function getAuthStr(date, digest) {
  let signatureOrigin = `host: ${config.host}\ndate: ${date}\nPOST ${config.uri} HTTP/1.1\ndigest: ${digest}`;
  let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret);
  let signature = CryptoJS.enc.Base64.stringify(signatureSha);
  let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`;
  return authorizationOrigin;
}

/**
 * 调用讯飞翻译API
 */
function callTranslateAPI(text, from, to) {
  return new Promise((resolve, reject) => {
    const date = new Date().toUTCString();
    const postBody = getPostBody(text, from, to);
    const digest = getDigest(postBody);
    const authStr = getAuthStr(date, digest);

    const bodyStr = JSON.stringify(postBody);

    const options = {
      hostname: config.host,
      port: 443,
      path: config.uri,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json,version=1.0",
        Host: config.host,
        Date: date,
        Digest: digest,
        Authorization: authStr,
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    };

    console.log("【翻译请求】", { text, from, to, date });

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const result = JSON.parse(data);
          console.log("【翻译响应】", result);
          resolve(result);
        } catch (e) {
          reject(new Error("解析响应失败: " + e.message));
        }
      });
    });

    req.on("error", (e) => {
      reject(new Error("请求失败: " + e.message));
    });

    req.write(bodyStr);
    req.end();
  });
}

/**
 * 创建HTTP服务器
 */
const server = http.createServer(async (req, res) => {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 处理预检请求
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 处理翻译请求
  if (req.method === "POST" && req.url === "/api/translate") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { text, from, to } = JSON.parse(body);

        if (!text || !from || !to) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "缺少必要参数" }));
          return;
        }

        const result = await callTranslateAPI(text, from, to);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error("【翻译错误】", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });

    return;
  }

  // 健康检查
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "translate-service" }));
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`翻译服务已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`翻译接口: POST http://localhost:${PORT}/api/translate`);
  console.log(`========================================`);
});
