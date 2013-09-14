/*global Flora, Burner, Brait, document */
var world = new Burner.World(document.body, {
  c: 0.01,
  gravity: new Burner.Vector(),
  width: Flora.Utils.getWindowSize().width / 0.75,
  height: Flora.Utils.getWindowSize().height / 0.75,
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: [100, 100, 100],
  color: [0, 0, 0],
  boundToWindow: false
});

Burner.System.init(function() {

  var i, max,
      maxVehicles = 6,
      getRandomNumber = Flora.Utils.getRandomNumber,
      world = Burner.System.firstWorld();

  // create vehicles
  for (i = 0; i < maxVehicles; i += 1) {

    var obj = new Brait.Vehicle({
      system: this,
      controlCamera: !i,
      color: !i ? [255, 255, 255] : [255, 100, 0],
      borderColor: !i ? [255, 100, 0] : [255, 150, 50],
      viewArgs: [i],
      sensors: [
        new Brait.Sensor({
          system: this,
          type: 'heat',
          behavior: 'ACCELERATE'
        }),
        new Brait.Sensor({
          system: this,
          type: 'cold',
          behavior: 'DECELERATE'
        })
      ]
    });
    var eye = document.createElement('div');
    eye.id = 'eye' + obj.id;
    eye.className = 'eye';
    eye.style.background = !i ? 'rgb(100, 100, 100)' : 'rgb(255, 255, 255)',
    eye.style.opacity = 1;
    obj.el.appendChild(eye);
  }

  // create stimulants
  for (i = 0, max = (0.02 * world.bounds[1]); i < max; i += 1) {
    Brait.Stimulus.create(null, new Burner.Vector(getRandomNumber(0, world.bounds[1]),
        getRandomNumber(0, world.bounds[2])), [Brait.Heat, Brait.Cold]);
  }

  // add event listener to create random stimulant on mouseup
  Flora.Utils.addEvent(document, 'mouseup', Brait.Stimulus.createHeat);

}, world, null, true);

Flora.Utils.addEvent(document.getElementById('buttonStart'), "mouseup", function(e) {

  if (e.stopPropagation) {
    e.stopPropagation();
  }
  document.getElementById('containerMenu').removeChild(document.getElementById('containerButton'));
  Burner.System.start();
});

Burner.System.start();
