// The storybook owns one visible page at a time; no scrolling is needed.
const pages = [...document.querySelectorAll(".page")];
const progressText = document.querySelector("#progressText");
const progressDots = document.querySelector("#progressDots");
const confettiContainer = document.querySelector("#confetti");
let currentPage = 1;
let audioContext;
let micStream;
let micFrame;
let candlesBlown = false;
const backgroundMusic = document.querySelector("#backgroundMusic");
const musicToggle = document.querySelector("#musicToggle");
const musicLabel = document.querySelector("#musicLabel");
const musicStatus = document.querySelector("#musicStatus");
let musicFadeTimer;
let musicPlaying = false;

pages.forEach(() => {
  const dot = document.createElement("i");
  progressDots.appendChild(dot);
});
function updateProgress() {
  progressText.textContent = `${currentPage} of ${pages.length}`;
  [...progressDots.children].forEach((dot, index) => dot.classList.toggle("active", index === currentPage - 1));
}
function stopMicrophone() {
  if (micFrame) cancelAnimationFrame(micFrame);
  if (micStream) micStream.getTracks().forEach((track) => track.stop());
  micFrame = null;
  micStream = null;
}
function showPage(targetPage) {
  if (targetPage < 1 || targetPage > pages.length || targetPage === currentPage) return;
  stopMicrophone();
  const oldPage = pages[currentPage - 1];
  const nextPage = pages[targetPage - 1];
  oldPage.classList.add("leaving");
  oldPage.classList.remove("active");
  nextPage.classList.add("active");
  nextPage.setAttribute("aria-hidden", "false");
  oldPage.setAttribute("aria-hidden", "true");
  currentPage = targetPage;
  updateProgress();
  setTimeout(() => oldPage.classList.remove("active", "leaving"), 650);
  if (targetPage === 3) startTypewriter();
}
document.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", () => showPage(currentPage + 1)));
document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showPage(currentPage - 1)));
updateProgress();

const pickupLines = [
  "Are you a notification? Because you make my ordinary days special! 😂",
  "Do you know what's my favourite plot twist? Meeting you in a classroom! 🦋",
  "Are you magic? Because somehow you made friendship feel special again! 💗"
];
let pickupIndex = 0;
document.querySelector("#pickupNext").addEventListener("click", () => {
  if (pickupIndex < pickupLines.length - 1) {
    pickupIndex += 1;
    const card = document.querySelector("#pickupCard");
    card.classList.remove("changing");
    void card.offsetWidth;
    card.classList.add("changing");
    document.querySelector("#pickupNumber").textContent = `0${pickupIndex + 1} / 03`;
    document.querySelector("#pickupText").textContent = pickupLines[pickupIndex];
  } else showPage(3);
});

const storyCopy = "I entered college with a different mindset. At some point, I had almost lost hope in friendship. I wasn't expecting anyone to become this important in my life. Then you came into my life during first year, in an ordinary classroom. I never expected that ordinary beginning to turn into such a meaningful friendship. You understand my mood swings, my sudden silence, my overthinking and all my different moods and emotions, even when I struggle to express what I feel. You became someone who understands me without making me explain everything. We haven't had misunderstandings that changed our bond. You are not just another college friend. You are one of the people who made me believe that genuine friendship still exists.";
let typewriterStarted = false;
function startTypewriter() {
  if (typewriterStarted) return;
  typewriterStarted = true;
  const target = document.querySelector("#storyText");
  let index = 0;
  const write = () => {
    target.textContent = storyCopy.slice(0, index);
    if (index < storyCopy.length) {
      index += 1;
      setTimeout(write, index < 70 ? 18 : 10);
    } else document.querySelector("#typeCursor").classList.add("hidden");
  };
  write();
}

const bigEnvelope = document.querySelector("#bigEnvelope");
function openLetter() {
  bigEnvelope.classList.add("open");
  document.querySelector("#envelopeHint").textContent = "a little piece of my heart, just for you ♡";
  document.querySelector("#letterNext").disabled = false;
  setTimeout(() => bigEnvelope.classList.add("revealed"), 900);
}
bigEnvelope.addEventListener("click", openLetter);
bigEnvelope.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") openLetter();
});
document.querySelector("#letterNext").addEventListener("click", () => showPage(5));

