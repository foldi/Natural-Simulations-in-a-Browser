/*global document, Burner, Flora */
var world = new Burner.World(document.body, {
  color: [0, 0, 0],
  c: 0.1,
  gravity: new Burner.Vector(0, 1)
});

Burner.System.init(function() {

  var i, maxHoppers = 30, minWidth = 10, maxWidth = 200,
      randomNumber = Flora.Utils.getRandomNumber,
      map = Flora.Utils.map;

  /**
   * Each time a hopper crosses the right world bounds,
   * its 'crossings' property is incremented by this value.
   */
  var crossingVal = 10;

  /**
   * Each time a hopper crosses the right world bounds,
   * its hue is set to its initial hue + the average of
   * all hoppers' 'crossing' property.
   */
  var crossingAvg = 0;

  /**
   * Create palettes.
   */
  var pl = new Flora.ColorPalette();

  pl.addColor({
    min: 12,
    max: 24,
    startColor: [180, 70, 70],
    endColor: [220, 30, 30]
  });

  /**
   * Returns the average of all hoppers' 'crossing' property.
   */
  var getCrossingAvg = function() {
    var i, max, records = Burner.System._records.list, total = 0;
    for (i = 0, max = records.length; i < max; i++) {
      if (records[i].crossings) {
        total += records[i].crossings;
      }
    }
    return total/i;
  };

  var initWidth, mass, mover, initColorMover = pl.getColor();

  /**
   * Updates Mover properties each frame.
   */
  var beforeStepHopper = function() {
    if (!this.hopping) {
      this.hopping = true;
      if (!this.targetVector) {
        this.acceleration.x = this.hopVector.x;
        this.acceleration.y = this.hopVector.y;
      } else {

        var desiredVelocity = Burner.Vector.VectorSub(this.targetVector.location, this.location),
            distanceToTarget = desiredVelocity.mag();

        if (distanceToTarget < this.world.width) {
          desiredVelocity.normalize();
          desiredVelocity.mult(10);
          this.velocity.x = desiredVelocity.x;
          this.velocity.y = desiredVelocity.y;
          this.targetVector = null;
        }
      }
    } else if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.y) < 0.1) {
      if (!randomNumber(0, 100)) {
        this.hopping = false;
      }
    }
    /**
     * If crossing right boundary:
     * Move object to left bounday.
     * Increment this.crossings.
     * Get average crossings from all objects.
     * Increment hue by average.
     */
    if (this.location.x - this.width / 2 > this.world.width) {
      this.location.x = -this.width / 2;
      this.crossings += crossingVal;
      crossingAvg = getCrossingAvg();
      this.color[0] = this.initColor[0] + crossingAvg;
    } else if (this.location.x < -this.width / 2) {
      this.location.x = this.world.width + this.width / 2;
    }
  };

  /**
   * Sets Mover location relative to its world width.
   */
  var locationHopper = function() {
    return new Burner.Vector(randomNumber(0, this.world.width),
        this.world.height - this.height / 2);
  };

  /**
   * Updates Point properties each frame.
   */
  var beforeStepPoint = function() {
    this.color[0] = this.initColor[0] + crossingAvg;
    this.borderColor[0] = this.initBorderColor[0] + crossingAvg;
    this.boxShadowColor[0] = this.initBoxShadowColor[0] + crossingAvg;
  };

  /**
   * Create movers.
   */
  for (i = 0; i < maxHoppers; i++) {
    if (!i) {
      initWidth = Burner.System.firstWorld().width / 1.5;
      mass = initWidth * 0.05;
    } else {
      initWidth = randomNumber(minWidth, maxWidth);
      mass = initWidth * 0.1;
    }
    mover = this.add('Agent', {
      initWidth: initWidth,
      width: initWidth,
      height: randomNumber(1, 3),
      mass: mass,
      colorMode: 'hsl',
      initColor: initColorMover,
      color: [initColorMover[0], initColorMover[1], initColorMover[2]],
      opacity: 1,
      bounciness: 0.1,
      worldBounds: [false, false, true, false],
      hopVector: new Burner.Vector(1, 85),
      targetVector: null,
      maxSpeed: 100,
      crossings: 1,
      location: locationHopper,
      beforeStep: beforeStepHopper,
      hopping: true
    });

    /**
     * Create points. Points are parented to Movers.
     */
    var ptSize = map(initWidth, minWidth, maxWidth, minWidth / 2, maxWidth / 2),
        initColorPoint = pl.getColor(), initBorderColor = pl.getColor(), initBoxShadowColor = pl.getColor();

    this.add('Point', {
      isStatic: true,
      parent: mover, // the parent
      width: ptSize,
      height: ptSize,
      zIndex: 2,
      colorMode: 'hsl',
      initColor: initColorPoint,
      color: [initColorPoint[0], initColorPoint[1], initColorPoint[2]],
      borderWidth: mover.width / 8,
      borderStyle: 'solid',
      initBorderColor: initBorderColor,
      borderColor: [initBorderColor[0], initBorderColor[1] + 10, initBorderColor[2] - 10],
      boxShadowSpread: mover.width / 16,
      initBoxShadowColor: initBoxShadowColor,
      boxShadowColor: [initBoxShadowColor[0], initBoxShadowColor[1] - 10, initBoxShadowColor[2] + 10],
      checkWorldEdges: false,
      beforeStep: beforeStepPoint
    });
  }

  /**
   * Clicking the mouse down sets a new target for Hoppers to seek.
   * Releasing the mouse clears the new target.
   */
  var mousedown = false;

  Flora.Utils.addEvent(document, 'mousedown', function() {
    mousedown = true;
    Burner.System.updateItemPropsByName('Agent', {
      targetVector: {
        location: new Burner.Vector(Burner.System.mouse.location.x, Burner.System.mouse.location.y)
      }
    });
  });

  Flora.Utils.addEvent(document, 'mousemove', function() {
    if (mousedown) {
      Burner.System.updateItemPropsByName('Agent', {
        targetVector: {
          location: new Burner.Vector(Burner.System.mouse.location.x, Burner.System.mouse.location.y)
        }
      });
    }
  });

  Flora.Utils.addEvent(document, 'mouseup', function() {
    mousedown = false;
    Burner.System.updateItemPropsByName('Agent', {
      targetVector: null,
      hopping_: true
    });
  });
}, world);