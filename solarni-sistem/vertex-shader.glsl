#version 300 es
precision mediump float;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

in vec3 in_position;
in vec3 in_normal;
in vec2 in_uv;

out vec3 v_normal;
out vec2 v_uv;
out vec3 v_fragPos;

void main() {
    v_normal = mat3(u_model) * in_normal;
    v_uv = in_uv;
    v_fragPos = vec3(u_model * vec4(in_position, 1.0));
    gl_Position = u_projection * u_view * u_model * vec4(in_position, 1.0);
}