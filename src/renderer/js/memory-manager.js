// ===== 内存管理工具 =====
// 用于防止内存泄露和优化资源使用

class MemoryManager {
    constructor() {
        this.canvasPool = [];
        this.maxPoolSize = 5;
        this.activeCanvases = new Set();
    }
    
    // 获取 Canvas（从池中复用或创建新的）
    getCanvas() {
        let canvas;
        if (this.canvasPool.length > 0) {
            canvas = this.canvasPool.pop();
        } else {
            canvas = document.createElement('canvas');
        }
        this.activeCanvases.add(canvas);
        return canvas;
    }
    
    // 释放 Canvas（放回池中）
    releaseCanvas(canvas) {
        if (!canvas) return;
        
        this.activeCanvases.delete(canvas);
        
        // 清理 Canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // 重置尺寸
        canvas.width = 0;
        canvas.height = 0;
        
        // 放回池中（如果池未满）
        if (this.canvasPool.length < this.maxPoolSize) {
            this.canvasPool.push(canvas);
        } else {
            // 池已满，彻底释放
            canvas.remove();
            canvas = null;
        }
    }
    
    // 清理所有 Canvas
    clearAll() {
        // 清理活动的 Canvas
        this.activeCanvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            canvas.remove();
        });
        this.activeCanvases.clear();
        
        // 清理池中的 Canvas
        this.canvasPool.forEach(canvas => {
            canvas.remove();
        });
        this.canvasPool = [];
    }
    
    // 获取内存使用情况
    getMemoryInfo() {
        if (performance.memory) {
            return {
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
        return null;
    }
    
    // 强制垃圾回收提示（实际上 JS 无法强制 GC，但可以清理引用）
    requestGarbageCollection() {
        this.clearAll();
        
        // 清理全局引用
        if (window.gc) {
            window.gc();
        }
        
        console.log('Memory cleanup requested');
    }
}

// 导出单例
export const memoryManager = new MemoryManager();

// 监控内存使用
export function startMemoryMonitoring(interval = 30000) {
    setInterval(() => {
        const info = memoryManager.getMemoryInfo();
        if (info) {
            console.log('Memory usage:', info);
        }
    }, interval);
}

// 清理 PDF 文档
export function cleanupPdfDocument(pdfDoc) {
    if (pdfDoc) {
        try {
            pdfDoc.destroy();
        } catch (error) {
            console.error('Error destroying PDF document:', error);
        }
    }
}

// 清理页面对象
export function cleanupPage(page) {
    if (page) {
        try {
            page.cleanup();
        } catch (error) {
            console.error('Error cleaning up page:', error);
        }
    }
}

// 清理 ArrayBuffer
export function cleanupArrayBuffer(buffer) {
    if (buffer) {
        // ArrayBuffer 无法直接清理，但可以解除引用
        buffer = null;
    }
}

// 防抖函数（减少频繁调用）
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数（限制调用频率）
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
