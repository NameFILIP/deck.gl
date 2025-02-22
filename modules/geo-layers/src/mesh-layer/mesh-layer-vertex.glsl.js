export default `#version 300 es
#define SHADER_NAME simple-mesh-layer-vs

// Scale the model
uniform float sizeScale;
uniform bool composeModelMatrix;
uniform bool u_pickFeatureIds;

// Primitive attributes
in vec3 positions;
in vec3 normals;
in vec3 colors;
in vec2 texCoords;
in vec4 uvRegions;
in vec3 featureIdsPickingColors;

// Instance attributes
in vec4 instanceColors;
in vec3 instancePickingColors;
in mat3 instanceModelMatrix;

// Outputs to fragment shader
out vec2 vTexCoord;
out vec3 cameraPosition;
out vec3 normals_commonspace;
out vec4 position_commonspace;
out vec4 vColor;

vec2 applyUVRegion(vec2 uv) {
  #ifdef HAS_UV_REGIONS
    // https://github.com/Esri/i3s-spec/blob/master/docs/1.7/geometryUVRegion.cmn.md
    return fract(uv) * (uvRegions.zw - uvRegions.xy) + uvRegions.xy;
  #else
    return uv;
  #endif
}

void main(void) {
  vec2 uv = applyUVRegion(texCoords);
  geometry.uv = uv;

  if (u_pickFeatureIds) {
    geometry.pickingColor = featureIdsPickingColors;
  } else {
    geometry.pickingColor = instancePickingColors;
  }

  #ifdef MODULE_PBR
    // set PBR data
    #ifdef HAS_NORMALS
      pbr_vNormal = project_normal(instanceModelMatrix * normals);
      geometry.normal = pbr_vNormal;
    #endif

    #ifdef HAS_UV
      pbr_vUV = uv;
    #else
      pbr_vUV = vec2(0., 0.);
    #endif
    geometry.uv = pbr_vUV;
  #endif

  vTexCoord = uv;
  cameraPosition = project_uCameraPosition;
  normals_commonspace = project_normal(instanceModelMatrix * normals);
  vColor = vec4(colors * instanceColors.rgb, instanceColors.a);
  geometry.normal = normals_commonspace;

  vec3 pos = (instanceModelMatrix * positions) * sizeScale;
  vec3 projectedPosition = project_position(positions);
  position_commonspace = vec4(projectedPosition, 1.0);
  gl_Position = project_common_position_to_clipspace(position_commonspace);

  geometry.position = position_commonspace;

  #ifdef MODULE_PBR
    // set PBR data
    pbr_vPosition = geometry.position.xyz;
  #endif

  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  DECKGL_FILTER_COLOR(vColor, geometry);
}
`;
