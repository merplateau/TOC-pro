// ===== 导入 PDF.js =====
import * as pdfjsLib from '../../../node_modules/pdfjs-dist/build/pdf.mjs';

// ===== 导入内存管理工具 =====
import { memoryManager, startMemoryMonitoring, cleanupPdfDocument, cleanupPage } from './memory-manager.js';

// 设置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '../../../node_modules/pdfjs-dist/build/pdf.worker.mjs';

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
    loadConfig();
    setupEventListeners();
    setupDragAndDrop();
    setupKeyboardShortcuts();
    startMemoryMonitoring(60000); // 每分钟监控一次内存
}

// ===== 加载配置 =====
function loadConfig() {
    const savedConfig = window.configAPI.get('appConfig');
    if (savedConfig) {
        state.config = { ...state.config, ...savedConfig };
        elements.apiKeyInput.value = state.config.apiKey || '';
        elements.printedPageInput.value = 1;
        elements.pdfPageInput.value = 1;
        updateOffset();
    }
}

// ===== 保存配置 =====
function saveConfig() {
    window.configAPI.set('appConfig', state.config);
}

// ===== 事件监听器 =====
function setupEventListeners() {
    // 打开文件
    elements.openFileBtn.addEventListener('click', openFile);
    
    // 页面导航
    elements.prevPageBtn.addEventListener('click', () => changePage(-1));
    elements.nextPageBtn.addEventListener('click', () => changePage(1));
    
    // 目录抽屉
    elements.tocBtn.addEventListener('click', toggleTocDrawer);
    elements.closeTocBtn.addEventListener('click', toggleTocDrawer);
    elements.tocDrawer.querySelector('.drawer-overlay').addEventListener('click', toggleTocDrawer);
    
    // 目录操作
    elements.recognizeTocBtn.addEventListener('click', recognizeToc);
    elements.editTocBtn.addEventListener('click', openTocEditModal);
    elements.exportPdfBtn.addEventListener('click', exportPdfWithToc);
    
    // 设置
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.backFromSettingsBtn.addEventListener('click', closeSettings);
    elements.testApiBtn.addEventListener('click', testApiConnection);
    elements.apiKeyInput.addEventListener('input', (e) => {
        state.config.apiKey = e.target.value;
        saveConfig();
    });
    elements.printedPageInput.addEventListener('input', updateOffset);
    elements.pdfPageInput.addEventListener('input', updateOffset);
    
    // 目录编辑模态框
    elements.closeEditModalBtn.addEventListener('click', closeTocEditModal);
    elements.cancelEditBtn.addEventListener('click', closeTocEditModal);
    elements.saveTocBtn.addEventListener('click', saveTocEdits);
    elements.addTocItemBtn.addEventListener('click', addTocItem);
    elements.importJsonBtn.addEventListener('click', importTocJson);
    elements.exportJsonBtn.addEventListener('click', exportTocJson);
    elements.tocEditModal.querySelector('.modal-overlay').addEventListener('click', closeTocEditModal);
}

// ===== 拖放文件 =====
function setupDragAndDrop() {
    const dropZone = elements.welcomeScreen;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            const file = files[0];
            const arrayBuffer = await file.arrayBuffer();
            await loadPdfFromData(arrayBuffer, file.name, file.path);
        }
    });
}

// ===== 键盘快捷键 =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Cmd+O: 打开文件
        if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
            e.preventDefault();
            openFile();
        }
        
        // Cmd+T: 打开/关闭目录
        if ((e.metaKey || e.ctrlKey) && e.key === 't') {
            e.preventDefault();
            toggleTocDrawer();
        }
        
        // Cmd+,: 打开设置
        if ((e.metaKey || e.ctrlKey) && e.key === ',') {
            e.preventDefault();
            openSettings();
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
    try {
        const result = await window.electronAPI.openFile();
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
    
    try {
        // 清理旧文档
        if (state.pdfDoc) {
            cleanupPdfDocument(state.pdfDoc);
            state.pdfDoc = null;
        }
        
        // 清理旧 Canvas
        memoryManager.clearAll();
        
        // 加载新文档
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        state.pdfDoc = await loadingTask.promise;
        state.totalPages = state.pdfDoc.numPages;
        state.currentPage = 1;
        state.fileName = fileName.replace('.pdf', '');
        state.filePath = filePath;
        state.fileData = arrayBuffer;
        state.tocItems = [];
        
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
    try {
        const page = await state.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: state.scale });
        
        // 创建 canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.className = 'pdf-page';
        
        // 渲染
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // 清理旧 canvas
        const oldCanvas = elements.pdfContainer.querySelector('canvas');
        if (oldCanvas) {
            memoryManager.releaseCanvas(oldCanvas);
        }
        
        // 添加新 canvas
        elements.pdfContainer.innerHTML = '';
        elements.pdfContainer.appendChild(canvas);
        
        // 清理页面对象
        cleanupPage(page);
    } catch (error) {
        console.error('渲染页面失败:', error);
    }
}

