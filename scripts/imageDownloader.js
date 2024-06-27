// imageDownloader.js

/**
 * 下载并生成图片
 * @param {string} prompt - 图片描述提示。
 * @param {number} width - 图片的宽度。
 * @param {number} height - 图片的高度。
 * @param {number} seed - 用来生成图片的种子，每个种子对应一张唯一图片。
 * @param {string} model - 使用的模型名称，默认值为 'your_model_name'。
 */
async function downloadImage(prompt, width, height, seed, model = 'your_model_name') {
    // 构建图片URL
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}`;

    try {
        // 从URL获取图片
        let response = await fetch(imageUrl);
        // 将响应内容读取为Blob对象
        let blob = await response.blob();
        // 创建一个链接元素
        let link = document.createElement('a');
        // 为Blob对象创建一个对象URL
        link.href = window.URL.createObjectURL(blob);
        // 设置下载属性和文件名
        link.download = 'image.png';
        // 将链接添加到文档 (Firefox需要)
        document.body.appendChild(link);
        // 程序化点击链接以触发下载
        link.click();
        // 从文档中移除链接
        link.remove();
        console.log('下载完成');
    } catch (error) {
        console.error('下载图片时出错:', error);
    }
}

// 导出模块
export { downloadImage };

/**
 * 使用指南：
 * 1. 在你的HTML文件中引入该模块：
 * <script type="module" src="path/to/imageDownloader.js"></script>
 *
 * 2. 在你的其他JS文件或HTML文件中导入并使用：
 * <script type="module">
 *   import { downloadImage } from './path/to/imageDownloader.js';
 *
 *   // 调用downloadImage函数
 *   const prompt = 'Elf warrior stands on a mossy, volcanic landscape, eyes glow...';
 *   const width = 1024;
 *   const height = 1024;
 *   const seed = 769735;
 *   downloadImage(prompt, width, height, seed);
 * </script>
 */