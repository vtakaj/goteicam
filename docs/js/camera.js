class CameraManager {
    constructor() {
        this.currentStream = null;
        this.facingMode = 'environment';
        this.video = null;
        this.canvas = null;
        this.ctx = null;
    }

    init(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        return this.startCamera();
    }

    async startCamera() {
        try {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' }).catch(() => null);
            
            if (permissionStatus && permissionStatus.state === 'denied') {
                throw new Error('PERMISSION_DENIED');
            }
            
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
            }
            
            const constraints = {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };
            
            this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.currentStream;
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            return {
                success: true,
                hasMultipleCameras: videoDevices.length > 1
            };
            
        } catch (err) {
            console.error('カメラエラー:', err);
            return {
                success: false,
                error: this.getErrorMessage(err)
            };
        }
    }

    getErrorMessage(err) {
        if (err.message === 'PERMISSION_DENIED' || err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            return 'PERMISSION_DENIED';
        } else if (err.name === 'NotFoundError') {
            return 'カメラが見つかりません。デバイスにカメラが接続されているか確認してください。';
        } else if (err.name === 'NotReadableError') {
            return 'カメラは他のアプリで使用中です。他のアプリを終了してから再度お試しください。';
        } else if (err.name === 'OverconstrainedError') {
            return 'OVERCONSTRAINED';
        } else {
            return 'カメラへのアクセスに失敗しました: ' + err.message;
        }
    }

    async switchCamera() {
        this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
        return await this.startCamera();
    }

    capturePhoto() {
        if (!this.video || !this.canvas || !this.ctx) {
            throw new Error('カメラが初期化されていません');
        }

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.drawImage(this.video, 0, 0);
        
        return this.canvas.toDataURL('image/jpeg', 0.8);
    }

    stop() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
    }
}

window.CameraManager = CameraManager;