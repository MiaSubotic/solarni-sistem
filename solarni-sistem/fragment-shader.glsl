#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D u_sampler;
uniform vec4 u_color;

out vec4 outColor;

void main() {
   vec4 texColor = texture(u_sampler, v_texcoord);
    outColor = texColor * u_color;
    


}
