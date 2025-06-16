const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
  alert('WebGL 2 nije podržan!');
  throw new Error('WebGL 2 nije podržan');
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

async function loadShaderSrc(url) {
  const response = await fetch(url);
  return await response.text();
}

function compileShader(src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Greška pri kompajliranju shadera.');
  }

  return shader;
}

function createProgram(vertexSrc, fragmentSrc) {
  const vs = compileShader(vertexSrc, gl.VERTEX_SHADER);
  const fs = compileShader(fragmentSrc, gl.FRAGMENT_SHADER);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw new Error('Greška pri linkovanju programa.');
  }

  return program;
}

let program;

async function main() {
  const vertexShaderSrc = await loadShaderSrc('vertex-shader.glsl');
  const fragmentShaderSrc = await loadShaderSrc('fragment-shader.glsl');
  program = createProgram(vertexShaderSrc, fragmentShaderSrc);
  gl.useProgram(program);

  // Ovdje cu ubaciti VAO/VBO za Sunce i planete kasnije

  render();
}

function render() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Ovdje cu poslije crtati Sunce i planete

  requestAnimationFrame(render);
}

main();
