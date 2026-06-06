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
            <div v-for="(msg, index) in messages" :key="index" :class="['message-item', msg.type]">
                <div class="message-content">
                    <p>{{ msg.text }}</p>
                    <span class="message-time">{{ msg.time }}</span>
                </div>
            </div>

            <!-- 当前正在识别的中间结果 -->
            <div v-if="currentTranscript" class="message-item user current">
                <div class="message-content">
                    <p class="interim-text">{{ currentTranscript }}...</p>
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>

        </div>
        <!-- 操作区 -->
        <div class="operation">
            <!-- 识别语言选择 -->
            <div class="language-select">
                <ElSelect v-model="sourceLanguage" placeholder="识别语言" size="large" :disabled="isStarted"
                    class="lang-select">
                    <ElOption v-for="lang in languageOptions" :key="lang.code" :label="lang.label" :value="lang.code" />
                </ElSelect>
            </div>

            <!-- 箭头分隔 -->
            <span class="arrow">→</span>

            <!-- 翻译语言选择 -->
            <div class="language-select">
                <ElSelect v-model="targetLanguage" placeholder="翻译语言" size="large" :disabled="isStarted"
                    class="lang-select">
                    <ElOption v-for="lang in languageOptions" :key="lang.code" :label="lang.label" :value="lang.code" />
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

const messageListRef = ref(null);
const messages = ref([]);
const currentTranscript = ref(''); // 当前正在识别的文本（中间结果）
const isStarted = ref(false);

// 是否处于底部状态（用于判断是否需要自动滚动）
const isAtBottom = ref(true);
// 底部阈值（距离底部多少像素内认为是在底部）
const bottomThreshold = 100;

// 语言选项
const languageOptions = [
    { code: 'zh-CN', label: '中文' },
    { code: 'en-US', label: 'English' },
    { code: 'ja-JP', label: '日本語' },
    { code: 'ko-KR', label: '한국어' },
    { code: 'fr-FR', label: 'Français' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'es-ES', label: 'Español' },
    { code: 'ru-RU', label: 'русский' },
];

// 当前选择的识别语言和翻译语言
const sourceLanguage = ref('zh-CN');
const targetLanguage = ref('en-US');

// 创建speechRecognition对象(语音识别)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert('您的浏览器不支持语音识别功能，请使用 Chrome、Edge 或 Safari 浏览器');
}

const recognition = new SpeechRecognition();
// 设置识别语言（使用用户选择的语言）
recognition.lang = sourceLanguage.value;
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
            type: 'user',
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
            type: 'user',
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

    let errorMessage = '';
    switch (event.error) {
        case 'not-allowed':
            errorMessage = '请允许麦克风访问权限';
            break;
        case 'no-speech':
            errorMessage = '未检测到语音输入，请继续说话';
            break;
        case 'network':
            errorMessage = '网络错误，请检查网络连接';
            break;
        case 'aborted':
            errorMessage = '语音识别已停止';
            break;
        default:
            errorMessage = `识别错误: ${event.error}`;
    }

    addMessage({
        type: 'error',
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
        type: 'translated',
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
    isAtBottom.value = scrollTop + clientHeight >= scrollHeight - bottomThreshold;
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

        .message-item {
            max-width: 100%;
            display: flex;

            &.user {
                justify-content: flex-end;
                margin-left: 24px;

                .message-content {
                    background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%);
                    color: white;
                    border-radius: 16px 16px 4px 16px;

                    .message-time {
                        color: rgba(255, 255, 255, 0.7);
                    }
                }

                &.current {
                    animation: pulse 1.5s infinite;

                    .message-content {
                        opacity: 0.9;
                    }
                }
            }

            &.translated {
                justify-content: flex-start;
                margin-right: 24px;

                .message-content {
                    background: #ecfeff;
                    color: #0d9488;
                    border: 1px solid #99f6e4;
                    border-radius: 16px 16px 16px 4px;
                }
            }

            &.error {
                justify-content: center;

                .message-content {
                    background: #fef2f2;
                    color: #dc2626;
                    border-radius: 8px;
                    text-align: center;
                    padding: 8px 16px;
                }
            }

            .message-content {
                display: inline-block;
                padding: 12px 16px;
                background: #f1f5f9;
                color: #333;
                border-radius: 16px 16px 16px 16px;

                p {
                    margin: 0 0 6px 0;
                    line-height: 1.5;
                    font-size: 14px;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .interim-text {
                    font-style: italic;
                    opacity: 0.8;
                }

                .message-time {
                    display: block;
                    font-size: 10px;
                    color: #999;
                    margin-top: 4px;
                }

                .typing-indicator {
                    display: inline-flex;
                    gap: 4px;
                    margin-top: 8px;

                    span {
                        width: 6px;
                        height: 6px;
                        background: rgba(255, 255, 255, 0.7);
                        border-radius: 50%;
                        animation: bounce 1.4s infinite ease-in-out both;

                        &:nth-child(1) {
                            animation-delay: -0.32s;
                        }

                        &:nth-child(2) {
                            animation-delay: -0.16s;
                        }
                    }
                }
            }
        }

        @keyframes pulse {

            0%,
            100% {
                opacity: 1;
            }

            50% {
                opacity: 0.7;
            }
        }

        @keyframes bounce {

            0%,
            80%,
            100% {
                transform: scale(0);
            }

            40% {
                transform: scale(1);
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
