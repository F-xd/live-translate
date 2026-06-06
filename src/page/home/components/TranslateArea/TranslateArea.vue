<template>
    <div class="chat-area">
        <!-- 翻译内容列表 -->
        <div ref="messageListRef" class="message-list" @scroll="handleScroll">
            <!-- 系统提示 -->
            <div class="system-message" v-if="messages.length === 0 && !currentTranscript">
                <span class="system-icon">🎤</span>
                <p>点击下方按钮开始同声传译</p>
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
            <ElButton type="primary" size="large" color="#2dd4bf" round @click="handleStart">
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
import { ElButton } from 'element-plus';
import { ref, nextTick } from 'vue';
import Waveform from '@/components/Waveform.vue';
import MessageItem from './MessageItem.vue';
import {
    LANGUAGE_OPTIONS,
    DEFAULT_SOURCE_LANGUAGE,
    DEFAULT_TARGET_LANGUAGE,
    SCROLL_CONFIG,
    MESSAGE_TYPES,
    RECOGNITION_ERROR_MESSAGES
} from './constants.js';

const messageListRef = ref(null);
const messages = ref([]);
const currentTranscript = ref(''); // 当前正在识别的文本（中间结果）
const isStarted = ref(false);

// 是否处于底部状态（用于判断是否需要自动滚动）
const isAtBottom = ref(true);

// 当前选择的识别语言和翻译语言
const sourceLanguage = ref(DEFAULT_SOURCE_LANGUAGE);
const targetLanguage = ref(DEFAULT_TARGET_LANGUAGE);

// 创建speechRecognition对象(语音识别)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert('您的浏览器不支持语音识别功能，请使用 Chrome、Edge 或 Safari 浏览器');
}

const recognition = new SpeechRecognition();
// 设置识别语言（使用用户选择的语言）
recognition.lang = DEFAULT_SOURCE_LANGUAGE;
// 开启中间结果
recognition.interimResults = true;
// 开启连续识别
recognition.continuous = true;
// 最大备选结果数
recognition.maxAlternatives = 1;

// 监听识别开始
recognition.onstart = () => {
    console.log('语音识别开始');
    isStarted.value = true;
    currentTranscript.value = '';
};

// 监听识别结果
recognition.onresult = (event) => {
    let interimTranscript = '';  // 中间结果
    let finalTranscript = '';     // 最终结果

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            // 最终结果，添加到消息列表
            finalTranscript += transcriptText;
        } else {
            // 中间结果，实时显示
            interimTranscript += transcriptText;
        }
    }

    // 更新当前识别的中间结果
    currentTranscript.value = interimTranscript;

    // 中间结果更新时也需要滚动到最新内容
    if (interimTranscript && isAtBottom.value) {
        scrollToBottom();
    }

    // 如果有最终结果，添加到消息列表
    if (finalTranscript) {
        addMessage({
            type: MESSAGE_TYPES.USER,
            text: finalTranscript,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        });

        // 模拟翻译结果（实际应用中这里应该调用翻译API）
        setTimeout(() => {
            translateMessage(finalTranscript);
        }, 500);

        // 清空中间结果
        currentTranscript.value = '';
    }
};

// 监听识别结束
recognition.onend = () => {
    console.log('语音识别结束');
    // 如果还有未完成的中间结果，也要处理
    if (currentTranscript.value.trim()) {
        addMessage({
            type: MESSAGE_TYPES.USER,
            text: currentTranscript.value.trim(),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        });

        // 模拟翻译
        setTimeout(() => {
            translateMessage(currentTranscript.value.trim());
        }, 500);

        currentTranscript.value = '';
    }

    // 如果还在started状态，自动重新开始识别（连续识别）
    if (isStarted.value) {
        try {
            recognition.start();
        } catch (e) {
            console.log('重新开始识别失败', e);
            isStarted.value = false;
        }
    }
};

// 监听错误
recognition.onerror = (event) => {
    console.error('语音识别错误:', event.error);

    const errorMessage = RECOGNITION_ERROR_MESSAGES[event.error] || `识别错误: ${event.error}`;

    addMessage({
        type: MESSAGE_TYPES.ERROR,
        text: errorMessage,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });

    currentTranscript.value = '';
};

// 模拟翻译函数（实际应用中需要调用真实的翻译API）
const translateMessage = (text) => {
    // 这里模拟翻译结果，实际应该调用翻译API
    const translatedText = `[翻译] ${text}`; // 临时占位

    addMessage({
        type: MESSAGE_TYPES.TRANSLATED,
        text: translatedText,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
};

// 开始/停止同声传译
const handleStart = () => {
    if (isStarted.value) {
        // 停止识别
        recognition.stop();
        isStarted.value = false;
        currentTranscript.value = '';
    } else {
        // 设置识别语言为用户选择的语言
        recognition.lang = sourceLanguage.value;

        // 请求麦克风权限并开始识别
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                recognition.start();
            })
            .catch((err) => {
                console.error('获取麦克风权限失败:', err);
                addMessage({
                    type: 'error',
                    text: '无法访问麦克风，请检查权限设置',
                    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
                });
            });
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

        .language-select {
            .lang-select {
                width: 120px;

                .el-select__wrapper {
                    border-radius: 8px;
                    background: white;
                }
            }
        }

        .arrow {
            font-size: 18px;
            color: #666;
            font-weight: bold;
        }
    }

}
</style>
