let debug = false; // Set to true for debugging, false for normal operation

// Timing
let puzzleTimeSeconds = 120;
let puzzleTransitionTimeSeconds = 6;

if (debug) {
  puzzleTimeSeconds = 2;
  puzzleTransitionTimeSeconds = 2;
}

// Puzzle Logic
let currentState;
let startVideo;
let videoEndTime;
let mainLoopStartTime = 0;
let puzzleNumber = 1;
let puzzleOrder = [];
for (let i = 1; i <= 8; i++) {
  // Assuming you have 8 puzzles
  puzzleOrder.push(i);
}
// Shuffle the puzzle order
shuffleArray(puzzleOrder);
console.log("puzzle order", puzzleOrder);
let firstPlayInitiated = false;

// Visual Stimuli
let iconWidth = 100;
let iconHeight = iconWidth;
let images = []; // Array to store images
let centroids = []; // Array to store centroids of images

let alphaValue = 0; // Initialize value for fade-in effect of puzzle
let splashScreenImage;
let blankScreenImage;
let transitionImages = [];

// Auditory Stimuli
let sounds = [];
let backgroundSound;

let audioSustainLevel = 0.5; // 0-1
let audioReleaseTime = 0.5; // Seconds
let audioAttackTime = 0.1; // Seconds
let audioDecayTime = 0.3; // Seconds

let soundsStarted = false; // Flag to track if sounds have started playing
let soundsPerNote = {
  Asharp: [1, 18],
  Csharp: [19, 34],
  Dsharp: [35, 55],
  Fsharp: [56, 69],
  Gsharp: [71, 89],
};
let soundNumber;

let volumeBackground = 0.4;
let volumeSettings = {
  Asharp: 0.2,
  Csharp: 0.2,
  Dsharp: 0.2,
  Fsharp: 0.2,
  Gsharp: 0.2,
};

// Face Tracking
let faceMesh;
let webcamVideo;
let faces = [];
let faceX = 0;
let faceY = 0;
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let videoDownsampleFactor = 2;

// Setup functions
// ------
function preload() {
  for (let i = 2; i <= 8; i++) {
    transitionImages[i] = loadImage(`splashScreens/${i}.jpg`);
  }
  iconImage = loadImage("assets/ICON_reconstruction.png");
  console.log("transitionImagesLoaded", transitionImages);
  splashScreenImage = loadImage("splashScreens/StartPressKey.jpg");
  blankScreenImage = loadImage("splashScreens/Blank.jpg");
  startVideo = createVideo(["videos/startVideo.mp4"]);
  startVideo.hide(); // Hide the HTML video element
  startVideo.position(100, 100);
  startVideo.onended(videoEnded); // Add an event listener for when the video ends
  if (debug) {
    startVideo.elt.ontimeupdate = function () {
      if (startVideo.time() >= 4) {
        // Stop the video after 2 second
        startVideo.stop();
        videoEnded(); // Manually call the videoEnded function
      }
    };
  }

  endVideo = createVideo(["videos/endVideo.mp4"]);
  endVideo.hide(); // Hide the HTML video element
  endVideo.onended(reset); // Add an event listener for when the video ends
  if (debug) {
    endVideo.elt.ontimeupdate = function () {
      if (endVideo.time() >= 4) {
        // Stop the video after 2 second
        endVideo.stop();
      }
    };
  }

  let backgroundSoundNumber = Math.floor(Math.random() * 11) + 90; //  there are 11 background sounds
  let backgroundSoundFile = `sounds/6_wildcard_ambience/${backgroundSoundNumber}_WC.mp3`;
  console.log("Background Sound File:", backgroundSoundFile);
  backgroundSound = loadSound(backgroundSoundFile);
  loadSounds();

  let envelope = new p5.Envelope();
  envelope.setADSR(
    audioAttackTime,
    audioDecayTime,
    audioSustainLevel,
    audioReleaseTime
  );
  envelope.setRange(1.0, 0); // Maximum level, minimum level

  // Load the faceMesh Model
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth * 0.9, windowHeight * 0.9);
  currentState = "splashScreen";

  background(255);
  frameRate(30); // Set the frame rate to 10 frames per second
}

