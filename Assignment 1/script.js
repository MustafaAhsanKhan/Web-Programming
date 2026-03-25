/* =========================================================
 * Photo Editor - JavaScript
 * Roll Number: 23i-0549 (last 2 digits = 49, odd -> step = 3)
 * Pure JavaScript — no external libraries or CDN imports
 * ========================================================= */

// ==================== CONFIGURATION ====================
// Roll number 23i-0549: last 2 digits = 49 (odd) => step = 3
var FILTER_STEP = 3;

// ==================== DOM ELEMENTS ====================
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var fileInput = document.getElementById('fileInput');

// Filter tab controls (inside the card)
var filterSlider = document.getElementById('filterSlider');
var filterNameEl = document.querySelector('.filter-name');
var filterValueEl = document.querySelector('.filter-value');
var filterButtons = document.querySelectorAll('.filter-btn');

// Extra sliders (below the card)
var blurSlider = document.getElementById('blurSlider');
var rotateSlider = document.getElementById('rotateSlider');
var sepiaSlider = document.getElementById('sepiaSlider');

// Extra slider badges (pink pills)
var blurBadge = document.getElementById('blurBadge');
var rotateBadge = document.getElementById('rotateBadge');
var sepiaBadge = document.getElementById('sepiaBadge');

// Action buttons
var resetBtn = document.getElementById('resetBtn');
var chooseBtn = document.getElementById('chooseBtn');
var saveBtn = document.getElementById('saveBtn');

// Undo / Redo buttons
var undoBtn = document.getElementById('undoBtn');
var redoBtn = document.getElementById('redoBtn');

// History panel list
var historyListEl = document.getElementById('historyList');

// Rotate & flip buttons
var rotateLeftBtn = document.getElementById('rotateLeftBtn');
var rotateRightBtn = document.getElementById('rotateRightBtn');
var flipHBtn = document.getElementById('flipHBtn');
var flipVBtn = document.getElementById('flipVBtn');

// ==================== STATE ====================
// Stores the original loaded image and its raw pixel data
var originalImage = null;
var originalImageData = null;

// All filter/transform values in one object
var state = {
    brightness: 0,      // 0–100 (per-pixel, multiplicative)
    saturation: 0,      // 0–100 (per-pixel, boost)
    inversion: 0,       // 0–100 (per-pixel, lerp to inverted)
    grayscale: 0,       // 0–100 (per-pixel, lerp to gray)
    blur: 0,            // 0–30  (spatial, box blur radius)
    rotate: 0,          // 0–360 degrees (slider, CSS transform)
    sepia: 0,           // 0–100 (per-pixel, sepia matrix lerp)
    flipH: false,       // horizontal flip toggle
    flipV: false,       // vertical flip toggle
    rotate90: 0,        // rotation from buttons (0, 90, 180, 270)
    activeFilter: 'brightness' // currently selected filter tab
};

// ==================== HISTORY STACK ====================
// Each entry stores a cloned state snapshot + a descriptive label
var historyStack = [];
var historyIndex = -1; // points to the current position in the stack

/**
 * Create a shallow clone of the state object.
 * Excludes 'activeFilter' since it is purely UI state
 * and does not affect the rendered image.
 */
function cloneState(stateObj) {
    return {
        brightness: stateObj.brightness,
        saturation: stateObj.saturation,
        inversion: stateObj.inversion,
        grayscale: stateObj.grayscale,
        blur: stateObj.blur,
        rotate: stateObj.rotate,
        sepia: stateObj.sepia,
        flipH: stateObj.flipH,
        flipV: stateObj.flipV,
        rotate90: stateObj.rotate90
    };
}

/**
 * Restore the state from a history snapshot.
 * Copies all filter/transform values from the snapshot back into the
 * live state object, then re-renders and updates the UI.
 */
