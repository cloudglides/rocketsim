

export const PHYSICS = {
  THRUST_POWER: 0.012,
  GRAVITY: 0.0025,
  MASS: 1000,
  DRAG_COEFFICIENT: 0.0001,
  FUEL_CONSUMPTION: 0.3,
  INITIAL_FUEL: 200,
};

export const PARTICLES = {
  FLAME_COUNT: 5000,
  SMOKE_COUNT: 1800,
  PARTICLE_SCALE: 1.0,
};

export const SCENE = {
  GROUND_WIDTH: 400,
  GROUND_HEIGHT: 400,
  GROUND_COLOR: 0x8b4513,
  SKY_COLOR: 0x87ceeb,
  FOG_NEAR: 50,
  FOG_FAR: 200,
};

export const CAMERA = {
  FOV: 65,
  NEAR: 0.1,
  FAR: 1000,
  DEFAULT_POV_OFFSET: 25,
};

export const CONTROLS = {
  DAMPING_FACTOR: 0.08,
  ROTATE_SPEED: 0.6,
  ZOOM_SPEED: 1.0,
  PAN_SPEED: 0.8,
};

export const LIGHTING = {
  AMBIENT_INTENSITY: 0.6,
  DIRECTIONAL_INTENSITY: 1.1,
  BASE_LIGHT_COLOR: 0xffa04d,
  BASE_LIGHT_DISTANCE: 12,
};

export const DIAMONDS = {
  COUNT: 6,
  BASE_RADIUS: 0.6,
  OUTER_RADIUS: 0.8,
};

export const WIND = {
  X: 0.0004,
  Y: 0,
  Z: 0.00015,
};


export const GROUND_LEVEL = 0;
export const GROUND_Y = -8;
export const GROUND_COLOR = 0x8b4513;
export const NOZZLE_OFFSET = 2.2;
export const ROCKET_SPAWN_Y = 0;
export const PARTICLE_SPAWN_Y_OFFSET = -5;
export const ORBITAL_ALTITUDE = 50;
export const ORBITAL_VELOCITY = 3.0;
export const GRAVITY_TRANSITION_START = 50;
export const GRAVITY_TRANSITION_END = 200;
export const SCALE_FACTOR = 0.1;
export const MAX_SPEED_KMS = 11.2;
export const SPEED_SHAKE_THRESHOLD = 8.0;
