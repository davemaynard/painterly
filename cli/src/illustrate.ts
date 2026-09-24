// The whole recipe, from a loaded photo to a finished raster: prepare the
// photo, plan the strokes, paint them in bands, and finish the surface.
import {jitter, type Plan, plan, type Raster, rasterFromImageData} from '../../dist/index.js';
import {type BandPool, paintInBands} from './bands.ts';
import {flatGround, tonedGround} from './photo.ts';
import {type Style, type StyleName, styles} from './styles.ts';

export type Illustrated = {image: Raster; strokes: number};

/** Paint `photo` in `style`. `onStage` hears as each stage finishes, for progress. */
export async function illustrate(
  photo: Raster,
  style: StyleName,
  {seed, pool, onStage}: {seed: number; pool: BandPool; onStage?: (stage: string) => void},
): Promise<Illustrated> {
  const definition = styles[style];
  const {width, height} = photo;
  const source = definition.prepare?.(photo, seed) ?? photo;
  const options = definition.plan(width, height);
  const painting = plan(source, {seed, flow: 'tensor', ...options});
  onStage?.(`planned ${painting.strokes.length.toLocaleString()} strokes`);

  const [color, heights] = await Promise.all([
    paintInBands(pool, painting, {style, pass: 'color', ground: groundFor(definition, source)}),
    definition.relief
      ? paintInBands(pool, heightPlan(painting, definition.relief), {
          style,
          pass: 'relief',
          ground: flatGround(width, height, [128, 128, 128]),
        })
      : undefined,
  ]);
  onStage?.(`painted on ${pool.size} processes`);

  const image = rasterFromImageData({width, height, data: color});
  definition.finish(image, {
    photo,
    seed,
    heights: heights && rasterFromImageData({width, height, data: heights}),
  });
  return {image, strokes: painting.strokes.length};
}

function groundFor(definition: Style, source: Raster): Uint8ClampedArray {
  const {ground} = definition;
  if (ground === 'toned') {
    const [biggest = 1] = definition.plan(source.width, source.height).radii;
    return tonedGround(source, biggest);
  }
  if (ground === 'source') return tonedGround(source, 0);
  return flatGround(source.width, source.height, ground);
}

/**
 * The broad strokes of the plan, recolored as heights around mid-gray. Bigger
 * brushes carry more paint, so their heights wander further: up to `base`
 * levels for the finest broad stroke and `base + extra` for the biggest.
 */
function heightPlan(painting: Plan, {belowLayer, load}: NonNullable<Style['relief']>): Plan {
  const [base, extra] = load;
  const biggest = painting.strokes[0]?.radius ?? 1;
  const random = jitter(painting.seed);
  const strokes = painting.strokes
    .filter((stroke) => stroke.layer < belowLayer)
    .map((stroke) => {
      const wander = base + extra * Math.sqrt(stroke.radius / biggest);
      const level = 128 + (random() - 0.5) * wander;
      return {...stroke, color: [level, level, level] as Plan['ground']};
    });
  return {...painting, strokes};
}
