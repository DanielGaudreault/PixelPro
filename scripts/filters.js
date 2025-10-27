// Image Filters and Effects
class FilterManager {
    constructor(editor) {
        this.editor = editor;
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
            sharpen: 0,
            exposure: 0,
            temperature: 0,
            vignette: 0,
            noise: 0
        };
        this.presets = this.createPresets();
        this.setupFilterHandlers();
    }

    setupFilterHandlers() {
        // Brightness
        document.getElementById('brightness').addEventListener('input', (e) => {
            this.filters.brightness = e.target.value;
            this.updateFilterValue('brightnessValue', e.target.value);
            this.applyFilters();
        });

        // Contrast
        document.getElementById('contrast').addEventListener('input', (e) => {
            this.filters.contrast = e.target.value;
            this.updateFilterValue('contrastValue', e.target.value);
            this.applyFilters();
        });

        // Saturation
        document.getElementById('saturation').addEventListener('input', (e) => {
            this.filters.saturation = e.target.value;
            this.updateFilterValue('saturationValue', e.target.value);
            this.applyFilters();
        });

        // Hue
        document.getElementById('hue').addEventListener('input', (e) => {
            this.filters.hue = e.target.value;
            this.updateFilterValue('hueValue', e.target.value);
            this.applyFilters();
        });

        // Blur
        document.getElementById('blur').addEventListener('input', (e) => {
            this.filters.blur = e.target.value;
            this.updateFilterValue('blurValue', e.target.value);
            this.applyFilters();
        });

        // Sharpen
        document.getElementById('sharpen').addEventListener('input', (e) => {
            this.filters.sharpen = e.target.value;
            this.updateFilterValue('sharpenValue', e.target.value);
            this.applyFilters();
        });

        // Exposure
        document.getElementById('exposure').addEventListener('input', (e) => {
            this.filters.exposure = e.target.value;
            this.updateFilterValue('exposureValue', e.target.value);
            this.applyFilters();
        });

        // Temperature
        document.getElementById('temperature').addEventListener('input', (e) => {
            this.filters.temperature = e.target.value;
            this.updateFilterValue('temperatureValue', e.target.value);
            this.applyFilters();
        });

        // Vignette
        document.getElementById('vignette').addEventListener('input', (e) => {
            this.filters.vignette = e.target.value;
            this.updateFilterValue('vignetteValue', e.target.value);
            this.applyFilters();
        });

        // Noise
        document.getElementById('noise').addEventListener('input', (e) => {
            this.filters.noise = e.target.value;
            this.updateFilterValue('noiseValue', e.target.value);
            this.applyFilters();
        });

        // Preset handlers
        document.querySelectorAll('.filter-preset').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const presetName = e.currentTarget.dataset.preset;
                this.applyPreset(presetName);
            });
        });

        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });
    }

    updateFilterValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    applyFilters() {
        if (!this.editor.currentImage) return;

        const ctx = this.editor.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.editor.canvas.width, this.editor.canvas.height);
        ctx.drawImage(this.editor.originalImage, 0, 0);

        const imageData = ctx.getImageData(0, 0, this.editor.canvas.width, this.editor.canvas.height);
        const data = imageData.data;

        // Apply color filters
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Brightness
            r = this.applyBrightness(r, this.filters.brightness);
            g = this.applyBrightness(g, this.filters.brightness);
            b = this.applyBrightness(b, this.filters.brightness);

            // Contrast
            r = this.applyContrast(r, this.filters.contrast);
            g = this.applyContrast(g, this.filters.contrast);
            b = this.applyContrast(b, this.filters.contrast);

            // Saturation
            [r, g, b] = this.applySaturation(r, g, b, this.filters.saturation);

            // Hue
            [r, g, b] = this.applyHue(r, g, b, this.filters.hue);

            // Exposure
            r = this.applyExposure(r, this.filters.exposure);
            g = this.applyExposure(g, this.filters.exposure);
            b = this.applyExposure(b, this.filters.exposure);

            // Temperature
            [r, g, b] = this.applyTemperature(r, g, b, this.filters.temperature);

            // Clamp values
            data[i] = this.clamp(r);
            data[i + 1] = this.clamp(g);
            data[i + 2] = this.clamp(b);
        }

        ctx.putImageData(imageData, 0, 0);

        // Apply blur (canvas filter)
        if (this.filters.blur > 0) {
            ctx.filter = `blur(${this.filters.blur}px)`;
            ctx.drawImage(this.editor.canvas, 0, 0);
            ctx.filter = 'none';
        }

        // Apply sharpen (convolution filter)
        if (this.filters.sharpen > 0) {
            this.applySharpen(ctx, this.filters.sharpen);
        }

        // Apply vignette
        if (this.filters.vignette > 0) {
            this.applyVignette(ctx, this.filters.vignette);
        }

        // Apply noise
        if (this.filters.noise > 0) {
            this.applyNoise(ctx, this.filters.noise);
        }
    }

    applyBrightness(value, brightness) {
        return value * (brightness / 100);
    }

    applyContrast(value, contrast) {
        return ((value - 128) * (contrast / 100)) + 128;
    }

    applySaturation(r, g, b, saturation) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        return [
            gray + (r - gray) * (saturation / 100),
            gray + (g - gray) * (saturation / 100),
            gray + (b - gray) * (saturation / 100)
        ];
    }

    applyHue(r, g, b, hue) {
        // Convert to HSL, adjust hue, convert back to RGB
        let h, s, l;
        [h, s, l] = this.rgbToHsl(r, g, b);
        h = (h + hue / 360) % 1;
        return this.hslToRgb(h, s, l);
    }

    applyExposure(value, exposure) {
        return value * Math.pow(2, exposure / 100);
    }

    applyTemperature(r, g, b, temperature) {
        // Warm (positive) or cool (negative) temperature
        if (temperature > 0) {
            r += temperature * 0.5;
            g += temperature * 0.3;
        } else {
            g += Math.abs(temperature) * 0.3;
            b += Math.abs(temperature) * 0.5;
        }
        return [r, g, b];
    }

    applySharpen(ctx, amount) {
        const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const kernelSize = 3;
        const strength = amount / 100;
        
        this.applyConvolutionFilter(ctx, weights, kernelSize, strength);
    }

    applyConvolutionFilter(ctx, weights, kernelSize, strength) {
        const canvas = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        
        const side = Math.round(Math.sqrt(weights.length));
        const halfSide = Math.floor(side / 2);
        
        for (let y = halfSide; y < canvas.height - halfSide; y++) {
            for (let x = halfSide; x < canvas.width - halfSide; x++) {
                let r = 0, g = 0, b = 0;
                let weightIndex = 0;
                
                for (let cy = y - halfSide; cy <= y + halfSide; cy++) {
                    for (let cx = x - halfSide; cx <= x + halfSide; cx++) {
                        const pixelIndex = (cy * canvas.width + cx) * 4;
                        const weight = weights[weightIndex++];
                        
                        r += tempData[pixelIndex] * weight;
                        g += tempData[pixelIndex + 1] * weight;
                        b += tempData[pixelIndex + 2] * weight;
                    }
                }
                
                const pixelIndex = (y * canvas.width + x) * 4;
                data[pixelIndex] = this.clamp(data[pixelIndex] + (r - data[pixelIndex]) * strength);
                data[pixelIndex + 1] = this.clamp(data[pixelIndex + 1] + (g - data[pixelIndex + 1]) * strength);
                data[pixelIndex + 2] = this.clamp(data[pixelIndex + 2] + (b - data[pixelIndex + 2]) * strength);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    applyVignette(ctx, strength) {
        const canvas = ctx.canvas;
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
        );
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${strength / 100})`);
        
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    applyNoise(ctx, amount) {
        const canvas = ctx.canvas;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * amount;
            data[i] = this.clamp(data[i] + noise);
            data[i + 1] = this.clamp(data[i + 1] + noise);
            data[i + 2] = this.clamp(data[i + 2] + noise);
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r * 255, g * 255, b * 255];
    }

    clamp(value) {
        return Math.max(0, Math.min(255, value));
    }

    createPresets() {
        return {
            vintage: { brightness: 110, contrast: 90, saturation: 85, hue: -10, temperature: 15 },
            blackWhite: { brightness: 100, contrast: 120, saturation: 0, hue: 0 },
            dramatic: { brightness: 90, contrast: 130, saturation: 110, exposure: 10 },
            cool: { brightness: 105, contrast: 100, saturation: 95, temperature: -20 },
            warm: { brightness: 105, contrast: 100, saturation: 95, temperature: 20 },
            cinematic: { brightness: 95, contrast: 110, saturation: 105, vignette: 30 },
            highContrast: { brightness: 100, contrast: 150, saturation: 110 },
            soft: { brightness: 105, contrast: 90, saturation: 95, blur: 2 }
        };
    }

    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        // Update slider values
        Object.keys(preset).forEach(filter => {
            if (this.filters.hasOwnProperty(filter)) {
                this.filters[filter] = preset[filter];
                const slider = document.getElementById(filter);
                if (slider) {
                    slider.value = preset[filter];
                    this.updateFilterValue(`${filter}Value`, preset[filter]);
                }
            }
        });

        this.applyFilters();
        this.showNotification(`Applied ${presetName} preset`, 'success');
    }

    resetFilters() {
        // Reset all filters to default values
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
            sharpen: 0,
            exposure: 0,
            temperature: 0,
            vignette: 0,
            noise: 0
        };

        // Reset all sliders
        Object.keys(this.filters).forEach(filter => {
            const slider = document.getElementById(filter);
            if (slider) {
                slider.value = this.filters[filter];
                this.updateFilterValue(`${filter}Value`, this.filters[filter]);
            }
        });

        this.applyFilters();
        this.showNotification('Filters reset to default', 'info');
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

    // Advanced filters
    applySepia() {
        const ctx = this.editor.canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, this.editor.canvas.width, this.editor.canvas.height);
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

    applyInvert() {
        const ctx = this.editor.canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, this.editor.canvas.width, this.editor.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];     // red
            data[i + 1] = 255 - data[i + 1]; // green
            data[i + 2] = 255 - data[i + 2]; // blue
        }

        ctx.putImageData(imageData, 0, 0);
    }

    applyGrayscale() {
        const ctx = this.editor.canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, this.editor.canvas.width, this.editor.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;     // red
            data[i + 1] = gray; // green
            data[i + 2] = gray; // blue
        }

        ctx.putImageData(imageData, 0, 0);
    }
}

// Global functions for filter presets
function applyFilterPreset(presetName) {
    if (filterManager) {
        filterManager.applyPreset(presetName);
    }
}

function resetAllFilters() {
    if (filterManager) {
        filterManager.resetFilters();
    }
}

function applySepiaFilter() {
    if (filterManager) {
        filterManager.applySepia();
    }
}

function applyInvertFilter() {
    if (filterManager) {
        filterManager.applyInvert();
    }
}

function applyGrayscaleFilter() {
    if (filterManager) {
        filterManager.applyGrayscale();
    }
}

let filterManager;
