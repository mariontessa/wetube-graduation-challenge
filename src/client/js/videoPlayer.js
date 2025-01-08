const video = document.querySelector("video");
const playBtn = document.getElementById("play");
// const playBtnIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
// const muteBtnIcon = document.querySelector("i");
const volumeRange = document.getElementById("volume");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime ");
const fullScreenBtn = document.getElementById("fullscreen");
const fullScreenIcon = document.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

let controlsTimeout = null;
let controlsMovementTimeout = null;
var volumeValue = 0.5;
video.volume = volumeValue;

const handlePlayClick = (e) => {
  if (video.paused) {
    video.play();
    playBtn.className = "fas fa-pause"
  } else {
    video.pause();
     playBtn.className = "fas fa-play"
  }

};

const handleMute = (e) => {
  if (video.muted) {
    video.muted = "false";
    muteBtn.className = "fas fa-volume-up"
  } else {
    video.muted = true;
    muteBtn.className = "fas fa-volume-mute"
  }
  volumeRange.value = video.muted ? 0 : volumeValue;
};

const handleVolumeRange = (event) => {
  const {
    target: { value }
  } = event;
  if (video.muted) {
    video.muted = false;
    muteBtn.className = "fas fa-volume-mute"
  } 
  if (value === 0) {
     muteBtn.className = "fas fa-volume-off";
  } else {
    muteBtn.className = "fas fa-volume-up";
  }  
  video.volume = volumeValue = value 
  // volumeValue = value;
  // video.volume = value;
};

const formatTime = (seconds) =>
  new Date(seconds * 1000).toISOString().substr(11, 8);

const handleLoadedMetaData = (event) => {
  console.log(event)
  totalTime.innerText = formatTime(Math.floor(video.duration));
  timeline.max = Math.floor(video.duration);
};

const handleTimeUpdate = () => {
  currentTime.innerText = formatTime(Math.floor(video.currentTime));
  timeline.value = Math.floor(video.currentTime);
};

const handleTimelineChange = (event) => {
  const {
    target: { value }
  } = event;
  video.currentTime = value;
};

const handleFullscreen = () => {
  const fullScreen = document.fullscreenElement;

  if (fullScreen) {
    document.exitFullscreen();
    fullScreenIcon.className = "fas fa-compress";
  } else {
    videoContainer.requestFullscreen();
    fullScreenIcon.className = "fas fa-expand";
  }
};

const hideControls = () => videoControls.classlist.remove("showing");

const handleMouseMove = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
    controlsTimeout = null;
  }
  if (controlsMovementTimeout) {
    clearTimeout(controlsMovementTimeout);
    controlsMovementTimeout = null;
  }
  videoControls.classList.add("showing");
  setTimeout(hideControls, 3000);
};

const handleMouseLeave = () => {
  controlsTimeout = setTimeout(hideControls, 3000);
};

const handleEnded = () => {
  const { id } = videoContainer.dataset;
  fetch(`/api/videos/${id}/view`, { method: "POST" });
};

playBtn.addEventListener("click", handlePlayClick);
muteBtn.addEventListener("click", handleMute);
volumeRange.addEventListener("input", handleVolumeRange);
video.addEventListener("loadeddata", handleLoadedMetaData);
video.addEventListener("timeupdate", handleTimeUpdate);
video.addEventListener("ended", handleEnded);
timeline.addEventListener("input", handleTimelineChange);
fullScreenBtn.addEventListener("click", handleFullscreen);
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