function restoreState(snapshot) {
    state.brightness = snapshot.brightness;
    state.saturation = snapshot.saturation;
    state.inversion = snapshot.inversion;
    state.grayscale = snapshot.grayscale;
    state.blur = snapshot.blur;
    state.rotate = snapshot.rotate;
    state.sepia = snapshot.sepia;
    state.flipH = snapshot.flipH;
    state.flipV = snapshot.flipV;
    state.rotate90 = snapshot.rotate90;

    // Re-render image with restored state and update all UI controls
    updateUI();
    applyFilters();
}

/**
 * Push a new entry onto the history stack.
 * If the current position is not at the end of the stack,
 * all future states beyond it are discarded (branching history).
 *
 * @param {string} label - Description of the change (e.g. "Brightness: 42%")
 */
function pushHistory(label) {
    // Truncate any future states if we're not at the end
    if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
    }

    // Add the new snapshot
    historyStack.push({
        state: cloneState(state),
        label: label
    });

    // Move pointer to the new end
    historyIndex = historyStack.length - 1;

    // Refresh the history panel and button states
    updateHistoryUI();
}

/**
 * Undo — move one step back in the history stack.
 * Only works if there is a previous state to go to.
 */
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState(historyStack[historyIndex].state);
        updateHistoryUI();
    }
}

/**
 * Redo — move one step forward in the history stack.
 * Only works if there is a future state that was undone.
 */
function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        restoreState(historyStack[historyIndex].state);
        updateHistoryUI();
    }
}

/**
 * Jump to a specific point in the history stack.
 * Clicking a history entry calls this to instantly restore that state.
 *
 * @param {number} index - The index in historyStack to jump to
 */
function jumpToHistory(index) {
    if (index < 0 || index >= historyStack.length) return;
    historyIndex = index;
    restoreState(historyStack[historyIndex].state);
    updateHistoryUI();
}

/**
 * Rebuild the visual history panel list and update undo/redo button states.
 * Creates an <li> for each history entry with filter name + value badge.
 * Highlights the current position and attaches click handlers.
 */
