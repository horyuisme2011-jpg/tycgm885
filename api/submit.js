export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // 從 Vercel 環境變數抓取 Token
    const TOKEN = process.env.GIT_TOKEN;

    try {
        // 這裡示範將資料傳送到 GitHub Repo 的某個地方 (例如建立一個 Issue)
        // 你可以根據需求修改這裡的 fetch 目標
        const response = await fetch(`https://api.github.com/repos/你的帳號/你的倉庫/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                title: `[求助申請] ${req.body.reporter.name}`,
                body: JSON.stringify(req.body, null, 2)
            })
        });

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'GitHub API Error' });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}