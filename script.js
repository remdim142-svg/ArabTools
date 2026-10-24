"use strict";

const imageInput = document.getElementById("imageInput");
const uploadBox = document.getElementById("uploadBox");
const toolsGrid = document.getElementById("toolsGrid");

const editor = document.getElementById("editor");
const selectedToolTitle = document.getElementById("selectedToolTitle");
const toolControls = document.getElementById("toolControls");

const originalPreview = document.getElementById("originalPreview");
const originalPlaceholder = document.getElementById("originalPlaceholder");
const originalDimensions = document.getElementById("originalDimensions");
const originalDetails = document.getElementById("originalDetails");

const outputCanvas = document.getElementById("outputCanvas");
const outputPlaceholder = document.getElementById("outputPlaceholder");
const outputDimensions = document.getElementById("outputDimensions");
const outputDetails = document.getElementById("outputDetails");

const applyButton = document.getElementById("applyButton");
const downloadButton = document.getElementById("downloadButton");
const newImageButton = document.getElementById("newImageButton");
const statusMessage = document.getElementById("statusMessage");

const ctx = outputCanvas.getContext("2d");

const tools = [
    {
        id: "compress",
        icon: "📦",
        title: "ضغط الصور",
        description: "تقليل حجم الملف مع الحفاظ على الجودة."
    },
    {
        id: "resize",
        icon: "↔️",
        title: "تغيير الحجم",
        description: "تحديد العرض والارتفاع بالبكسل."
    },
    {
        id: "convert",
        icon: "🔄",
        title: "تحويل الصيغة",
        description: "تحويل الصورة إلى PNG أو JPG أو WebP."
    },
    {
        id: "crop",
        icon: "✂️",
        title: "قص الصور",
        description: "قص جزء محدد من الصورة."
    },
    {
        id: "rotate",
        icon: "🔃",
        title: "تدوير الصور",
        description: "تدوير الصورة بزاوية مناسبة."
    },
    {
        id: "flip",
        icon: "↔",
        title: "قلب الصور",
        description: "قلب الصورة أفقياً أو رأسياً."
    },
    {
        id: "grayscale",
        icon: "⚫",
        title: "أبيض وأسود",
        description: "تحويل الصورة إلى تدرجات الرمادي."
    },
    {
        id: "blur",
        icon: "💧",
        title: "تأثير الضبابية",
        description: "تطبيق تأثير ضبابي على الصورة."
    },
    {
        id: "watermark",
        icon: "✍️",
        title: "علامة مائية",
        description: "إضافة نص إلى الصورة."
    },
    {
        id: "adjust",
        icon: "☀️",
        title: "الإضاءة والتباين",
        description: "ضبط سطوع الصورة وتباينها."
    }
];

let currentTool = "compress";
let sourceImage = null;
let sourceObjectUrl = null;
let sourceMimeType = "image/png";
let outputBlob = null;
let isProcessing = false;

function renderTools() {
    toolsGrid.innerHTML = "";

    tools.forEach((tool) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tool-card";
        button.dataset.tool = tool.id;

        button.innerHTML = `
            <span class="tool-icon">${tool.icon}</span>
            <strong>${tool.title}</strong>
            <small>${tool.description}</small>
        `;

        button.addEventListener("click", () => selectTool(tool.id));
        toolsGrid.appendChild(button);
    });

    updateActiveToolCard();
}

