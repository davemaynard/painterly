// painterly: watch a photo get painted.
//
//   const source = rasterFromImageData(ctx.getImageData(0, 0, w, h));
//   const painting = plan(source, {seed: 7});
//   const painter = createPainter(ctx, painting, brushes.bristle);
//   painter.paintTo(painting.strokes.length);
//
// plan() is pure data in, pure data out; createPainter() is the only part that
// touches a canvas.
export {
  blur,
  cloneRaster,
  colorDistance,
  createRaster,
  dominantColor,
  type Gradient,
  luminance,
  type Raster,
  rasterFromImageData,
  sample,
  sobel,
} from './image';
export {
  type Brush,
  type BrushName,
  brushes,
  createPainter,
  createSchedule,
  type Painter,
  paintStroke,
  type Schedule,
} from './paint';
export {defaultRadii, meanDifference, type PlanOptions, plan, simulate} from './plan';
export {createRandom, jitter, type Random} from './random';
export type {Plan, Point, Rgb, Stroke} from './types';
