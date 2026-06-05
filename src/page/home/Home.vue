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
        <TranslateArea />
    </div>
</template>

<script setup>
import TranslateArea from './components/TranslateArea/TranslateArea.vue';
</script>

<style lang='less' scoped>
.home-container {
    width: 100%;
    height: 100vh;
    background: linear-gradient(135deg, #d1fae5 0%, #ecfeff 50%, #cffafe 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.header {
    width: 100%;
    height: 80px;
    display: flex;
    justify-content: start;
    align-items: center;
    padding: 0 32px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);

    .title-section {
        display: flex;
        align-items: center;
        gap: 16px;

        .logo {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;

            img {
                width: 70%;
                height: 70%;
                object-fit: cover;
            }
        }

        .title {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a2e;
            margin: 0;
            background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    }
}

.content :deep(.chat-area) {
    flex: 1;
    min-height: 500px;
}
</style>
