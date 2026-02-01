// ===== PDF Reader Pro - 主应用逻辑 =====

// 等待 PDF.js 加载完成
const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];

// 设置 PDF.js worker
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
}

// ===== 全局状态 =====
const state = {
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.5,
    fileName: '',
    filePath: '',
    fileData: null,
    tocItems: [],
    config: {
        apiKey: '',
        model: 'doubao-seed-1-6-flash-250828',
        apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/responses',
        pageOffset: 0
    }
};

// ===== Canvas 对象池 =====
const canvasPool = {
    pool: [],
    maxSize: 3,
    
    get() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return document.createElement('canvas');
    },
    
    release(canvas) {
        if (this.pool.length < this.maxSize) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.pool.push(canvas);
        }
    },
    
    clearAll() {
        this.pool = [];
    }
};

// ===== DOM 元素 =====
const elements = {
    welcomeScreen: document.getElementById('welcome-screen'),
    mainScreen: document.getElementById('main-screen'),
    settingsScreen: document.getElementById('settings-screen'),
    openFileBtn: document.getElementById('open-file-btn'),
    fileName: document.getElementById('file-name'),
    pdfContainer: document.getElementById('pdf-container'),
    pageInfo: document.getElementById('page-info'),
    prevPageBtn: document.getElementById('prev-page-btn'),
    nextPageBtn: document.getElementById('next-page-btn'),
    tocBtn: document.getElementById('toc-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    tocDrawer: document.getElementById('toc-drawer'),
    closeTocBtn: document.getElementById('close-toc-btn'),
    tocTree: document.getElementById('toc-tree'),
    recognizeTocBtn: document.getElementById('recognize-toc-btn'),
    editTocBtn: document.getElementById('edit-toc-btn'),
    exportPdfBtn: document.getElementById('export-pdf-btn'),
    backFromSettingsBtn: document.getElementById('back-from-settings-btn'),
    apiKeyInput: document.getElementById('api-key-input'),
    testApiBtn: document.getElementById('test-api-btn'),
    apiStatus: document.getElementById('api-status'),
    printedPageInput: document.getElementById('printed-page-input'),
    pdfPageInput: document.getElementById('pdf-page-input'),
    offsetValue: document.getElementById('offset-value'),
    tocEditModal: document.getElementById('toc-edit-modal'),
    closeEditModalBtn: document.getElementById('close-edit-modal-btn'),
    addTocItemBtn: document.getElementById('add-toc-item-btn'),
    importJsonBtn: document.getElementById('import-json-btn'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    tocTableBody: document.getElementById('toc-table-body'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    saveTocBtn: document.getElementById('save-toc-btn'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text')
};

// ===== 初始化 =====
function init() {
    console.log('初始化应用...');
    loadConfig();
    setupEventListeners();
    setupDragAndDrop();
    setupKeyboardShortcuts();
    console.log('应用初始化完成');
}

// ===== 加载配置 =====
function loadConfig() {
    try {
        const savedConfig = window.configAPI.get('appConfig');
        if (savedConfig) {
            state.config = { ...state.config, ...savedConfig };
            elements.apiKeyInput.value = state.config.apiKey || '';
            elements.printedPageInput.value = 1;
            elements.pdfPageInput.value = 1;
            updateOffset();
        }
    } catch (error) {
        console.error('加载配置失败:', error);
    }
}

// ===== 保存配置 =====
function saveConfig() {
    try {
        window.configAPI.set('appConfig', state.config);
    } catch (error) {
        console.error('保存配置失败:', error);
    }
}

// ===== 事件监听器 =====
function setupEventListeners() {
    console.log('设置事件监听器...');
    
    // 打开文件
    elements.openFileBtn.addEventListener('click', () => {
        console.log('打开文件按钮被点击');
        openFile();
    });
    
    // 页面导航
    elements.prevPageBtn.addEventListener('click', () => changePage(-1));
    elements.nextPageBtn.addEventListener('click', () => changePage(1));
    
    // 目录
    elements.tocBtn.addEventListener('click', toggleTocDrawer);
    elements.closeTocBtn.addEventListener('click', toggleTocDrawer);
    elements.recognizeTocBtn.addEventListener('click', recognizeToc);
    elements.editTocBtn.addEventListener('click', openTocEditModal);
    elements.exportPdfBtn.addEventListener('click', exportPdfWithToc);
    
    // 设置
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.backFromSettingsBtn.addEventListener('click', closeSettings);
    elements.testApiBtn.addEventListener('click', testApiConnection);
    elements.apiKeyInput.addEventListener('input', () => {
        state.config.apiKey = elements.apiKeyInput.value;
        saveConfig();
    });
    elements.printedPageInput.addEventListener('input', updateOffset);
    elements.pdfPageInput.addEventListener('input', updateOffset);
    
    // 目录编辑
    elements.closeEditModalBtn.addEventListener('click', closeTocEditModal);
    elements.cancelEditBtn.addEventListener('click', closeTocEditModal);
    elements.saveTocBtn.addEventListener('click', saveTocEdits);
    elements.addTocItemBtn.addEventListener('click', addTocItem);
    elements.importJsonBtn.addEventListener('click', importTocJson);
    elements.exportJsonBtn.addEventListener('click', exportTocJson);
    
    console.log('事件监听器设置完成');
}

// ===== 拖拽上传 =====
function setupDragAndDrop() {
    console.log('设置拖拽功能...');
    
    const dropZone = elements.welcomeScreen;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('文件拖拽中...');
    });
    
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('文件被放下');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.pdf')) {
            console.log('检测到 PDF 文件:', files[0].name);
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            await loadPdfFromData(arrayBuffer, file.name, file.path || '');
        } else {
            alert('请拖拽 PDF 文件');
        }
    });
    
    console.log('拖拽功能设置完成');
}

