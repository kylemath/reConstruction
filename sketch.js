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

let images = []; // Array to store images

let centroids = []; // Array to store centroids of images
// Create an envelope
let envelope;
let cycleCounter = 0; // Counter for the number of cycles

function preload() {
  sounds.push(loadSound("sounds/pause.wav"));
  sounds.push(loadSound("sounds/note_C.wav"));
  sounds.push(loadSound("sounds/note_D.wav"));
  sounds.push(loadSound("sounds/note_E.wav"));
  sounds.push(loadSound("sounds/note_G.wav"));
  sounds.push(loadSound("sounds/note_A.wav"));

  // loads images
  for (let i = 1; i <= 5; i++) {
    loadImage(
      `./content/curvilinear_1_SILOUHETTE_EXTRACTIONS/Bard_Generated_Image-79_cutout_${i}.png`,
      (img) => {
        images[i - 1] = img;
        centroids[i - 1] = calculateCentroid(img);
      }
    );
  }

  envelope = new p5.Envelope();
  envelope.setADSR(0.1, 0.2, 0.5, 1); // Attack time, decay time, sustain level, release time
  envelope.setRange(1.0, 0); // Maximum level, minimum level
}

function setup() {
  createCanvas(2000, 1500);
  background(255);
  frameRate(10); // Set the frame rate to 10 frames per second

  // Set text properties
  textSize(16);
  fill(0); // Black color

  // Display the pattern
  text("Pattern: " + pattern.join(" "), 10, 350);

  // Make keyboard
  stepDuration = ((60 / bpm) * 1000) / (pattern.length / 2); // Calculate step duration based on pattern length and bpm
}

function draw() {
  background(255); // Clear the canvas before drawing the images

  for (let i = 0; i < 5; i++) {
    push(); // Save the current transformation matrix

    // Calculate displacement, scale, and rotation based on mouse position
    let displacementX = map(mouseX, 0, width, 0, 1) * (random() - 0.5) * 200;
    let displacementY = map(mouseX, 0, width, 0, 1) * (random() - 0.5) * 200;
    let rotation = map(mouseY, 0, height, 0, TWO_PI);

    // Apply transformations
    translate(centroids[i].x, centroids[i].y); // Move to the centroid of the image
    rotate(rotation); // Apply rotation
    scale(1);
    translate(-centroids[i].x, -centroids[i].y); // Move back
    translate(displacementX, displacementY); // Apply displacement

    // Draw the image
    imageMode(CENTER); // Draw the image centered at the specified position
    image(images[i], width / 2, height / 2);

    pop(); // Restore the transformation matrix
  }

  // Map the mouse's y position to the range of possible values for steps
  steps = map(mouseY, 0, height, 8, 2, true);
  steps = Math.round(steps);

  // Map the mouse's x position to the range of possible values for pauses, with the maximum being the current number of steps
  pauses = map(mouseX, 0, width, 0, steps, true);
  pauses = Math.round(pauses);
  if (pauses == steps) {
    pauses = steps - 1;
  }

  let currentTime = millis();
  if (currentTime - lastTimeStamp > stepDuration) {
    let noteIndex = pattern[currentIndex];
    playSound(noteIndex);
    currentIndex = (currentIndex + 1) % pattern.length; // Move to the next step in the pattern
    // Check if a new pattern is ready and the current pattern has finished playing
    if (currentIndex === 0) {
      cycleCounter++; // Increment the counter each time a cycle completes
      if (cycleCounter === 4) {
        updatePattern(); // Update the pattern
        cycleCounter = 0; // Reset the counter
      }
    }
    lastTimeStamp = currentTime;
  }
}

function mousePressed() {}

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
  // // Use slider values
  // let pauses = sliderBeats.value();
  // let steps = sliderSteps.value();

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
  if (n <= 0 || k < 0 || n < k) {
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
        // If the pixel is not transparent
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  if (count === 0) {
    return createVector(img.width / 2, img.height / 2); // Return the center of the image if all pixels are transparent
  } else {
    return createVector(sumX / count, sumY / count); // Return the centroid of non-transparent pixels
  }
}