function updateHistoryUI() {
    // Enable/disable undo and redo buttons based on stack position
    undoBtn.disabled = (historyIndex <= 0);
    redoBtn.disabled = (historyIndex >= historyStack.length - 1);

    // Clear the list
    historyListEl.innerHTML = '';

    // Show empty state if no history
    if (historyStack.length === 0) {
        var emptyMsg = document.createElement('li');
        emptyMsg.className = 'history-empty';
        emptyMsg.textContent = 'No history yet';
        historyListEl.appendChild(emptyMsg);
        return;
    }

    // Build list items for each history entry
    for (var i = 0; i < historyStack.length; i++) {
        var entry = historyStack[i];
        var li = document.createElement('li');
        li.className = 'history-item';

        // Highlight the current position
        if (i === historyIndex) {
            li.className += ' active';
        }

        // Parse label into name and value parts
        var parts = entry.label.split(': ');
        var nameSpan = document.createElement('span');
        nameSpan.className = 'history-item-name';
        nameSpan.textContent = parts[0];

        li.appendChild(nameSpan);

        // Add value badge if there is a value part
        if (parts.length > 1) {
            var valueSpan = document.createElement('span');
            valueSpan.className = 'history-item-value';
            valueSpan.textContent = parts[1];
            li.appendChild(valueSpan);
        }

        // Click to jump to this history entry
        li.setAttribute('data-index', i);
        li.addEventListener('click', function () {
            var idx = parseInt(this.getAttribute('data-index'));
            jumpToHistory(idx);
        });

        historyListEl.appendChild(li);
    }

    // Auto-scroll to the active entry so it's always visible
    var activeItem = historyListEl.querySelector('.history-item.active');
    if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

// ==================== IMAGE LOADING ====================

/**
 * Load an image file onto the canvas
 * Reads the file, creates an Image element, draws it on canvas,
 * and stores the original pixel data for filter operations.
 */
function loadImage(file) {
    if (!file) return;

    var reader = new FileReader();

    reader.onload = function (e) {
        var img = new Image();

        img.onload = function () {
            // Store reference to original image
            originalImage = img;

            // Set canvas internal resolution to match image
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Draw the original image
            ctx.drawImage(img, 0, 0);

            // Store pixel data for non-destructive filter application
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Reset history stack for the new image
            historyStack = [];
            historyIndex = -1;

            // Push the initial "Original" state as the first history entry
            pushHistory('Original: Loaded');

            // Apply any filters that may already be set
            applyFilters();
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clamp a numeric value between min and max bounds
 */
function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

// ==================== PIXEL FILTER FUNCTIONS ====================

/**
 * Apply all per-pixel filters in a single pass through the data array.
 * Order: brightness -> saturation -> inversion -> grayscale -> sepia
 * Each filter checks its state value and skips if zero (no effect).
 *
 * @param {Uint8ClampedArray} data - The RGBA pixel data array
 */
function applyPixelFilters(data) {
    // Early exit if no per-pixel filters are active
    if (state.brightness === 0 && state.saturation === 0 &&
        state.inversion === 0 && state.grayscale === 0 && state.sepia === 0) {
        return;
    }

    var len = data.length;

    for (var i = 0; i < len; i += 4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        // Alpha channel (data[i + 3]) is not modified

        // --- 1. BRIGHTNESS ---
        // Multiplicative: factor 1.0 (no change) to 2.0 (double brightness)
        if (state.brightness > 0) {
            var bFactor = 1 + (state.brightness / 100);
            r = r * bFactor;
            g = g * bFactor;
            b = b * bFactor;
        }

        // --- 2. SATURATION (boost) ---
        // Increases distance of each channel from its luminance gray value
        // Factor 1.0 (no change) to 3.0 (triple saturation)
        if (state.saturation > 0) {
            var satFactor = 1 + (state.saturation / 50);
            var satGray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = satGray + (r - satGray) * satFactor;
            g = satGray + (g - satGray) * satFactor;
            b = satGray + (b - satGray) * satFactor;
        }

        // --- 3. INVERSION ---
        // Linear interpolation between original and inverted (255 - pixel)
        // At 100%: fully inverted
        if (state.inversion > 0) {
            var invFactor = state.inversion / 100;
            r = r + (255 - 2 * r) * invFactor;
            g = g + (255 - 2 * g) * invFactor;
            b = b + (255 - 2 * b) * invFactor;
        }

        // --- 4. GRAYSCALE ---
        // Lerp between original color and luminance gray
        // Uses standard luminance weights (BT.601)
        if (state.grayscale > 0) {
            var grayFactor = state.grayscale / 100;
            var grayVal = 0.299 * r + 0.587 * g + 0.114 * b;
            r = r + (grayVal - r) * grayFactor;
            g = g + (grayVal - g) * grayFactor;
            b = b + (grayVal - b) * grayFactor;
        }

        // --- 5. SEPIA ---
        // Apply sepia tone matrix, then lerp by intensity
        // Sepia matrix coefficients create warm brownish tones
        if (state.sepia > 0) {
            var sepFactor = state.sepia / 100;
            var sepR = 0.393 * r + 0.769 * g + 0.189 * b;
            var sepG = 0.349 * r + 0.686 * g + 0.168 * b;
            var sepB = 0.272 * r + 0.534 * g + 0.131 * b;
            // Cap sepia values at 255
            if (sepR > 255) sepR = 255;
            if (sepG > 255) sepG = 255;
            if (sepB > 255) sepB = 255;
            r = r + (sepR - r) * sepFactor;
            g = g + (sepG - g) * sepFactor;
            b = b + (sepB - b) * sepFactor;
        }

        // Clamp final values to valid [0, 255] range
        data[i]     = clamp(Math.round(r), 0, 255);
        data[i + 1] = clamp(Math.round(g), 0, 255);
        data[i + 2] = clamp(Math.round(b), 0, 255);
    }
}

/**
 * Apply box blur using a two-pass separable approach (horizontal then vertical).
 * This is more efficient than a naive 2D kernel: O(w*h*r) instead of O(w*h*r^2).
 *
 * @param {ImageData} imageData - The canvas image data to blur
 * @param {number} value - Blur slider value (0–30)
 */
function applyBlur(imageData, value) {
    if (value <= 0) return;

    // Convert slider value to pixel radius
    var radius = Math.ceil(value / 3);
    if (radius < 1) radius = 1;

    var w = imageData.width;
    var h = imageData.height;
    var data = imageData.data;

    // Temporary buffer for intermediate results
    var temp = new Uint8ClampedArray(data.length);

    // --- HORIZONTAL PASS ---
    // For each pixel, average its horizontal neighbors within the radius
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var rSum = 0, gSum = 0, bSum = 0, count = 0;

            for (var dx = -radius; dx <= radius; dx++) {
                // Clamp neighbor coordinate to image bounds (edge extension)
                var nx = x + dx;
                if (nx < 0) nx = 0;
                if (nx >= w) nx = w - 1;

                var idx = (y * w + nx) * 4;
                rSum += data[idx];
                gSum += data[idx + 1];
                bSum += data[idx + 2];
                count++;
            }

            var outIdx = (y * w + x) * 4;
            temp[outIdx]     = rSum / count;
            temp[outIdx + 1] = gSum / count;
            temp[outIdx + 2] = bSum / count;
            temp[outIdx + 3] = data[outIdx + 3]; // preserve alpha
        }
    }

    // --- VERTICAL PASS ---
    // For each pixel, average its vertical neighbors from the horizontal-pass result
    for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
            var rSum = 0, gSum = 0, bSum = 0, count = 0;

            for (var dy = -radius; dy <= radius; dy++) {
                var ny = y + dy;
                if (ny < 0) ny = 0;
                if (ny >= h) ny = h - 1;

                var idx = (ny * w + x) * 4;
                rSum += temp[idx];
                gSum += temp[idx + 1];
                bSum += temp[idx + 2];
                count++;
            }

            var outIdx = (y * w + x) * 4;
            data[outIdx]     = rSum / count;
            data[outIdx + 1] = gSum / count;
            data[outIdx + 2] = bSum / count;
        }
    }
}

