/**
 * 讯飞星火实时语音转写 API 签名生成工具
 * 完全移植自Demo实现
 */

/**
 * 生成UUID（不带连字符，32位）
 */
export function generateUUID() {
  return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    return r.toString(16);
  });
}

/**
 * 生成UTC时间格式：yyyy-MM-dd'T'HH:mm:ss+0800
 */
export function generateUTC() {
  const now = new Date();
  const offset = "+0800";
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

/**
 * URL编码（兼容浏览器）
 */
export function urlEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

/**
 * 生成HMAC-SHA1签名
 */
export async function generateHmacSignature(baseStr, key) {
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const dataBuffer = encoder.encode(baseStr);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * 生成鉴权参数（完全按照Demo实现）
 */
export async function generateAuthParams(config) {
  const {
    appId,
    accessKeyId,
    accessKeySecret,
    lang = "autodialect",
    audioEncode = "pcm_s16le",
    samplerate = 16000,
  } = config;

  // 固定参数配置（与Demo完全一致）
  const FIXED_PARAMS = {
    audio_encode: audioEncode,
    lang: lang,
    samplerate: String(samplerate),
  };

  // 构建参数对象（与Demo完全一致）
  const authParams = {
    accessKeyId: accessKeyId,
    appId: appId,
    uuid: generateUUID(),
    utc: generateUTC(),
    ...FIXED_PARAMS,
  };

  // 过滤空值并按字典序排序
  const sortedParams = Object.keys(authParams)
    .filter(
      (k) => authParams[k] !== null && String(authParams[k]).trim() !== "",
    )
    .sort()
    .reduce((acc, k) => {
      acc[k] = authParams[k];
      return acc;
    }, {});

  // 拼接基础字符串
  const baseStr = Object.keys(sortedParams)
    .map((k) => `${urlEncode(k)}=${urlEncode(sortedParams[k])}`)
    .join("&");

  // 生成签名
  const signature = await generateHmacSignature(baseStr, accessKeySecret);
  authParams.signature = signature;

  return authParams;
}

/**
 * 构建 WebSocket URL（完全按照Demo实现）
 */
export async function buildWsUrl(config) {
  const authParams = await generateAuthParams(config);

  // 构建URL参数字符串（与Demo完全一致）
  const paramsStr = Object.keys(authParams)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(authParams[k])}`)
    .join("&");

  const fullWsUrl = `wss://office-api-ast-dx.iflyaisol.com/ast/communicate/v1?${paramsStr}`;
  console.log(`【连接信息】完整URL：${fullWsUrl}`);

  return fullWsUrl;
}