// ----
// Main Animation
// ----
function draw() {
  if (currentState === "splashScreen") {
    image(splashScreenImage, 0, 0, width, height);
  } else if (currentState === "startVideo") {
    image(startVideo, 0, 0, width, height);
  } else if (currentState === "blankScreen") {
    image(blankScreenImage, 0, 0, width, height); // Display the splash screen image
  } else if (currentState === "transition") {
    console.log("puzzleNumber", puzzleNumber);
    image(transitionImages[puzzleNumber + 1], 0, 0, width, height);
  } else if (currentState === "endVideo") {
    image(endVideo, 0, 0, width, height);
  } else if (currentState === "mainLoop") {
    if (puzzleNumber === 1 && firstPlayInitiated === false) {
      console.log("FirstPlayInitiated", firstPlayInitiated);
      firstPlayInitiated = true;
      playAllSounds(); // Start playing the sounds for the first puzzle
    }

    background(255); // Clear the canvas before drawing the images
    tint(255, alphaValue);

    // Draw the first tracked face points
    let face = faces[0];
    if (face && face.keypoints) {
      // Compute mouth opening
      let mouthArea =
        face.lips.width * face.lips.height * videoDownsampleFactor;
      iconWidth = map(mouthArea, 1000, 8000, 20, 120);

      // Compute centroid in a single pass
      let meanFace = createVector(0, 0);
      let numKeypoints = face.keypoints.length;

      for (let keypoint of face.keypoints) {
        meanFace.x += keypoint.x;
        meanFace.y += keypoint.y;
      }
      meanFace.x /= numKeypoints;
      meanFace.y /= numKeypoints;

      faceX = width - meanFace.x * videoDownsampleFactor;
      faceY = meanFace.y * videoDownsampleFactor;

      // // for mouse testing
      // faceX = mouseX;
      // faceY = mouseY;
    }

    for (let i = 0; i < 5; i++) {
      if (centroids[i]) {
        // Check if the centroid has been loaded
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
      updateVolumesBasedOnDistance(); // Adjust volumes based on face position

      // Increase alphaValue to create the fade-in effect
      if (alphaValue < 255) {
        alphaValue += 2; // Adjust this value to control the speed of the fade-in
      }
    }

    image(
      iconImage,
      faceX - iconWidth / 2,
      faceY - iconWidth / 2,
      iconWidth,
      iconWidth
    ); // Add iconWidth and iconHeight as needed

    if (millis() - mainLoopStartTime >= puzzleTimeSeconds * 1000) {
      advancePuzzle();
    }
  }
}

// User Interactions
// -----
function keyPressed() {
  if (currentState === "splashScreen") {
    startFirstVideo();
  } else if (currentState === "mainLoop") {
    // Advance to the next puzzle or transition state
    advancePuzzle();
  }
}

function mouseClicked() {
  if (currentState === "splashScreen") {
    startFirstVideo();
  } else if (currentState === "startVideo") {
    startVideo.stop(); // Stop the video
    videoEnded(); // Manually call the videoEnded function to proceed
  } else if (currentState === "mainLoop") {
    advancePuzzle();
  }
}

// Advance puzzle functions
// -----
function advancePuzzle() {
  console.log(
    "AdvancePuzzle called, puzzle number: ",
    puzzleNumber,
    "currentState:",
    currentState
  );
  currentState = "transition";
  fadeOutAllSounds(); // Fade out all sounds
  if (puzzleNumber < 8) {
    setTimeout(startNextLoop, puzzleTransitionTimeSeconds * 1000); // Start the next loop after the transition
  } else {
    currentState = "endVideo";
    fadeOutAllSounds(); // Fade out all sounds
    setTimeout(playEndVideo, puzzleTransitionTimeSeconds * 1000); // Start the next loop after the transition
  }
}

function startNextLoop() {
  clearSounds(); // Clear previous sounds
  clearImages(); // Clear previous images

  console.log(
    "startNextLoop Called, puzzle number: ",
    puzzleNumber,
    "currentState:",
    currentState
  );
  puzzleNumber++;
  alphaValue = 0; // Reset alpha value for the next puzzle's fade-in effect

  console.log("New puzzle Number:", puzzleNumber);
  if (puzzleNumber <= 8) {
    // Load the corresponding splash screen image
    splashScreenImage = loadImage(`splashScreens/${puzzleNumber}.jpg`);
    loadSounds();
    // Start the next loop
    currentState = "blankScreen";

    setTimeout(function () {
      currentState = "mainLoop";
      playAllSounds(); // Start playing the new sounds
      mainLoopStartTime = millis(); // Store the time when the main loop starts
    }, 2000); // Wait for 2 seconds
  }
}

// Sound functions
// -----
function loadSounds() {
  sounds = [];
  for (let i = 0; i < 5; i++) {
    let note = Object.keys(soundsPerNote)[i];
    soundNumber =
      soundsPerNote[note][0] +
      Math.round(
        Math.random() * (soundsPerNote[note][1] - soundsPerNote[note][0])
      );
    let currentSoundFile =
      "sounds/" + (i + 1) + "_" + note + `_mp3/${soundNumber}.mp3`;
    console.log(
      "Loading Sounds File:",
      currentSoundFile,
      "File Number:",
      sounds.length
    );
    let sound = loadSound(currentSoundFile);

    // Panning for each of the five notes
    if (i === 0) {
      sound.pan(-1);
    } else if (i === 1) {
      sound.pan(-0.5);
    } else if (i === 2) {
      sound.pan(0);
    } else if (i === 3) {
      sound.pan(0.5);
    } else if (i === 4) {
      sound.pan(1);
    }

    sounds.push(sound);
  }

  let backgroundSoundNumber = Math.floor(Math.random() * 11) + 90; //  there are 11 background sounds
  let backgroundSoundFile = `sounds/6_wildcard_ambience/${backgroundSoundNumber}_WC.mp3`;
  console.log("Background Sound File:", backgroundSoundFile);
  backgroundSound = loadSound(backgroundSoundFile);

  console.log("Sounds loaded:", sounds);

  // Construct the base path for the images
  const basePath = `puzzles/curvilinear${
    puzzleOrder[puzzleNumber - 1]
  }_SILOUHETTEEXTRACTIONS`;
  console.log("loading from folder:", basePath);

  // Load images from 1 to 5
  images = [];
  centroids = [];
  for (let i = 1; i <= 5; i++) {
    loadImage(`${basePath}/${i}.png`, (img) => {
      images.push(img);
      console.log("Image loaded:", img);
      centroids.push(calculateCentroid(img));
    });
  }

  console.log("Images loaded:", images);
}

function playAllSounds() {
  console.log(
    "PlayAllSounds Called, puzzleNumber:",
    puzzleNumber,
    "CurrentState",
    currentState
  );
  backgroundSound.setVolume(volumeBackground);
  backgroundSound.loop();
  Object.keys(soundsPerNote).forEach((note, index) => {
    let sound = sounds[index];
    sound.setVolume(volumeSettings[note]);
    sound.loop();
  });
}

function fadeOutAllSounds() {
  // Fade out the background sound
  if (backgroundSound) {
    backgroundSound.fade(0, puzzleTransitionTimeSeconds); // Fade to volume 0 over 1 second
  }
  // Fade out all sounds in the sounds array
  for (let sound of sounds) {
    sound.fade(0, puzzleTransitionTimeSeconds); // Fade to volume 0 over 1 second
  }
}

function clearSounds() {
  backgroundSound.stop();
  for (let i = 0; i < sounds.length; i++) {
    if (sounds[i]) {
      sounds[i].stop();
      sounds[i] = null; // Remove reference to the sound
    }
  }
}

function updateVolumesBasedOnDistance() {
  for (let i = 0; i < centroids.length; i++) {
    if (centroids[i]) {
      // Calculate the distance between the face and the centroid
      let distance = dist(faceX, faceY, centroids[i].x, centroids[i].y);
      // Map the distance to a volume level (0.0 to 1.0)
      // Assuming a maximum effective distance of 600 pixels for full volume
      let volume = map(distance, 0, 600, 0.8, 0.0, true);
      volume = constrain(volume, 0, 1); // Ensure volume is within bounds

      // Update the volume of the corresponding sound
      if (sounds[i]) {
        sounds[i].setVolume(volume);
      }
    }
  }
  // adjust background sound based on mouth
  let currentBackgroundVolume =
    volumeBackground + map(iconWidth, 20, 120, -0.2, 0.2);
  backgroundSound.setVolume(currentBackgroundVolume);
}

// Face Tracker Functions
// ----
function gotFaces(results) {
  // Save the output to the faces variable
  faces = results;
}

function startFaceDetection() {
  faceX = width / 2;
  faceY = height / 2;
  // Setup video capture
  webcamVideo = createCapture(VIDEO);
  webcamVideo.size(
    width / videoDownsampleFactor,
    height / videoDownsampleFactor
  );
  webcamVideo.hide();

  // Start detecting faces from the webcam video
  faceMesh.detectStart(webcamVideo, gotFaces);
}

// Visual stim functions
// -----
function startFirstVideo() {
  let fs = fullscreen();
  fullscreen(!fs);
  resizeCanvas(displayWidth * 0.9, displayHeight * 0.9);

  startFaceDetection();
  currentState = "startVideo";
  startVideo.play(); // Start playing the video
}

function clearImages() {
  for (let i = 0; i < images.length; i++) {
    if (images[i]) {
      images[i] = null; // Remove reference to the image
    }
  }
}

function playEndVideo() {
  clear();
  endVideo.play();
}

function videoEnded() {
  currentState = "blankScreen";
  setTimeout(function () {
    currentState = "mainLoop";
  }, 2000); // Wait for 2 seconds
}

// Helper functions
function shuffleArray(array) {
  // Shuffle function (Fisher-Yates shuffle)

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

function reset() {
  // Reload the page to reset the application
  window.location.reload();
}
