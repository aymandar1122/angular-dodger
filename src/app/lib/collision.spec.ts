import { rectsOverlap } from './collision';

describe('rectsOverlap', () => {
  it('returns true when rectangles overlap', () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 10, y: 10, width: 20, height: 20 };

    expect(rectsOverlap(a, b)).toBeTrue();
    expect(rectsOverlap(b, a)).toBeTrue();
  });

  it('returns false when rectangles only touch at the edges', () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 20, y: 0, width: 20, height: 20 };
    const c = { x: 0, y: 20, width: 20, height: 20 };

    expect(rectsOverlap(a, b)).toBeFalse();
    expect(rectsOverlap(a, c)).toBeFalse();
  });

  it('returns false when rectangles do not overlap', () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 50, y: 50, width: 10, height: 10 };

    expect(rectsOverlap(a, b)).toBeFalse();
  });
});
