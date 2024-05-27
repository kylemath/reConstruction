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
let envelope; // Create an envelope

let cycleCounter = 0; // Counter for the number of cycles
let ctracker;

let faceX = 0;
let faceY = 0;

let soundsPerNote = {
  'Asharp': [1, 18],
  'Csharp': [19, 34],
  'Dsharp': [35, 55],
  'Fsharp': [56, 69],
  'Gsharp': [71, 89],
};

let soundNumber




function preload() {

  sounds.push(loadSound("sounds/pause.wav"));

  for (let i = 0; i < 5; i++) {
    let note = Object.keys(soundsPerNote)[i];
    soundNumber = soundsPerNote[note][0] + 
    Math.round(Math.random() * 
    (soundsPerNote[note][1] - soundsPerNote[note][0])
    );
    sounds.push(loadSound('sounds/'+ (i+1) +'_' + note + `_mp3/${soundNumber}.mp3`));  }
 

  // Define the current puzzle number
  let puzzleNumber = 8;
  // Construct the base path for the images
  const basePath = `puzzles/curvilinear${puzzleNumber}_SILOUHETTEEXTRACTIONS`;

  // Load images from 1 to 5
  for (let i = 1; i <= 5; i++) {
    loadImage(`${basePath}/${i}.png`, (img) => {
      images[i - 1] = img;
      centroids[i - 1] = calculateCentroid(img);
    });
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

  // Setup video capture
  let videoInput = createCapture(VIDEO);
  videoInput.size(width, height);
  videoInput.hide();

  // Setup clmtrackr
  ctracker = new clm.tracker();
  ctracker.init();
  ctracker.start(videoInput.elt);
}

function draw() {
  background(255); // Clear the canvas before drawing the images

  // Get array of face marker positions [x, y] format
  let positions = ctracker.getCurrentPosition();

  stroke(255, 0, 0); // Red color
  if (positions) {
    // Correct for mirrored video capture
    // faceX = width - positions[62][0];
    // faceY = positions[62][1];

    // for mouse testing
    faceX = mouseX;
    faceY = mouseY;

    // Map the face's x position to the range of possible values for pauses
    let pauses = map(faceX, 0, width, 1, steps, true);

    // Map the face's y position to the range of possible values for steps
    steps = map(faceY, 0, height, 8, 2, true);

    // Round the values to integers
    steps = Math.round(steps);
    pauses = Math.round(pauses);

    if (pauses == steps) {
      pauses = steps - 1;
    }

    // Draw crosshair at face position
    stroke(0, 255, 0); // Green color
  }

  for (let i = 0; i < 5; i++) {
    push(); // Save the current transformation matrix

    // Calculate displacement, scale, and rotation based on mouse position
    let displacementX =
      map(faceX, 0, width, -0.5, 0.5) * (random() - 0.5) * 200;
    let displacementY =
      map(faceX, 0, width, -0.5, 0.5) * (random() - 0.5) * 200;
    let rotation = map(faceY, 0, height, -PI, PI);
    let tscale = map(faceY, 0, height, 0.5, 1.5);

    // Apply transformations
    translate(centroids[i].x, centroids[i].y); // Move to the centroid of the image
    rotate(rotation); // Apply rotation
    scale(tscale);
    translate(-centroids[i].x, -centroids[i].y); // Move back
    translate(displacementX, displacementY); // Apply displacement

    // Draw the image
    imageMode(CENTER); // Draw the image centered at the specified position
    image(images[i], width / 2, height / 2);

    pop(); // Restore the transformation matrix
  }

  line(faceX, 0, faceX, height); // Vertical line
  line(0, faceY, width, faceY); // Horizontal line

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
