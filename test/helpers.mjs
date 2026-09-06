import {createRaster} from '../dist/index.js';

/** A photo the tests can reason about: a hard vertical edge with a soft ramp on one side. */
export function edgeRaster(width = 160, height = 120) {
  const raster = createRaster(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      if (x < width / 2) {
        raster.data[i] = 200;
        raster.data[i + 1] = 40 + (y / height) * 60;
        raster.data[i + 2] = 40;
      } else {
        raster.data[i] = 30;
        raster.data[i + 1] = 60;
        raster.data[i + 2] = 200;
      }
    }
  }
  return raster;
}

/** A smooth left-to-right ramp: the gradient points along x everywhere, so every stroke should run along y. */
export function rampRaster(width = 160, height = 120) {
  const raster = createRaster(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      raster.data[i] = 20 + (x / width) * 220;
      raster.data[i + 1] = 80;
      raster.data[i + 2] = 240 - (x / width) * 220;
    }
  }
  return raster;
}
