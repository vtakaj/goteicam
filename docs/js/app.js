class App {
    constructor() {
        this.cameraManager = new CameraManager();
        this.imageUploader = new ImageUploader();
        this.resultModal = new ResultModal('resultModal');
        this.currentImageData = null;
        
        this.elements = {
            video: document.getElementById('video'),
            canvas: document.getElementById('canvas'),
            previewContainer: document.getElementById('previewContainer'),
            previewImage: document.getElementById('previewImage'),
            locationInput: document.getElementById('locationInput'),
            loading: document.getElementById('loading'),
            captureBtn: document.getElementById('captureBtn'),
            retakeBtn: document.getElementById('retakeBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            switchCameraBtn: document.getElementById('switchCamera'),
            fileUploadBtn: document.getElementById('fileUploadBtn'),
            fileInput: document.getElementById('fileInput')
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.initCamera();
        this.setupServiceWorker();
    }

    async initCamera() {
        const result = await this.cameraManager.init(this.elements.video, this.elements.canvas);
        
        if (result.success) {
            if (result.hasMultipleCameras) {
                this.elements.switchCameraBtn.style.display = 'flex';
            }
        } else {
            this.handleCameraError(result.error);
        }
    }

    handleCameraError(error) {
        if (error === 'PERMISSION_DENIED') {
            this.showPermissionGuide();
        } else if (error === 'OVERCONSTRAINED') {
            this.fallbackToBasicConstraints();
        } else {
            this.showError(error);
        }
    }

    async fallbackToBasicConstraints() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.elements.video.srcObject = stream;
            this.cameraManager.currentStream = stream;
        } catch (err) {
            this.showCameraFallback();
        }
    }

    showCameraFallback() {
        this.elements.captureBtn.style.display = 'none';
        this.elements.fileUploadBtn.style.display = 'block';
    }

    showPermissionGuide() {
        const guideHTML = `
            <div style="background: white; padding: 20px; margin: 20px; border-radius: 10px; text-align: center;">
                <h2 style="color: #e74c3c;">📷 カメラへのアクセスが必要です</h2>
                <p style="margin: 20px 0;">このアプリを使用するにはカメラへのアクセス許可が必要です。</p>
                
                <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>設定方法:</h3>
                    <h4>Safari (iPad/iPhone)の場合:</h4>
                    <ol>
                        <li>設定アプリを開く</li>
                        <li>「Safari」を選択</li>
                        <li>「カメラ」を「許可」に変更</li>
                        <li>このページを再読み込み</li>
                    </ol>
                    
                    <h4>Chrome/Edgeの場合:</h4>
                    <ol>
                        <li>アドレスバーの鍵アイコンをクリック</li>
                        <li>「カメラ」を「許可」に変更</li>
                        <li>ページを再読み込み</li>
                    </ol>
                </div>
                
                <button class="btn btn-primary" onclick="location.reload()">再読み込み</button>
            </div>
        `;
        document.querySelector('.camera-container').innerHTML = guideHTML;
    }

    showError(message) {
        const errorHTML = `
            <div style="background: white; padding: 20px; margin: 20px; border-radius: 10px; text-align: center;">
                <h2 style="color: #e74c3c;">⚠️ エラー</h2>
                <p style="margin: 20px 0;">${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">再試行</button>
            </div>
        `;
        document.querySelector('.camera-container').innerHTML = errorHTML;
    }

    setupEventListeners() {
        this.elements.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.elements.retakeBtn.addEventListener('click', () => this.retakePhoto());
        this.elements.uploadBtn.addEventListener('click', () => this.uploadPhoto());
        this.elements.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        this.elements.fileUploadBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        window.closeResult = () => this.resultModal.hide();
    }

    capturePhoto() {
        try {
            this.currentImageData = this.cameraManager.capturePhoto();
            this.showPreview(this.currentImageData);
        } catch (err) {
            alert('撮影エラー: ' + err.message);
        }
    }

    showPreview(imageData) {
        this.elements.previewImage.src = imageData;
        this.elements.previewContainer.style.display = 'block';
        this.elements.retakeBtn.style.display = 'block';
        this.elements.uploadBtn.style.display = 'block';
        this.elements.captureBtn.style.display = 'none';
    }

    retakePhoto() {
        this.elements.previewContainer.style.display = 'none';
        this.elements.retakeBtn.style.display = 'none';
        this.elements.uploadBtn.style.display = 'none';
        this.elements.captureBtn.style.display = 'block';
        this.currentImageData = null;
    }

    async uploadPhoto() {
        if (!this.currentImageData) {
            alert('撮影された画像がありません');
            return;
        }

        const location = this.elements.locationInput.value;
        this.elements.loading.style.display = 'block';

        try {
            const result = await this.imageUploader.getDemoResult();
            this.elements.loading.style.display = 'none';
            this.resultModal.show(result);
            this.resetToInitialState();
        } catch (err) {
            this.elements.loading.style.display = 'none';
            alert('アップロードエラー: ' + err.message);
        }
    }

    async switchCamera() {
        const result = await this.cameraManager.switchCamera();
        if (!result.success) {
            alert('カメラの切り替えに失敗しました');
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentImageData = e.target.result;
                this.showPreview(this.currentImageData);
                this.elements.fileUploadBtn.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    resetToInitialState() {
        this.elements.previewContainer.style.display = 'none';
        this.elements.retakeBtn.style.display = 'none';
        this.elements.uploadBtn.style.display = 'none';
        this.elements.captureBtn.style.display = 'block';
        this.elements.locationInput.value = '';
        this.currentImageData = null;
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});