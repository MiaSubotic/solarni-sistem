import WebGLUtils from '../WebGLUtils.js';


const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
  alert('WebGL 2 nije podržan u tvom browseru!');
  throw new Error('WebGL2 nije podržan');
}

// Funkcija da se prilagodi canvas veličini prozora
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Osvježavanje scene
function render() {
  // Očisti ekran u crnu boju
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(render);
}

render();
