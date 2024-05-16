function playSound(index) {
  if (sounds[index]) {
    if (sounds[index].isPlaying()) {
      sounds[index].fade(0, 0.25); // Fade out over 0.1 seconds
      // setTimeout(() => sounds[index].stop(), 100); // Stop the sound after the fade-out
    }
    sounds[index].setVolume(0.0); // Start the sound at zero volume for fade-in
    sounds[index].play();
    sounds[index].setVolume(1, 0.25); // Fade in over 0.1 seconds
  }
}

function updatePattern() {
  if (pauses > steps) {
    alert("Pauses cannot be greater than steps!");
    pauses = steps;
  }
  pattern = []; // Clear the current pattern
  currentIndex = 0; // Reset the index to start at the beginning of the new pattern
  pattern = getEuclideanRhythm(steps, pauses);
  let patternDisplay = document.getElementById("patternDisplay");
  patternDisplay.textContent = "Pattern: " + pattern.join(" ");
}

function getEuclideanRhythm(n, k) {
  if (n <= 0 || k < 0 || n < k) {
    throw Error("invalid arguments");
  }
  let pattern = new Array(n)
    .fill()
    .map(() => Math.floor(Math.random() * 5) + 1);
  for (let i = 0; i < k; i++) {
    pattern[Math.floor((i * n) / k)] = 0;
  }
  return pattern;
}

function calculateCentroid(img) {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  img.loadPixels();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let index = (x + y * img.width) * 4;
      let alpha = img.pixels[index + 3];
      if (alpha > 0) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }
  if (count === 0) {
    return createVector(img.width / 2, img.height / 2);
  } else {
    return createVector(sumX / count, sumY / count);
  }
}