function selectTool(toolId) {
    const tool = tools.find((item) => item.id === toolId);

    if (!tool) return;

    currentTool = toolId;
    selectedToolTitle.textContent = tool.title;

    renderControls();
    updateActiveToolCard();

    setStatus(
        sourceImage
            ? "عدّل الإعدادات ثم اضغط تطبيق التعديل."
            : "ارفع صورة أولاً لبدء التعديل."
    );

    editor.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function updateActiveToolCard() {
    document.querySelectorAll(".tool-card").forEach((card) => {
        card.classList.toggle("active", card.dataset.tool === currentTool);
    });
}

function numberField(key, label, value, min = 1, max = 10000) {
    return `
        <div class="control-field">
            <label for="${key}">${label}</label>
            <input
                id="${key}"
                data-key="${key}"
                type="number"
                min="${min}"
                max="${max}"
                value="${value}"
                required
            >
        </div>
    `;
}

function selectField(key, label, options, selectedValue) {
    const optionHtml = options.map((option) => `
        <option
            value="${option.value}"
            ${option.value === selectedValue ? "selected" : ""}
        >${option.label}</option>
    `).join("");

    return `
        <div class="control-field">
            <label for="${key}">${label}</label>
            <select id="${key}" data-key="${key}">
                ${optionHtml}
            </select>
        </div>
    `;
}

function rangeField(key, label, min, max, value, suffix = "") {
    return `
        <div class="control-field">
            <div class="range-heading">
                <label for="${key}">${label}</label>
                <output id="${key}Value">${value}${suffix}</output>
            </div>

            <input
                id="${key}"
                data-key="${key}"
                type="range"
                min="${min}"
                max="${max}"
                value="${value}"
                data-suffix="${suffix}"
            >
        </div>
    `;
}

function renderControls() {
    const width = sourceImage ? sourceImage.naturalWidth : 1000;
    const height = sourceImage ? sourceImage.naturalHeight : 1000;

    let html = "";

    switch (currentTool) {
        case "compress":
            html = `
                ${rangeField("quality", "جودة الصورة", 10, 100, 75, "%")}
                ${selectField("format", "صيغة الملف", [
                    { value: "image/webp", label: "WebP — حجم صغير غالباً" },
                    { value: "image/jpeg", label: "JPG / JPEG" },
                    { value: "image/png", label: "PNG" }
                ], "image/webp")}
            `;
            break;

        case "resize":
            html = `
                ${numberField("width", "العرض بالبكسل", Math.min(width, 800), 1, 10000)}
                ${numberField("height", "الارتفاع بالبكسل", Math.max(1, Math.round(Math.min(width, 800) * height / width)), 1, 10000)}
                <p class="status-message">تغيير الحجم هنا قد يغيّر نسبة أبعاد الصورة.</p>
            `;
            break;

        case "convert":
            html = `
                ${selectField("format", "الصيغة الجديدة", [
                    { value: "image/png", label: "PNG" },
                    { value: "image/jpeg", label: "JPG / JPEG" },
                    { value: "image/webp", label: "WebP" }
                ], "image/webp")}
                ${rangeField("quality", "جودة JPG أو WebP", 10, 100, 90, "%")}
            `;
            break;

        case "crop":
            html = `
                <div class="field-row">
                    ${numberField("x", "بداية القص X", 0, 0, Math.max(0, width - 1))}
                    ${numberField("y", "بداية القص Y", 0, 0, Math.max(0, height - 1))}
                </div>
                <div class="field-row">
                    ${numberField("cropWidth", "عرض الجزء", width, 1, width)}
                    ${numberField("cropHeight", "ارتفاع الجزء", height, 1, height)}
                </div>
                <p class="status-message">القيم بالبكسل، وتبدأ الإحداثيات من أعلى يسار الصورة.</p>
            `;
            break;

        case "rotate":
            html = selectField("angle", "زاوية التدوير", [
                { value: "90", label: "90 درجة" },
                { value: "180", label: "180 درجة" },
                { value: "270", label: "270 درجة" },
                { value: "-90", label: "-90 درجة" }
            ], "90");
            break;

        case "flip":
            html = selectField("axis", "اتجاه القلب", [
                { value: "horizontal", label: "أفقي" },
                { value: "vertical", label: "رأسي" }
            ], "horizontal");
            break;

        case "grayscale":
            html = `
                <p class="status-message">
                    سيجري تحويل الألوان إلى تدرجات الرمادي.
                </p>
            `;
            break;

        case "blur":
            html = rangeField("blurAmount", "قوة الضبابية", 0, 20, 5, " px");
            break;

        case "watermark":
            html = `
                <div class="control-field">
                    <label for="watermarkText">النص الذي سيظهر على الصورة</label>
                    <input
                        id="watermarkText"
                        data-key="watermarkText"
                        type="text"
                        maxlength="100"
                        value="PixelTools"
                        placeholder="اكتب النص هنا"
                    >
                </div>
                ${rangeField("opacity", "شفافية العلامة المائية", 10, 100, 70, "%")}
            `;
            break;

        case "adjust":
            html = `
                ${rangeField("brightness", "السطوع", 50, 150, 100, "%")}
                ${rangeField("contrast", "التباين", 50, 150, 100, "%")}
            `;
            break;
    }

    toolControls.innerHTML = html;

    toolControls.querySelectorAll('input[type="range"]').forEach((input) => {
        input.addEventListener("input", () => {
            const output = document.getElementById(`${input.id}Value`);

            if (output) {
                output.value = `${input.value}${input.dataset.suffix || ""}`;
                output.textContent = output.value;
            }
        });
    });

    applyButton.disabled = !sourceImage || isProcessing;
}

function getValue(key) {
    const element = toolControls.querySelector(`[data-key="${key}"]`);

    if (!element) return null;

    if (element.type === "number" || element.type === "range") {
        const value = Number(element.value);
        return Number.isFinite(value) ? value : 0;
    }

    return element.value;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "غير معروف";
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;

    return `${(bytes / (1024 * 1024)).toFixed(2)} ميجابايت`;
}

function formatDimensions(width, height) {
    return `${width} × ${height}`;
}

function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";

    if (type) {
        statusMessage.classList.add(type);
    }
}

