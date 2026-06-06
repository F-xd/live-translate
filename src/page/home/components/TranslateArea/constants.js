// 语言选项配置
export const LANGUAGE_OPTIONS = [
    { code: 'zh-CN', label: '中文', name: 'Chinese' },
    { code: 'en-US', label: 'English', name: 'English' },
    { code: 'ja-JP', label: '日本語', name: 'Japanese' },
    { code: 'ko-KR', label: '한국어', name: 'Korean' },
    { code: 'fr-FR', label: 'Français', name: 'French' },
    { code: 'de-DE', label: 'Deutsch', name: 'German' },
    { code: 'es-ES', label: 'Español', name: 'Spanish' },
    { code: 'ru-RU', label: 'русский', name: 'Russian' },
];

// 默认语言设置
export const DEFAULT_SOURCE_LANGUAGE = 'zh-CN';
export const DEFAULT_TARGET_LANGUAGE = 'en-US';

// 滚动配置
export const SCROLL_CONFIG = {
    bottomThreshold: 100, // 距离底部多少像素内认为是在底部
};

// 消息类型
export const MESSAGE_TYPES = {
    USER: 'user',
    TRANSLATED: 'translated',
    ERROR: 'error',
};

// 语音识别错误消息映射
export const RECOGNITION_ERROR_MESSAGES = {
    'not-allowed': '请允许麦克风访问权限',
    'no-speech': '未检测到语音输入，请继续说话',
    'network': '网络错误，请检查网络连接',
    'aborted': '语音识别已停止',
};
