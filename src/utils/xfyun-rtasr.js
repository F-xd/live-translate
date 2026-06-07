/**
 * 讯飞星火实时语音转写客户端
 */
import { buildWsUrl } from "./xfyun-signature";

class RTASRClient {
  constructor(config) {
    this.appId = config.appId;
    this.accessKeyId = config.accessKeyId;
    this.accessKeySecret = config.accessKeySecret;
    this.lang = config.lang || "autodialect";
    this.audioEncode = config.audioEncode || "pcm_s16le";
    this.samplerate = config.samplerate || 16000;

    this.ws = null;
    this.audioContext = null;
    this.processor = null;
    this.stream = null;
    this.sessionId = null;

    // 回调函数
    this.onResult = config.onResult || (() => {});
    this.onError = config.onError || (() => {});
    this.onClose = config.onClose || (() => {});
    this.onOpen = config.onOpen || (() => {});

    // 状态
    // 是否已连接
    this.isConnected = false;
    // 是否正在录音
    this.isRecording = false;
    // 音频队列
    this.audioQueue = [];
    // 是否正在清除队列
    this.isClearQueue = false;
    // 清除队列定时器
    this.clearQueueTimer = null;
    // 静音定时器
    this.muteTimer = null;
  }

  /**
   * 建立 WebSocket 连接
   */
  async connect() {
    try {
      const url = await buildWsUrl({
        appId: this.appId,
        accessKeyId: this.accessKeyId,
        accessKeySecret: this.accessKeySecret,
        lang: this.lang,
        audioEncode: this.audioEncode,
        samplerate: this.samplerate,
      });

      this.ws = new WebSocket(url);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error("【连接异常】", error.message);
      this.onError("连接失败", error);
      throw error;
    }
  }

  /**
   * 处理连接打开
   */
  handleOpen() {
    console.log("【连接成功】WebSocket握手完成，等待服务端就绪...");
    this.isConnected = true;

    // 延迟触发onOpen，确保服务端完全初始化
    setTimeout(() => {
      this.onOpen();
    }, 1500);
  }

  /**
   * 处理消息
   */
  handleMessage(event) {
    if (!this.isConnected || !this.ws) {
      console.log("【接收线程】连接已关闭，退出接收循环");
      return;
    }

    try {
      if (typeof event.data === "string") {
        // 文本消息（JSON）
        try {
          const result = JSON.parse(event.data);
          console.log("【接收消息】", result);
          this.processResult(result);
        } catch (e) {
          console.log(
            "【接收异常】非JSON文本消息：",
            event.data.substring(0, 50),
          );
        }
      } else {
        // 二进制消息（忽略）
        console.log(
          "【接收提示】收到二进制消息，长度：",
          event.data.byteLength,
        );
      }
    } catch (error) {
      console.error("【接收异常】未知错误：", error.message);
      this.close();
    }
  }

  /**
   * 处理返回结果
   */
  processResult(result) {
    // 更新会话 ID
    if (
      result.msg_type === "action" &&
      result.data?.sessionId &&
      result.data?.action === "started"
    ) {
      // 会话ID更新
      this.sessionId = result.data.sessionId;
      console.log("【会话ID】", this.sessionId);
      // 清除队列
      this.handleClearQueue();
    }

    // 处理识别结果
    if (result.msg_type === "result" && result.res_type === "asr") {
      const text = this.parseResult(result.data);
      const isFinal = result.data?.ls === true;
      console.log("【识别结果】", text, "是否最终：", isFinal);
      this.onResult(text, isFinal, result.data);
    }

    // 处理错误
    if (result.msg_type === "error" || result.data?.normal === false) {
      const errorMsg = result.data?.desc || "未知错误";
      console.error("【识别错误】", errorMsg);
      this.onError(errorMsg, result);
    }
  }

  /**
   * 解析识别结果
   */
  parseResult(data) {
    let text = "";
    if (data.cn && data.cn.st && data.cn.st.rt) {
      data.cn.st.rt.forEach((rt) => {
        if (rt.ws) {
          rt.ws.forEach((w) => {
            if (w.cw) {
              w.cw.forEach((cw) => {
                if (cw.w) {
                  text += cw.w;
                }
              });
            }
          });
        }
      });
    }
    return text;
  }

  /**
   * 处理错误
   */
  handleError(error) {
    console.error("【连接失败】WebSocket错误：", error.message || error);
    this.isConnected = false;
    this.onError("WebSocket连接错误", error);
  }

