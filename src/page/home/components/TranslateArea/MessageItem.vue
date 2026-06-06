<template>
    <div :class="['message-item', msg.type, { talking: isTalking }]">
        <div class="message-content">
            <!-- 正在识别时的显示 -->
            <template v-if="isTalking">
                <p class="interim-text">{{ msg.text }}...</p>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </template>
            <!-- 正常消息显示 -->
            <template v-else>
                <p>{{ msg.text }}</p>
                <span class="message-time">{{ msg.time }}</span>
            </template>
        </div>
    </div>
</template>

<script setup>
defineProps({
    msg: {
        type: Object,
        required: true,
        properties: {
            type: {
                type: String,
                required: true
            },
            text: {
                type: String,
                required: true
            },
            time: {
                type: String,
                required: true
            }
        }
    },
    isTalking: {
        type: Boolean,
        default: false
    }
});
</script>

<style lang='less' scoped>
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
    }

    &.talking {
        animation: pulse 1.5s infinite;

        .message-content {
            opacity: 0.9;
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
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

@keyframes bounce {
    0%, 80%, 100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1);
    }
}
</style>
