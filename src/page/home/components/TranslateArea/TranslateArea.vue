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
            <!-- 识别语言选择 -->
            <div class="language-select">
                <ElSelect v-model="sourceLanguage" placeholder="识别语言" size="large" :disabled="isStarted"
                    class="lang-select">
                    <ElOption v-for="lang in LANGUAGE_OPTIONS" :key="lang.code" :label="lang.label"
                        :value="lang.code" />
                </ElSelect>
            </div>

            <!-- 箭头分隔 -->
            <span class="arrow">→</span>

            <!-- 翻译语言选择 -->
            <div class="language-select">
                <ElSelect v-model="targetLanguage" placeholder="翻译语言" size="large" :disabled="isStarted"
                    class="lang-select">
                    <ElOption v-for="lang in LANGUAGE_OPTIONS" :key="lang.code" :label="lang.label"
                        :value="lang.code" />
                </ElSelect>
            </div>

            <!-- 开始按钮 -->
            <ElButton type="primary" size="large" color="#2dd4bf" round @click="handleStart"
                :disabled="!hasXFYUNConfig">
                <ElIcon size="24">
                    <Microphone />
                </ElIcon>
                <span v-if="!isStarted" style="font-size: 16px;">开始同声传译</span>
                <Waveform v-else />
            </ElButton>
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, computed } from 'vue';
import { ElButton } from 'element-plus';
import Waveform from '@/components/Waveform.vue';
import MessageItem from './components/MessageItem.vue';
import { DEFAULT_SOURCE_LANGUAGE, DEFAULT_TARGET_LANGUAGE, LANGUAGE_OPTIONS } from './constants.js';
import { SCROLL_CONFIG, MESSAGE_TYPES } from './constants.js';
import RTASRClient from '@/utils/xfyun-rtasr';
import { XFYUN_CONFIG } from '@/config/xfyun';

// 判断是否配置了讯飞API
const hasXFYUNConfig = computed(() => {
    return XFYUN_CONFIG.appId && XFYUN_CONFIG.accessKeyId && XFYUN_CONFIG.accessKeySecret;
});

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

            // 模拟翻译结果（实际应用中这里应该调用翻译API）
            setTimeout(() => {
                translateMessage(text.trim());
            }, 500);
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

// 模拟翻译函数（实际应用中需要调用真实的翻译API）
const translateMessage = (text) => {
    // 这里模拟翻译结果，实际应该调用翻译API
    const translatedText = `[翻译] ${text}`;

    addMessage({
        type: MESSAGE_TYPES.TRANSLATED,
        text: translatedText,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
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
    background: white;
    border-radius: 6px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;

    .message-list {
        flex: 1;
        display: flex;
        padding: 20px;
        overflow-y: auto;
        flex-direction: column;
        gap: 16px;

        .system-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #999;

            .system-icon {
                font-size: 48px;
                margin-bottom: 12px;
            }

            p {
                margin: 0;
                font-size: 14px;

                &.config-tip {
                    color: #f59e0b;
                    margin-top: 8px;
                    font-size: 12px;
                }
            }
        }
    }

    .operation {
        width: 100%;
        height: 100px;
        background: #c0e3f5;
        border-radius: 0 0 6px 6px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
        gap: 12px;

        .arrow {
            font-size: 18px;
            color: #666;
            font-weight: bold;
        }
    }
}
</style>
