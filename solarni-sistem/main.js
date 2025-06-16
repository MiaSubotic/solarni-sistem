/* Example: 06-phong
 * Rotating a 3D model with Phong shading
 * Mouse dragging and callbacks are used to rotate the model.
 * Added zoom with keyboard.
 */

import { mat4, vec3 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm';
import WebGLUtils from '../WebGLUtils.js';

async function main() {
  /** @type {WebGL2RenderingContext} */
  const gl = WebGLUtils.initWebGL();
  if (!gl) {
    console.error("WebGL2 nije podržan.");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  WebGLUtils.resizeCanvasToWindow(gl);

  const vertices = await WebGLUtils.loadOBJ("../shapes/sphere.obj", true);
  const texture = await WebGLUtils.loadTexture(gl, "../shapes/brick.jpg");
  const naziv_planeta = document.getElementById("naziv_planeta");
  const opis_planeta = document.getElementById("opis_planeta");

  const program = await WebGLUtils.createProgram(gl, "vertex-shader.glsl", "fragment-shader.glsl");
  if (!program) {
    console.error("Neuspešno kreiran shader program.");
    return;
  }

  const modelMat = mat4.create();
  const viewMat = mat4.create();
  const projectionMat = mat4.create();
  const mvpMat = mat4.create();

  mat4.perspective(projectionMat, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);

  // Zoom vrednost
  let zoom = 5;
  let cameraPos = [2, 2, zoom];

  // Svetlo
  const lightDir = vec3.fromValues(5.0, 2.0, 1.0);
  const lightColor = vec3.fromValues(1.0, 1.0, 1.0);    // bela svetlost
  const ambientColor = vec3.fromValues(0.1, 0.1, 0.1);  // ambijentalno

  vec3.normalize(lightDir, lightDir);

  // Početno slanje uniformi
  WebGLUtils.setUniformMatrix4fv(gl, program, ["u_projection"], [projectionMat]);
  WebGLUtils.setUniform3f(gl, program,
    ["u_ambient_color", "u_light_direction", "u_light_color"],
    [ambientColor, lightDir, lightColor]
  );

  gl.useProgram(program);
  const textureLoc = gl.getUniformLocation(program, "u_texture");
  gl.uniform1i(textureLoc, 0);

  const VAO = WebGLUtils.createVAO(gl, program, vertices, 8, [
    { name: "in_position", size: 3, offset: 0 },
    { name: "in_normal", size: 3, offset: 5 },
    { name: "in_uv", size: 2, offset: 3},
  ]);

  // Rotacija mišem
  let isDragging = false;
  let isAltView = false;
  let lastX = 5, lastY = 0;
  let rotationX = 0, rotationY = 0;
  const ROTATION_SPEED = 0.005;

  gl.canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  gl.canvas.addEventListener('mouseup', () => isDragging = false);
  gl.canvas.addEventListener('mouseleave', () => isDragging = false);

  gl.canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    rotationY += deltaX * ROTATION_SPEED;
    rotationX += deltaY * ROTATION_SPEED;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  gl.canvas.addEventListener('click', (e) => {
  // Koordinate klika
  const rect = gl.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Normalizovane koordinate (-1 do 1)
  const ndcX = (x / gl.canvas.width) * 2 - 1;
  const ndcY = -((y / gl.canvas.height) * 2 - 1); // y je obrnut

  // Prosta logika: ako je klik blizu centra, tretiraj ga kao klik na planetu
  const threshold = 0.2;
  const clickedOnPlanet = Math.abs(ndcX) < threshold && Math.abs(ndcY) < threshold;

  if (clickedOnPlanet) {
    isAltView = !isAltView;

    if (isAltView && naziv_planeta.style.display === "none" && opis_planeta.style.display === "none") {
      cameraPos = [-1, -1, 5];
      naziv_planeta.style.display = "block";
      opis_planeta.style.display = "block";
    } else {
      cameraPos = [2, 2, zoom];
      naziv_planeta.style.display = "none";
      opis_planeta.style.display = "none";
    }
  }
});

  document.getElementById("zoomIn").addEventListener("click", () => {
    zoom -= 0.5;
    if (zoom < 1.5) zoom = 1.5;
  });

document.getElementById("zoomOut").addEventListener("click", () => {
    zoom += 0.5;
    if (zoom > 20) zoom = 20;
  });

  function render() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Kamera update
    cameraPos[2] = zoom;
    mat4.lookAt(viewMat, cameraPos, [0, 0, 0], [0, 1, 0]);

    WebGLUtils.setUniformMatrix4fv(gl, program, ["u_view"], [viewMat]);
    WebGLUtils.setUniform3f(gl, program, ["u_view_direction"], [cameraPos]);

    // Rotacija modela
    mat4.identity(modelMat);
    mat4.rotateX(modelMat, modelMat, rotationX);
    mat4.rotateY(modelMat, modelMat, rotationY);
    WebGLUtils.setUniformMatrix4fv(gl, program, ["u_model"], [modelMat]);

    gl.useProgram(program);
    gl.bindVertexArray(VAO);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);

    requestAnimationFrame(render);
  }

  render();
}

main();