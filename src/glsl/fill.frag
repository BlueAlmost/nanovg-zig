#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 frag[11];
uniform sampler2D tex;
uniform sampler2D colormap;
varying vec2 ftcoord;
varying vec2 fpos;
#define scissorMat mat3(frag[0].xyz, frag[1].xyz, frag[2].xyz)
#define paintMat mat3(frag[3].xyz, frag[4].xyz, frag[5].xyz)
#define innerCol frag[6]
#define outerCol frag[7]
#define scissorExt frag[8].xy
#define scissorScale frag[8].zw
#define extent frag[9].xy
#define radius frag[9].z
#define feather frag[9].w
#define texType int(frag[10].x)
#define type int(frag[10].y)

float sdroundrect(vec2 pt, vec2 ext, float rad) {
    vec2 ext2 = ext - vec2(rad,rad);
    vec2 d = abs(pt) - ext2;
    return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rad;
}

// Scissoring
float scissorMask(vec2 p) {
    vec2 sc = (abs((scissorMat * vec3(p,1.0)).xy) - scissorExt);
    sc = vec2(0.5,0.5) - sc * scissorScale;
    return clamp(sc.x,0.0,1.0) * clamp(sc.y,0.0,1.0);
}

void main(void) {
   vec4 result;
    float scissor = scissorMask(fpos);
    if (type == 0) { // Gradient
        // Calculate gradient color using box gradient
        vec2 pt = (paintMat * vec3(fpos,1.0)).xy;
        float d = clamp((sdroundrect(pt, extent, radius) + feather*0.5) / feather, 0.0, 1.0);
        vec4 color = mix(innerCol,outerCol,d);
        // Combine alpha
        color *= scissor;
        result = color;
    } else if (type == 1) { // Image
        // Calculate color fron texture
        vec2 pt = (paintMat * vec3(fpos,1.0)).xy / extent;
        vec4 color = texture2D(tex, pt);
        if (texType == 1) color = vec4(color.xyz*color.w,color.w);
        if (texType == 2) color = vec4(color.x);
        if (texType == 3) {
            color = texture2D(colormap, vec2(color.x, 0.5));
            color = vec4(color.xyz*color.w,color.w);
        }
        // Apply color tint and alpha.
        color *= innerCol;
        // Combine alpha
        color *= scissor;
        result = color;
    } else if (type == 2) { // Stencil fill
        result = vec4(1,1,1,1);
    } else if (type == 3) { // Textured tris
        vec4 color = texture2D(tex, ftcoord);
        if (texType == 1) color = vec4(color.xyz*color.w,color.w);
        if (texType == 2) color = vec4(color.x);
        if (texType == 3) {
            color = texture2D(colormap, vec2(color.x, 0.5));
            color = vec4(color.xyz*color.w,color.w);
        }
        color *= scissor;
        result = color * innerCol;
    }
    gl_FragColor = result;
}