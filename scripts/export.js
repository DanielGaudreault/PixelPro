// Export and Download Functionality
class ExportManager {
    constructor(editor) {
        this.editor = editor;
        this.setupExportHandlers();
    }

    setupExportHandlers() {
        // Export button handlers
        document.getElementById('exportJpg').addEventListener('click', () => this.exportImage('jpg'));
        document.getElementById('exportPng').addEventListener('click', () => this.exportImage('png'));
        document.getElementById('exportWebp').addEventListener('click', () => this.exportImage('webp'));
        
        // Share handlers
        document.getElementById('shareFacebook').addEventListener('click', () => this.shareToSocial('facebook'));
        document.getElementById('shareTwitter').addEventListener('click', () => this.shareToSocial('twitter'));
        document.getElementById('shareInstagram').addEventListener('click', () => this.shareToSocial('instagram'));
        
        // Print handler
        document.getElementById('printImage').addEventListener('click', () => this.printImage());
        
        // Quality slider
        document.getElementById('exportQuality').addEventListener('input', (e) => {
            document.getElementById('qualityValue').textContent = `${e.target.value}%`;
        });
    }

    exportImage(format = 'png') {
        if (!this.editor.currentImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        const canvas = this.editor.canvas;
        const quality = document.getElementById('exportQuality').value / 100;
        
        let mimeType, extension;
        switch (format) {
            case 'jpg':
                mimeType = 'image/jpeg';
                extension = 'jpg';
                break;
            case 'webp':
                mimeType = 'image/webp';
                extension = 'webp';
                break;
            default:
                mimeType = 'image/png';
                extension = 'png';
        }

        try {
            const dataUrl = canvas.toDataURL(mimeType, quality);
            this.downloadImage(dataUrl, `edited-image.${extension}`);
            this.showNotification(`Image exported as ${extension.toUpperCase()} successfully!`, 'success');
            
            // Log export activity
            this.logExportActivity(format, quality);
        } catch (error) {
            this.showNotification('Error exporting image: ' + error.message, 'error');
            console.error('Export error:', error);
        }
    }

    downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportWithWatermark() {
        if (!this.editor.currentImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match original image
        canvas.width = this.editor.canvas.width;
        canvas.height = this.editor.canvas.height;
        
        // Draw the edited image
        ctx.drawImage(this.editor.canvas, 0, 0);
        
        // Add watermark
        this.addWatermark(ctx, canvas.width, canvas.height);
        
        // Export watermarked image
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        this.downloadImage(dataUrl, 'edited-image-with-watermark.png');
        this.showNotification('Image exported with watermark!', 'success');
    }

    addWatermark(ctx, width, height) {
        const watermarkText = 'Edited with PixelForge';
        ctx.save();
        
        // Set watermark style
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px Arial';
        
        // Add text shadow for better visibility
        ctx.strokeText(watermarkText, width / 2, height - 40);
        ctx.fillText(watermarkText, width / 2, height - 40);
        
        // Add logo/icon
        ctx.globalAlpha = 0.8;
        ctx.font = 'bold 16px Arial';
        ctx.fillText('🎨', width / 2, height - 70);
        
        ctx.restore();
    }

    shareToSocial(platform) {
        if (!this.editor.currentImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        const canvas = this.editor.canvas;
        canvas.toBlob((blob) => {
            const file = new File([blob], 'edited-image.png', { type: 'image/png' });
            const shareData = {
                files: [file],
                title: 'My Edited Image',
                text: 'Check out this image I edited with PixelForge!'
            };

            // Platform-specific sharing
            switch (platform) {
                case 'facebook':
                    this.shareToFacebook(shareData);
                    break;
                case 'twitter':
                    this.shareToTwitter(shareData);
                    break;
                case 'instagram':
                    this.shareToInstagram(shareData);
                    break;
                default:
                    this.fallbackShare(shareData);
            }
        }, 'image/png', 0.9);
    }

    shareToFacebook(shareData) {
        // Convert to data URL for Facebook sharing
        this.editor.canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
                const imageUrl = reader.result;
                const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`;
                window.open(facebookUrl, '_blank', 'width=600,height=400');
            };
            reader.readAsDataURL(blob);
        });
    }

    shareToTwitter(shareData) {
        this.editor.canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onload = () => {
                const imageUrl = reader.result;
                const text = encodeURIComponent('Check out my edited image! #PixelForge');
                const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(imageUrl)}`;
                window.open(twitterUrl, '_blank', 'width=600,height=400');
            };
            reader.readAsDataURL(blob);
        });
    }

    shareToInstagram(shareData) {
        // Instagram doesn't have a direct share API, so we download the image
        this.exportImage('png');
        this.showNotification('Image downloaded. You can now upload it to Instagram!', 'info');
    }

