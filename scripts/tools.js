// Advanced Tool System
class ToolSystem {
    constructor(editor) {
        this.editor = editor;
        this.currentTool = null;
        this.tools = {
            select: new SelectTool(editor),
            crop: new CropTool(editor),
            rotate: new RotateTool(editor),
            brush: new BrushTool(editor),
            text: new TextTool(editor),
            shapes: new ShapesTool(editor),
            eraser: new EraserTool(editor)
        };
    }

    activateTool(toolName) {
        // Deactivate current tool
        if (this.currentTool && this.currentTool.deactivate) {
            this.currentTool.deactivate();
        }

        // Activate new tool
        this.currentTool = this.tools[toolName];
        if (this.currentTool && this.currentTool.activate) {
            this.currentTool.activate();
        }
    }

    handleMouseDown(x, y) {
        if (this.currentTool && this.currentTool.onMouseDown) {
            this.currentTool.onMouseDown(x, y);
        }
    }

    handleMouseMove(x, y) {
        if (this.currentTool && this.currentTool.onMouseMove) {
            this.currentTool.onMouseMove(x, y);
        }
    }

    handleMouseUp(x, y) {
        if (this.currentTool && this.currentTool.onMouseUp) {
            this.currentTool.onMouseUp(x, y);
        }
    }
}

// Base Tool Class
class Tool {
    constructor(editor) {
        this.editor = editor;
        this.canvas = editor.canvas;
        this.ctx = editor.ctx;
        this.isActive = false;
    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.editor.zoomLevel,
            y: (e.clientY - rect.top) / this.editor.zoomLevel
        };
    }
}

// Selection Tool
class SelectTool extends Tool {
    constructor(editor) {
        super(editor);
        this.selection = null;
        this.isSelecting = false;
        this.startX = 0;
        this.startY = 0;
    }

    onMouseDown(x, y) {
        this.isSelecting = true;
        this.startX = x;
        this.startY = y;
        
        // Create selection rectangle
        this.selection = {
            x: x,
            y: y,
            width: 0,
            height: 0
        };
    }

    onMouseMove(x, y) {
        if (!this.isSelecting) return;

        this.selection.width = x - this.startX;
        this.selection.height = y - this.startY;

        this.drawSelection();
    }

    onMouseUp(x, y) {
        this.isSelecting = false;
        
        if (Math.abs(this.selection.width) < 5 && Math.abs(this.selection.height) < 5) {
            // Click selection
            this.selection = null;
        }
    }

    drawSelection() {
        // This would draw the selection rectangle on an overlay canvas
        // For now, we'll just log the selection
        console.log('Selection:', this.selection);
    }
}

// Crop Tool
class CropTool extends Tool {
    constructor(editor) {
        super(editor);
        this.cropArea = null;
        this.isCropping = false;
    }

    onMouseDown(x, y) {
        this.isCropping = true;
        this.cropArea = {
            x: x,
            y: y,
            width: 0,
            height: 0
        };
    }

    onMouseMove(x, y) {
        if (!this.isCropping) return;

        this.cropArea.width = x - this.cropArea.x;
        this.cropArea.height = y - this.cropArea.y;

        this.drawCropArea();
    }

    onMouseUp(x, y) {
        this.isCropping = false;
        
        if (Math.abs(this.cropArea.width) > 10 && Math.abs(this.cropArea.height) > 10) {
            this.applyCrop();
        }
    }

    drawCropArea() {
        // Draw crop area on overlay
        console.log('Crop area:', this.cropArea);
    }

    applyCrop() {
        if (!this.cropArea) return;

        const { x, y, width, height } = this.cropArea;
        const absWidth = Math.abs(width);
        const absHeight = Math.abs(height);
        const absX = width < 0 ? x + width : x;
        const absY = height < 0 ? y + height : y;

        // Create temporary canvas for cropped image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = absWidth;
        tempCanvas.height = absHeight;
        
        // Draw cropped portion
        tempCtx.drawImage(
            this.canvas,
            absX, absY, absWidth, absHeight,
            0, 0, absWidth, absHeight
        );

        // Resize main canvas
        this.canvas.width = absWidth;
        this.canvas.height = absHeight;
        
        // Draw cropped image back to main canvas
        this.ctx.drawImage(tempCanvas, 0, 0);

        this.editor.addHistoryState('Crop Applied');
        this.editor.showToast('Image cropped', 'success');
        
        this.cropArea = null;
    }
}

// Brush Tool
class BrushTool extends Tool {
    constructor(editor) {
        super(editor);
        this.lastX = 0;
        this.lastY = 0;
        this.isDrawing = false;
    }

    onMouseDown(x, y) {
        this.isDrawing = true;
        this.lastX = x;
        this.lastY = y;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    onMouseMove(x, y) {
        if (!this.isDrawing) return;

        this.ctx.lineTo(x, y);
        this.ctx.strokeStyle = this.editor.currentColor;
        this.ctx.lineWidth = this.editor.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    onMouseUp(x, y) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.ctx.closePath();
        
        this.editor.addHistoryState('Brush Stroke');
    }
}

// Text Tool
class TextTool extends Tool {
    constructor(editor) {
        super(editor);
        this.textInput = null;
    }

