export default async function handler(req, res) {
    // 1. 只允許 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const TOKEN = process.env.GIT_TOKEN;
    const REPO_OWNER = "你的GitHub帳號"; // 這裡請務必填寫正確，例如 "my-name"
    const REPO_NAME = "你的專案名稱";    // 這裡請務必填寫正確，例如 "gm-site"
    const FILE_PATH = "soss995.json";

    // 檢查 Token 是否存在 (排除 Vercel 設定問題)
    if (!TOKEN) {
        console.error("錯誤: 找不到 GIT_TOKEN 環境變數");
        return res.status(500).json({ error: '伺服器未設定 Token' });
    }

    try {
        let sha = null;
        let currentContent = [];

        // 2. 獲取現有的檔案內容與 SHA
        const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const getFileRes = await fetch(getUrl, {
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-cache'
            }
        });

        if (getFileRes.ok) {
            const fileData = await getFileRes.json();
            sha = fileData.sha;
            // 解碼 Base64 內容
            const contentString = Buffer.from(fileData.content, 'base64').toString('utf-8');
            try {
                currentContent = JSON.parse(contentString);
                if (!Array.isArray(currentContent)) currentContent = [];
            } catch (e) {
                currentContent = []; // 如果檔案內容不是 JSON 格式，重置為空陣列
            }
        } else if (getFileRes.status !== 404) {
            // 如果不是 404 (找不到檔案)，而是其他錯誤 (如 401)，就報錯
            const errorMsg = await getFileRes.text();
            console.error("讀取 GitHub 失敗:", errorMsg);
            return res.status(getFileRes.status).json({ error: '無法读取舊資料', detail: errorMsg });
        }

        // 3. 插入新資料
        currentContent.push(req.body);

        // 4. 上傳更新到 GitHub
        const updatedBody = {
            message: `自動更新求助紀錄: ${new Date().toLocaleString()}`,
            content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64'),
            sha: sha // 重要：如果檔案已存在，沒有這個會報 409 Conflict
        };

        const putFileRes = await fetch(getUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(updatedBody)
        });

        const putResult = await putFileRes.json();

        if (putFileRes.ok) {
            return res.status(200).json({ success: true });
        } else {
            console.error("GitHub API 寫入報錯:", putResult);
            return res.status(putFileRes.status).json({
                error: 'GitHub 寫入失敗',
                message: putResult.message
            });
        }

    } catch (err) {
        console.error("伺服器運行錯誤:", err.message);
        return res.status(500).json({ error: 'Internal Server Error', detail: err.message });
    }
}