// ===== 切换页面 =====
async function changePage(delta) {
    const newPage = state.currentPage + delta;
    if (newPage >= 1 && newPage <= state.totalPages) {
        state.currentPage = newPage;
        await renderPage(state.currentPage);
        updatePageInfo();
    }
}

// ===== 更新页码信息 =====
function updatePageInfo() {
    elements.pageInfo.textContent = `${state.currentPage} / ${state.totalPages}`;
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = state.currentPage === state.totalPages;
}

// ===== 切换目录抽屉 =====
function toggleTocDrawer() {
    elements.tocDrawer.classList.toggle('hidden');
    if (!elements.tocDrawer.classList.contains('hidden')) {
        renderTocTree();
    }
}

// ===== 渲染目录树 =====
function renderTocTree() {
    if (state.tocItems.length === 0) {
        elements.tocTree.innerHTML = '<div class="toc-empty">暂无目录</div>';
        return;
    }
    
    elements.tocTree.innerHTML = '';
    state.tocItems.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = `toc-item level-${item.level}`;
        itemEl.innerHTML = `
            <span class="toc-item-title">${item.title}</span>
            <span class="toc-item-page">第 ${item.page} 页</span>
        `;
        itemEl.addEventListener('click', () => {
            const targetPage = item.page + state.config.pageOffset;
            if (targetPage >= 1 && targetPage <= state.totalPages) {
                state.currentPage = targetPage;
                renderPage(state.currentPage);
                updatePageInfo();
                toggleTocDrawer();
            }
        });
        elements.tocTree.appendChild(itemEl);
    });
}

// ===== 识别目录 =====
async function recognizeToc() {
    if (!state.config.apiKey) {
        alert('请先在设置中配置 API Key');
        openSettings();
        return;
    }
    
    showLoading('正在识别目录...');
    
    try {
        // 提取前几页的文本内容
        const maxPages = Math.min(10, state.totalPages);
        let extractedText = '';
        
        for (let i = 1; i <= maxPages; i++) {
            const page = await state.pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            extractedText += `\n=== 第 ${i} 页 ===\n${pageText}\n`;
            page.cleanup();
        }
        
        // 调用 API
        const prompt = `请分析以下 PDF 文档的前几页内容，识别出目录结构。

要求：
1. 识别标题、页码和层级关系
2. 返回 JSON 格式：{"items": [{"title": "标题", "page": 页码, "level": 层级}]}
3. level 从 1 开始，1 表示一级标题，2 表示二级标题，以此类推
4. 只返回 JSON，不要其他说明

文档内容：
${extractedText}`;
        
        const response = await callAPI(prompt);
        const tocData = parseAPIResponse(response);
        
        if (tocData && tocData.items && tocData.items.length > 0) {
            state.tocItems = tocData.items;
            renderTocTree();
            hideLoading();
            alert(`成功识别 ${tocData.items.length} 个目录项`);
        } else {
            hideLoading();
            alert('未能识别出目录，请手动编辑');
        }
    } catch (error) {
        console.error('识别目录失败:', error);
        hideLoading();
        alert('识别目录失败: ' + error.message);
    }
}