function burstConfetti() {
  const colors = ["#a93243", "#f7a530", "#fff3e7", "#d8777b", "#573b35"];
  for (let i = 0; i < 70; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetto";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * .5}s`;
    confettiContainer.appendChild(piece);
    setTimeout(() => piece.remove(), 4200);
  }
}
function extinguishCandles() {
  if (candlesBlown) return;
  candlesBlown = true;
  stopMicrophone();
  document.querySelector("#cake").classList.add("blown");
  document.querySelector("#cakeMessage").textContent = "YAYYY! Your wish is on its way! 💗";
  document.querySelector("#micStatus").textContent = "All your wishes are officially in the universe.";
  document.querySelector("#cakeNext").disabled = false;
  burstConfetti();
  playBlowSound();
}
document.querySelector("#tapBlow").addEventListener("click", extinguishCandles);
document.querySelector("#cakeNext").addEventListener("click", () => showPage(6));

async function listenForBlow() {
  const status = document.querySelector("#micStatus");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    status.textContent = "Your browser doesn't support the mic — use the tap button instead.";
    return;
  }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = context.createAnalyser();
    const source = context.createMediaStreamSource(micStream);
    const data = new Uint8Array(analyser.fftSize);
    analyser.fftSize = 512;
    source.connect(analyser);
    status.textContent = "Listening... give the candles a strong blow!";
    const checkVolume = () => {
      if (!micStream || candlesBlown) return;
      analyser.getByteTimeDomainData(data);
      let total = 0;
      data.forEach((value) => { total += Math.abs(value - 128); });
      if (total / data.length > 22) {
        context.close();
        extinguishCandles();
        return;
      }
      micFrame = requestAnimationFrame(checkVolume);
    };
    checkVolume();
  } catch (error) {
    status.textContent = "No worries! Mic permission was not available — tap the candles instead.";
    stopMicrophone();
  }
}
document.querySelector("#micButton").addEventListener("click", listenForBlow);
function playBlowSound() {
  try {
    const context = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(190, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(70, context.currentTime + .3);
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.08, context.currentTime + .03);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .4);
  } catch (error) { /* Audio is an enhancement; the candle interaction still completes. */ }
}

function fadeMusic(targetVolume, onComplete) {
  clearInterval(musicFadeTimer);
  const startVolume = backgroundMusic.volume;
  const duration = 500;
  const startedAt = performance.now();
  musicFadeTimer = setInterval(() => {
    const progress = Math.min((performance.now() - startedAt) / duration, 1);
    backgroundMusic.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress === 1) {
      clearInterval(musicFadeTimer);
      if (onComplete) onComplete();
    }
  }, 25);
}
function setMusicStatus(message) {
  musicStatus.textContent = message;
  if (message) setTimeout(() => { if (!musicPlaying) musicStatus.textContent = ""; }, 4500);
}
async function startMusic() {
  clearInterval(musicFadeTimer);
  backgroundMusic.volume = 0;
  try {
    await backgroundMusic.play();
    musicPlaying = true;
    musicToggle.classList.add("playing");
    musicLabel.textContent = "Pause music";
    musicToggle.setAttribute("aria-pressed", "true");
    fadeMusic(.35);
    setMusicStatus("");
  } catch (error) {
    musicPlaying = false;
    musicLabel.textContent = "Play a little music";
    setMusicStatus("I couldn't start the music yet. Please try the music button again.");
  }
}
function pauseMusic() {
  musicPlaying = false;
  musicToggle.classList.remove("playing");
  musicLabel.textContent = "Play a little music";
  musicToggle.setAttribute("aria-pressed", "false");
  fadeMusic(0, () => backgroundMusic.pause());
}
musicToggle.addEventListener("click", () => {
  if (musicPlaying) pauseMusic();
  else startMusic();
});
backgroundMusic.addEventListener("error", () => {
  musicPlaying = false;
  musicToggle.classList.remove("playing");
  musicLabel.textContent = "Play a little music";
  setMusicStatus("Your music file couldn't be found. Please add music.mp3 beside index.html.");
});
document.querySelector("#replayButton").addEventListener("click", () => {
  stopMicrophone(); currentPage = 1; pickupIndex = 0; typewriterStarted = false; candlesBlown = false;
  bigEnvelope.classList.remove("open", "revealed"); document.querySelector("#letterNext").disabled = true;
  document.querySelector("#envelopeHint").textContent = "click the envelope to open your letter";
  document.querySelector("#pickupNumber").textContent = "01 / 03"; document.querySelector("#pickupText").textContent = pickupLines[0];
  document.querySelector("#cake").classList.remove("blown"); document.querySelector("#cakeMessage").textContent = "Close your eyes, make a wish!";
  document.querySelector("#cakeNext").disabled = true; document.querySelector("#storyText").textContent = ""; document.querySelector("#typeCursor").classList.remove("hidden");
  pages.forEach((page, index) => { page.classList.toggle("active", index === 0); page.classList.remove("leaving"); page.setAttribute("aria-hidden", String(index !== 0)); }); updateProgress();
});
window.addEventListener("pagehide", stopMicrophone);
