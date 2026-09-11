export type Quality = {
  sparks: number;
  clouds: number;
  starfield: number;
  pixelRatio: number;
  mobile: boolean;
};

export function detectQuality(): Quality {
  const narrow = window.matchMedia("(max-width: 720px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const mobile = narrow || (coarse && window.innerWidth < 1100);
  const dpr = window.devicePixelRatio || 1;
  if (mobile) {
    return {
      sparks: 4200,
      clouds: 1600,
      starfield: 700,
      pixelRatio: Math.min(dpr, 1.5),
      mobile: true,
    };
  }
  return {
    sparks: 11000,
    clouds: 3200,
    starfield: 1600,
    pixelRatio: Math.min(dpr, 2),
    mobile: false,
  };
}
