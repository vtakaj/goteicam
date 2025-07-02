class ImageUploader {
    constructor() {
        this.apiEndpoint = 'https://your-server.com/upload';
    }

    async uploadImage(imageData, location) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    location: location || '未入力',
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            console.error('アップロードエラー:', err);
            throw err;
        }
    }

    getDemoResult() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    score: 65,
                    improvements: [
                        { category: '整理', issue: '不要な工具が作業台に放置されています' },
                        { category: '整頓', issue: '工具の定位置表示がありません' },
                        { category: '清掃', issue: '床面に切削屑が散乱しています' }
                    ]
                });
            }, 2000);
        });
    }
}

class ResultModal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.resultDetails = document.getElementById('resultDetails');
    }

    show(data) {
        this.resultDetails.innerHTML = `
            <p><strong>スコア:</strong> ${data.score}/100点</p>
            <h3>改善が必要な項目:</h3>
            ${data.improvements.map(item => `
                <div class="result-item">
                    <strong>${item.category}</strong><br>
                    ${item.issue}
                </div>
            `).join('')}
            <p style="margin-top: 20px;">
                詳細な分析結果はSlackに送信されました。
            </p>
        `;
        this.modal.style.display = 'block';
    }

    hide() {
        this.modal.style.display = 'none';
    }
}

window.ImageUploader = ImageUploader;
window.ResultModal = ResultModal;