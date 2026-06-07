/**
 * 讯飞星火 API 配置
 *
 * 使用前请前往讯飞开放平台获取：
 * https://console.xfyun.cn/services/new_rta
 */
export const XFYUN_CONFIG = {
  // ============================================
  // 实时语音转写（RTASR）配置
  // ============================================
  // 应用 ID
  appId: "e6a4bcb6",

  // API Key
  accessKeyId: "60c8f30d5ad658640c23f59295b94f59",

  // API Secret
  accessKeySecret: "MjQ4ZjcyOGUxMTAwYTg3ZGY5MjQ0ZmE3",

  // 默认语言（autodialect: 中英+202种方言，autominor: 37种语种）
  defaultLang: "autodialect",

  // 音频采样率
  sampleRate: 16000,

  // 音频编码格式
  audioEncode: "pcm_s16le",

  // ============================================
  // 机器翻译（niutrans）配置
  // https://www.xfyun.cn/doc/nlp/niutrans/API.html
  // ============================================
  // 翻译 API Key（32位字符串，在控制台机器翻译页面获取）
  translateApiKey: "60c8f30d5ad658640c23f59295b94f59",

  // 翻译 API Secret（在控制台机器翻译页面获取）
  translateApiSecret: "MjQ4ZjcyOGUxMTAwYTg3ZGY5MjQ0ZmE3",

  // 翻译 API 地址
  translateUrl: "https://ntrans.xfyun.cn/v2/ots",
};
