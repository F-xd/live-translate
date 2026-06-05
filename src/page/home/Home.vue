<template>
    <div class="home-container">
        <!-- 头部区域 -->
        <div class="header">
            <div class="title-section">
                <div class="logo">
                    <img src="../../assets/images/logo.png" alt="同声传译助手">
                </div>
                <h1 class="title">同声传译助手</h1>
            </div>
        </div>
        <!-- 内容区域 -->
        <div class="content">
            <!-- 聊天区域 -->
            <div class="chat-area">
                asdasd
            </div>
            <div class="button-container">
                <ElButton color="#2dd4bf" size="large" round @click="isStart = !isStart">
                    <Waveform v-if="isStart" />
                    <template v-else>
                        <el-icon size="24" color="#1a1a2e">
                            <Microphone />
                        </el-icon>
                        <span color="#1a1a2e">开始翻译</span>
                    </template>
                </ElButton>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import Waveform from './components/Waveform.vue';
import { ElButton, ElIcon } from 'element-plus';
const isStart = ref(false);
</script>

<style lang='less' scoped>
.home-container {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #d1fae5 0%, #ecfeff 50%, #cffafe 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.header {
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: start;

    .title-section {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-left: 24px;

        .logo {
            width: 48px;
            height: 48px;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }

        text-align: center;

        .title {
            font-size: 48px;
            font-weight: 700;
            color: #1a1a2e;
            margin: 0 0 12px 0;
            background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    }
}

.content {
    width: 100%;
    height: calc(100% - 100px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
}

/* 聊天区域 */
.chat-area {
    width: 100%;
    height: 70%;
    padding: 24px;
    display: flex;
    gap: 24px;
    position: relative;
}
</style>