// ===== 键盘快捷键 =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Cmd+O: 打开文件
        if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
            e.preventDefault();
            if (!elements.welcomeScreen.classList.contains('hidden')) {
                openFile();
            }
        }
        
        // Cmd+T: 打开/关闭目录
        if ((e.metaKey || e.ctrlKey) && e.key === 't') {
            e.preventDefault();
            if (!elements.mainScreen.classList.contains('hidden')) {
                toggleTocDrawer();
            }
        }
        
        // Cmd+,: 打开设置
        if ((e.metaKey || e.ctrlKey) && e.key === ',') {
            e.preventDefault();
            if (!elements.mainScreen.classList.contains('hidden')) {
                openSettings();
            }
        }
        
        // 左右箭头: 翻页
        if (e.key === 'ArrowLeft') {
            changePage(-1);
        } else if (e.key === 'ArrowRight') {
            changePage(1);
        }
        
        // ESC: 关闭面板
        if (e.key === 'Escape') {
            if (!elements.tocDrawer.classList.contains('hidden')) {
                toggleTocDrawer();
            } else if (!elements.settingsScreen.classList.contains('hidden')) {
                closeSettings();
            } else if (!elements.tocEditModal.classList.contains('hidden')) {
                closeTocEditModal();
            }
        }
    });
}

// ===== 打开文件 =====
async function openFile() {
    console.log('调用打开文件对话框...');
    try {
        const result = await window.electronAPI.openFile();
        console.log('文件选择结果:', result);
        if (result) {
            await loadPdfFromData(result.data, result.name, result.path);
        }
    } catch (error) {
        console.error('打开文件失败:', error);
        alert('打开文件失败: ' + error.message);
    }
}

// ===== 加载 PDF =====
async function loadPdfFromData(arrayBuffer, fileName, filePath) {
    showLoading('正在加载 PDF...');
    console.log('开始加载 PDF:', fileName);
    
    try {
        // 确保 PDF.js 已加载
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js 未加载');
        }
        
        // 清理旧文档
        if (state.pdfDoc) {
            state.pdfDoc.destroy();
            state.pdfDoc = null;
        }
        
        // 清理旧 Canvas
        canvasPool.clearAll();
        
        // 加载新文档
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        state.pdfDoc = await loadingTask.promise;
        state.totalPages = state.pdfDoc.numPages;
        state.currentPage = 1;
        state.fileName = fileName.replace('.pdf', '');
        state.filePath = filePath;
        state.fileData = arrayBuffer;
        state.tocItems = [];
        
        console.log('PDF 加载成功，总页数:', state.totalPages);
        
        // 更新 UI
        elements.fileName.textContent = fileName;
        elements.welcomeScreen.classList.add('hidden');
        elements.mainScreen.classList.remove('hidden');
        
        // 渲染第一页
        await renderPage(state.currentPage);
        updatePageInfo();
        
        hideLoading();
    } catch (error) {
        console.error('加载 PDF 失败:', error);
        hideLoading();
        alert('加载 PDF 失败: ' + error.message);
    }
}

