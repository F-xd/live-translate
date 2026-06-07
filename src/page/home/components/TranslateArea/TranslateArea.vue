<template>
    <div class="chat-area">
        <!-- 翻译内容列表 -->
        <div ref="messageListRef" class="message-list" @scroll="handleScroll">
            <!-- 系统提示 -->
            <div class="system-message" v-if="messages.length === 0 && !currentTranscript">
                <span class="system-icon">🎤</span>
                <p>点击下方按钮开始同声传译</p>
                <p v-if="!hasXFYUNConfig" class="config-tip">请先配置讯飞API密钥</p>
            </div>

            <!-- 消息列表 -->
            <MessageItem v-for="(msg, index) in messages" :key="index" :msg="msg" />

            <!-- 当前正在识别的中间结果 -->
            <MessageItem v-if="currentTranscript" :msg="{ type: 'user', text: currentTranscript, time: '' }"
                :is-talking="true" />
        </div>

        <!-- 操作区 -->
        <div class="operation">
            <div class="operation-content">
                <!-- 语言选择区域 -->
                <div class="language-section">
                    <div class="language-select-wrapper">
                        <label class="language-label">识别语言</label>
                        <ElSelect v-model="sourceLanguage" placeholder="识别语言" size="large" :disabled="isStarted"
                            class="language-select">
                            <ElOption v-for="lang in RECOGNITION_LANGUAGES" :key="lang.code" :label="lang.label"
                                :value="lang.code" />
                        </ElSelect>
                    </div>

                    <span class="arrow-icon">↔</span>

                    <div class="language-select-wrapper">
                        <label class="language-label">翻译语言</label>
                        <ElSelect v-model="targetLanguage" placeholder="翻译语言" size="large" :disabled="isStarted"
                            class="language-select">
                            <ElOption v-for="lang in TRANSLATE_LANGUAGES" :key="lang.code" :label="lang.label"
                                :value="lang.code" />
                        </ElSelect>
                    </div>
                </div>

                <!-- 控制按钮区域 -->
                <div class="control-section">
                    <div class="status-indicator" :class="{ active: isStarted }">
                        <span class="status-dot"></span>
                        <span class="status-text">{{ isStarted ? '正在识别' : '准备就绪' }}</span>
                    </div>

                    <ElButton type="primary" size="large" round class="start-button" :class="{ active: isStarted }"
                        @click="handleStart" :disabled="!hasXFYUNConfig">
                        <ElIcon size="28">
                            <Microphone />
                        </ElIcon>
                        <span v-if="!isStarted">开始同声传译</span>
                        <Waveform v-else />
                    </ElButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue';
import { ElButton } from 'element-plus';
import Waveform from '@/components/Waveform.vue';
import MessageItem from './components/MessageItem.vue';
import { translateText, LANGUAGE_NAMES } from '@/utils/xfyun-translate';
import { SCROLL_CONFIG, MESSAGE_TYPES } from './constants.js';
import RTASRClient from '@/utils/xfyun-rtasr';
import { XFYUN_CONFIG } from '@/config/xfyun';

// 判断是否配置了讯飞API
const hasXFYUNConfig = computed(() => {
    return XFYUN_CONFIG.appId && XFYUN_CONFIG.accessKeyId && XFYUN_CONFIG.accessKeySecret;
});

// 识别语言选项（语音转写支持的语言）
const RECOGNITION_LANGUAGES = [
    { code: 'autodialect', label: '中英+方言' },
];

// 翻译语言选项（翻译API支持的语言）
const TRANSLATE_LANGUAGES = [
    { code: 'cn', label: '中文' },
    { code: 'en', label: '英语' },
    { code: 'ja', label: '日语' },
    { code: 'ko', label: '韩语' },
    { code: 'fr', label: '法语' },
    { code: 'de', label: '德语' },
    { code: 'es', label: '西班牙语' },
    { code: 'ru', label: '俄语' },
    { code: 'it', label: '意大利语' },
    { code: 'pt', label: '葡萄牙语' },
    { code: 'vi', label: '越南语' },
    { code: 'th', label: '泰语' },
    { code: 'ms', label: '马来语' },
    { code: 'id', label: '印尼语' },
    { code: 'ar', label: '阿拉伯语' },
];

// 默认语言
const DEFAULT_SOURCE_LANGUAGE = 'autodialect';
const DEFAULT_TARGET_LANGUAGE = 'cn';

