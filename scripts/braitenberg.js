/*
Braitenberg-Vehicles
Copyright (c) 2013 Vince Allen
vince@vinceallen.com
http://www.vinceallen.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
/* Version: 1.0.0 */
/* Build time: September 10, 2013 11:55:33 */

/*global Flora, Burner, document, setTimeout */
/** @namespace */
var Brait = {}, exports = Brait;

(function(exports) {

  'use strict';

  var getRandomNumber = Flora.Utils.getRandomNumber,
      pal, color, palettes = {};

  for (var i = 0, max = Flora.Config.defaultColorList.length; i < max; i++) {
    color = Flora.Config.defaultColorList[i];
    pal = new Flora.ColorPalette();
    pal.addColor({
      min: 6,
      max: 24,
      startColor: color.startColor,
      endColor: color.endColor
    });
    palettes[color.name] = pal;
  }

  /**
   * Creates a Braitenberg vehicle.
   *
   * @constructor
   */
  function Vehicle(options) {

    var system = options.system,
        sensors = options.sensors,
        controlCamera = options.controlCamera,
        color = options.color,
        borderColor = options.borderColor,
        viewArgs = options.viewArgs,
        collisions = options.collisions || {},
        beforeStep = options.beforeStep || Vehicle.beforeStep,
        maxSteeringForce = options.maxSteeringForce || getRandomNumber(2, 5, true);

    return system.add('Agent', {
      sensors: sensors,
      velocity: new Burner.Vector(getRandomNumber(-1, 1, true),
          getRandomNumber(-1, 1, true)),
      motorSpeed: 4,
      minSpeed: 1,
      maxSpeed: getRandomNumber(5, 10, true),
      //maxSpeed: 100,
      maxSteeringForce: maxSteeringForce,
      //maxSteeringForce: 100,
      controlCamera: controlCamera,
      wrapWorldEdges: true,
      color: color,
      width: 22,
      height: 22,
      borderWidth: 3,
      borderStyle: 'solid',
      borderColor: borderColor,
      borderRadius: 100,
      eyeRotation: 0,
      view: Vehicle.view,
      viewArgs: viewArgs,
      collisions: collisions,
      beforeStep: beforeStep
    });
  }

  Vehicle.beforeStep = function() {

      var i, max;

      if (getRandomNumber(0, 300) === 1) {
        this.randomRadius = 100;
        this.seekTarget = { // find a random point and steer toward it
          location: Burner.Vector.VectorAdd(this.location,
              new Burner.Vector(getRandomNumber(-this.randomRadius, this.randomRadius),
              getRandomNumber(-this.randomRadius, this.randomRadius)))
        };
        var me = this;
        setTimeout(function () {
          me.seekTarget = null;
        }, 100);
      }

      // check if agent intersects w stimulators
      var lights = Burner.System._caches.Light;
      if (lights) {
        for (i = 0, max = lights.list.length; i < max; i += 1) {
          // check the obj has not been marked as deleted
          if (lights.lookup[lights.list[i].id]) {
            if (this.isInside(lights.list[i])) {
              this.collisions.light.call(this, i);
            }
          }
        }
      }

      var oxygen = Burner.System._caches.Oxygen;
      if (oxygen) {
        for (i = 0, max = oxygen.list.length; i < max; i += 1) {
          // check the obj has not been marked as deleted
          if (oxygen.lookup[oxygen.list[i].id]) {
            if (this.isInside(oxygen.list[i])) {
              this.collisions.oxygen.call(this, i);
            }
          }
        }
      }

      var food = Burner.System._caches.Food;
      if (food) {
        for (i = 0, max = food.list.length; i < max; i += 1) {
          // check the obj has not been marked as deleted
          if (food.lookup[food.list[i].id]) {
            if (this.isInside(food.list[i])) {
              this.collisions.food.call(this, i);
            }
          }
        }
      }

      var eye = document.getElementById('eye' + this.id),
          a = this.eyeRotation;

      if (eye) {
        eye.style.webkitTransform = 'rotate(' + a + 'deg)';
        this.eyeRotation += Flora.Utils.map(this.velocity.mag(), this.minSpeed, this.maxSpeed, 3, 50);
      }

  };


  /**
   * Creates a Sensor.
   *
   * @constructor
   */
  function Sensor(options) {

    var system = Burner.System,
        type = options.type,
        behavior = options.behavior,
        afterStep = options.afterStep || Sensor.afterStep,
        maxSpeed = options.maxSpeed || 1;

    return system.add('Sensor', {
      type: type,
      behavior: behavior,
      afterStep: afterStep,
      maxSpeed: maxSpeed
    });
  }

  Sensor.afterStep = function() {

    var system = Burner.System;


      if (this.activated) {

        if (!this.connector) {
          this.connector = system.add('Connector', {
            parentA: this,
            parentB: this.target,
            zIndex: 100});
        } else {
          this.connector.parentA = this;
          this.connector.parentB = this.target;
        }
        this.opacity = 1;
      } else {
        if (this.connector) {
          system.destroyItem(this.connector);
          this.connector = null;
        }
        this.opacity = 0.75;
      }

  };

  /**
   * Creates a stimulant from a random selection of Stimuli.
   *
   * @constructor
   */
  function Stimulus(options) {

    var system = Burner.System,
        location = options.location,
        size = options.size,
        type = options.type;

    var stimuli = [Brait.Heat, Brait.Cold, Brait.Light, Brait.Oxygen, Brait.Food];

    if (type) {
      return new type[getRandomNumber(0, type.length - 1)]({
        location: location,
        size: size,
        system: system
      });
    } else {
      return new stimuli[getRandomNumber(0, stimuli.length - 1)]({
        location: location,
        size: size,
        system: system
      });
    }
  }

  Stimulus.create = function(e, loc, type) {

    var location = e ? new Burner.Vector(e.offsetX, e.offsetY) : loc;
    new Brait.Stimulus({
      location: location,
      size: getRandomNumber(15, 75),
      type: type
    });
  };

  Stimulus.createHeat = function(e) {
    new Brait.Stimulus({
      location: new Burner.Vector(e.offsetX, e.offsetY),
      size: getRandomNumber(15, 75),
      type: [Brait.Heat]
    });
  };

  Stimulus.createCold = function(e) {
    new Brait.Stimulus({
      location: new Burner.Vector(e.offsetX, e.offsetY),
      size: getRandomNumber(15, 75),
      type: [Brait.Cold]
    });
  };

  Stimulus.createLight = function(e) {
    new Brait.Stimulus({
      location: new Burner.Vector(e.offsetX, e.offsetY),
      size: getRandomNumber(15, 75),
      type: [Brait.Light]
    });
  };

  Stimulus.createFood = function(e) {
    new Brait.Stimulus({
      location: new Burner.Vector(e.offsetX, e.offsetY),
      size: getRandomNumber(15, 75),
      type: [Brait.Food]
    });
  };

  Stimulus.borderStyles = [
    'none',
    'solid',
    'dotted',
    'dashed',
    'double'
  ];

  /**
   * Creates a Heat stimulant.
   *
   * @constructor
   */
  function Heat(options) {

    var system = options.system,
        location = options.location,
        size = options.size;

    return system.add('Stimulus', {
      type: 'Heat',
      color: palettes.heat.getColor(),
      width: size,
      height: size,
      scale: 0.01,
      scaleTarget: 1,
      isStatic: true,
      location: location,
      borderWidth: getRandomNumber(2, 6),
      borderStyle: Stimulus.borderStyles[getRandomNumber(0, Stimulus.borderStyles.length - 1)],
      borderColor: palettes.heat.getColor(),
      boxShadow: '0 0 0 ' + getRandomNumber(2, 6) + 'px rgb(' + palettes.heat.getColor().toString() + ')',
      beforeStep: function() {
        if (this.scaleTarget && this.scale < this.scaleTarget) {
          this.scale *= 1.2;
        } else {
          this.scaleTarget = null;
        }
      }
    });
  }

  /**
   * Creates a Cold stimulant.
   *
   * @constructor
   */
  function Cold(options) {

    var system = options.system,
        location = options.location,
        size = options.size;

    return system.add('Stimulus', {
      type: 'Cold',
      color: palettes.cold.getColor(),
      width: size,
      height: size,
      scale: 0.01,
      scaleTarget: 1,
      isStatic: true,
      location: location,
      borderWidth: getRandomNumber(2, 6),
      borderStyle: Stimulus.borderStyles[getRandomNumber(0, Stimulus.borderStyles.length - 1)],
      borderColor: palettes.cold.getColor(),
      boxShadow: '0 0 0 ' + getRandomNumber(2, 6) + 'px rgb(' + palettes.cold.getColor().toString() + ')',
      beforeStep: function() {
        if (this.scaleTarget && this.scale < this.scaleTarget) {
          this.scale *= 1.15;
        } else {
          this.scaleTarget = null;
        }
      }
    });
  }

  /**
   * Creates a Light stimulant.
   *
   * @constructor
   */
  function Light(options) {

    var system = options.system,
        location = options.location,
        size = options.size,
        onCollision = options.onCollision || function() {};

    return system.add('Stimulus', {
      type: 'Light',
      color: palettes.light.getColor(),
      width: size,
      height: size,
      scale: 0.01,
      scaleTarget: 1,
      isStatic: true,
      location: location,
      borderWidth: getRandomNumber(2, 6),
      borderStyle: Stimulus.borderStyles[getRandomNumber(0,
          Stimulus.borderStyles.length - 1)],
      borderColor: palettes.light.getColor(),
      boxShadow: '0 0 0 ' + getRandomNumber(2, 6) + 'px rgb(' + palettes.light.getColor().toString() + ')',
      collide: onCollision,
      beforeStep: function() {
        if (this.scaleTarget && this.scale < this.scaleTarget) {
          this.scale *= 1.14;
        } else {
          this.scaleTarget = null;
        }
      }
    });
  }

  Light.collide = function(i) {

    var system = Burner.System,
        lights = system._caches.Light,
        x = lights.list[i].location.x,
        y = lights.list[i].location.y;

    system.add('ParticleSystem', {
      location: new Burner.Vector(x, y),
      startColor: palettes.light.getColor(),
      endColor: [255, 255, 255],
      life: 0,
      lifespan: 20,
      particleOptions: {
        width: 10,
        height: 10,
        maxSpeed: 3,
        burst: 2,
        lifespan: 80
      }
    });

    system.destroyItem(lights.list[i]);

    var world = Burner.System.firstWorld();

    Brait.Stimulus.create(null, new Burner.Vector(getRandomNumber(0, world.bounds[1]),
        getRandomNumber(0, world.bounds[2])), [Brait.Light]);

  };

  /**
   * Creates an Oxygen stimulant.
   *
   * @constructor
   */
  function Oxygen(options) {

    var system = options.system,
        location = options.location,
        size = options.size,
        onCollision = options.onCollision || function() {};

    return system.add('Stimulus', {
      type: 'Oxygen',
      color: palettes.oxygen.getColor(),
      width: size,
      height: size,
      scale: 0.01,
      scaleTarget: 1,
      isStatic: true,
      location: location,
      borderWidth: getRandomNumber(2, 6),
      borderStyle: Stimulus.borderStyles[getRandomNumber(0,
          Stimulus.borderStyles.length - 1)],
      borderColor: palettes.oxygen.getColor(),
      boxShadow: '0 0 0 ' + getRandomNumber(2, 6) + 'px rgb(' + palettes.oxygen.getColor().toString() + ')',
      collide: onCollision,
      beforeStep: function() {
        if (this.scaleTarget && this.scale < this.scaleTarget) {
          this.scale *= 1.12;
        } else {
          this.scaleTarget = null;
        }
      }
    });
  }

  Oxygen.collide = function(i) {

    var system = Burner.System,
        world = system.firstWorld(),
        oxygen = system._caches.Oxygen;

    oxygen.list[i].scale -= 0.015;
    if (oxygen.list[i].scale < 0.2) {
      system.destroyItem(oxygen.list[i]);
      Brait.Stimulus.create(null, new Burner.Vector(getRandomNumber(0, world.bounds[1]),
        getRandomNumber(0, world.bounds[2])), [Brait.Oxygen]);
    }
  };

  /**
   * Creates an Food stimulant.
   *
   * @constructor
   */
  function Food(options) {

    var system = options.system,
        location = options.location,
        size = getRandomNumber(50, 80),
        onCollision = options.onCollision || function() {};

    return system.add('Stimulus', {
      type: 'Food',
      color: palettes.food.getColor(),
      width: size,
      height: size,
      scale: 0.01,
      scaleTarget: 1,
      isStatic: true,
      location: location,
      borderWidth: getRandomNumber(4, 8),
      borderStyle: Stimulus.borderStyles[getRandomNumber(0,
          Stimulus.borderStyles.length - 1)],
      borderColor: palettes.food.getColor(),
      boxShadow: '0 0 0 ' + getRandomNumber(2, 6) + 'px rgb(' + palettes.food.getColor().toString() + ')',
      collide: onCollision,
      beforeStep: function() {
        if (this.scaleTarget && this.scale < this.scaleTarget) {
          this.scale *= 1.1;
        } else {
          this.scaleTarget = null;
        }
      }
    });
  }

  Food.collide = function(i) {

    var system = Burner.System,
        world = system.firstWorld(),
        food = system._caches.Food;

    food.list[i].scale -= 0.015;
    if (food.list[i].scale < 0.2) {
      system.destroyItem(food.list[i]);
      Brait.Stimulus.create(null, new Burner.Vector(getRandomNumber(0, world.bounds[1]),
        getRandomNumber(0, world.bounds[2])), [Brait.Food]);
    }
  };

  //

  exports.Vehicle = Vehicle;
  exports.Sensor = Sensor;
  exports.Stimulus = Stimulus;
  exports.Heat = Heat;
  exports.Cold = Cold;
  exports.Light = Light;
  exports.Oxygen = Oxygen;
  exports.Food = Food;

}(exports));