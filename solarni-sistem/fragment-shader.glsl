#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D u_sampler;
uniform vec4 u_color;
uniform int u_selected;

out vec4 outColor;

void main() {
    outColor = texture(u_sampler, v_texcoord) * u_color;

    if (u_selected == 1) {
        // Neka svetli malo jače
        outColor.rgb *= 1.5;
        
        // Dodajte svetleći obrub
        float edge = smoothstep(0.4, 0.5, 
            max(abs(v_texcoord.x - 0.5), abs(v_texcoord.y - 0.5)));
        outColor.rgb = mix(outColor.rgb, vec3(1.0), edge);
    }
}