const messageListRef = ref(null);
const messages = ref([]);
const currentTranscript = ref(''); // 当前正在识别的文本（中间结果）
const isStarted = ref(false);

// 是否处于底部状态（用于判断是否需要自动滚动）
const isAtBottom = ref(true);

// 当前选择的识别语言和翻译语言
const sourceLanguage = ref(DEFAULT_SOURCE_LANGUAGE);
const targetLanguage = ref(DEFAULT_TARGET_LANGUAGE);

// RTASR客户端实例
let rtasrClient = null;

// 初始化RTASR客户端
const initRTASRClient = () => {
    if (!hasXFYUNConfig.value) {
        return null;
    }

    return new RTASRClient({
        appId: XFYUN_CONFIG.appId,
        accessKeyId: XFYUN_CONFIG.accessKeyId,
        accessKeySecret: XFYUN_CONFIG.accessKeySecret,
        // lang: sourceLanguage.value,
        samplerate: XFYUN_CONFIG.sampleRate,
        audioEncode: XFYUN_CONFIG.audioEncode,
        onResult: handleRecognitionResult,
        onError: handleRecognitionError,
        onClose: handleConnectionClose,
        onOpen: handleConnectionOpen
    });
};

// 处理识别结果
const handleRecognitionResult = (text, isFinal, rawData) => {
    if (!isFinal) {
        // 中间结果
        currentTranscript.value = text;

        // 中间结果更新时滚动到最新内容
        if (text && isAtBottom.value) {
            scrollToBottom();
        }
    } else {
        // 最终结果
        if (text.trim()) {
            addMessage({
                type: MESSAGE_TYPES.USER,
                text: text.trim(),
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            });

            // 调用翻译API
            translateMessage(text.trim());
        }

        // 清空中间结果
        currentTranscript.value = '';
    }
};

// 处理识别错误
const handleRecognitionError = (message, error) => {
    console.error('识别错误:', message, error);

    addMessage({
        type: MESSAGE_TYPES.ERROR,
        text: message,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });

    currentTranscript.value = '';
    isStarted.value = false;
};

// 处理连接关闭
const handleConnectionClose = (code, reason) => {
    console.log('连接关闭:', code, reason);

    // 如果是意外断开，尝试重新连接
    // if (isStarted.value && code !== 1000) {
    //     addMessage({
    //         type: MESSAGE_TYPES.ERROR,
    //         text: '连接异常断开，正在尝试重连...',
    //         time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    //     });

    //     // 延迟重连
    //     setTimeout(() => {
    //         startRecognition();
    //     }, 3000);
    // }
};

// 处理连接打开
const handleConnectionOpen = () => {
    console.log('RTASR 连接成功');
};

// 翻译函数
const translateMessage = async (text) => {
    try {
        // 调用讯飞翻译API
        const result = await translateText(text, sourceLanguage.value, targetLanguage.value);

        addMessage({
            type: MESSAGE_TYPES.TRANSLATED,
            text: result.dst,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        });
    } catch (error) {
        console.error('翻译失败:', error);

        // 显示翻译错误消息
        addMessage({
            type: MESSAGE_TYPES.ERROR,
            text: `翻译失败: ${error.message}`,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        });
    }
};

// 开始识别
const startRecognition = async () => {
    try {
        // 创建新的客户端实例
        rtasrClient = initRTASRClient();

        if (!rtasrClient) {
            addMessage({
                type: MESSAGE_TYPES.ERROR,
                text: '请先配置讯飞API密钥',
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            });
            return;
        }
        // 开始录制音频
        rtasrClient.startRecording();

    } catch (error) {
        console.error('开始识别失败:', error);
        addMessage({
            type: MESSAGE_TYPES.ERROR,
            text: '开始识别失败: ' + error.message,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        });
        isStarted.value = false;
    }
};

// 停止识别
const stopRecognition = () => {
    if (rtasrClient) {
        rtasrClient.close();
        rtasrClient = null;
    }
    isStarted.value = false;
};

// 开始/停止同声传译
const handleStart = () => {
    if (isStarted.value) {
        // 停止识别
        stopRecognition();
    } else {
        // 开始识别
        isStarted.value = true;
        currentTranscript.value = '';
        startRecognition();
    }
};