function resetOutput() {
    outputBlob = null;
    outputCanvas.hidden = true;
    outputPlaceholder.hidden = false;

    outputDimensions.textContent = "—";
    outputDetails.textContent = "لم يتم إنشاء نتيجة بعد";

    downloadButton.disabled = true;
}

function loadImage(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        setStatus("الملف المحدد ليس ملف صورة صالحاً.", "error");
        return;
    }

    if (sourceObjectUrl) {
        URL.revokeObjectURL(sourceObjectUrl);
    }

    resetOutput();
    setStatus("جاري تحميل الصورة...");

    sourceObjectUrl = URL.createObjectURL(file);
    sourceMimeType = file.type || "image/png";

    const image = new Image();

    image.onload = () => {
        sourceImage = image;
        originalPreview.src = sourceObjectUrl;
        originalPreview.hidden = false;
        originalPlaceholder.hidden = true;

        originalDimensions.textContent = formatDimensions(
            image.naturalWidth,
            image.naturalHeight
        );

        originalDetails.textContent =
            `${formatBytes(file.size)} · ${file.type || "صيغة غير معروفة"}`;

        renderControls();

        applyButton.disabled = false;

        setStatus("تم تحميل الصورة بنجاح. اختر الإعدادات واضغط تطبيق التعديل.", "success");

        editor.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    image.onerror = () => {
        sourceImage = null;
        originalPreview.hidden = true;
        originalPlaceholder.hidden = false;

        applyButton.disabled = true;
        setStatus("تعذّر فتح الصورة. جرّب ملفاً آخر.", "error");
    };

    image.src = sourceObjectUrl;
}

function clearCanvas() {
    ctx.filter = "none";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
}

function drawOriginal() {
    outputCanvas.width = sourceImage.naturalWidth;
    outputCanvas.height = sourceImage.naturalHeight;

    clearCanvas();
    ctx.drawImage(sourceImage, 0, 0);
}

function prepareCanvas(width, height) {
    outputCanvas.width = Math.max(1, Math.round(width));
    outputCanvas.height = Math.max(1, Math.round(height));

    clearCanvas();
}

function drawWithFilter(filter) {
    prepareCanvas(sourceImage.naturalWidth, sourceImage.naturalHeight);

    ctx.filter = filter;
    ctx.drawImage(sourceImage, 0, 0);
    ctx.filter = "none";
}

