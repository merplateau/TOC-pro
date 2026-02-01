#!/bin/bash

echo "开始构建 PDF Reader Pro..."

# 检查依赖
if ! command -v pnpm &> /dev/null; then
    echo "错误: 未找到 pnpm，请先安装 pnpm"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    pnpm install
fi

# 构建应用
echo "构建 macOS 应用..."
pnpm build:dir

echo "构建完成！"
echo "应用位置: dist/mac-arm64/PDF Reader Pro.app"
