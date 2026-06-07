/**
 * 讯飞星火 API 配置
 *
 * 配置从环境变量读取，确保敏感信息不会提交到代码仓库
 * Vite 环境变量注意：
 * - 必须以 VITE_ 前缀命名才能在浏览器中访问
 * - .env 文件中的变量会自动被 Vite 识别
 */

// 从环境变量获取配置（仅支持 Vite 的 import.meta.env）
const getEnv = (key, defaultValue = "") => {
  // Vite 环境变量前缀为 VITE_
  const viteKey = `VITE_${key}`;
  return import.meta.env[viteKey] || defaultValue;
};

export const XFYUN_CONFIG = {
  // ============================================
  // 实时语音转写（RTASR）配置
  // ============================================
  // 应用 ID
  appId: getEnv("XFYUN_APPID"),

  // API Key
  accessKeyId: getEnv("XFYUN_ACCESSKEYID"),

  // API Secret
  accessKeySecret: getEnv("XFYUN_ACCESSKEYSECRET"),

  // 默认语言（autodialect: 中英+202种方言，autominor: 37种语种）
  defaultLang: getEnv("XFYUN_DEFAULT_LANG", "autodialect"),

  // 音频采样率
  sampleRate: parseInt(getEnv("XFYUN_SAMPLERATE", "16000")),

  // 音频编码格式
  audioEncode: getEnv("XFYUN_AUDIOENCODE", "pcm_s16le"),
};

// 检查是否已配置
export const hasXFYUNConfig = () => {
  return (
    XFYUN_CONFIG.appId &&
    XFYUN_CONFIG.accessKeyId &&
    XFYUN_CONFIG.accessKeySecret
  );
};