// ===== 渲染页面 =====
async function renderPage(pageNum) {
    if (!state.pdfDoc) return;
    
    try {
        const page = await state.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: state.scale });
        
        // 获取或创建 Canvas
        let canvas = elements.pdfContainer.querySelector('canvas');
        if (!canvas) {
            canvas = canvasPool.get();
            elements.pdfContainer.innerHTML = '';
            elements.pdfContainer.appendChild(canvas);
        }
        
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // 渲染
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        // 清理页面对象
        page.cleanup();
        
    } catch (error) {
        console.error('渲染页面失败:', error);
    }
}

// ===== 切换页面 =====
function changePage(delta) {
    const newPage = state.currentPage + delta;
    if (newPage >= 1 && newPage <= state.totalPages) {
        state.currentPage = newPage;
        renderPage(state.currentPage);
        updatePageInfo();
    }
}

// ===== 更新页码信息 =====
function updatePageInfo() {
    elements.pageInfo.textContent = `${state.currentPage} / ${state.totalPages}`;
}

// ===== 显示/隐藏加载提示 =====
function showLoading(text = '加载中...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

// ===== 目录功能 =====
function toggleTocDrawer() {
    elements.tocDrawer.classList.toggle('hidden');
}

function openTocEditModal() {
    elements.tocEditModal.classList.remove('hidden');
    renderTocEditTable();
}

function closeTocEditModal() {
    elements.tocEditModal.classList.add('hidden');
}

// ===== 设置功能 =====
function openSettings() {
    elements.settingsScreen.classList.remove('hidden');
}

function closeSettings() {
    elements.settingsScreen.classList.add('hidden');
}

function updateOffset() {
    const printed = parseInt(elements.printedPageInput.value) || 1;
    const pdf = parseInt(elements.pdfPageInput.value) || 1;
    state.config.pageOffset = pdf - printed;
    elements.offsetValue.textContent = state.config.pageOffset;
    saveConfig();
}

// ===== 测试 API 连接 =====
async function testApiConnection() {
    if (!state.config.apiKey) {
        elements.apiStatus.textContent = '请先输入 API Key';
        elements.apiStatus.style.color = '#FF3B30';
        return;
    }
    
    showLoading('测试 API 连接...');
    
    try {
        const response = await fetch(state.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.config.apiKey}`
            },
            body: JSON.stringify({
                model: state.config.model,
                input: 'Hello'
            })
        });
        
        if (response.ok) {
            elements.apiStatus.textContent = '✓ API 连接成功';
            elements.apiStatus.style.color = '#34C759';
        } else {
            elements.apiStatus.textContent = '✗ API 连接失败';
            elements.apiStatus.style.color = '#FF3B30';
        }
    } catch (error) {
        elements.apiStatus.textContent = '✗ 连接错误: ' + error.message;
        elements.apiStatus.style.color = '#FF3B30';
    }
    
    hideLoading();
}

// ===== 识别目录 =====
async function recognizeToc() {
    alert('目录识别功能需要完整的 API 集成，当前为演示版本');
}

// ===== 导出 PDF =====
async function exportPdfWithToc() {
    alert('PDF 导出功能需要完整的 pdf-lib 集成，当前为演示版本');
}

// ===== 目录编辑功能 =====
function renderTocEditTable() {
    // 简化版本
    elements.tocTableBody.innerHTML = '<div style="padding: 20px; text-align: center; color: #86868B;">暂无目录条目</div>';
}

function addTocItem() {
    alert('添加目录功能');
}

function saveTocEdits() {
    closeTocEditModal();
}

function importTocJson() {
    alert('导入 JSON 功能');
}

function exportTocJson() {
    alert('导出 JSON 功能');
}

// ===== 页面加载完成后初始化 =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('app.js 脚本已加载');
