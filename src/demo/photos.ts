// The photos the page offers. Three are Unsplash (free to use under the
// Unsplash License; credited anyway), one is Dave's own dog. All are shipped
// with their metadata stripped and resized so the longer side is 1400px.

export type Photo = {
  id: string;
  file: string;
  /** Shown under the canvas. */
  caption: string;
  credit: {name: string; url: string} | null;
};

export const photos: Photo[] = [
  {
    id: 'golden',
    file: 'photos/golden.jpg',
    caption: 'A golden retriever on a wet Atlanta sidewalk',
    credit: null,
  },
  {
    id: 'mist',
    file: 'photos/mist.jpg',
    caption: 'Bare trees over a still river in morning mist',
    credit: {name: 'Jonny Gios', url: 'https://unsplash.com/photos/8mTgxXVpGGI'},
  },
  {
    id: 'oranges',
    file: 'photos/oranges.jpg',
    caption: 'Oranges on a table in window light',
    credit: {name: 'Cristina Anne Costello', url: 'https://unsplash.com/photos/7Jbx0dZyJkw'},
  },
  {
    id: 'boats',
    file: 'photos/boats.jpg',
    caption: 'Rowboats on an alpine lake',
    credit: {name: 'Pietro De Grandi', url: 'https://unsplash.com/photos/T7K4aEPoGGk'},
  },
];
