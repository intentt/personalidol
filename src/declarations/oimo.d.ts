declare module "oimo" {
  declare class Body {}

  declare class World {
    constructor(setup: {
      timestep: number;
      iterations: number;
      // 1 brute force, 2 sweep and prune, 3 volume tree
      broadphase: 1 | 2 | 3;
      // scale full world
      worldscale: number;
      // randomize sample
      random: boolean;
      // calculate statistic or not
      info: boolean;
      gravity: [number, number, number];
    });

    add(object: {
      // type of shape : sphere, box, cylinder
      type: "box" | "cylinder" | "sphere";
      // size of shape
      size: [number, number, number];
      // start position in degree
      pos: [number, number, number];
      // start rotation in degree
      rot: [number, number, number];
      // dynamic or statique
      move: boolean;
      density: number;
      friction: number;
      restitution: number;
      // The bits of the collision groups to which the shape belongs.
      belongsTo: number;
      // The bits of the collision groups with which the shape collides.
      collidesWith: number;
    }): Body;

    step(): void;
  }
  // declare class btCollisionDispatcher {
  //   constructor(configuration: btDefaultCollisionConfiguration);
  // }

  // declare class btDbvtBroadphase {}

  // declare class btDefaultCollisionConfiguration {}

  // declare class btDiscreteDynamicsWorld {
  //   constructor(
  //     dispatcher: btCollisionDispatcher,
  //     overlappingPairCache: btDbvtBroadphase,
  //     solver: btSequentialImpulseConstraintSolver,
  //     collisionConfiguration: btDefaultCollisionConfiguration
  //   );

  //   setGravity(gravity: byVector3);
  // }

  // declare class btSequentialImpulseConstraintSolver {}

  // declare class btVector3 {
  //   constructor(x: number, y: number, z: number);
  // }
}