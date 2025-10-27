// Main Editor Class
class PhotoEditor {
    constructor() {
        this.canvas = document.getElementById('editorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentImage = null;
        this.originalImage = null;
        this.isImageLoaded = false;
        
        this.initializeEditor();
    }

    initializeEditor() {
        this.setupEventListeners();
        this.setupDefaultSettings();
        this.loadSampleImage();
    }

    setupEventListeners() {
        // File upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });

        // Drag and drop
        utils.setupDragAndDrop(document.getElementById('editorArea'), (file) => {
            this.handleImageUpload(file);
        });

        // Sample images
        document.querySelectorAll('.sample-image').forEach(img => {
            img.addEventListener('click', (e) => {
                const src = e.target.src;
                this.loadImageFromUrl(src);
            });
        });

        // Camera capture
        document.getElementById('cameraCapture').addEventListener('click', () => {
            this.openCamera();
        });

        // Reset editor
        document.getElementById('resetEditor').addEventListener('click', () => {
            this.resetEditor();
        });

        // Keyboard shortcuts
        utils.setupKeyboardShortcuts(this);
    }

    setupDefaultSettings() {
        // Set default canvas background
        this.canvas.style.background = '#f0f0f0';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    async handleImageUpload(file) {
        try {
            utils.validateFile(file);
            
            const img = await utils.loadImage(file);
            this.loadImageToCanvas(img);
            
            utils.showNotification('Image loaded successfully!', 'success');
        } catch (error) {
            utils.showNotification(error.message, 'error');
        }
    }

    loadImageToCanvas(img) {
        this.currentImage = img;
        this.originalImage = img;
        
        // Calculate dimensions to fit canvas
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        // Resize canvas
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Draw image
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.drawImage(img, 0, 0, width, height);
        
        this.isImageLoaded = true;
        this.updateUI();
        
        // Initialize tools and filters if not already done
        if (!window.toolManager) {
            window.toolManager = new ToolManager(this);
        }
        if (!window.filterManager) {
            window.filterManager = new FilterManager(this);
        }
        if (!window.exportManager) {
            window.exportManager = new ExportManager(this);
        }
        
        // Save to history
        if (toolManager) {
            toolManager.saveToHistory();
        }
    }

    loadImageFromUrl(url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            this.loadImageToCanvas(img);
            utils.showNotification('Sample image loaded!', 'success');
        };
        img.onerror = () => {
            utils.showNotification('Failed to load sample image', 'error');
        };
        img.src = url;
    }

    loadSampleImage() {
        // Load a default sample image
        const sampleImage = new Image();
        sampleImage.onload = () => {
            this.loadImageToCanvas(sampleImage);
        };
        sampleImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRyYWcgYW4gaW1hZ2UgaGVyZSBvciBjbGljayB0byB1cGxvYWQ8L3RleHQ+Cjwvc3ZnPg==';
    }

    updateUI() {
        // Show/hide UI elements based on image state
        const uploadArea = document.getElementById('uploadArea');
        const editorTools = document.getElementById('editorTools');
        
        if (this.isImageLoaded) {
            uploadArea.style.display = 'none';
            editorTools.style.display = 'block';
        } else {
            uploadArea.style.display = 'block';
            editorTools.style.display = 'none';
        }
    }

    resetEditor() {
        if (!this.isImageLoaded) return;
        
        if (confirm('Are you sure you want to reset all changes?')) {
            this.loadImageToCanvas(this.originalImage);
            
            // Reset filters
            if (filterManager) {
                filterManager.resetFilters();
            }
            
            // Reset tools
            if (toolManager) {
                toolManager.setupHistory();
            }
            
            utils.showNotification('Editor reset successfully', 'info');
        }
    }

    openCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            utils.showNotification('Camera not supported in your browser', 'error');
            return;
        }

        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                video.srcObject = stream;
                video.play();
                
