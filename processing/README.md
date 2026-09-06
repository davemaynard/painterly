# The 2020 sketches

These are the Processing (Python mode) sketches that `painterly` grew out of,
kept exactly as they were written in January 2020, from the repo that was then
called `paintings.py`. Processing 4 dropped Python mode, so they need Processing 3
with the Python mode add-on to run today. They are here as the origin story, not
as working code.

- `brush_strokes/` is the one that mattered: pick a random unpainted pixel, lay a
  six-bristle bezier stroke in that colour with alpha and a little colour drift,
  repeat until the pixels run out. `frames/husky/2021-01-19/frame-89296.jpg` is
  what it produced, and is the bar the TypeScript port had to clear.
- `brush_strokes_ordered/` painted in scan order instead of at random.
- `brush_strokes_pointillism/` swapped strokes for dots. It never saved a finished
  frame; its `round` brush lives on as a preset in the port.
- `pixelate/` was the first step toward a mosaic.
- `boilerplate/` is the starter the others were copied from.

The sample photos those sketches painted had no recorded licence, so they are not
in this repo.