// ==================== MASTER RENDER FUNCTION ====================

/**
 * Main rendering pipeline — called whenever any filter value changes.
 * Steps:
 *   1. Copy original pixel data (non-destructive editing)
 *   2. Apply per-pixel filters (brightness, saturation, inversion, grayscale, sepia)
 *   3. Draw filtered pixels to canvas
 *   4. Apply blur if needed (spatial filter, separate pass)
 *   5. Apply CSS transforms for rotation/flip (geometric transforms)
 */
function applyFilters() {
    if (!originalImageData) return;

    // 1. Create a fresh copy of the original pixel data
    var imageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
    );

    // 2. Apply all per-pixel filters in one pass
    applyPixelFilters(imageData.data);

    // 3. Draw the filtered pixel data onto the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);

    // 4. Apply blur (reads and writes canvas pixel data)
    if (state.blur > 0) {
        var blurData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        applyBlur(blurData, state.blur);
        ctx.putImageData(blurData, 0, 0);
    }

    // 5. Apply CSS transforms for rotation and flip
    updateCanvasTransform();
}

/**
 * Apply CSS transforms on the canvas element for rotation and flip.
 * Uses CSS for smooth visual feedback without re-rendering pixels.
 * Transforms are baked into pixel data only when saving.
 */
function updateCanvasTransform() {
    var transforms = [];

    // Combine button rotation (0/90/180/270) + slider rotation (0–360)
    var totalRotation = state.rotate90 + state.rotate;
    if (totalRotation !== 0) {
        transforms.push('rotate(' + totalRotation + 'deg)');
    }

    // Flip transforms
    if (state.flipH) {
        transforms.push('scaleX(-1)');
    }
    if (state.flipV) {
        transforms.push('scaleY(-1)');
    }

    canvas.style.transform = transforms.length > 0 ? transforms.join(' ') : 'none';
}

// ==================== UI UPDATE FUNCTIONS ====================

/**
 * Update the slider track fill to show a blue portion up to the thumb.
 * Uses a CSS linear-gradient background on the range input.
 *
 * @param {HTMLInputElement} slider - The range input element
 */