  /**
   * 处理连接关闭
   */
  handleClose(event) {
    console.log(
      "【连接关闭】WebSocket关闭，代码：",
      event.code,
      "原因：",
      event.reason,
    );
    this.isConnected = false;
    this.onClose(event.code, event.reason);
  }

  /**
   * 开始音频采集
   */
  async startRecording() {
    try {
      // 获取麦克风权限
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.samplerate,
          channelCount: 1,
          volume: 1.0,
        },
      });

      // 创建音频上下文
      this.audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )({
        sampleRate: this.samplerate,
      });

      // 创建音频源
      const source = this.audioContext.createMediaStreamSource(this.stream);

      // 创建处理器（缓冲区大小必须是 2 的幂次方：256, 512, 1024, 2048, 4096, 8192, 16384）
      // 16kHz 采样率下，512 = 32ms，1024 = 64ms
      const bufferSize = 512;
      this.processor = this.audioContext.createScriptProcessor(
        bufferSize,
        1,
        1,
      );

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      // 处理音频数据
      this.processor.onaudioprocess = this.handleAudioProcess.bind(this);

      this.isRecording = true;
      console.log(
        "【录音开始】采样率：",
        this.samplerate,
        "缓冲区：",
        bufferSize,
      );
    } catch (error) {
      console.error("【录音失败】", error.message);
      this.onError("录音失败", error);
      throw error;
    }
  }

  /**
   * 处理音频数据
   */
  handleAudioProcess(event) {
    // 获取音频数据
    const inputBuffer = event.inputBuffer.getChannelData(0);

    // 计算音频能量（均方根 RMS）
    let sum = 0;
    for (let i = 0; i < inputBuffer.length; i++) {
      sum += inputBuffer[i] * inputBuffer[i];
    }
    const rms = Math.sqrt(sum / inputBuffer.length);

    // 将 Float32Array 转换为 Int16Array（16bit PCM）
    const int16Buffer = new Int16Array(inputBuffer.length);
    for (let i = 0; i < inputBuffer.length; i++) {
      // Float32 范围是 [-1, 1]，转换为 Int16 范围 [-32768, 32767]
      int16Buffer[i] = Math.max(
        -32768,
        Math.min(32767, inputBuffer[i] * 32767),
      );
    }
    // 发送音频数据到队列
    if (this.isClearQueue && rms > 0.001) {
      this.audioQueue.push(int16Buffer.buffer);
    }
    // 静音阈值：RMS < 0.02 认为是静音
    if (rms < 0.04) {
      // 启动静音计时器
      if (!this.muteTimer) {
        this.muteTimer = setTimeout(() => {
          // 清除队列定时器并发送结束标识
          clearInterval(this.clearQueueTimer);
          this.sendEnd();
          this.isClearQueue = false;
        }, 250);
      }
    } else {
      // 清除静音计时器
      clearTimeout(this.muteTimer);
      this.muteTimer = null;
      console.log("【有效音频数据】", rms);
      // 开始连接ws发送音频数据
      if (this.isClearQueue) {
        return;
      }
      this.audioQueue.push(int16Buffer.buffer);
      this.isClearQueue = true;
      // 连接ws, 连接后服务器就绪会发送消息通知客户端
      this.connect();
    }
  }
  /**
   * 清除音频队列
   */
  handleClearQueue() {
    this.clearQueueTimer = setInterval(() => {
      if (this.audioQueue.length > 0) {
        console.log("【发送音频数据】", this.audioQueue.length);
        this.ws.send(this.audioQueue.shift());
      }
    }, 0);
  }

  /**
   * 停止录音
   */
  stopRecording() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.isRecording = false;
    console.log("【录音停止】");
  }

  /**
   * 发送结束标识
   */
  sendEnd() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const endMsg = { end: true };
      if (this.sessionId) {
        endMsg.sessionId = this.sessionId;
      }
      const endMsgStr = JSON.stringify(endMsg);
      this.ws.send(endMsgStr);
      console.log("【发送结束】已发送标准JSON结束标记：", endMsgStr);
    }
  }

  /**
   * 关闭连接
   */
  close() {
    this.stopRecording();

    if (this.ws) {
      // 发送结束标识
      this.sendEnd();
      // 不需要客户端关闭，因为服务器会自动断开连接
    }
  }

  /**
   * 设置语言
   */
  setLanguage(lang) {
    this.lang = lang;
  }
}

export default RTASRClient;
