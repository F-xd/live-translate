/**
* 语音波形展示组件
*/
<template>
    <div class="waveform">
        <div class="wave-bar" v-for="i in waveNum" :key="i" :style="{ animationDelay: i * 0.05 + 's' }">
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
const props = defineProps({
    waveNum: {
        type: Number,
        default: 10
    }
})
console.log(props.waveNum)
</script>

<style lang='less' scoped>
.waveform {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 20px;

    .wave-bar {
        width: 4px;
        height: 20px;
        background: linear-gradient(135deg, #026558 0%, #013a36 100%);
        border-radius: 2px;
        animation: wave 1.2s ease-in-out infinite;
    }
}

@keyframes wave {

    0%,
    100% {
        transform: scaleY(0.3);
    }

    50% {
        transform: scaleY(1);
    }
}
</style>