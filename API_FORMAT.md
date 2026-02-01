# 火山方舟 Responses API 格式

根据文档，正确的 API 请求格式如下：

## 请求示例

```bash
curl --location "https://ark.cn-beijing.volces.com/api/v3/responses" \
--header "Authorization: Bearer $ARK_API_KEY" \
--header "Content-Type: application/json" \
--data '{
  "model": "doubao-seed-1-6-250615",
  "input": "你好啊"
}'
```

## 关键参数

- **model**: 模型名称（如 `doubao-seed-1-6-250615`）
- **input**: 用户输入的文本或消息数组

## 注意事项

1. 使用 `input` 字段，不是 `messages` 或 `prompt`
2. Authorization 使用 Bearer Token 格式
3. 模型名称可能需要确认（文档中显示的是 `doubao-seed-1-6-250615`，而不是 `doubao-seed-1-6-flash-250828`）
