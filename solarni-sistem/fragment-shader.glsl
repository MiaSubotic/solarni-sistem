#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D u_sampler;
uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = texture(u_sampler, v_texcoord) * u_color;
}
