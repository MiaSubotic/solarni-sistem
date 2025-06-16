#version 300 es
precision mediump float;

in vec3 v_normal;
in vec2 v_uv;

uniform sampler2D u_texture;

out vec4 out_color;

void main() {
    vec3 color = texture(u_texture, v_uv).rgb;
    out_color = vec4(color, 1.0);
}