function getExportSettings() {
    let type = sourceMimeType;
    let quality = 0.92;

    if (currentTool === "compress") {
        type = getValue("format") || "image/webp";
        quality = getValue("quality") / 100;
    } else if (currentTool === "convert") {
        type = getValue("format") || "image/png";
        quality = getValue("quality") / 100;
    }

    quality = clamp(quality, 0.1, 1);

    return { type, quality };
}

function applyCurrentTool() {
    if (!sourceImage || isProcessing) {
        setStatus("ارفع صورة أولاً.", "error");
        return;
    }

    try {
        isProcessing = true;
        applyButton.disabled = true;
        downloadButton.disabled = true;
        setStatus("جاري معالجة الصورة...");

        switch (currentTool) {
            case "compress": {
                drawOriginal();
                break;
            }

            case "resize": {
                const width = clamp(Math.round(getValue("width")), 1, 10000);
                const height = clamp(Math.round(getValue("height")), 1, 10000);

                prepareCanvas(width, height);
                ctx.drawImage(sourceImage, 0, 0, width, height);
                break;
            }

            case "convert": {
                drawOriginal();
                break;
            }

            case "crop": {
                const originalWidth = sourceImage.naturalWidth;
                const originalHeight = sourceImage.naturalHeight;

                const x = clamp(Math.round(getValue("x")), 0, originalWidth - 1);
                const y = clamp(Math.round(getValue("y")), 0, originalHeight - 1);

                const width = clamp(
                    Math.round(getValue("cropWidth")),
                    1,
                    originalWidth - x
                );

                const height = clamp(
                    Math.round(getValue("cropHeight")),
                    1,
                    originalHeight - y
                );

                prepareCanvas(width, height);

                ctx.drawImage(
                    sourceImage,
                    x, y, width, height,
                    0, 0, width, height
                );
                break;
            }

            case "rotate": {
                const angle = Number(getValue("angle"));
                const radians = angle * Math.PI / 180;

                const originalWidth = sourceImage.naturalWidth;
                const originalHeight = sourceImage.naturalHeight;

                const rotatedWidth = Math.abs(
                    originalWidth * Math.cos(radians)
                ) + Math.abs(
                    originalHeight * Math.sin(radians)
                );

                const rotatedHeight = Math.abs(
                    originalWidth * Math.sin(radians)
                ) + Math.abs(
                    originalHeight * Math.cos(radians)
                );

                prepareCanvas(rotatedWidth, rotatedHeight);

                ctx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
                ctx.rotate(radians);

                ctx.drawImage(
                    sourceImage,
                    -originalWidth / 2,
                    -originalHeight / 2
                );

                ctx.setTransform(1, 0, 0, 1, 0, 0);
                break;
            }

            case "flip": {
                const axis = getValue("axis");

                prepareCanvas(
                    sourceImage.naturalWidth,
                    sourceImage.naturalHeight
                );

                if (axis === "horizontal") {
                    ctx.translate(outputCanvas.width, 0);
                    ctx.scale(-1, 1);
                } else {
                    ctx.translate(0, outputCanvas.height);
                    ctx.scale(1, -1);
                }

                ctx.drawImage(sourceImage, 0, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                break;
            }

            case "grayscale": {
                drawWithFilter("grayscale(100%)");
                break;
            }

            case "blur": {
                const amount = clamp(getValue("blurAmount"), 0, 20);
                drawWithFilter(`blur(${amount}px)`);
                break;
            }

            case "watermark": {
                drawOriginal();

                const text = String(getValue("watermarkText") || "").trim();

                if (text) {
                    const fontSize = Math.max(
                        16,
                        Math.round(outputCanvas.width * 0.045)
                    );

                    const padding = Math.max(12, Math.round(fontSize * 0.7));

                    ctx.save();
                    ctx.globalAlpha = clamp(getValue("opacity"), 10, 100) / 100;
                    ctx.font = `bold ${fontSize}px Arial, Tahoma, sans-serif`;
                    ctx.textAlign = "right";
                    ctx.textBaseline = "bottom";

                    ctx.lineWidth = Math.max(1, fontSize / 12);
                    ctx.strokeStyle = "rgba(0, 0, 0, 0.65)";
                    ctx.fillStyle = "#ffffff";

                    ctx.strokeText(
                        text,
                        outputCanvas.width - padding,
                        outputCanvas.height - padding
                    );

                    ctx.fillText(
                        text,
                        outputCanvas.width - padding,
                        outputCanvas.height - padding
                    );

                    ctx.restore();
                }
                break;
            }

            case "adjust": {
                const brightness = clamp(getValue("brightness"), 50, 150);
                const contrast = clamp(getValue("contrast"), 50, 150);

                drawWithFilter(
                    `brightness(${brightness}%) contrast(${contrast}%)`
                );
                break;
            }

            default:
                throw new Error("الأداة المحددة غير موجودة.");
        }

        const settings = getExportSettings();

        outputCanvas.toBlob(
            (blob) => {
                isProcessing = false;
                applyButton.disabled = !sourceImage;

                if (!blob) {
                    resetOutput();
                    setStatus("تعذّر إنشاء ملف الصورة. جرّب صيغة أخرى.", "error");
                    return;
                }

                outputBlob = blob;

                outputCanvas.hidden = false;
                outputPlaceholder.hidden = true;
                downloadButton.disabled = false;

                outputDimensions.textContent = formatDimensions(
                    outputCanvas.width,
                    outputCanvas.height
                );

                const ratio = sourceInputFile
                    ? (blob.size / sourceInputFile.size) * 100
                    : null;

                if (ratio !== null) {
                    const difference = sourceInputFile.size - blob.size;
                    const percentage = ((difference / sourceInputFile.size) * 100).toFixed(1);

                    if (difference > 0) {
                        outputDetails.textContent =
                            `${formatBytes(blob.size)} · انخفاض الحجم ${percentage}%`;
                    } else if (difference < 0) {
                        outputDetails.textContent =
                            `${formatBytes(blob.size)} · زاد الحجم ${Math.abs(percentage)}%`;
                    } else {
                        outputDetails.textContent = formatBytes(blob.size);
                    }
                } else {
                    outputDetails.textContent = formatBytes(blob.size);
                }

                const actualType = blob.type || "image/png";

                setStatus(
                    `تم التعديل بنجاح. الصيغة الناتجة: ${actualType}.`,
                    "success"
                );
            },
            settings.type,
            settings.quality
        );
    } catch (error) {
        isProcessing = false;
        applyButton.disabled = !sourceImage;
        setStatus(error.message || "حدث خطأ أثناء معالجة الصورة.", "error");
    }
}

let sourceInputFile = null;

function handleFile(file) {
    if (!file) return;

    sourceInputFile = file;
    loadImage(file);
}

function downloadImage() {
    if (!outputBlob) {
        setStatus("طبّق تعديلاً على الصورة أولاً.", "error");
        return;
    }

    const extensionByType = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/bmp": "bmp"
    };

    const extension = extensionByType[outputBlob.type] || "png";
    const downloadUrl = URL.createObjectURL(outputBlob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `pixeltools-${Date.now()}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

imageInput.addEventListener("change", (event) => {
    handleFile(event.target.files?.[0]);
});

newImageButton.addEventListener("click", () => {
    imageInput.click();
});

applyButton.addEventListener("click", applyCurrentTool);
downloadButton.addEventListener("click", downloadImage);

uploadBox.addEventListener("click", (event) => {
    if (event.target.closest("label")) return;
    imageInput.click();
});

uploadBox.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadBox.classList.add("dragging");
});

uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("dragging");
});

uploadBox.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadBox.classList.remove("dragging");

    const file = event.dataTransfer?.files?.[0];

    if (file) {
        handleFile(file);
    }
});

renderTools();
selectTool("compress");