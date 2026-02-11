export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const TOKEN = process.env.GIT_TOKEN;
    const REPO_OWNER = "你的GitHub帳號"; // 修改這裡
    const REPO_NAME = "你的專案名稱";    // 修改這裡
    const FILE_PATH = "soss995.json";    // 儲存的檔名

    try {
        // 1. 嘗試獲取現有的檔案內容 (取得 SHA 以便更新)
        let sha;
        let currentContent = [];

        const getFileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${TOKEN}` }
        });

        if (getFileRes.ok) {
            const fileData = await getFileRes.json();
            sha = fileData.sha;
            // 解碼 Base64 並轉回 JSON
            currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
        }

        // 2. 加入新資料
        currentContent.push(req.body);

        // 3. 將資料轉為 Base64 並推送到 GitHub
        const updatedBody = {
            message: `Update soss995.json - ${new Date().toLocaleString()}`,
            content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64'),
            sha: sha // 如果檔案存在，必須提供 SHA 才能更新
        };

        const putFileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedBody)
        });

        if (putFileRes.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errorData = await putFileRes.json();
            return res.status(500).json({ error: 'GitHub API 寫入失敗', detail: errorData });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}