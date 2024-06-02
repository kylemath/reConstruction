function playAllSounds() {
  backgroundSound.play();
  for (let i = 1; i <= 5; i++) {
    let sound = sounds[i];
    sound.play();
    // envelope.play(sound);
  }
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
