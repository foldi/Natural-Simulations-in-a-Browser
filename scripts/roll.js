/*
FloraJS-Flocking
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
/* Version: 1.0.1 */
/* Build time: September 1, 2013 10:24:56 */

/*global Flora, Burner, document */
var world = new Burner.World(document.body, {
  gravity: new Burner.Vector(),
  c: 0
});

Burner.System.init(function() {

  var getRandomNumber = Flora.Utils.getRandomNumber,
      world = Burner.System.firstWorld();

  var flowField = this.add('FlowField', {
    createMarkers: false,
    resolution: 20,
    perlinSpeed: 0.015,
    perlinTime: 520
  });
  flowField.build();

  var target = this.add('Agent', {
    flowField: flowField,
    wrapWorldEdges: true,
    mass: getRandomNumber(100, 300),
    visibility: 'hidden',
    beforeStep: function() {

      if (getRandomNumber(0, 1000) === 0) {
        this.location = new Burner.Vector(getRandomNumber(0, world.width),
            getRandomNumber(0, world.height));
      }
    }
  });

  function getColorPalette() {
    var temp_pl;
    switch (getRandomNumber(1, 5)) {
      case 1:
        temp_pl = new Flora.ColorPalette('darkPurple');
        temp_pl.addColor({
          min: 1,
          max: 24,
          startColor: [73, 10, 61],
          endColor: [111, 33, 96]
        });
        break;

      case 2:
        temp_pl = new Flora.ColorPalette('pink');
        temp_pl.addColor({
          min: 1,
          max: 24,
          startColor: [189, 21, 80],
          endColor: [236, 67, 126]
        });
        break;

      case 3:
        temp_pl = new Flora.ColorPalette('orange');
        temp_pl.addColor({
          min: 1,
          max: 24,
          startColor: [233, 127, 2],
          endColor: [255, 179, 89]
        });
        break;

      case 4:
        temp_pl = new Flora.ColorPalette('yellow');
        temp_pl.addColor({
          min: 1,
          max: 24,
          startColor: [248, 202, 0],
          endColor: [255, 226, 99]
        });
        break;

      case 5:
        temp_pl = new Flora.ColorPalette('green');
        temp_pl.addColor({
          min: 1,
          max: 24,
          startColor: [138, 155, 15],
          endColor: [188, 205, 63]
        });
        break;
    }
    return temp_pl;
  }
  var pl = getColorPalette();

  var wings = [];

  var beforeStepStick = function() {

    this.angle = 90 + Flora.Utils.radiansToDegrees(Math.atan2(this.velocity.y, this.velocity.x));

    if (this.opacity < 1) {
      this.opacity += 0.01;
    }
  };

  var beforeStepPropeller = function() {

    this.flapAngle += Flora.Utils.map(this.velocity.mag(),
        this.minSpeed, this.maxSpeed, 1, 50);

    this.angle = Flora.Utils.radiansToDegrees(Math.atan2(this.velocity.y, this.velocity.x)) +
        (this.index ? this.flapAngle : -this.flapAngle);

    if (this.opacity < 1) {
      this.opacity += 0.01;
    }
  };

  for (var i = 0; i < 20; i++) {

    var wingSize = getRandomNumber(8, 64),
        mass = getRandomNumber(100, 300);

    for (var j = 0; j < 3; j++) {
      wings.push(this.add('Agent', {
        parent: j ? wings[wings.length - j] : null,
        location: j ? new Burner.Vector() : new Burner.Vector(world.width / 2 + getRandomNumber(-50, 50),
          world.height / 2 + getRandomNumber(-50, 50)),
        seekTarget: target,
        offsetAngle: 0,
        offsetDistance: j ? (j === 1 ? wingSize / 20: -wingSize / 20) : null,
        pointToDirection: false,
        maxSteeringForce: 1000,
        wrapWorldEdges: true,
        flocking: j ? false : true,
        separateStrength: 0.4,
        alignStrength: 0.1,
        cohesionStrength: 0.3,
        width: j ? wingSize : wingSize,
        height: wingSize < 32 ? 1 : 2,
        color: j ? pl.getColor() : [255, 255, 255],
        opacity: 1,
        flapAngle: 0,
        mass: mass,
        index: j,
        beforeStep: j ? beforeStepStick : beforeStepPropeller
      }));
    }
  }

  // objects will flock toward mouse on click and hold
  var mousedown = false;

  Flora.Utils.addEvent(document, 'mousedown', function() {
    mousedown = true;
    Burner.System.updateItemPropsByName('Agent', {
      seekTarget: {
        location: new Burner.Vector(Burner.System.mouse.location.x, Burner.System.mouse.location.y)
      }
    });
  });

  Flora.Utils.addEvent(document, 'mousemove', function() {
    if (mousedown) {
      Burner.System.updateItemPropsByName('Agent', {
        seekTarget: {
          location: new Burner.Vector(Burner.System.mouse.location.x, Burner.System.mouse.location.y)
        }
      });
    }
  });

  Flora.Utils.addEvent(document, 'mouseup', function() {
    mousedown = false;
    Burner.System.updateItemPropsByName('Agent', {
      seekTarget: target
    });
  });
}, world);
