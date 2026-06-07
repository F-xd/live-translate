/**
 * 讯飞机器翻译 API 工具
 * 通过后端服务调用，避免 CORS 和签名问题
 */
// 后端服务地址
const SERVICE_URL = "http://localhost:3000";

/**
 * 翻译文本
 * @param {string} text - 待翻译文本
 * @param {string} fromLang - 源语言代码
 * @param {string} toLang - 目标语言代码
 * @returns {Promise<object>} 翻译结果
 */
export async function translateText(text, fromLang, toLang) {
  // 语言代码映射：语音识别语言 -> 翻译API语言
  const langMap = {
    'autodialect': 'auto',  // 中英+方言 -> 自动识别
    'autominor': 'auto',    // 37种语种 -> 自动识别
  };

  // 转换语言代码
  const translateFrom = langMap[fromLang] || fromLang;
  const translateTo = langMap[toLang] || toLang;

  console.log("【翻译请求】", { text, from: translateFrom, to: translateTo });

  try {
    const response = await fetch(`${SERVICE_URL}/api/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        from: translateFrom,
        to: translateTo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`翻译请求失败: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log("【翻译响应】", result);

    // 检查返回码
    if (result.code !== 0) {
      throw new Error(`翻译失败: ${result.code} - ${result.message}`);
    }

    return {
      from: result.data.result.from,
      to: result.data.result.to,
      src: result.data.result.trans_result.src,
      dst: result.data.result.trans_result.dst,
      sid: result.sid,
    };
  } catch (error) {
    console.error("【翻译错误】", error);

    // 如果是网络错误，提示启动后端服务
    if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
      throw new Error("无法连接翻译服务，请确保后端服务已启动: cd service && npm install && npm start");
    }

    throw error;
  }
}

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES = [
  { code: "cn", name: "中文" },
  { code: "en", name: "英语" },
  { code: "ja", name: "日语" },
  { code: "ko", name: "韩语" },
  { code: "fr", name: "法语" },
  { code: "de", name: "德语" },
  { code: "es", name: "西班牙语" },
  { code: "ru", name: "俄语" },
  { code: "it", name: "意大利语" },
  { code: "pt", name: "葡萄牙语" },
  { code: "vi", name: "越南语" },
  { code: "th", name: "泰语" },
  { code: "ms", name: "马来语" },
  { code: "id", name: "印尼语" },
  { code: "ar", name: "阿拉伯语" },
];

/**
 * 语种代码到语言名称的映射
 */
export const LANGUAGE_NAMES = {
  cn: "中文",
  en: "英语",
  ja: "日语",
  ko: "韩语",
  fr: "法语",
  de: "德语",
  es: "西班牙语",
  ru: "俄语",
  it: "意大利语",
  pt: "葡萄牙语",
  vi: "越南语",
  th: "泰语",
  ms: "马来语",
  id: "印尼语",
  ar: "阿拉伯语",
};