                // Create camera modal
                const modal = utils.createElement('div', 'camera-modal active');
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Take a Photo</h3>
                            <button class="modal-close" onclick="this.closest('.camera-modal').remove(); video.srcObject.getTracks().forEach(track => track.stop());">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="camera-preview">
                            <video id="cameraVideo" autoplay playsinline></video>
                        </div>
                        <div class="camera-controls">
                            <button class="btn btn-primary" onclick="capturePhoto()">
                                <i class="fas fa-camera"></i> Capture
                            </button>
                            <button class="btn btn-secondary" onclick="this.closest('.camera-modal').remove(); video.srcObject.getTracks().forEach(track => track.stop());">
                                Cancel
                            </button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                const videoElement = document.getElementById('cameraVideo');
                videoElement.srcObject = stream;
                
                window.capturePhoto = () => {
                    canvas.width = videoElement.videoWidth;
                    canvas.height = videoElement.videoHeight;
                    ctx.drawImage(videoElement, 0, 0);
                    
                    const img = new Image();
                    img.onload = () => {
                        this.loadImageToCanvas(img);
                        modal.remove();
                        stream.getTracks().forEach(track => track.stop());
                        utils.showNotification('Photo captured successfully!', 'success');
                    };
                    img.src = canvas.toDataURL('image/png');
                };
            })
            .catch((error) => {
                utils.showNotification('Failed to access camera: ' + error.message, 'error');
            });
    }

    // Image manipulation methods
    getImageData() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    putImageData(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
    }

    // Utility methods
    getCanvas() {
        return this.canvas;
    }

    getContext() {
        return this.ctx;
    }

    hasImage() {
        return this.isImageLoaded;
    }

    // Export current state
    getCurrentState() {
        return {
            imageData: this.canvas.toDataURL(),
            filters: filterManager ? filterManager.filters : {},
            dimensions: {
                width: this.canvas.width,
                height: this.canvas.height
            }
        };
    }

    // Load state
    loadState(state) {
        const img = new Image();
        img.onload = () => {
            this.loadImageToCanvas(img);
            
            // Apply saved filters
            if (filterManager && state.filters) {
                Object.keys(state.filters).forEach(filter => {
                    filterManager.filters[filter] = state.filters[filter];
                    const slider = document.getElementById(filter);
                    if (slider) {
                        slider.value = state.filters[filter];
                        filterManager.updateFilterValue(`${filter}Value`, state.filters[filter]);
                    }
                });
                filterManager.applyFilters();
            }
        };
        img.src = state.imageData;
    }
}

// Initialize editor when page loads
let editor;

document.addEventListener('DOMContentLoaded', () => {
    editor = new PhotoEditor();
    
    // Make editor globally available
    window.editor = editor;
    
    console.log('Photo Editor initialized successfully!');
});

// Global editor functions
function loadImageFromFile(input) {
    if (input.files && input.files[0]) {
        editor.handleImageUpload(input.files[0]);
    }
}

function openImageFromUrl() {
    const url = prompt('Enter image URL:');
    if (url) {
        editor.loadImageFromUrl(url);
    }
}

function saveProject() {
    if (!editor.hasImage()) {
        utils.showNotification('No image to save', 'error');
        return;
    }

    const project = editor.getCurrentState();
    const projectName = prompt('Enter project name:', 'my-project');
    
    if (projectName) {
        const success = utils.saveToStorage(`project_${projectName}`, project);
        if (success) {
            utils.showNotification('Project saved successfully!', 'success');
        } else {
            utils.showNotification('Failed to save project', 'error');
        }
    }
}

function loadProject() {
    const projects = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('project_')) {
            projects.push(key.replace('project_', ''));
        }
    }

    if (projects.length === 0) {
        utils.showNotification('No saved projects found', 'info');
        return;
    }

    const projectName = prompt(`Available projects: ${projects.join(', ')}\nEnter project name to load:`);
    if (projectName) {
        const project = utils.loadFromStorage(`project_${projectName}`);
        if (project) {
            editor.loadState(project);
            utils.showNotification(`Project "${projectName}" loaded!`, 'success');
        } else {
            utils.showNotification('Project not found', 'error');
        }
    }
}
