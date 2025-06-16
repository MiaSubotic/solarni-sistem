/* Example: 04-obj-format
 * Load and render a 3D model from an OBJ file.
 */

// NOTE: Shapes are located in the `shapes` directory.

import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.0/+esm';
import WebGLUtils from '../WebGLUtils.js';

async function main() {
  /** @type {WebGLRenderingContext} */
  const gl = WebGLUtils.initWebGL();
  gl.enable(gl.DEPTH_TEST);

  WebGLUtils.resizeCanvasToWindow(gl);

	const vertices = await WebGLUtils.loadOBJ("../shapes/sphere.obj");

  const program = await WebGLUtils.createProgram(gl, "vertex-shader.glsl", "fragment-shader.glsl");

  const { modelMat, viewMat, projectionMat } = WebGLUtils.createModelViewProjection(gl, [2, 2, 5]);

  const mvpMat = mat4.create();
  mat4.multiply(mvpMat, projectionMat, viewMat);
  mat4.multiply(mvpMat, mvpMat, modelMat);

  WebGLUtils.setUniformMatrix4fv(gl, program, ["u_mvp"], [mvpMat]);

  const VAO = WebGLUtils.createVAO(gl, program, vertices, 8, [
    { name: "in_position", size: 3, offset: 0 },
  ]);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindVertexArray(VAO);
  gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 8);
}

main();