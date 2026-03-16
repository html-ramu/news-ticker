const textInput = document.getElementById('text-input');
const tickerText = document.getElementById('ticker-text');
const speedSlider = document.getElementById('speed-slider');
const speedDisplay = document.getElementById('speed-display');
const colorPicker = document.getElementById('color-picker');
const fontColorPicker = document.getElementById('font-color-picker');
const fontSelect = document.getElementById('font-select');
const tickerBar = document.getElementById('ticker-bar');
const exportBtn = document.getElementById('export-btn');
const statusMsg = document.getElementById('status-msg');
const canvas = document.getElementById('export-canvas');
const ctx = canvas.getContext('2d');

const fontSizeSlider = document.getElementById('font-size-slider');
const fontSizeDisplay = document.getElementById('font-size-display');
const tickerHeightSlider = document.getElementById('ticker-height-slider');
const tickerHeightDisplay = document.getElementById('ticker-height-display');
const verticalOffsetSlider = document.getElementById('vertical-offset-slider');
const verticalOffsetDisplay = document.getElementById('vertical-offset-display');

let domTextX = window.innerWidth;
let currentTextWidth = 0;

function calculateWidth() {
    currentTextWidth = tickerText.getBoundingClientRect().width;
}

fontSelect.addEventListener('change', (e) => {
    tickerText.style.fontFamily = e.target.value;
    document.fonts.ready.then(() => calculateWidth());
});

textInput.addEventListener('input', (e) => {
    tickerText.textContent = e.target.value;
    calculateWidth();
});

colorPicker.addEventListener('input', (e) => {
    tickerBar.style.backgroundColor = e.target.value;
});

// ✅ NEW: Font color live preview
fontColorPicker.addEventListener('input', (e) => {
    tickerText.style.color = e.target.value;
});

speedSlider.addEventListener('input', (e) => {
    speedDisplay.textContent = e.target.value + 's';
});

fontSizeSlider.addEventListener('input', (e) => {
    const newSize = e.target.value + 'px';
    fontSizeDisplay.textContent = newSize;
    tickerText.style.fontSize = newSize;
    calculateWidth();
});

tickerHeightSlider.addEventListener('input', (e) => {
    const newHeight = e.target.value + 'px';
    tickerHeightDisplay.textContent = newHeight;
    tickerBar.style.height = newHeight;
});

verticalOffsetSlider.addEventListener('input', (e) => {
    verticalOffsetDisplay.textContent = e.target.value + 'px';
    tickerText.style.marginTop = e.target.value + 'px';
});

document.fonts.ready.then(() => {
    calculateWidth();
});

// Live DOM scroll
function startLiveScroll() {
    const durationSeconds = parseFloat(speedSlider.value);
    const domSpeed = (window.innerWidth + currentTextWidth) / (durationSeconds * 60);

    domTextX -= domSpeed;
    if (domTextX < -currentTextWidth) {
        domTextX = window.innerWidth;
    }
    tickerText.style.transform = `translate(${domTextX}px, -50%)`;
    requestAnimationFrame(startLiveScroll);
}
startLiveScroll();

// ✅ Export using MediaRecorder (no FFmpeg needed)
exportBtn.addEventListener('click', () => {
    exportBtn.disabled = true;
    exportBtn.style.backgroundColor = "#555";
    statusMsg.textContent = "రికార్డింగ్ మొదలవుతోంది...";

    try {
        const durationSeconds = parseFloat(speedSlider.value);
        const selectedHeight = parseInt(tickerHeightSlider.value);
        const textToDraw = textInput.value;
        const selectedFont = fontSelect.value;
        const selectedFontSize = fontSizeSlider.value;
        const yOffset = parseInt(verticalOffsetSlider.value);
        const bgColor = colorPicker.value;
        const fontColor = fontColorPicker.value; // ✅ uses font color picker

        canvas.width = 1920;
        canvas.height = selectedHeight;

        ctx.font = `bold ${selectedFontSize}px ${selectedFont}`;
        const textWidth = ctx.measureText(textToDraw).width;
        const totalDistance = 1920 + textWidth;
        const fps = 60;
        const totalFrames = durationSeconds * fps;
        const speedPerFrame = totalDistance / totalFrames;
        let textX = 1920;

        const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9')
            ? 'video/webm; codecs=vp9'
            : 'video/webm';

        const stream = canvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, { mimeType });
        const chunks = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'b10news-ticker.webm';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            statusMsg.textContent = "✅ వీడియో విజయవంతంగా డౌన్‌లోడ్ అయింది!";
            exportBtn.disabled = false;
            exportBtn.style.backgroundColor = "#0078D7";
            setTimeout(() => { statusMsg.textContent = ''; }, 5000);
        };

        recorder.start();

        function renderFrame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `bold ${selectedFontSize}px ${selectedFont}`;
            ctx.fillStyle = fontColor;
            ctx.textBaseline = "middle";
            const finalY = (canvas.height / 2) + yOffset;
            ctx.fillText(textToDraw, textX, finalY);

            textX -= speedPerFrame;

            const progress = Math.min(100, Math.round(((1920 - textX) / totalDistance) * 100));
            statusMsg.textContent = `రికార్డింగ్ జరుగుతోంది... ${progress}%`;

            if (textX < -textWidth) {
                recorder.stop();
                return;
            }
            requestAnimationFrame(renderFrame);
        }

        renderFrame();

    } catch (error) {
        console.error(error);
        statusMsg.textContent = "లోపం జరిగింది. కన్సోల్ చెక్ చేయండి.";
        exportBtn.disabled = false;
        exportBtn.style.backgroundColor = "#0078D7";
    }
});
