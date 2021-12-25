import { Mesh } from "three/src/objects/Mesh";

import { clamp } from "../../../math/src/clamp";

import type { BufferGeometry } from "three/src/core/BufferGeometry";
import type { Material } from "three/src/materials/Material";

import type { MainLoopUpdatableState } from "../../../framework/src/MainLoopUpdatableState.type";

import type { MorphBlendMeshAnimation } from "./MorphBlendMeshAnimation.type";

export class MorphBlendMesh extends Mesh {
  animationsMap: {
    [key: string]: MorphBlendMeshAnimation;
  } = {};
  animationsList: Array<MorphBlendMeshAnimation> = [];
  morphTargetDictionary: { [key: string]: number } = {};
  morphTargetInfluences: Array<number> = [];
  state: MainLoopUpdatableState = Object.seal({
    needsUpdates: true,
  });

  constructor(geometry: BufferGeometry, material: Material) {
    super(geometry, material);

    // prepare default animation
    // (all frames played together in 1 second)

    var numFrames = Object.keys(this.morphTargetDictionary).length;

    var name = "__default";

    var startFrame = 0;
    var endFrame = numFrames - 1;

    var fps = numFrames / 1;

    this.createAnimation(name, startFrame, endFrame, fps);
    this.setAnimationWeight(name, 1);
  }

  createAnimation(name: string, start: number, end: number, fps: number) {
    var animation: MorphBlendMeshAnimation = {
      name: name,

      start: start,
      end: end,

      length: end - start + 1,

      fps: fps,
      duration: (end - start) / fps,

      lastFrame: 0,
      currentFrame: 0,

      active: false,

      time: 0,
      direction: 1,
      weight: 1,

      directionBackwards: false,
      mirroredLoop: false,
    };

    this.animationsMap[name] = animation;
    this.animationsList.push(animation);
  }

  autoCreateAnimations(fps: number) {
    var pattern = /([a-z]+)_?(\d+)/i;

    var firstAnimation;
    var frameRanges: {
      [key: string]: {
        start: number;
        end: number;
      };
    } = {};

    var i = 0;

    for (var key in this.morphTargetDictionary) {
      var chunks = key.match(pattern);

      if (chunks && chunks.length > 1) {
        var name = chunks[1];

        if (!frameRanges[name]) frameRanges[name] = { start: Infinity, end: -Infinity };

        var range = frameRanges[name];

        if (i < range.start) range.start = i;
        if (i > range.end) range.end = i;

        if (!firstAnimation) firstAnimation = name;
      }

      i++;
    }

    for (var name in frameRanges) {
      var range = frameRanges[name];
      this.createAnimation(name, range.start, range.end, fps);
    }
  }

  setAnimationDirectionForward(name: string) {
    var animation = this.animationsMap[name];

    if (animation) {
      animation.direction = 1;
      animation.directionBackwards = false;
    }
  }

  setAnimationDirectionBackward(name: string) {
    var animation = this.animationsMap[name];

    if (animation) {
      animation.direction = -1;
      animation.directionBackwards = true;
    }
  }

  setAnimationFPS(name: string, fps: number) {
    var animation = this.animationsMap[name];

    if (animation) {
      animation.fps = fps;
      animation.duration = (animation.end - animation.start) / animation.fps;
    }
  }

  setAnimationDuration(name: string, duration: number) {
    var animation = this.animationsMap[name];

    if (animation) {
      animation.duration = duration;
      animation.fps = (animation.end - animation.start) / animation.duration;
    }
  }

  setAnimationWeight(name: string, weight: number) {
    var animation = this.animationsMap[name];

    if (animation) {
      animation.weight = weight;
    }
  }

  setAnimationTime(name: string, time: number) {
    var animation = this.animationsMap[name];

    if (animation) {
      animation.time = time;
    }
  }

  getAnimationTime(name: string) {
    var time = 0;

    var animation = this.animationsMap[name];

    if (animation) {
      time = animation.time;
    }

    return time;
  }

  getAnimationDuration(name: string) {
    var duration = -1;

    var animation = this.animationsMap[name];

    if (animation) {
      duration = animation.duration;
    }

    return duration;
  }

  playAnimation(name: string) {
    var animation = this.animationsMap[name];

    if (animation) {
      animation.time = 0;
      animation.active = true;
    } else {
      throw new Error("THREE.MorphBlendMesh: animation[" + name + "] undefined in .playAnimation()");
    }
  }

  stopAnimation(name: string) {
    var animation = this.animationsMap[name];

    if (animation) {
      animation.active = false;
    }
  }

  update(delta: number) {
    for (let animation of this.animationsList) {
      if (!animation.active) continue;

      var frameTime = animation.duration / animation.length;

      animation.time += animation.direction * delta;

      if (animation.mirroredLoop) {
        if (animation.time > animation.duration || animation.time < 0) {
          animation.direction *= -1;

          if (animation.time > animation.duration) {
            animation.time = animation.duration;
            animation.directionBackwards = true;
          }

          if (animation.time < 0) {
            animation.time = 0;
            animation.directionBackwards = false;
          }
        }
      } else {
        animation.time = animation.time % animation.duration;

        if (animation.time < 0) animation.time += animation.duration;
      }

      var keyframe = animation.start + clamp(Math.floor(animation.time / frameTime), 0, animation.length - 1);

      if (keyframe !== animation.currentFrame) {
        this.morphTargetInfluences[animation.lastFrame] = 0;
        this.morphTargetInfluences[animation.currentFrame] = 1 * animation.weight;

        this.morphTargetInfluences[keyframe] = 0;

        animation.lastFrame = animation.currentFrame;
        animation.currentFrame = keyframe;
      }

      var mix = (animation.time % frameTime) / frameTime;

      if (animation.directionBackwards) mix = 1 - mix;

      if (animation.currentFrame !== animation.lastFrame) {
        this.morphTargetInfluences[animation.currentFrame] = mix * animation.weight;
        this.morphTargetInfluences[animation.lastFrame] = (1 - mix) * animation.weight;
      } else {
        this.morphTargetInfluences[animation.currentFrame] = animation.weight;
      }
    }
  }
}
