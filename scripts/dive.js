/*global document, Burner, Flora */
var world = new Burner.World(document.body, {
  color: [0, 0, 0]
});

Burner.System.init(function() {

  var i, j, randomNumber = Flora.Utils.getRandomNumber,
      map = Flora.Utils.map,
      world = Burner.System.firstWorld();

  /**
   * Declare vars we'll repeatedly use to create fish objects
   */
  var agent, walker, color, size, borderWidth, boxShadowSpread;

  /**
   * Creates fish body. All other fish parts are parented to the body.
   *
   * @param {Object} seekTarget A target to pursue.
   * @param {boolean} flocking Set to true to flock.
   * @param {number} size Size in pixels. Used for both width and height.
   * @param {number} borderWidth Border width.
   * @param {number} boxShadowSpread Box shadow spread.
   * @param {Array} color Color expressed as an array of 3 values.
   */
  var createFishBody = function(seekTarget, flocking, size, borderWidth, boxShadowSpread, color) {
    return Burner.System.add('Agent', {
      seekTarget: walker,
      flocking: flocking,
      checkWorldEdges: false,
      colorMode: 'hsl',
      width: size,
      height: size,
      location: new Burner.Vector(-Burner.System.firstWorld().width / 4,
        Burner.System.firstWorld().height / 1.65),
      mass: size,
      maxSpeed: 20,
      color: color,
      borderRadius: 100,
      borderWidth: borderWidth,
      borderStyle: 'solid',
      borderColor: [color[0], color[1], color[2] - 10],
      boxShadowSpread: boxShadowSpread,
      boxShadowColor: [color[0], color[1], color[2] + 10]
    });
  };

  /**
   * Updates fish fin properties.
   */
  var beforeStepFishFin = function() {
    var angle = map(this.parent.velocity.mag(), this.parent.minSpeed, this.parent.maxSpeed, 15, 0);
    this.angle += angle * this.dir;
  };

  /**
   * Creates fish fin. Parented to the body.
   *
   * @param {Object} parent The parent object.
   * @param {number} size Size in pixels. Used for both width and height.
   * @param {number} borderWidth Border width.
   * @param {number} boxShadowSpread Box shadow spread.
   * @param {Array} color Color expressed as an array of 3 values.
   * @param {number} rotationDir Set to 1 to rotate clockwise. -1 to rotate counter-clockwise.
   */
  var createFishFin = function(parent, size, borderWidth, boxShadowSpread, color, rotationDir) {
    return Burner.System.add('Mover', {
      parent: parent,
      offsetDistance: (size / 2) + (borderWidth / 2) + (boxShadowSpread / 2),
      offsetAngle: 180,
      colorMode: 'hsl',
      width: 2,
      height: size,
      color: color,
      borderRadius: 0,
      pointToDirection: false,
      dir: rotationDir,
      beforeStep: beforeStepFishFin
    });
  };

  /**
   * Creates fish tail. Parented to the body.
   *
   * @param {Object} parent The parent object.
   * @param {number} size Size in pixels. Used for both width and height.
   * @param {number} borderWidth Border width.
   * @param {number} boxShadowSpread Box shadow spread.
   * @param {Array} color Color expressed as an array of 3 values.
   */
  var createFishTail = function(parent, size, borderWidth, boxShadowSpread, color) {
    return Burner.System.add('Point', {
      isStatic: true,
      parent: parent,
      offsetDistance: (size / 2) + (borderWidth / 2) + (boxShadowSpread / 2),
      offsetAngle: 180,
      colorMode: 'hsl',
      width: size / 6,
      height: size / 6,
      color: [color[0], color[1], color[2] + 30],
      borderRadius: 100,
      borderColor: [color[0], color[1], color[2] - 10],
      borderWidth: borderWidth / 8,
      pointToDirection: false
    });
  };

  /**
   * Big Fish
   */

  walker = this.add('Oscillator', {
      visibility: 'hidden',
      initialLocation: new Burner.Vector(Burner.System.firstWorld().width / 2,
          Burner.System.firstWorld().height / 1.5),
      acceleration: new Burner.Vector(0.005, 0),
      amplitude: new Burner.Vector(Burner.System.firstWorld().width * 1,
          Burner.System.firstWorld().height / 2),
      isPerlin: false
  });

  var plBigFish = new Flora.ColorPalette();

  plBigFish.addColor({
    min: 12,
    max: 24,
    startColor: [240, 50, 40],
    endColor: [240, 30, 20]
  });

  color = plBigFish.getColor();
  size = Burner.System.firstWorld().width / 4;
  borderWidth = size / 4;
  boxShadowSpread = size / 4;

  agent = createFishBody(walker, false, size, borderWidth, boxShadowSpread, color);
  createFishFin(agent, size, borderWidth, boxShadowSpread, color, 1);
  createFishFin(agent, size, borderWidth, boxShadowSpread, color, -1);
  createFishTail(agent, size, borderWidth, boxShadowSpread, color);

  /**
   * Bottom Fish
   */

  var plBottomFish = new Flora.ColorPalette();

  plBottomFish.addColor({
    min: 12,
    max: 24,
    startColor: [240, 50, 60],
    endColor: [240, 30, 50]
  });

  walker = this.add('Oscillator', {
    visibility: 'hidden',
    initialLocation: new Burner.Vector(world.width / 2, world.height * 0.95),
    amplitude: new Burner.Vector(world.width / 1, world.height / 3),
    aVelocity: new Burner.Vector(0, 100),
    beforeStep: function() {
      this.aVelocity.x += 0.00001;
      this.aVelocity.y += 0.0001;
    }
  });

  for (j = 0; j < 3; j++) {

    color = plBottomFish.getColor();
    size = randomNumber(10, 40);
    borderWidth = size / 4;
    boxShadowSpread = size / 4;

    agent = createFishBody(walker, true, size, borderWidth, boxShadowSpread, color);
    createFishFin(agent, size, borderWidth, boxShadowSpread, color, 1);
    createFishFin(agent, size, borderWidth, boxShadowSpread, color, -1);
    createFishTail(agent, size, borderWidth, boxShadowSpread, color);
  }

  // Top Fish

  var fishPalettes = [[0, 100, 50], [50, 100, 50], [30, 100, 50]];

  var beforeStepWalker = function() {
    this.aVelocity.x += 0.0025;
    this.aVelocity.y += this.aSpeedY;
  };

  for (j = 0; j < 3; j++) {

    var plTopFish = new Flora.ColorPalette();

    plTopFish.addColor({
      min: 12,
      max: 24,
      startColor: [fishPalettes[j][0], fishPalettes[j][1] - 20, fishPalettes[j][2] - 10],
      endColor: [fishPalettes[j][0] + 20, fishPalettes[j][1], fishPalettes[j][2] + 10]
    });

    walker = this.add('Oscillator', {
      visibility: 'hidden',
      initialLocation: new Burner.Vector(randomNumber(0, world.width), world.height * 0.25),
      amplitude: new Burner.Vector(world.width / 1, world.height / 4),
      aVelocity: new Burner.Vector(0, 100),
      perlinSpeed: randomNumber(-5, 5, true) * 0.001,
      aSpeedY: randomNumber(1, 2, true) * 0.01,
      beforeStep: beforeStepWalker
    });

    for (i = 0; i < 4; i++) {

      color = plTopFish.getColor();
      size = randomNumber(10, 40);
      borderWidth = size / 4;
      boxShadowSpread = size / 4;

      if (!j && !i) {
        size = 80;
        borderWidth = size / 4;
        boxShadowSpread = size / 4;
      }

      agent = createFishBody(walker, true, size, borderWidth, boxShadowSpread, color);
      createFishFin(agent, size, borderWidth, boxShadowSpread, color, 1);
      createFishFin(agent, size, borderWidth, boxShadowSpread, color, -1);
      createFishTail(agent, size, borderWidth, boxShadowSpread, color);
    }
  }

  /**
   * Create wave palette.
   */
  var plWaves = new Flora.ColorPalette();

  plWaves.addColor({
    min: 12,
    max: 24,
    startColor: [200, 90, 40],
    endColor: [230, 80, 60]
  });

  var totalWaves = 12,
      worldWidth = world.width,
      initLocY = world.height / 1.3,
      initHeight = world.height / 1;

  /**
   * Sets wave initial location.
   */
  var locationWave = function() {
    return new Burner.Vector(this.width * this.index + this.width / 2, initLocY);
  };

  /**
   * Updates wave properties.
   */
  var beforeStepWave = function() {
    var y = Flora.SimplexNoise.noise(0, Burner.System.clock * 0.005 + this.index * 0.05) * 40;
    this.location.y = initLocY + y;
    world.location.y = (world.height / 2) - y;
  };

  /**
   * Create waves.
   */
  for (i = 0; i < totalWaves; i++) {
    color = plWaves.getColor();
    this.add('Liquid', {
      index: i,
      colorMode: 'hsl',
      color: color,
      isStatic: true,
      opacity: 0.65,
      initLocY: initLocY,
      width: worldWidth / totalWaves,
      height: initHeight,
      checkWorldEdges: false,
      borderRadius: 0,
      borderWidth: 0,
      boxShadowColor: color,
      boxShadowSpread: 2,
      location: locationWave,
      beforeStep: beforeStepWave
    });
  }
}, world);