// 监听滚动事件
const handleScroll = () => {
    if (!messageListRef.value) return;
    const { scrollTop, clientHeight, scrollHeight } = messageListRef.value;
    // 判断是否滚动到底部（允许一定阈值偏差）
    isAtBottom.value = scrollTop + clientHeight >= scrollHeight - SCROLL_CONFIG.bottomThreshold;
};

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        if (messageListRef.value) {
            messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
        }
    });
};

// 添加消息并根据状态决定是否滚动
const addMessage = (msg) => {
    messages.value.push(msg);
    // 只有当用户已经在底部时才自动滚动
    if (isAtBottom.value) {
        scrollToBottom();
    }
};
</script>

<style lang='less' scoped>
.chat-area {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1000px;
    height: 100%;
    margin: 0 auto;
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    border: 1px solid rgba(45, 212, 191, 0.1);

    .message-list {
        flex: 1;
        display: flex;
        padding: 24px;
        overflow-y: auto;
        flex-direction: column;
        gap: 20px;

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;

            &:hover {
                background: #94a3b8;
            }
        }

        .system-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            color: #64748b;

            .system-icon {
                font-size: 64px;
                margin-bottom: 16px;
                opacity: 0.6;
            }

            p {
                margin: 0;
                font-size: 15px;
                line-height: 1.6;

                &.config-tip {
                    color: #f59e0b;
                    margin-top: 12px;
                    font-size: 13px;
                    padding: 8px 16px;
                    background: rgba(245, 158, 11, 0.1);
                    border-radius: 8px;
                }
            }
        }
    }

    .operation {
        width: 100%;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-radius: 0 0 16px 16px;
        padding: 20px 24px;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);

        .operation-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            // 自动换行
            flex-wrap: wrap;
            gap: 20px;
            max-width: 900px;
            margin: 0 auto;
        }

        .language-section {
            display: flex;
            align-items: center;
            gap: 16px;

            .language-select-wrapper {
                display: flex;
                flex-direction: column;
                gap: 6px;

                .language-label {
                    font-size: 12px;
                    color: #94a3b8;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .language-select {
                    width: 140px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;

                    :deep(.el-select__wrapper) {
                        background: transparent;
                        border: none;
                    }

                    :deep(.el-select__trigger) {
                        color: #f1f5f9;
                        border-radius: 10px;
                        padding: 10px 12px;
                        font-size: 14px;
                        font-weight: 500;

                        &:hover {
                            background: rgba(255, 255, 255, 0.1);
                        }
                    }

                    :deep(.el-select__placeholder) {
                        color: #64748b;
                    }

                    :deep(.el-option) {
                        background: #1e293b;
                        color: #f1f5f9;

                        &:hover {
                            background: rgba(45, 212, 191, 0.2);
                        }

                        &.el-option-selected {
                            background: rgba(45, 212, 191, 0.3);
                            color: #2dd4bf;
                        }
                    }
                }
            }

            .arrow-icon {
                font-size: 20px;
                color: #475569;
                font-weight: 300;
                padding: 0 8px;
            }
        }

        .control-section {
            display: flex;
            align-items: center;
            gap: 16px;

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 20px;
                transition: all 0.3s ease;

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #94a3b8;
                    transition: all 0.3s ease;
                }

                .status-text {
                    font-size: 13px;
                    color: #94a3b8;
                    font-weight: 500;
                }

                &.active {
                    background: rgba(45, 212, 191, 0.15);

                    .status-dot {
                        background: #2dd4bf;
                        box-shadow: 0 0 12px rgba(45, 212, 191, 0.6);
                        animation: pulse 2s ease-in-out infinite;
                    }

                    .status-text {
                        color: #2dd4bf;
                    }
                }
            }

            .start-button {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 32px;
                font-size: 16px;
                font-weight: 600;
                background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
                border: none;
                border-radius: 50px;
                box-shadow: 0 4px 15px rgba(45, 212, 191, 0.4);
                transition: all 0.3s ease;
                color: #0f172a;

                :deep(.el-icon) {
                    color: #0f172a;
                }

                &:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(45, 212, 191, 0.5);
                }

                &:active:not(:disabled) {
                    transform: translateY(0);
                }

                &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                &.active {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);

                    :deep(.el-icon) {
                        color: #fff;
                    }
                }
            }
        }
    }
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.6;
        transform: scale(1.2);
    }
}
</style>
