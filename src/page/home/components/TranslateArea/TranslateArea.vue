<template>
    <div class="chat-area">
        <!-- 翻译内容列表 -->
        <div ref="messageListRef" class="message-list" @scroll="handleScroll">
            <!-- 系统提示 -->
            <div class="system-message" v-if="messages.length === 0">
                <span class="system-icon">🎤</span>
                <p>点击下方按钮开始同声传译</p>
            </div>

            <!-- 消息列表 -->
            <div v-for="(msg, index) in messages" :key="index" :class="['message-item', msg.type]">
                <div class="message-content">
                    <p>{{ msg }}</p>
                </div>
            </div>

        </div>
        <!-- 操作区 -->
        <div class="operation">
            <ElButton type="primary">开始同声传译</ElButton>
        </div>
    </div>
</template>

<script setup>
import { ElButton } from 'element-plus';
import { ref, nextTick, reactive } from 'vue';

const messageListRef = ref(null);
const messages = reactive(['你好']);
// 是否处于底部状态（用于判断是否需要自动滚动）
const isAtBottom = ref(true);
// 底部阈值（距离底部多少像素内认为是在底部）
const bottomThreshold = 50;
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
    messages.push(msg);
    // 只有当用户已经在底部时才自动滚动
    if (isAtBottom.value) {
        scrollToBottom();
    }
};
setInterval(() => {
    addMessage('你好');
}, 10000000);
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
            max-width: 70%;

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
    }

}
</style>
