let keys = [];
let sounds = [];
let pattern = [0, 4, 0, 2, 0, 4, 4]; // Represents the rhythm pattern "0----0--" with indices of sounds/keys
let currentIndex = 0; // Current index in the rhythm pattern
let lastTimeStamp = 0; // To track the timing of rhythm playback
let bpm = 100; // Tempo in beats per minute
let stepDuration; // Duration of one step in the pattern in milliseconds
let sliderBeats, sliderSteps, button;

let pauses = 2;
let steps = 8;

function preload() {
  sounds.push(loadSound("sounds/pause.wav"));
  sounds.push(loadSound("sounds/note_C.wav"));
  sounds.push(loadSound("sounds/note_D.wav"));
  sounds.push(loadSound("sounds/note_E.wav"));
  sounds.push(loadSound("sounds/note_G.wav"));
  sounds.push(loadSound("sounds/note_A.wav"));
}

function setup() {
  createCanvas(400, 200);
  // Set text properties
  textSize(16);
  fill(0); // Black color

  // Display the pattern
  text("Pattern: " + pattern.join(" "), 10, 350);
  // Create labels
  beatsLabel = createElement("label", "Pauses: ");
  beatsLabel.position(10, 260);
  stepsLabel = createElement("label", "Steps: ");
  stepsLabel.position(10, 300);

  // Create sliders
  sliderBeats = createSlider(1, 7, 2);
  sliderBeats.position(10, 280);
  sliderSteps = createSlider(2, 8, 8);
  sliderSteps.position(10, 320);

  // Create button
  button = createButton("Update Pattern");
  button.position(10, 340);
  button.mousePressed(updatePattern);

  // Make keyboard
  let numberOfKeys = 6;
  let keyWidth = width / numberOfKeys;
  stepDuration = ((60 / bpm) * 1000) / (pattern.length / 2); // Calculate step duration based on pattern length and bpm

  for (let i = 0; i < numberOfKeys; i++) {
    keys.push({
      x: i * keyWidth,
      y: 0,
      width: keyWidth,
      height: 400,
      isPressed: false,
    });
  }
}

function draw() {
  background(255);

  let currentTime = millis();
  if (currentTime - lastTimeStamp > stepDuration) {
    let noteIndex = pattern[currentIndex];
    playSound(noteIndex);
    keys[noteIndex].isPressed = true; // Visually indicate key press
    currentIndex = (currentIndex + 1) % pattern.length; // Move to the next step in the pattern
    lastTimeStamp = currentTime;

    // Reset visual indication after a short delay
    setTimeout(() => {
      keys[noteIndex].isPressed = false;
    }, stepDuration / 2);
  }

  for (let i = 1; i < keys.length; i++) {
    key = keys[i];
    fill(key.isPressed ? "gray" : "white");
    stroke("black");
    rect(key.x, key.y, key.width, key.height);
  }
}

function mousePressed() {
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (
      mouseX > key.x &&
      mouseX < key.x + key.width &&
      mouseY > key.y &&
      mouseY < key.y + key.height
    ) {
      // Key is pressed
      keys[i].isPressed = true;
      playSound(i);
      setTimeout(() => {
        keys[i].isPressed = false; // Ensure visual reset after manual play
      }, 100); // Adjust as necessary for visual timing
    }
  }
}

function playSound(index) {
  if (sounds[index]) {
    if (sounds[index].isPlaying()) {
      sounds[index].stop(); // Stop the sound if it's already playing
    }
    sounds[index].setVolume(1.0); // Ensure the sound plays at full volume
    sounds[index].play();
  }
}

function updatePattern() {
  // Use slider values
  let pauses = sliderBeats.value();
  let steps = sliderSteps.value();

  if (pauses > steps) {
    alert("Pauses cannot be greater than steps!");
    pauses = steps;
  }
  // Reset the current pattern and index
  pattern = []; // Clear the current pattern
  currentIndex = 0; // Reset the index to start at the beginning of the new pattern

  // Euclidean rhythm algorithm to generate a new pattern based on user input
  pattern = getEuclideanRhythm(steps, pauses);

  // Update the pattern display below the UI elements
  let patternDisplay = document.getElementById("patternDisplay");
  patternDisplay.textContent = "Pattern: " + pattern.join(" "); // Display the pattern as a string
}

function getEuclideanRhythm(n, k) {
  if (n <= 0 || k <= 0 || n < k) {
    throw Error("invalid arguments");
  }

  let pattern = new Array(n)
    .fill()
    .map(() => Math.floor(Math.random() * 5) + 1); // Initialize pattern with different random notes
  for (let i = 0; i < k; i++) {
    pattern[Math.floor((i * n) / k)] = 0; // Distribute pauses evenly
  }
  return pattern;
}
