// Select DOM elements
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');

// Makeup control buttons
const lipstickBtn = document.getElementById('lipstick-btn');
const eyeshadowBtn = document.getElementById('eyeshadow-btn');
const blushBtn = document.getElementById('blush-btn');
const clearBtn = document.getElementById('clear-btn');

// Current selected makeup
let currentMakeup = null;

// Load makeup images
const makeupImages = {
    lipstick: new Image(),
    eyeshadow: new Image(),
    blush: new Image()
};

// Set source for makeup images (hosted locally recommended)
makeupImages.lipstick.src = 'assets/lipstick.png'; // Ensure correct path
makeupImages.eyeshadow.src = 'assets/eyeshadow.png';
makeupImages.blush.src = 'assets/blush.png';

// Handle makeup selection
lipstickBtn.addEventListener('click', () => { currentMakeup = 'lipstick'; });
eyeshadowBtn.addEventListener('click', () => { currentMakeup = 'eyeshadow'; });
blushBtn.addEventListener('click', () => { currentMakeup = 'blush'; });
clearBtn.addEventListener('click', () => { 
    currentMakeup = null; 
    ctx.clearRect(0, 0, overlay.width, overlay.height); 
});

// Start video stream
async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        alert("Unable to access the webcam. Please check permissions and try again.");
    }
}

// Load face-api models
async function loadModels() {
    const MODEL_URL = '/models';
    try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
        console.log("Face-api models loaded successfully");
    } catch (err) {
        console.error("Error loading face-api models: ", err);
        alert("Failed to load face detection models.");
    }
}

// Detect face and apply makeup
async function onPlay() {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
    const result = await faceapi.detectSingleFace(video, options).withFaceLandmarks(true);

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (result && currentMakeup) {
        const landmarks = result.landmarks;

        switch (currentMakeup) {
            case 'lipstick':
                applyLipstick(landmarks);
                break;
            case 'eyeshadow':
                applyEyeshadow(landmarks);
                break;
            case 'blush':
                applyBlush(landmarks);
                break;
            default:
                break;
        }
    }

    requestAnimationFrame(onPlay);
}

// Apply Lipstick
function applyLipstick(landmarks) {
    const lips = landmarks.getLips();
    const lipPositions = lips.map(point => [point.x, point.y]);

    // Calculate bounding box for lips
    const xs = lipPositions.map(p => p[0]);
    const ys = lipPositions.map(p => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX;
    const height = maxY - minY;

    // Adjust size as needed
    const scaleFactor = 1.2;
    const adjustedWidth = width * scaleFactor;
    const adjustedHeight = height * scaleFactor;
    const adjustedX = minX - (adjustedWidth - width) / 2;
    const adjustedY = minY - (adjustedHeight - height) / 2;

    // Draw lipstick image
    ctx.drawImage(makeupImages.lipstick, adjustedX, adjustedY, adjustedWidth, adjustedHeight);
}

// Apply Eyeshadow
function applyEyeshadow(landmarks) {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    [leftEye, rightEye].forEach(eye => {
        const eyePositions = eye.map(point => [point.x, point.y]);

        // Calculate bounding box for eye
        const xs = eyePositions.map(p => p[0]);
        const ys = eyePositions.map(p => p[1]);
        const minX = Math.min(...xs) - 20;
        const maxX = Math.max(...xs) + 20;
        const minY = Math.min(...ys) - 20;
        const maxY = Math.max(...ys) + 20;

        const width = maxX - minX;
        const height = maxY - minY;

        // Draw eyeshadow image
        ctx.drawImage(makeupImages.eyeshadow, minX, minY, width, height);
    });
}

// Apply Blush
function applyBlush(landmarks) {
    const nose = landmarks.getNose();
    const leftCheek = nose[3]; // Approximate left cheek
    const rightCheek = nose[5]; // Approximate right cheek

    const blushSize = 50;

    // Draw blush circles
    ctx.globalAlpha = 0.5; // Set transparency
    ctx.fillStyle = 'rgba(255, 105, 180, 0.5)'; // Hot pink color

    ctx.beginPath();
    ctx.arc(leftCheek.x, leftCheek.y, blushSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rightCheek.x, rightCheek.y, blushSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1.0; // Reset transparency
}

// Initialize the application
async function init() {
    await loadModels();
    await startVideo();

    video.addEventListener('loadedmetadata', () => {
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
    });

    video.addEventListener('play', () => {
        onPlay();
    });
}

init();
