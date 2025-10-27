// Editing Tools (Crop, Rotate, Draw, Text, etc.)
class ToolManager {
    constructor(editor) {
        this.editor = editor;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.history = [];
        this.historyIndex = -1;
        this.setupTools();
    }

    setupTools() {
        this.setupToolHandlers();
        this.setupCanvasEvents();
        this.setupHistory();
    }

    setupToolHandlers() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.selectTool(tool);
            });
        });

        // Crop tool
        document.getElementById('cropApply').addEventListener('click', () => this.applyCrop());
        document.getElementById('cropCancel').addEventListener('click', () => this.cancelCrop());

        // Rotation
        document.getElementById('rotateLeft').addEventListener('click', () => this.rotate(-90));
        document.getElementById('rotateRight').addEventListener('click', () => this.rotate(90));
        document.getElementById('flipHorizontal').addEventListener('click', () => this.flip('horizontal'));
        document.getElementById('flipVertical').addEventListener('click', () => this.flip('vertical'));

        // Drawing tools
        document.getElementById('brushSize').addEventListener('input', (e) => {
            this.brushSize = e.target.value;
            document.getElementById('brushSizeValue').textContent = `${e.target.value}px`;
        });

        document.getElementById('brushColor').addEventListener('input', (e) => {
            this.brushColor = e.target.value;
        });

        // Text tool
        document.getElementById('addText').addEventListener('click', () => this.addText());
        document.getElementById('textColor').addEventListener('input', (e) => {
            this.textColor = e.target.value;
        });

        document.getElementById('textSize').addEventListener('input', (e) => {
            this.textSize = e.target.value;
            document.getElementById('textSizeValue').textContent = `${e.target.value}px`;
        });

        // Shape tools
        document.getElementById('addRectangle').addEventListener('click', () => this.addShape('rectangle'));
        document.getElementById('addCircle').addEventListener('click', () => this.addShape('circle'));
        document.getElementById('addLine').addEventListener('click', () => this.addShape('line'));

        // Undo/Redo
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('redo').addEventListener('click', () => this.redo());
    }

    setupCanvasEvents() {
        const canvas = this.editor.canvas;
        
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', () => this.handleMouseUp());
        canvas.addEventListener('mouseout', () => this.handleMouseUp());

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', () => this.handleMouseUp());

        // Prevent context menu
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    selectTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');

        // Update cursor
        this.updateCursor(tool);

        // Show/hide tool options
        this.showToolOptions(tool);

        console.log(`Selected tool: ${tool}`);
    }

    updateCursor(tool) {
        const canvas = this.editor.canvas;
        const cursors = {
            'select': 'default',
            'crop': 'crosshair',
            'brush': 'crosshair',
            'eraser': 'crosshair',
            'text': 'text',
            'shape': 'crosshair',
            'zoom': 'zoom-in'
        };
        canvas.style.cursor = cursors[tool] || 'default';
    }

    showToolOptions(tool) {
        // Hide all tool options
        document.querySelectorAll('.tool-options').forEach(options => {
            options.style.display = 'none';
        });

        // Show current tool options
        const options = document.getElementById(`${tool}Options`);
        if (options) {
            options.style.display = 'block';
        }
    }

    handleMouseDown(e) {
        if (!this.editor.currentImage) return;

        const rect = this.editor.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        this.isDrawing = true;

        switch (this.currentTool) {
            case 'brush':
                this.startDrawing();
                break;
            case 'eraser':
                this.startErasing();
                break;
            case 'crop':
                this.startCrop(this.lastX, this.lastY);
                break;
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing || !this.editor.currentImage) return;

        const rect = this.editor.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        switch (this.currentTool) {
            case 'brush':
                this.draw(currentX, currentY);
                break;
            case 'eraser':
                this.erase(currentX, currentY);
                break;
            case 'crop':
                this.updateCrop(currentX, currentY);
                break;
        }

        this.lastX = currentX;
        this.lastY = currentY;
    }

    handleMouseUp() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveToHistory();
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseDown(mouseEvent);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }

    // Drawing tools
    startDrawing() {
        const ctx = this.editor.canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.strokeStyle = this.brushColor || '#000000';
        ctx.lineWidth = this.brushSize || 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    draw(x, y) {
        const ctx = this.editor.canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    startErasing() {
        const ctx = this.editor.canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.strokeStyle = '#ffffff'; // White for erasing
        ctx.lineWidth = this.brushSize || 20;
        ctx.lineCap = 'round';
        ctx.globalCompositeOperation = 'destination-out';
    }

    erase(x, y) {
        const ctx = this.editor.canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        // Reset composite operation after erasing
        ctx.globalCompositeOperation = 'source-over';
    }

    // Crop tool
    startCrop(x, y) {
        this.cropStartX = x;
        this.cropStartY = y;
        this.cropRect = {
            x: x,
            y: y,
            width: 0,
            height: 0
        };
        this.drawCropRect();
    }

    updateCrop(x, y) {
        if (!this.cropRect) return;

        this.cropRect.width = x - this.cropStartX;
        this.cropRect.height = y - this.cropStartY;
        this.drawCropRect();
    }

    drawCropRect() {
        const ctx = this.editor.canvas.getContext('2d');
        
        // Redraw original image
        ctx.clearRect(0, 0, this.editor.canvas.width, this.editor.canvas.height);
        ctx.drawImage(this.editor.originalImage, 0, 0);

        // Draw crop rectangle
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.cropRect.x, this.cropRect.y, this.cropRect.width, this.cropRect.height);
        
        // Draw handles
        ctx.fillStyle = '#00ff00';
        const handleSize = 8;
        const handles = [
            [this.cropRect.x, this.cropRect.y], // top-left
            [this.cropRect.x + this.cropRect.width, this.cropRect.y], // top-right
            [this.cropRect.x, this.cropRect.y + this.cropRect.height], // bottom-left
            [this.cropRect.x + this.cropRect.width, this.cropRect.y + this.cropRect.height] // bottom-right
        ];

        handles.forEach(([x, y]) => {
            ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
        });

        ctx.setLineDash([]);
    }

    applyCrop() {
        if (!this.cropRect || Math.abs(this.cropRect.width) < 10 || Math.abs(this.cropRect.height) < 10) {
            this.showNotification('Please select a valid crop area', 'error');
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Ensure positive dimensions
        const x = Math.min(this.cropRect.x, this.cropRect.x + this.cropRect.width);
        const y = Math.min(this.cropRect.y, this.cropRect.y + this.cropRect.height);
        const width = Math.abs(this.cropRect.width);
        const height = Math.abs(this.cropRect.height);

        canvas.width = width;
        canvas.height = height;

        // Draw cropped area
        ctx.drawImage(
            this.editor.canvas,
            x, y, width, height,
            0, 0, width, height
        );

        // Update editor canvas
        this.editor.canvas.width = width;
        this.editor.canvas.height = height;
        this.editor.canvas.getContext('2d').drawImage(canvas, 0, 0);

        // Update original image reference
        this.editor.originalImage = new Image();
        this.editor.originalImage.src = this.editor.canvas.toDataURL();

        this.cropRect = null;
        this.saveToHistory();
        this.showNotification('Image cropped successfully', 'success');
    }

    cancelCrop() {
        this.cropRect = null;
        // Redraw original image
        const ctx = this.editor.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.editor.canvas.width, this.editor.canvas.height);
        ctx.drawImage(this.editor.originalImage, 0, 0);
    }

    // Rotation and flipping
    rotate(degrees) {
        const canvas = this.editor.canvas;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Swap dimensions for 90° rotations
        if (Math.abs(degrees) === 90) {
            tempCanvas.width = canvas.height;
            tempCanvas.height = canvas.width;
        } else {
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
        }

        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate(degrees * Math.PI / 180);
        tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

        // Update main canvas
        canvas.width = tempCanvas.width;
        canvas.height = tempCanvas.height;
        canvas.getContext('2d').drawImage(tempCanvas, 0, 0);

        // Update original image reference
        this.editor.originalImage = new Image();
        this.editor.originalImage.src = canvas.toDataURL();

        this.saveToHistory();
        this.showNotification(`Image rotated ${Math.abs(degrees)} degrees`, 'success');
    }

    flip(direction) {
        const canvas = this.editor.canvas;
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (direction === 'horizontal') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);
        }
        
        ctx.drawImage(this.editor.originalImage, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Update original image reference
        this.editor.originalImage = new Image();
        this.editor.originalImage.src = canvas.toDataURL();

        this.saveToHistory();
        this.showNotification(`Image flipped ${direction}`, 'success');
    }

    // Text tool
    addText() {
        const text = document.getElementById('textInput').value.trim();
        if (!text) {
            this.showNotification('Please enter some text', 'error');
            return;
        }

        const ctx = this.editor.canvas.getContext('2d');
        const fontSize = this.textSize || 24;
        const color = this.textColor || '#000000';

        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Add text shadow for better visibility
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Position text (you could make this draggable)
        const x = 20;
        const y = 20;

        ctx.fillText(text, x, y);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        this.saveToHistory();
        this.showNotification('Text added to image', 'success');
    }

    // Shape tools
    addShape(shapeType) {
        const ctx = this.editor.canvas.getContext('2d');
        const color = document.getElementById('shapeColor').value || '#ff0000';
        const lineWidth = document.getElementById('shapeWidth').value || 3;

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = color;

        const width = 100;
        const height = 100;
        const x = (this.editor.canvas.width - width) / 2;
        const y = (this.editor.canvas.height - height) / 2;

        switch (shapeType) {
            case 'rectangle':
                ctx.strokeRect(x, y, width, height);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(x + width/2, y + height/2, width/2, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case 'line':
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + width, y + height);
                ctx.stroke();
                break;
        }

        this.saveToHistory();
        this.showNotification(`${shapeType} added to image`, 'success');
    }

    // History management
    setupHistory() {
        this.history = [];
        this.historyIndex = -1;
    }

    saveToHistory() {
        // Remove any future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Save current canvas state
        const canvas = this.editor.canvas;
        const imageData = canvas.toDataURL();
        this.history.push(imageData);
        this.historyIndex++;

        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadFromHistory();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadFromHistory();
        }
    }

    loadFromHistory() {
        const image = new Image();
        image.onload = () => {
            const ctx = this.editor.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.editor.canvas.width, this.editor.canvas.height);
            ctx.drawImage(image, 0, 0);
        };
        image.src = this.history[this.historyIndex];
        
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undo');
        const redoBtn = document.getElementById('redo');

        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    showNotification(message, type = 'info') {
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
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
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

    // Additional tools
    resizeImage(width, height) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(this.editor.canvas, 0, 0, width, height);
        
        // Update main canvas
        this.editor.canvas.width = width;
        this.editor.canvas.height = height;
        this.editor.canvas.getContext('2d').drawImage(canvas, 0, 0);

        // Update original image reference
        this.editor.originalImage = new Image();
        this.editor.originalImage.src = this.editor.canvas.toDataURL();

        this.saveToHistory();
        this.showNotification(`Image resized to ${width}x${height}`, 'success');
    }

    autoEnhance() {
        // Apply automatic enhancements
        if (filterManager) {
            filterManager.filters.brightness = 105;
            filterManager.filters.contrast = 110;
            filterManager.filters.saturation = 105;
            filterManager.applyFilters();
        }
        this.saveToHistory();
        this.showNotification('Auto-enhance applied', 'success');
    }
}

// Global functions for tools
function selectTool(tool) {
    if (toolManager) {
        toolManager.selectTool(tool);
    }
}

function applyCrop() {
    if (toolManager) {
        toolManager.applyCrop();
    }
}

function cancelCrop() {
    if (toolManager) {
        toolManager.cancelCrop();
    }
}

function rotateImage(degrees) {
    if (toolManager) {
        toolManager.rotate(degrees);
    }
}

function flipImage(direction) {
    if (toolManager) {
        toolManager.flip(direction);
    }
}

function addTextToImage() {
    if (toolManager) {
        toolManager.addText();
    }
}

function addShapeToImage(shapeType) {
    if (toolManager) {
        toolManager.addShape(shapeType);
    }
}

function undoEdit() {
    if (toolManager) {
        toolManager.undo();
    }
}

function redoEdit() {
    if (toolManager) {
        toolManager.redo();
    }
}

function autoEnhanceImage() {
    if (toolManager) {
        toolManager.autoEnhance();
    }
}

let toolManager;