// ===== 调用 API =====
async function callAPI(prompt) {
    const response = await fetch(state.config.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.config.apiKey}`
        },
        body: JSON.stringify({
            model: state.config.model,
            input: prompt
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API 请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // 解析 Responses API 格式
    if (data.output && Array.isArray(data.output)) {
        // 查找 message 类型的输出
        const messageOutput = data.output.find(item => item.type === 'message');
        if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
            const textContent = messageOutput.content.find(c => c.type === 'output_text');
            if (textContent && textContent.text) {
                return textContent.text;
            }
        }
    }
    
    throw new Error('API 返回数据格式错误');
}

// ===== 解析 API 响应 =====
function parseAPIResponse(text) {
    try {
        // 提取 JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
    } catch (error) {
        console.error('解析 API 响应失败:', error);
        return null;
    }
}

// ===== 测试 API 连接 =====
async function testApiConnection() {
    if (!state.config.apiKey) {
        showStatus('请先输入 API Key', 'error');
        return;
    }
    
    elements.testApiBtn.disabled = true;
    elements.testApiBtn.textContent = '测试中...';
    
    try {
        await callAPI('Hello');
        showStatus('API 连接成功', 'success');
    } catch (error) {
        showStatus('API 连接失败: ' + error.message, 'error');
    } finally {
        elements.testApiBtn.disabled = false;
        elements.testApiBtn.textContent = '测试连接';
    }
}

// ===== 显示状态消息 =====
function showStatus(message, type) {
    elements.apiStatus.textContent = message;
    elements.apiStatus.className = `status-message ${type}`;
    setTimeout(() => {
        elements.apiStatus.className = 'status-message';
    }, 3000);
}

// ===== 更新偏移量 =====
function updateOffset() {
    const printedPage = parseInt(elements.printedPageInput.value) || 1;
    const pdfPage = parseInt(elements.pdfPageInput.value) || 1;
    const offset = pdfPage - printedPage;
    elements.offsetValue.textContent = offset;
    state.config.pageOffset = offset;
    saveConfig();
}

// ===== 打开设置 =====
function openSettings() {
    elements.settingsScreen.classList.remove('hidden');
}

// ===== 关闭设置 =====
function closeSettings() {
    elements.settingsScreen.classList.add('hidden');
}

// ===== 打开目录编辑模态框 =====
function openTocEditModal() {
    elements.tocEditModal.classList.remove('hidden');
    renderTocEditTable();
}

// ===== 关闭目录编辑模态框 =====
function closeTocEditModal() {
    elements.tocEditModal.classList.add('hidden');
}

// ===== 渲染目录编辑表格 =====
function renderTocEditTable() {
    elements.tocTableBody.innerHTML = '';
    
    state.tocItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'toc-table-row';
        row.innerHTML = `
            <input type="text" value="${item.title}" data-index="${index}" data-field="title">
            <input type="number" value="${item.page}" min="1" max="${state.totalPages}" data-index="${index}" data-field="page">
            <input type="number" value="${item.level}" min="1" max="5" data-index="${index}" data-field="level">
            <button data-index="${index}">删除</button>
        `;
        
        // 绑定事件
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                if (field === 'title') {
                    state.tocItems[idx][field] = e.target.value;
                } else {
                    state.tocItems[idx][field] = parseInt(e.target.value) || 1;
                }
            });
        });
        
        row.querySelector('button').addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            state.tocItems.splice(idx, 1);
            renderTocEditTable();
        });
        
        elements.tocTableBody.appendChild(row);
    });
}

// ===== 添加目录项 =====
function addTocItem() {
    state.tocItems.push({
        title: '新条目',
        page: 1,
        level: 1
    });
    renderTocEditTable();
}

// ===== 保存目录编辑 =====
function saveTocEdits() {
    renderTocTree();
    closeTocEditModal();
}

// ===== 导入目录 JSON =====
async function importTocJson() {
    try {
        const result = await window.electronAPI.openFile();
        if (result && result.name.endsWith('.json')) {
            const text = new TextDecoder().decode(result.data);
            const data = JSON.parse(text);
            if (data.items && Array.isArray(data.items)) {
                state.tocItems = data.items;
                renderTocEditTable();
                alert('导入成功');
            } else {
                alert('JSON 格式错误');
            }
        }
    } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败: ' + error.message);
    }
}

// ===== 导出目录 JSON =====
async function exportTocJson() {
    try {
        const data = { items: state.tocItems };
        const json = JSON.stringify(data, null, 2);
        const filePath = await window.electronAPI.saveFile({
            defaultPath: `${state.fileName}-toc.json`
        });
        
        if (filePath) {
            const encoder = new TextEncoder();
            const uint8Array = encoder.encode(json);
            await window.electronAPI.writeFile(filePath, uint8Array);
            alert('导出成功');
        }
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败: ' + error.message);
    }
}

// ===== 导出带目录的 PDF =====
async function exportPdfWithToc() {
    if (state.tocItems.length === 0) {
        alert('请先识别或编辑目录');
        return;
    }
    
    showLoading('正在生成 PDF...');
    
    try {
        // 动态导入 pdf-lib
        const { PDFDocument, PDFName, PDFString, PDFNumber } = await import('../../../node_modules/pdf-lib/dist/pdf-lib.esm.js');
        
        // 加载 PDF
        const pdfDoc = await PDFDocument.load(state.fileData);
        const pages = pdfDoc.getPages();
        
        // 应用偏移量
        const adjustedItems = state.tocItems.map(item => ({
            title: item.title,
            page: item.page + state.config.pageOffset,
            level: item.level
        })).filter(item => item.page >= 1 && item.page <= pages.length);
        
        // 添加目录
        addOutlinesToPdf(pdfDoc, pages, adjustedItems, PDFName, PDFString, PDFNumber);
        
        // 保存
        const pdfBytes = await pdfDoc.save();
        const filePath = await window.electronAPI.saveFile({
            defaultPath: `${state.fileName}-with-toc.pdf`
        });
        
        if (filePath) {
            await window.electronAPI.writeFile(filePath, pdfBytes);
            hideLoading();
            alert('导出成功');
        } else {
            hideLoading();
        }
    } catch (error) {
        console.error('导出失败:', error);
        hideLoading();
        alert('导出失败: ' + error.message);
    }
}

// ===== 添加 PDF 目录 =====
function addOutlinesToPdf(pdfDoc, pages, items, PDFName, PDFString, PDFNumber) {
    const pdfNull = null;
    
    // 构建树形结构
    const root = { children: [], level: 0 };
    const stack = [root];
    
    items.forEach((item) => {
        let level = Math.max(1, item.level);
        if (level > stack.length) {
            level = stack.length;
        }
        while (stack.length > level) {
            stack.pop();
        }
        const node = {
            title: item.title,
            page: item.page,
            level,
            children: [],
            parent: stack[stack.length - 1]
        };
        node.parent.children.push(node);
        stack[level] = node;
    });
    
    // 收集所有节点
    const allNodes = [];
    function collectNodes(nodes) {
        nodes.forEach((node) => {
            allNodes.push(node);
            if (node.children.length) {
                collectNodes(node.children);
            }
        });
    }
    collectNodes(root.children);
    
    // 创建目录字典
    allNodes.forEach((node) => {
        const page = pages[node.page - 1];
        const dest = pdfDoc.context.obj([
            page.ref,
            PDFName.of('XYZ'),
            0,
            page.getHeight(),
            pdfNull
        ]);
        const dict = pdfDoc.context.obj({
            Title: PDFString.of(node.title),
            Dest: dest
        });
        node.dict = dict;
        node.ref = pdfDoc.context.register(dict);
    });
    
    // 链接兄弟节点
    function linkSiblings(nodes) {
        nodes.forEach((node, index) => {
            node.prev = index > 0 ? nodes[index - 1] : null;
            node.next = index < nodes.length - 1 ? nodes[index + 1] : null;
            if (node.children.length) {
                linkSiblings(node.children);
            }
        });
    }
    linkSiblings(root.children);
    
    // 计算子节点数量
    function countDescendants(node) {
        let count = 0;
        node.children.forEach((child) => {
            count += 1 + countDescendants(child);
        });
        node.descCount = count;
        return count;
    }
    root.children.forEach((node) => countDescendants(node));
    
    // 创建 Outlines
    const outlineDict = pdfDoc.context.obj({ Type: PDFName.of('Outlines') });
    const outlineRef = pdfDoc.context.register(outlineDict);
    pdfDoc.catalog.set(PDFName.of('Outlines'), outlineRef);
    
    if (root.children.length) {
        outlineDict.set(PDFName.of('First'), root.children[0].ref);
        outlineDict.set(PDFName.of('Last'), root.children[root.children.length - 1].ref);
        outlineDict.set(PDFName.of('Count'), PDFNumber.of(allNodes.length));
    }
    
    // 设置节点关系
    allNodes.forEach((node) => {
        const dict = node.dict;
        dict.set(PDFName.of('Parent'), node.parent === root ? outlineRef : node.parent.ref);
        if (node.prev) {
            dict.set(PDFName.of('Prev'), node.prev.ref);
        }
        if (node.next) {
            dict.set(PDFName.of('Next'), node.next.ref);
        }
        if (node.children.length) {
            dict.set(PDFName.of('First'), node.children[0].ref);
            dict.set(PDFName.of('Last'), node.children[node.children.length - 1].ref);
            dict.set(PDFName.of('Count'), PDFNumber.of(node.descCount));
        }
    });
}

// ===== 显示加载提示 =====
function showLoading(text) {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
}

// ===== 隐藏加载提示 =====
function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

// ===== 启动应用 =====
init();