    activate() {
        super.activate();
        this.createTextInput();
    }

    deactivate() {
        super.deactivate();
        this.removeTextInput();
    }

    createTextInput() {
        this.textInput = document.createElement('textarea');
        this.textInput.className = 'text-editor';
        this.textInput.style.display = 'none';
        this.textInput.placeholder = 'Type your text here...';
        
        this.textInput.addEventListener('blur', () => {
            this.applyText();
        });
        
        this.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.applyText();
            }
        });

        document.getElementById('canvasOverlay').appendChild(this.textInput);
    }

    removeTextInput() {
        if (this.textInput && this.textInput.parentElement) {
            this.textInput.parentElement.removeChild(this.textInput);
        }
    }

    onMouseDown(x, y) {
        if (this.textInput) {
            this.textInput.style.left = x + 'px';
            this.textInput.style.top = y + 'px';
            this.textInput.style.display = 'block';
            this.textInput.focus();
        }
    }

    applyText() {
        const text = this.textInput.value.trim();
        if (text) {
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = this.editor.currentColor;
            this.ctx.fillText(
                text,
                parseInt(this.textInput.style.left),
                parseInt(this.textInput.style.top) + 24
            );
            
            this.editor.addHistoryState('Text Added');
            this.editor.showToast('Text added to image', 'success');
        }
        
        this.textInput.style.display = 'none';
        this.textInput.value = '';
    }
}

// Shapes Tool
class ShapesTool extends Tool {
    constructor(editor) {
        super(editor);
        this.currentShape = 'rectangle';
        this.startX = 0;
        this.startY = 0;
        this.isDrawing = false;
    }

    onMouseDown(x, y) {
        this.isDrawing = true;
        this.startX = x;
        this.startY = y;
    }

    onMouseMove(x, y) {
        if (!this.isDrawing) return;

        // Draw preview of shape
        this.drawShapePreview(x, y);
    }

    onMouseUp(x, y) {
        if (!this.isDrawing) return;

        this.isDrawing = false;
        this.drawFinalShape(x, y);
        this.editor.addHistoryState('Shape Added');
    }

    drawShapePreview(x, y) {
        // This would draw a preview on an overlay canvas
        console.log('Drawing shape preview from', this.startX, this.startY, 'to', x, y);
    }

    drawFinalShape(x, y) {
        const width = x - this.startX;
        const height = y - this.startY;

        this.ctx.strokeStyle = this.editor.currentColor;
        this.ctx.lineWidth = 2;

        switch (this.currentShape) {
            case 'rectangle':
                this.ctx.strokeRect(this.startX, this.startY, width, height);
                break;
            case 'circle':
                const radius = Math.sqrt(width * width + height * height);
                this.ctx.beginPath();
                this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                this.ctx.stroke();
                break;
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                break;
        }
    }

    setShape(shape) {
        this.currentShape = shape;
    }
}

// Eraser Tool
class EraserTool extends Tool {
    constructor(editor) {
        super(editor);
        this.lastX = 0;
        this.lastY = 0;
        this.isErasing = false;
    }

    onMouseDown(x, y) {
        this.isErasing = true;
        this.lastX = x;
        this.lastY = y;
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    onMouseMove(x, y) {
        if (!this.isErasing) return;

        this.ctx.lineTo(x, y);
        this.ctx.lineWidth = this.editor.brushSize;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    onMouseUp(x, y) {
        if (!this.isErasing) return;
        
        this.isErasing = false;
        this.ctx.restore();
        
        this.editor.addHistoryState('Eraser Used');
    }
}

// Rotate Tool
class RotateTool extends Tool {
    constructor(editor) {
        super(editor);
        this.rotation = 0;
    }

    onMouseDown(x, y) {
        // For rotate tool, we might want to show rotation handles
        // or implement drag-to-rotate functionality
    }

    rotate(degrees) {
        this.rotation += degrees;
        
        // Create temporary canvas for rotation
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set temporary canvas size to accommodate rotation
        const angle = this.rotation * Math.PI / 180;
        const sin = Math.abs(Math.sin(angle));
        const cos = Math.abs(Math.cos(angle));
        const newWidth = this.canvas.width * cos + this.canvas.height * sin;
        const newHeight = this.canvas.width * sin + this.canvas.height * cos;
        
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        
        // Rotate and draw
        tempCtx.translate(newWidth / 2, newHeight / 2);
        tempCtx.rotate(angle);
        tempCtx.drawImage(
            this.canvas,
            -this.canvas.width / 2,
            -this.canvas.height / 2
        );
        
        // Update main canvas
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.drawImage(tempCanvas, 0, 0);
        
        this.editor.addHistoryState(`Rotated ${degrees}°`);
        this.editor.showToast(`Image rotated ${degrees} degrees`, 'success');
    }
}

// Initialize tool system when main editor loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.photoEditor) {
        window.toolSystem = new ToolSystem(window.photoEditor);
    }
});
