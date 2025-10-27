// Main Photo Editor Application
class PhotoEditor {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = 'select';
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = '#000000';
        this.brushSize = 10;
        this.zoomLevel = 1;
        this.history = [];
        this.historyIndex = -1;
        this.currentImage = null;
        this.adjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            exposure: 0,
            temperature: 0
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.showLoadingScreen();
        
        // Simulate loading completion
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showToast('Photo Editor loaded successfully!', 'success');
        }, 2000);
    }

    setupEventListeners() {
        // File operations
        document.getElementById('openFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.loadImage(e.target.files[0]);
        });

        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.newProject();
        });

        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTool(e.currentTarget.dataset.tool);
            });
        });

        // Adjustment controls
        document.querySelectorAll('.slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.handleAdjustmentChange(e.target.id, e.target.value);
            });
        });

        // Filter presets
        document.querySelectorAll('.filter-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.applyFilter(e.currentTarget.dataset.filter);
            });
        });

        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.zoomIn();
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.zoomOut();
        });

        document.getElementById('resetZoomBtn').addEventListener('click', () => {
            this.resetZoom();
        });

        // Color picker
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.setColor(e.target.value);
        });

        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.setColor(e.currentTarget.dataset.color);
            });
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
        this.canvas.addEventListener('touchmove', (e) => this.draw(e.touches[0]));
        this.canvas.addEventListener('touchend', () => this.stopDrawing());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });

        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        document.getElementById('exportConfirmBtn').addEventListener('click', () => {
            this.exportImage();
        });

        // History controls
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });

        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // Layer controls
        document.getElementById('addLayerBtn').addEventListener('click', () => {
            this.addLayer();
        });
    }

    setupCanvas() {
        // Set initial canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Clear canvas with transparent background
        this.ctx.fillStyle = 'transparent';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add checkerboard pattern for transparency
        this.drawCheckerboard();
    }

    drawCheckerboard() {
        const size = 20;
        for (let y = 0; y < this.canvas.height; y += size) {
            for (let x = 0; x < this.canvas.width; x += size) {
                const isEven = Math.floor(x / size + y / size) % 2 === 0;
                this.ctx.fillStyle = isEven ? '#e5e5e5' : '#d5d5d5';
                this.ctx.fillRect(x, y, size, size);
            }
        }
    }

    showLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Add close event
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    loadImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                
                // Resize canvas to image dimensions
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                
                // Draw image on canvas
                this.ctx.drawImage(img, 0, 0);
                
                // Update UI
                this.updateImageInfo();
                this.addHistoryState('Image Loaded');
                this.showToast('Image loaded successfully!', 'success');
                
                // Reset adjustments
                this.resetAdjustments();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    newProject() {
        if (!confirm('Are you sure you want to start a new project? Any unsaved changes will be lost.')) {
            return;
        }

        this.setupCanvas();
        this.currentImage = null;
        this.resetAdjustments();
        this.clearHistory();
        this.updateImageInfo();
        this.showToast('New project created', 'info');
    }

    selectTool(tool) {
        // Update active tool button
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        this.currentTool = tool;
        this.updateToolInfo();

        // Show tool-specific options
        this.showToolOptions(tool);
    }

    showToolOptions(tool) {
        const propertyControls = document.getElementById('propertyControls');
        
        // Hide all tool options first
        propertyControls.innerHTML = '';

        switch(tool) {
            case 'brush':
                propertyControls.innerHTML = `
                    <div class="control-group">
                        <label>Brush Size</label>
                        <input type="range" id="brushSize" min="1" max="100" value="${this.brushSize}" class="slider">
                        <span class="value" id="brushSizeValue">${this.brushSize}px</span>
                    </div>
                    <div class="control-group">
                        <label>Brush Hardness</label>
                        <input type="range" id="brushHardness" min="0" max="100" value="50" class="slider">
                        <span class="value" id="brushHardnessValue">50%</span>
                    </div>
                    <div class="control-group">
                        <label>Opacity</label>
                        <input type="range" id="opacity" min="0" max="100" value="100" class="slider">
                        <span class="value" id="opacityValue">100%</span>
                    </div>
                `;
                break;

            case 'text':
                propertyControls.innerHTML = `
                    <div class="control-group">
                        <label>Font Size</label>
                        <input type="range" id="fontSize" min="8" max="72" value="24" class="slider">
                        <span class="value" id="fontSizeValue">24px</span>
                    </div>
                    <div class="control-group">
                        <label>Font Family</label>
                        <select id="fontFamily">
                            <option value="Arial">Arial</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Verdana">Verdana</option>
                        </select>
                    </div>
                `;
                break;

            case 'shapes':
                propertyControls.innerHTML = `
                    <div class="control-group">
                        <label>Shape Type</label>
                        <select id="shapeType">
                            <option value="rectangle">Rectangle</option>
                            <option value="circle">Circle</option>
                            <option value="line">Line</option>
                            <option value="triangle">Triangle</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Stroke Width</label>
                        <input type="range" id="strokeWidth" min="1" max="20" value="2" class="slider">
                        <span class="value" id="strokeWidthValue">2px</span>
                    </div>
                `;
                break;
        }

        // Re-attach event listeners for new controls
        this.setupDynamicEventListeners();
    }

    setupDynamicEventListeners() {
        // Brush size
        const brushSizeSlider = document.getElementById('brushSize');
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', (e) => {
                this.brushSize = parseInt(e.target.value);
                document.getElementById('brushSizeValue').textContent = `${this.brushSize}px`;
            });
        }

        // Other dynamic controls would be added here...
    }

    startDrawing(e) {
        if (!this.currentImage && this.currentTool !== 'brush') {
            this.showToast('Please load an image first', 'warning');
            return;
        }

        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = (e.clientX - rect.left) / this.zoomLevel;
        this.lastY = (e.clientY - rect.top) / this.zoomLevel;

        switch(this.currentTool) {
            case 'brush':
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                break;
            case 'eraser':
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                break;
        }
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) / this.zoomLevel;
        const currentY = (e.clientY - rect.top) / this.zoomLevel;

        switch(this.currentTool) {
            case 'brush':
                this.ctx.lineTo(currentX, currentY);
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.lineWidth = this.brushSize;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.stroke();
                break;

            case 'eraser':
                this.ctx.lineTo(currentX, currentY);
                this.ctx.lineWidth = this.brushSize;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
                break;
        }

        this.lastX = currentX;
        this.lastY = currentY;
    }

    stopDrawing() {
        if (!this.isDrawing) return;

        this.isDrawing = false;
        this.ctx.closePath();

        if (this.currentTool === 'eraser') {
            this.ctx.restore();
        }

        // Add to history if we made changes
        if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
            this.addHistoryState(`${this.currentTool.charAt(0).toUpperCase() + this.currentTool.slice(1)} Drawing`);
        }
    }

    handleAdjustmentChange(adjustment, value) {
        this.adjustments[adjustment] = parseInt(value);
        
        // Update display value
        document.getElementById(`${adjustment}Value`).textContent = value;
        
        // Apply adjustments to image
        this.applyAdjustments();
    }

    applyAdjustments() {
        if (!this.currentImage) return;

        // Redraw original image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.currentImage, 0, 0);

        // Apply filters using CSS filters (simplified)
        const filterString = this.generateFilterString();
        this.canvas.style.filter = filterString;
    }

    generateFilterString() {
        const { brightness, contrast, saturation } = this.adjustments;
        return `
            brightness(${(brightness + 100) / 100})
            contrast(${(contrast + 100) / 100})
            saturate(${(saturation + 100) / 100})
        `;
    }

    applyFilter(filterName) {
        if (!this.currentImage) {
            this.showToast('Please load an image first', 'warning');
            return;
        }

        // Update active filter button
        document.querySelectorAll('.filter-preset').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filterName}"]`).classList.add('active');

        // Apply filter (this would be more sophisticated in a real implementation)
        const filters = {
            'none': '',
            'vintage': 'sepia(0.5) contrast(1.2)',
            'blackWhite': 'grayscale(1)',
            'clarendon': 'contrast(1.2) saturate(1.35)',
            'moon': 'grayscale(1) contrast(1.1) brightness(1.1)',
            'lark': 'contrast(0.9) brightness(1.1) saturate(1.1)',
            'reyes': 'sepia(0.22) contrast(0.85) brightness(1.1) saturate(0.75)',
            'juno': 'contrast(1.15) brightness(1.1) saturate(1.1) hue-rotate(-10deg)'
        };

        this.canvas.style.filter = filters[filterName] || '';
        this.addHistoryState(`Applied ${filterName} filter`);
        this.showToast(`Applied ${filterName} filter`, 'success');
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel * 1.2, 5);
        this.updateZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.1);
        this.updateZoom();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.updateZoom();
    }

    updateZoom() {
        document.getElementById('zoomLevel').textContent = `${Math.round(this.zoomLevel * 100)}%`;
        this.canvas.style.transform = `scale(${this.zoomLevel})`;
    }

    setColor(color) {
        this.currentColor = color;
        document.getElementById('colorPicker').value = color;
        document.getElementById('currentColor').textContent = color;

        // Update active color preset
        document.querySelectorAll('.color-preset').forEach(preset => {
            preset.classList.remove('active');
        });
        document.querySelector(`[data-color="${color}"]`).classList.add('active');
    }

    handleKeyboard(e) {
        // Prevent default behavior for shortcuts
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
        }

        switch(e.key) {
            case 'z':
                if (e.ctrlKey || e.metaKey) {
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                }
                break;
            case 'y':
                if (e.ctrlKey || e.metaKey) {
                    this.redo();
                }
                break;
            case '=':
            case '+':
                if (e.ctrlKey || e.metaKey) {
                    this.zoomIn();
                }
                break;
            case '-':
                if (e.ctrlKey || e.metaKey) {
                    this.zoomOut();
                }
                break;
            case '0':
                if (e.ctrlKey || e.metaKey) {
                    this.resetZoom();
                }
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
                if (!e.ctrlKey && !e.metaKey) {
                    const tools = ['select', 'crop', 'rotate', 'brush', 'text', 'shapes', 'eraser'];
                    const toolIndex = parseInt(e.key) - 1;
                    if (tools[toolIndex]) {
                        this.selectTool(tools[toolIndex]);
                    }
                }
                break;
        }
    }

    addHistoryState(description) {
        // Remove any future states if we're not at the end
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current canvas state to history
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history.push({
            description,
            imageData,
            timestamp: new Date()
        });
        
        this.historyIndex = this.history.length - 1;
        this.updateHistoryUI();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreHistoryState();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreHistoryState();
        }
    }

    restoreHistoryState() {
        const state = this.history[this.historyIndex];
        this.ctx.putImageData(state.imageData, 0, 0);
        this.updateHistoryUI();
    }

    updateHistoryUI() {
        const historyPanel = document.getElementById('historyPanel');
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');

        // Update buttons
        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;

        // Update history list
        historyPanel.innerHTML = '';
        this.history.forEach((state, index) => {
            const item = document.createElement('div');
            item.className = `history-item ${index === this.historyIndex ? 'active' : ''}`;
            item.innerHTML = `
                <i class="fas fa-image"></i>
                <span>${state.description}</span>
            `;
            item.addEventListener('click', () => {
                this.historyIndex = index;
                this.restoreHistoryState();
            });
            historyPanel.appendChild(item);
        });
    }

    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.updateHistoryUI();
        this.showToast('History cleared', 'info');
    }

    addLayer() {
        this.showToast('New layer added', 'success');
        // Layer implementation would go here
    }

    showExportModal() {
        if (!this.currentImage) {
            this.showToast('Please load an image first', 'warning');
            return;
        }

        document.getElementById('exportModal').classList.add('active');
    }

    exportImage() {
        const format = document.getElementById('exportFormat').value;
        const quality = parseInt(document.getElementById('exportQuality').value) / 100;
        const scale = parseInt(document.getElementById('exportScale').value) / 100;

        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        exportCanvas.width = this.canvas.width * scale;
        exportCanvas.height = this.canvas.height * scale;
        
        // Draw current canvas content to export canvas
        exportCtx.drawImage(this.canvas, 0, 0, exportCanvas.width, exportCanvas.height);

        // Convert to data URL
        const dataURL = exportCanvas.toDataURL(`image/${format}`, quality);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `edited-image.${format}`;
        link.href = dataURL;
        link.click();

        // Close modal
        document.getElementById('exportModal').classList.remove('active');
        this.showToast('Image exported successfully!', 'success');
    }

    updateImageInfo() {
        const dimensions = document.getElementById('imageDimensions');
        const size = document.getElementById('imageSize');

        if (this.currentImage) {
            dimensions.textContent = `${this.canvas.width} × ${this.canvas.height} px`;
            // Calculate approximate file size
            const approximateSize = Math.round((this.canvas.width * this.canvas.height * 4) / 1024);
            size.textContent = `~${approximateSize} KB`;
        } else {
            dimensions.textContent = 'No image loaded';
            size.textContent = '-';
        }
    }

    updateToolInfo() {
        document.getElementById('toolInfo').textContent = `Tool: ${this.currentTool.charAt(0).toUpperCase() + this.currentTool.slice(1)}`;
    }

    resetAdjustments() {
        // Reset all adjustment values
        Object.keys(this.adjustments).forEach(adjustment => {
            this.adjustments[adjustment] = 0;
            const slider = document.getElementById(adjustment);
            if (slider) {
                slider.value = 0;
                document.getElementById(`${adjustment}Value`).textContent = '0';
            }
        });

        // Reset canvas filter
        this.canvas.style.filter = '';
    }

    updateCursorPosition(x, y) {
        document.getElementById('cursorPosition').textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
    }
}

// Initialize the photo editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.photoEditor = new PhotoEditor();
});
