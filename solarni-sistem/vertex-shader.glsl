#version 300 es
precision highp float;

in vec3 in_position;
in vec2 in_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec2 v_texcoord;

void main() {
  gl_Position = u_projection * u_view * u_model * vec4(in_position, 1.0);
  v_texcoord = in_texcoord;
}