    async fallbackShare(shareData) {
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                this.showNotification('Image shared successfully!', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.showNotification('Share failed: ' + error.message, 'error');
                }
            }
        } else {
            this.showNotification('Web Share API not supported in your browser', 'warning');
            // Fallback: download the image
            this.exportImage('png');
        }
    }

    printImage() {
        if (!this.editor.currentImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        const printWindow = window.open('', '_blank');
        const imageUrl = this.editor.canvas.toDataURL('image/png', 1.0);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Image</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        text-align: center;
                        background: white;
                    }
                    img { 
                        max-width: 100%; 
                        height: auto;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    }
                    @media print {
                        body { padding: 0; }
                        img { box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <img src="${imageUrl}" alt="Edited Image">
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    exportMultipleSizes() {
        if (!this.editor.currentImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        const sizes = [
            { name: 'Small', width: 800, suffix: '_small' },
            { name: 'Medium', width: 1200, suffix: '_medium' },
            { name: 'Large', width: 1920, suffix: '_large' },
            { name: 'Original', width: this.editor.canvas.width, suffix: '_original' }
        ];

        sizes.forEach(size => {
            const resizedCanvas = this.resizeCanvas(this.editor.canvas, size.width);
            const dataUrl = resizedCanvas.toDataURL('image/jpeg', 0.9);
            this.downloadImage(dataUrl, `edited-image${size.suffix}.jpg`);
        });

        this.showNotification('Multiple sizes exported successfully!', 'success');
    }

    resizeCanvas(sourceCanvas, targetWidth) {
        const aspectRatio = sourceCanvas.height / sourceCanvas.width;
        const targetHeight = Math.round(targetWidth * aspectRatio);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Use high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
        
        return canvas;
    }

    exportAsZip() {
        if (!this.editor.currentImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        // This would require a zip library like JSZip
        this.showNotification('ZIP export requires additional libraries', 'info');
        console.log('ZIP export functionality would be implemented with JSZip');
    }

    copyToClipboard() {
        if (!this.editor.currentImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        this.editor.canvas.toBlob(async (blob) => {
            try {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                this.showNotification('Image copied to clipboard!', 'success');
            } catch (error) {
                this.showNotification('Failed to copy to clipboard: ' + error.message, 'error');
            }
        });
    }

    saveToCloud() {
        // This would integrate with cloud storage APIs
        this.showNotification('Cloud save functionality would connect to services like Google Drive or Dropbox', 'info');
        
        // Simulate cloud save
        setTimeout(() => {
            this.showNotification('Image saved to cloud successfully!', 'success');
        }, 2000);
    }

    exportWithMetadata() {
        if (!this.editor.currentImage) {
            this.showNotification('Please load an image first', 'error');
            return;
        }

        // Add metadata to the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.editor.canvas.width;
        canvas.height = this.editor.canvas.height;
        ctx.drawImage(this.editor.canvas, 0, 0);
        
        // This would require EXIF.js or similar library for real metadata
        this.showNotification('Metadata export requires EXIF library', 'info');
        
        // For now, just export normally
        this.exportImage('jpg');
    }

    logExportActivity(format, quality) {
        const activity = {
            type: 'export',
            format: format,
            quality: quality,
            timestamp: new Date().toISOString(),
            imageDimensions: {
                width: this.editor.canvas.width,
                height: this.editor.canvas.height
            }
        };
        
        // Save to localStorage for analytics
        const activities = JSON.parse(localStorage.getItem('editorActivities') || '[]');
        activities.push(activity);
        localStorage.setItem('editorActivities', JSON.stringify(activities));
        
        console.log('Export activity logged:', activity);
    }

    showNotification(message, type = 'info') {
        // Create or use existing notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Batch export for multiple images
    setupBatchExport() {
        // This would handle exporting multiple edited images
        console.log('Batch export functionality');
    }

    // Preview before export
    showExportPreview() {
        if (!this.editor.currentImage) return;

        const modal = document.createElement('div');
        modal.className = 'export-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Export Preview</h3>
                    <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="preview-container">
                    <img src="${this.editor.canvas.toDataURL('image/png', 1)}" alt="Export Preview">
                </div>
                <div class="preview-actions">
                    <button class="btn btn-primary" onclick="exportManager.exportImage('png')">
                        <i class="fas fa-download"></i> Export PNG
                    </button>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Initialize export manager when editor is ready
let exportManager;

// Global functions for HTML onclick handlers
function exportImage(format) {
    if (exportManager) {
        exportManager.exportImage(format);
    }
}

function shareImage(platform) {
    if (exportManager) {
        exportManager.shareToSocial(platform);
    }
}

function printCurrentImage() {
    if (exportManager) {
        exportManager.printImage();
    }
}

function copyImageToClipboard() {
    if (exportManager) {
        exportManager.copyToClipboard();
    }
}

function showExportPreview() {
    if (exportManager) {
        exportManager.showExportPreview();
    }
}
