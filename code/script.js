const video = document.getElementById('video');
const statusText = document.getElementById('status');
const logList = document.getElementById('log');

function addLog(message) {
  const li = document.createElement('li');
  li.textContent = new Date().toLocaleTimeString() + " - " + message;
  logList.appendChild(li);
}

// 🎥 Camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    statusText.textContent = "Camera: ON";
    addLog("Camera activated");
  } catch (err) {
    statusText.textContent = "Camera: DENIED";
    addLog("Camera access denied");
  }
}

startCamera();

// 🚨 Tab switch
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    addLog("User switched tab!");
  }
});

// 🚨 Window blur
window.addEventListener("blur", () => {
  addLog("Window lost focus!");
});

// 🚨 Camera check
setInterval(() => {
  if (!video.srcObject) {
    addLog("Camera stopped!");
  }
}, 3000);

// 🧠 Motion detection
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let previousFrame = null;

function detectMotion() {
  if (!video.videoWidth) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (previousFrame) {
    let diff = 0;

    for (let i = 0; i < currentFrame.data.length; i += 4) {
      const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
      const gDiff = Math.abs(currentFrame.data[i+1] - previousFrame.data[i+1]);
      const bDiff = Math.abs(currentFrame.data[i+2] - previousFrame.data[i+2]);

      diff += rDiff + gDiff + bDiff;
    }

    if (diff > 5000000) {
      addLog("⚠️ Motion detected!");
    }
  }

  previousFrame = currentFrame;
}

setInterval(detectMotion, 1000);

// ✅ Submit logic
function submitAnswer() {
  const selected = document.querySelector('input[name="answer"]:checked');

  if (!selected) {
    alert("Pilih jawaban dulu!");
    return;
  }

  const answer = selected.value;
  const isCorrect = (answer === "C");

  addLog("Answer selected: " + answer);

  document.getElementById("questionBlock").style.display = "none";

  const resultText = document.getElementById("resultText");
  if (isCorrect) {
    resultText.textContent = "Jawaban kamu BENAR ✅";
  } else {
    resultText.textContent = "Jawaban kamu SALAH ❌";
  }

  document.getElementById("resultBlock").style.display = "block";
}

let model;

async function loadModel() {
  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
  );
  addLog("Face model loaded");
}

loadModel();

async function detectYawning() {
  if (!model || !video.videoWidth) return;

  const predictions = await model.estimateFaces({ input: video });

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // Ambil titik bibir atas & bawah
    const upperLip = keypoints[13];
    const lowerLip = keypoints[14];

    const mouthOpen = Math.abs(upperLip[1] - lowerLip[1]);

    // Threshold (bisa di-tuning)
    if (mouthOpen > 25) {
      addLog("😮 Possible yawning detected!");
    }
  }
}

// cek tiap 2 detik
setInterval(detectYawning, 2000);