function updateSliderTrack(slider) {
    var value = parseFloat(slider.value);
    var min = parseFloat(slider.min) || 0;
    var max = parseFloat(slider.max) || 100;
    var percentage = ((value - min) / (max - min)) * 100;
    slider.style.background =
        'linear-gradient(to right, #5372F0 ' + percentage + '%, #ddd ' + percentage + '%)';
}

/**
 * Sync the active filter tab's slider with the current state.
 * Updates the slider position, label text, and value display.
 */
function updateFilterSlider() {
    var filter = state.activeFilter;
    var value = state[filter];
    filterSlider.value = value;
    // Capitalize filter name for display
    filterNameEl.textContent = filter.charAt(0).toUpperCase() + filter.slice(1);
    filterValueEl.textContent = value + '%';
    updateSliderTrack(filterSlider);
}

/**
 * Sync all four extra sliders (Grayscale, Blur, Rotate, Sepia)
 * with the current state, updating slider positions and badge text.
 */
function updateExtraSliders() {

    blurSlider.value = state.blur;
    blurBadge.textContent = state.blur + ' px';
    updateSliderTrack(blurSlider);

    rotateSlider.value = state.rotate;
    rotateBadge.textContent = state.rotate + ' deg';
    updateSliderTrack(rotateSlider);

    sepiaSlider.value = state.sepia;
    sepiaBadge.textContent = state.sepia + '%';
    updateSliderTrack(sepiaSlider);
}

/**
 * Update all UI elements to reflect the current state.
 */
function updateUI() {
    updateFilterSlider();
    updateExtraSliders();
}

// ==================== EVENT LISTENERS ====================

// --- File Input: Load image when user selects a file ---
fileInput.addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        loadImage(e.target.files[0]);
    }
});

// --- Choose Image Button: Triggers the hidden/native file input ---
chooseBtn.addEventListener('click', function () {
    fileInput.click();
});

// --- Filter Tab Buttons: Switch active filter ---
filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
        // Deactivate all buttons
        filterButtons.forEach(function (b) {
            b.classList.remove('active');
        });
        // Activate clicked button
        btn.classList.add('active');

        // Update active filter in state and refresh the slider
        state.activeFilter = btn.dataset.filter;
        updateFilterSlider();
    });
});

// --- Main Filter Slider (inside the card) ---
// 'input' event fires continuously during drag for live preview
filterSlider.addEventListener('input', function () {
    var value = parseInt(this.value);
    state[state.activeFilter] = value;
    filterValueEl.textContent = value + '%';
    updateSliderTrack(this);
    applyFilters();
});

// 'change' event fires on slider release — commit to history
filterSlider.addEventListener('change', function () {
    var value = parseInt(this.value);
    var name = state.activeFilter.charAt(0).toUpperCase() + state.activeFilter.slice(1);
    pushHistory(name + ': ' + value + '%');
});

// --- Extra Slider: Blur ---
// 'input' for live preview during drag
blurSlider.addEventListener('input', function () {
    var value = parseInt(this.value);
    state.blur = value;
    blurBadge.textContent = value + ' px';
    updateSliderTrack(this);
    applyFilters();
});
// 'change' to commit blur change to history on release
blurSlider.addEventListener('change', function () {
    var value = parseInt(this.value);
    pushHistory('Blur: ' + value + ' px');
});

// --- Extra Slider: Rotate ---
// 'input' for live preview during drag
rotateSlider.addEventListener('input', function () {
    var value = parseInt(this.value);
    state.rotate = value;
    rotateBadge.textContent = value + ' deg';
    updateSliderTrack(this);
    applyFilters();
});
// 'change' to commit rotate change to history on release
rotateSlider.addEventListener('change', function () {
    var value = parseInt(this.value);
    pushHistory('Rotate: ' + value + ' deg');
});

// --- Extra Slider: Sepia ---
// 'input' for live preview during drag
sepiaSlider.addEventListener('input', function () {
    var value = parseInt(this.value);
    state.sepia = value;
    sepiaBadge.textContent = value + '%';
    updateSliderTrack(this);
    applyFilters();
});
// 'change' to commit sepia change to history on release
sepiaSlider.addEventListener('change', function () {
    var value = parseInt(this.value);
    pushHistory('Sepia: ' + value + '%');
});

