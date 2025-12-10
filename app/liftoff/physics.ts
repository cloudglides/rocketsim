import { GROUND_LEVEL } from "./constants";

export interface PhysicsState {
  velocity: number;
  fuel: number;
  mass: number;
}

export interface PhysicsParams {
  thrust: number;
  gravity: number;
  dragCoefficient: number;
  mass: number;
  fuel: number;
  velocity: number;
}

export function calculateAcceleration(params: PhysicsParams): number {
  const curMass = params.mass + params.fuel * 5;
  return (params.thrust - params.gravity - params.dragCoefficient * params.velocity * Math.abs(params.velocity)) / (curMass / 1000);
}

export function updatePhysics(
  velocity: number,
  acceleration: number,
  yPosition: number,
  delta: number,
  fuelConsumption: number,
  thrustActive: boolean,
  fuel: number
): {
  newVelocity: number;
  newYPosition: number;
  newFuel: number;
} {
  let newVelocity = velocity + acceleration * delta * 60;
  let newYPosition = yPosition + newVelocity * delta * 60;
  let newFuel = fuel;

  if (newYPosition <= GROUND_LEVEL && newVelocity < 0) {
    newYPosition = GROUND_LEVEL;
    newVelocity = 0;
  }

  if (thrustActive && fuel > 0) {
    newFuel = Math.max(0, fuel - fuelConsumption * delta * 2);
  }

  return { newVelocity, newYPosition, newFuel };
}

export function calculateThrust(thrustActive: boolean, thrustPower: number, fuel: number): number {
  if (!thrustActive || fuel <= 0) return 0;
  return thrustPower;
}
