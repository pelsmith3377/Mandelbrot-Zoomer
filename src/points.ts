export interface PointOfInterest {
  id: number;
  name: string;
  description: string;
  centerX: number;
  centerY: number;
  maxZoom: number; // High enough to see detail, but within WebGL float32 bounds (50,000 to 150,000)
  // Cosine palette config: color = a + b * cos(6.28318 * (c * t + d))
  paletteA: [number, number, number];
  paletteB: [number, number, number];
  paletteC: [number, number, number];
  paletteD: [number, number, number];
}

export const POINTS_OF_INTEREST: PointOfInterest[] = [
  {
    id: 1,
    name: "Seahorse Valley",
    description: "Centuries of spiral division resembling majestic seahorse formations cascading infinitely.",
    centerX: -0.743643887,
    centerY: 0.131825904,
    maxZoom: 140000.0,
    // Oceanic Palette (Blues, Teals, and Purples)
    paletteA: [0.5, 0.5, 0.5],
    paletteB: [0.5, 0.5, 0.5],
    paletteC: [1.0, 1.0, 1.0],
    paletteD: [0.0, 0.33, 0.67],
  },
  {
    id: 2,
    name: "Elephant Valley",
    description: "Pachyderm-like shapes with raised trunks marching along the boundary of the main cardioid.",
    centerX: 0.277359825605773106, 
    centerY: 0.007315052840165309325,
    maxZoom: 60000.0,
    // Sunset Fire Palette (Warm Golds, Oranges, Reds)
    paletteA: [0.5, 0.5, 0.5],
    paletteB: [0.5, 0.5, 0.5],
    paletteC: [1.0, 1.0, 1.0],
    paletteD: [0.0, 0.1, 0.2],
  },
  {
    id: 3,
    name: "Triple Spiral Valley",
    description: "A delicate nexus where three massive ornamental spiraling branches converge perfectly.",
    centerX: -0.088435529218091719635,
    centerY: 0.6544637335479181876,
    maxZoom: 80000.0,
    // Cyberpunk Dream Palette (Pinks, Magentas, Neon Cyan)
    paletteA: [0.5, 0.5, 0.5],
    paletteB: [0.5, 0.5, 0.5],
    paletteC: [1.0, 1.0, 1.0],
    paletteD: [0.8, 0.9, 0.0],
  },
  {
    id: 4,
    name: "Scepter Valley",
    description: "Crown-like structures and scepters rising from the sea of high-frequency geometry.",
    centerX: -1.2505,
    centerY: 0.0465,
    maxZoom: 110000.0,
    // Imperial Velvet Palette (Gold, Purple, Amber)
    paletteA: [0.8, 0.5, 0.4],
    paletteB: [0.2, 0.4, 0.2],
    paletteC: [2.0, 1.0, 1.0],
    paletteD: [0.0, 0.25, 0.25],
  },
  {
    id: 5,
    name: "Miniature Mandelbrot",
    description: "A perfect, tiny replica of the parent set deep within the outer needle antennas.",
    centerX: -1.75,
    centerY: 0.0,
    maxZoom: 50000.0,
    // Acid Lime Palette (Bright Greens, Yellows, Dark Forest)
    paletteA: [0.5, 0.6, 0.7],
    paletteB: [0.5, 0.5, 0.3],
    paletteC: [1.0, 1.0, 1.0],
    paletteD: [0.0, 0.15, 0.2],
  },
  {
    id: 6,
    name: "Double Spiral Valley",
    description: "Twin interlocking arms of fractal geometry twisting around a central point.",
    centerX: -0.761574,
    centerY: 0.0847596,
    maxZoom: 150000.0,
    // Twilight Space Palette (Dusk Purples, Warm Pinks, Dark Blues)
    paletteA: [0.5, 0.5, 0.5],
    paletteB: [0.5, 0.5, 0.5],
    paletteC: [1.0, 1.0, 0.5],
    paletteD: [0.8, 0.9, 0.3],
  },
  {
    id: 7,
    name: "Starfish point",
    description: "Five-pointed radial formations clustered in a vibrant ocean of complexity.",
    centerX: -0.37424712424078289123,
    centerY: 0.60783389990352808405,
    maxZoom: 90000.0,
    // Neon Indigo Palette (Vibrant Blues, Neon Mints)
    paletteA: [0.5, 0.5, 0.5],
    paletteB: [0.5, 0.5, 0.5],
    paletteC: [1.0, 1.0, 1.0],
    paletteD: [0.3, 0.2, 0.2],
  },
  {
    id: 8,
    name: "Golden ratio spiral area",
    description: "Extremely tight geometric formations following logarithmic golden spirals.",
    centerX: -0.748,
    centerY: 0.1,
    maxZoom: 75000.0,
    // Cosmos Nebula Palette (Deep violets, Neon purples, Golds)
    paletteA: [0.8, 0.2, 0.5],
    paletteB: [0.3, 0.6, 0.7],
    paletteC: [1.0, 1.0, 1.0],
    paletteD: [0.2, 0.5, 0.7],
  },
  {
    id: 9,
    name: "Mandelbrot Needle Valley",
    description: "Fine, needle-like geometric spurs shoot outwards from the main cardioid.",
    centerX: -0.16070135,
    centerY: 1.0375665,
    maxZoom: 120000.0,
    // Opal & Platinum Palette (Teal, Blue-Gray, Rose highlights)
    paletteA: [0.5, 0.5, 0.5],
    paletteB: [0.5, 0.5, 0.5],
    paletteC: [1.0, 1.0, 1.0],
    paletteD: [0.5, 0.1, 0.05],
  },
  {
    id: 10,
    name: "East Cardioid Tendril",
    description: "Webbed, feathery lace patterns framing the easternmost boundary of the cardioid.",
    centerX: 0.26,
    centerY: -0.0016,
    maxZoom: 85000.0,
    // Cosmic Fireworks (Electric reds, Orange, Purple)
    paletteA: [0.5, 0.5, 0.5],
    paletteB: [0.5, 0.5, 0.5],
    paletteC: [2.0, 1.0, 0.0],
    paletteD: [0.5, 0.2, 0.25],
  },
];