// --- Rotate Left Button: Rotate by -90 degrees ---
rotateLeftBtn.addEventListener('click', function () {
    state.rotate90 = (state.rotate90 - 90 + 360) % 360;
    applyFilters();
    pushHistory('Rotate Left: ' + state.rotate90 + '°');
});

// --- Rotate Right Button: Rotate by +90 degrees ---
rotateRightBtn.addEventListener('click', function () {
    state.rotate90 = (state.rotate90 + 90) % 360;
    applyFilters();
    pushHistory('Rotate Right: ' + state.rotate90 + '°');
});

// --- Flip Horizontal Button: Toggle horizontal flip ---
flipHBtn.addEventListener('click', function () {
    state.flipH = !state.flipH;
    applyFilters();
    pushHistory('Flip Horizontal: ' + (state.flipH ? 'ON' : 'OFF'));
});

// --- Flip Vertical Button: Toggle vertical flip ---
flipVBtn.addEventListener('click', function () {
    state.flipV = !state.flipV;
    applyFilters();
    pushHistory('Flip Vertical: ' + (state.flipV ? 'ON' : 'OFF'));
});

// --- Undo Button ---
undoBtn.addEventListener('click', function () {
    undo();
});

// --- Redo Button ---
redoBtn.addEventListener('click', function () {
    redo();
});

// --- Reset Button: Restore all filters to default ---
resetBtn.addEventListener('click', function () {
    // Reset all state values
    state.brightness = 0;
    state.saturation = 0;
    state.inversion = 0;
    state.grayscale = 0;
    state.blur = 0;
    state.rotate = 0;
    state.sepia = 0;
    state.flipH = false;
    state.flipV = false;
    state.rotate90 = 0;

    // Update all UI controls to reflect reset state
    updateUI();

    // Re-render the canvas with original image (no filters)
    applyFilters();

    // Push reset as a history entry so it can be undone
    pushHistory('Reset: All Filters');
});

// --- Save Button: Download the edited image as PNG ---
saveBtn.addEventListener('click', function () {
    if (!originalImage) {
        alert('Please load an image first!');
        return;
    }

    // Create a temporary canvas to bake in all filters + transforms
    var saveCanvas = document.createElement('canvas');
    var saveCtx = saveCanvas.getContext('2d');

    // Calculate total rotation in radians
    var totalDeg = state.rotate90 + state.rotate;
    var totalRad = totalDeg * Math.PI / 180;

    // Calculate the bounding box of the rotated image
    var absSin = Math.abs(Math.sin(totalRad));
    var absCos = Math.abs(Math.cos(totalRad));
    var newWidth = Math.ceil(canvas.width * absCos + canvas.height * absSin);
    var newHeight = Math.ceil(canvas.width * absSin + canvas.height * absCos);

    // Size the save canvas to contain the rotated image
    saveCanvas.width = newWidth;
    saveCanvas.height = newHeight;

    // Apply transforms: translate to center -> rotate -> flip -> draw
    saveCtx.translate(newWidth / 2, newHeight / 2);
    saveCtx.rotate(totalRad);
    if (state.flipH) saveCtx.scale(-1, 1);
    if (state.flipV) saveCtx.scale(1, -1);

    // Draw the pixel-filtered canvas (which already has filters applied)
    saveCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

    // Trigger download
    var link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = saveCanvas.toDataURL('image/png');
    link.click();
});

// ==================== INITIALIZATION ====================

/**
 * Initialize the editor on page load.
 * Sets up slider track visuals.
 */
function init() {
    // Set initial slider track fill for all sliders
    updateSliderTrack(filterSlider);
    updateSliderTrack(blurSlider);
    updateSliderTrack(rotateSlider);
    updateSliderTrack(sepiaSlider);

    // Initialize history panel with empty state
    updateHistoryUI();
}

// Run initialization
init();
