export const PHYSICS = {
  THRUST_POWER: 0.0138,
  GRAVITY: 0.0018,
  MASS: 1200,
  DRAG_COEFFICIENT: 0.00012,
  FUEL_CONSUMPTION: 0.48,
  INITIAL_FUEL: 360,
  STAGE1_FUEL: 190,
  STAGE2_FUEL: 170,
  ENGINE_OVERHEAT_THRESHOLD: 1.0,
  ENGINE_TEMP_COOLDOWN: 0.13,
  ENGINE_TEMP_BUILDUP: 0.52,
  MALFUNCTION_CHANCE: 0.035,
  MALFUNCTION_DURATION: 1.2,
};

export const PARTICLES = {
  FLAME_COUNT: 3000,
  SMOKE_COUNT: 1200,
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
  DISTANCE_Z: 0.3,
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
  X: 0.0015,
  Y: 0,
  Z: 0.0008,
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
export const MAX_SPEED_KMS = 7.2;
export const SPEED_SHAKE_THRESHOLD = 6.0;

export const ORBITAL_INSERT_VELOCITY_MIN = 7.5;
export const ORBITAL_INSERT_VELOCITY_MAX = 8.2;
export const ORBITAL_INSERT_ALTITUDE_MIN = 950;
export const ORBITAL_INSERT_ALTITUDE_MAX = 1050;

export const MISSIONS = {
   BEGINNER: { 
     name: 'CHAPTER 1', 
     target: 150, 
     description: 'Basic Arithmetic (Additions)', 
     wind: 0.0004,
     fuel: 360,
     gravity: 0.0018,
     difficulty: 1,
     enableStaging: false,
     enableMalfunction: false,
     enablePrecisionOrbit: false,
     enableTemperature: false
   },
   INTERMEDIATE: { 
     name: 'CHAPTER 2', 
     target: 400, 
     description: 'Multiplication & Division', 
     wind: 0.0008,
     fuel: 360,
     gravity: 0.0018,
     difficulty: 2,
     enableStaging: true,
     enableMalfunction: false,
     enablePrecisionOrbit: false,
     enableTemperature: true
   },
   ADVANCED: { 
     name: 'CHAPTER 3', 
     target: 1000, 
     description: 'Advanced Algebra & Mixed Operations', 
     wind: 0.0016,
     fuel: 330,
     gravity: 0.002,
     difficulty: 3,
     enableStaging: true,
     enableMalfunction: true,
     enablePrecisionOrbit: true,
     enableTemperature: true
   },
 };
