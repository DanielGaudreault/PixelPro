// Advanced Filter and Effect System
class FilterSystem {
    constructor(editor) {
        this.editor = editor;
        this.filters = {
            // Basic filters
            none: { name: 'Original', apply: (ctx, width, height) => {} },
            
            // Color filters
            vintage: {
                name: 'Vintage',
                apply: (ctx, width, height) => {
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        // Sepia tone
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        
                        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                        
                        // Add slight yellow tint
                        data[i] = Math.min(255, data[i] + 10);
                        data[i + 1] = Math.min(255, data[i + 1] + 5);
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                }
            },
            
            blackWhite: {
                name: 'Black & White',
                apply: (ctx, width, height) => {
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = brightness;     // Red
                        data[i + 1] = brightness; // Green
                        data[i + 2] = brightness; // Blue
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                }
            },
            
            // Instagram-like filters
            clarendon: {
                name: 'Clarendon',
                apply: (ctx, width, height) => {
                    this.applyBrightness(ctx, width, height, 10);
                    this.applyContrast(ctx, width, height, 20);
                    this.applySaturation(ctx, width, height, 35);
                }
            },
            
            lark: {
                name: 'Lark',
                apply: (ctx, width, height) => {
                    this.applyBrightness(ctx, width, height, 10);
                    this.applyContrast(ctx, width, height, -10);
                    this.applySaturation(ctx, width, height, 10);
                }
            },
            
            // Advanced filters
            invert: {
                name: 'Invert',
                apply: (ctx, width, height) => {
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = 255 - data[i];         // Red
                        data[i + 1] = 255 - data[i + 1]; // Green
                        data[i + 2] = 255 - data[i + 2]; // Blue
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                }
            },
            
            sepia: {
                name: 'Sepia',
                apply: (ctx, width, height) => {
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const data = imageData.data;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        
                        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
                    }
                    
                    ctx.putImageData(imageData, 0, 0);
                }
            }
        };
    }

    // Basic adjustment methods
    applyBrightness(ctx, width, height, value) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = this.clamp(factor * (data[i] - 128) + 128);
            data[i + 1] = this.clamp(factor * (data[i + 1] - 128) + 128);
            data[i + 2] = this.clamp(factor * (data[i + 2] - 128) + 128);
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    applyContrast(ctx, width, height, value) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = this.clamp(factor * (data[i] - 128) + 128);
            data[i + 1] = this.clamp(factor * (data[i + 1] - 128) + 128);
            data[i + 2] = this.clamp(factor * (data[i + 2] - 128) + 128);
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    applySaturation(ctx, width, height, value) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const factor = value / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
            
            data[i] = this.clamp(gray + factor * (r - gray));
            data[i + 1] = this.clamp(gray + factor * (g - gray));
            data[i + 2] = this.clamp(gray + factor * (b - gray));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    applyHue(ctx, width, height, value) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const hue = value * Math.PI / 180;
        const cos = Math.cos(hue);
        const sin = Math.sin(hue);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = this.clamp(r * (cos + (1 - cos) / 3) + g * ((1 - cos) / 3 - Math.sqrt(3) * sin / 3) + b * ((1 - cos) / 3 + Math.sqrt(3) * sin / 3));
            data[i + 1] = this.clamp(r * ((1 - cos) / 3 + Math.sqrt(3) * sin / 3) + g * (cos + (1 - cos) / 3) + b * ((1 - cos) / 3 - Math.sqrt(3) * sin / 3));
            data[i + 2] = this.clamp(r * ((1 - cos) / 3 - Math.sqrt(3) * sin / 3) + g * ((1 - cos) / 3 + Math.sqrt(3) * sin / 3) + b * (cos + (1 - cos) / 3));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Advanced effects
    applyBlur(ctx, width, height, radius) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0, a = 0, count = 0;
                
                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const px = x + kx;
                        const py = y + ky;
                        
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const index = (py * width + px) * 4;
                            r += tempData[index];
                            g += tempData[index + 1];
                            b += tempData[index + 2];
                            a += tempData[index + 3];
                            count++;
                        }
                    }
                }
                
                const index = (y * width + x) * 4;
                data[index] = r / count;
                data[index + 1] = g / count;
                data[index + 2] = b / count;
                data[index + 3] = a / count;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    applySharpen(ctx, width, height, amount) {
        const kernel = [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0]
        ];
        
        this.applyConvolution(ctx, width, height, kernel, amount);
    }

    applyEmboss(ctx, width, height) {
        const kernel = [
            [-2, -1, 0],
            [-1, 1, 1],
            [0, 1, 2]
        ];
        
        this.applyConvolution(ctx, width, height, kernel, 1);
    }

    applyConvolution(ctx, width, height, kernel, factor) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        const kernelSize = kernel.length;
        const kernelRadius = Math.floor(kernelSize / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let r = 0, g = 0, b = 0;
                
                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const px = x + kx - kernelRadius;
                        const py = y + ky - kernelRadius;
                        
                        if (px >= 0 && px < width && py >= 0 && py < height) {
                            const index = (py * width + px) * 4;
                            const weight = kernel[ky][kx];
                            
                            r += tempData[index] * weight;
                            g += tempData[index + 1] * weight;
                            b += tempData[index + 2] * weight;
                        }
                    }
                }
                
                const index = (y * width + x) * 4;
                data[index] = this.clamp(r * factor + 128);
                data[index + 1] = this.clamp(g * factor + 128);
                data[index + 2] = this.clamp(b * factor + 128);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Utility methods
    clamp(value) {
        return Math.max(0, Math.min(255, value));
    }

    // Public API
    applyFilter(filterName, ctx, width, height) {
        const filter = this.filters[filterName];
        if (filter && filter.apply) {
            filter.apply(ctx, width, height);
            return true;
        }
        return false;
    }

    getAvailableFilters() {
        return Object.keys(this.filters);
    }

    getFilterInfo(filterName) {
        return this.filters[filterName];
    }

    // Custom filter creation
    createCustomFilter(name, callback) {
        this.filters[name] = {
            name: name,
            apply: callback
        };
    }
}

// Initialize filter system when main editor loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.photoEditor) {
        window.filterSystem = new FilterSystem(window.photoEditor);
    }
});
