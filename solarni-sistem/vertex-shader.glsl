#version 300 es
precision mediump float;

uniform mat4 u_mvp; // Model-View-Projection matrix

in vec3 in_position;

void main() {
	gl_Position = u_mvp * vec4(in_position, 1.0f);
}