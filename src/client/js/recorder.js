const startBtn = document.getElementById("startBtn");
const video = document.getElementById("preview");

let stream;
let recorder;
let videoFile;

const handleUpload = async () => {
  const formData = new FormData();
  const blob = await fetch(videoFile).then((r) => r.blob());
  formData.append("video", blob, "recorded.webm");
};

// const response = await fetch("/videos/api/videos/upload", {
//   method: "POST",
//   body: formData
// });

const handleDownload = () => {
  const a = document.createElement("a");
  a.href = videoFile;
  a.download = "MyRecording.webm";
  document.body.appendChild(a);
  a.click();
};

const handleStop = () => {
  startBtn.innerText = "Download Recording";
  startBtn.removeEventListener("click", handleStop);
  startBtn.addEventListener("click", handleDownload);
  recorder.stop();
};

const handleStart = () => {
  startBtn.innerText = "Stop recording";
  startBtn.removeEventListener("click", handleStart);
  startBtn.addEventListener("click", handleStop);

  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (event) => {
    console.log(event.data);
    videoFile = URL.createObjectURL(event.data);
    video.srcObject = null;
    video.src = videoFile;
    video.loop = true;
    video.play();
  };

  recorder.start();
};

const init = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 200, height: 100 }
    });

    video.srcObject = stream;
    video.play();
  } catch (error) {
    console.log("Error accessing the media devices:", error);
  }
};

// async () => {
/* await */ init();
startBtn.addEventListener("click", handleStart);
// };
