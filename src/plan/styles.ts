// Named ways to paint. A style is a bundle of planner options, sized to the
// photo, so the page can offer them by name and a URL can name one.
//
// `painting` is the default: five brushes, coarse to fine, until the picture
// is a likeness. `underpainting` stops after the first brush, with the longer
// strokes and looser threshold the very first build had. It was meant to be a
// stage on the way to a painting; it turned out to be the picture people
// liked, so it stays as its own thing.
import type {PlanOptions} from './plan';

export type StyleName = 'painting' | 'underpainting';

export const styles: Record<
  StyleName,
  {label: string; options(width: number, height: number): PlanOptions}
> = {
  painting: {
    label: 'Painting',
    options: () => ({}),
  },
  underpainting: {
    label: 'Underpainting',
    options: (width, height) => ({
      radii: [Math.max(width, height) / 40],
      threshold: 60,
      minLength: 4,
      maxLength: 16,
    }),
  },
};

export function isStyleName(name: string | null): name is StyleName {
  return name !== null && name in styles;
}
