// 测试 API 连接脚本
const API_KEY = '6b761a23-6613-4f9e-9830-2fc2d2353aa1';
const MODEL = 'doubao-seed-1-6-flash-250828';
const ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/responses';

async function testAPI() {
    console.log('Testing API connection...');
    
    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                input: 'Hello'
            })
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (response.ok && data.resp_data) {
            console.log('\n✓ API 连接成功！');
        } else {
            console.log('\n✗ API 返回异常');
        }
    } catch (error) {
        console.error('\n✗ API 连接失败:', error.message);
    }
}

testAPI();
