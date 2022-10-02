import * as THREE from "three";
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import VirtualScroll from 'virtual-scroll';
// import GUI from 'lil-gui';
// import gsap from "gsap";

// Fonts
import { MSDFTextGeometry, MSDFTextMaterial, uniforms } from "three-msdf-text";
import fnt from '../font/zookahs-msdf.json';
import atlasURL from '../font/zookahs.png';


const TEXT = [
  'synistr_motives',
  'STLfromHell67',
  'Reddshinobi',
  'riskyumbrella',
  'DAFFODILRAT',
  'fayze',
  'MATTAKAICEMAN',
  'QUBX',
  'The Treemiester',
  'ZooKaH',

].reverse();

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.sceneCopy = new THREE.Scene();
    this.groupCopy = new THREE.Group();
    this.sceneCopy.add(this.groupCopy);
    this.group = new THREE.Group();
    this.groupPlane = new THREE.Group();
    this.scene.add(this.group);
    this.scene.add(this.groupPlane);

    this.textures = [...document.querySelectorAll('.texture')];
    this.textures = this.textures.map(t => { return new THREE.TextureLoader().load(t.src)});

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio, 2);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1); 
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    // scroller values and speed of scroll
    this.position = 0
    this.speed = 0
    this.targetSpeed = 0
    this.scroller = new VirtualScroll()
    this.scroller.on(event => {
      this.position = - event.y/3000
      this.speed = - event.deltaY/2000
    });

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 2.5);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.dracoloader = new DRACOLoader();
    this.dracoloader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/dracos/')
    this.gltf = new GLTFLoader();
    this.gltf.setDRACOLoader(this.dracoloader);

    this.isPlaying = true;
    
    this.addObjects();
    this.addTexts();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.imageAspect = 853/1280;
    let a1; let a2;
    

    // this.material.uniforms.resolution.value.x = this.width;
    // this.material.uniforms.resolution.value.y = this.height;
    // this.material.uniforms.resolution.value.z = a1;
    // this.material.uniforms.resolution.value.w = a2;

    this.camera.updateProjectionMatrix();
  }

  addLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(0, 0, 1);
    this.sceneCopy.add(light2);
  }

  addTexts() {
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      defines: {
          IS_SMALL: false,
      },
      extensions: {
          derivatives: true,
      },
      uniforms: {
        uSpeed : { value: 0 },
          // Common
          ...uniforms.common,
          
          // Rendering
          ...uniforms.rendering,
          
          // Strokes
          ...uniforms.strokes,
      },
      vertexShader: `
          // Attribute
          #include <three_msdf_attributes>
  
          // Varyings
          #include <three_msdf_varyings>
          

          mat4 rotationMatrix(vec3 axis, float angle) {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;
            
            return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                        0.0,                                0.0,                                0.0,                                1.0);
          }
        
          vec3 rotate(vec3 v, vec3 axis, float angle) {
          mat4 m = rotationMatrix(axis, angle);
          return (m * vec4(v, 1.0)).xyz;
          } 

          uniform float uSpeed;
  
          void main() {


            // Varyings
            vUv = uv;
            vLayoutUv = layoutUv;
            vNormal = normal;
            
            vLineIndex = lineIndex;
            
            vLineLettersTotal = lineLettersTotal;
            vLineLetterIndex = lineLetterIndex;
            
            vLineWordsTotal = lineWordsTotal;
            vLineWordIndex = lineWordIndex;
            
            vWordIndex = wordIndex;
            
            vLetterIndex = letterIndex;

            // Output
            vec3 newpos = position;

            float xx = position.x*.004;
            newpos = rotate(newpos, vec3(.0, 0.0, 1.0), uSpeed*xx*xx*xx);

            vec4 mvPosition = vec4(newpos, 1.0);
            mvPosition = modelViewMatrix * mvPosition;
            gl_Position = projectionMatrix * mvPosition;

            vViewPosition = -mvPosition.xyz;
          }
      `,
      fragmentShader: `
          // Varyings
          #include <three_msdf_varyings>
  
          // Uniforms
          #include <three_msdf_common_uniforms>
          #include <three_msdf_strokes_uniforms>
  
          // Utils
          #include <three_msdf_median>
  
          void main() {
              // Common
              #include <three_msdf_common>
  
              // Strokes
              #include <three_msdf_strokes>
  
              // Alpha Test
              #include <three_msdf_alpha_test>
  
              // Outputs
              #include <three_msdf_strokes_output>


              gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
      `,
  });

  // start of promise for three-msdf-text

      Promise.all([loadFontAtlas(atlasURL),]).then(([atlas]) => {

        this.size = 0.2;

        this.material.uniforms.uMap.value = atlas;
        TEXT.forEach((text, i) => { 
            const geometry = new MSDFTextGeometry({
            text: text.toUpperCase(),
            font: fnt,
        });
      
    
      this.material.uniforms.uMap.value = atlas;
    
      const mesh = new THREE.Mesh(geometry, this.material);

      let s = 0.006;
      mesh.scale.set(s, -s, s);
      mesh.position.x = -0.9;
      mesh.position.y = this.size*i;
      


      this.group.add(mesh);
      this.groupCopy.add(mesh.clone());
    });

  });
  
      function loadFontAtlas(path) {
      const promise = new Promise((resolve, reject) => {
          const loader = new THREE.TextureLoader();
          loader.load(path, resolve);
      });
  
      return promise;
    }
  }

  addObjects() {
    let that = this;
    this.planematerial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        uTexture : { value: this.textures[0] },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1)
        }
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.geometry = new THREE.PlaneGeometry(1.77/2, 1/2, 30, 30).translate(0, 0, 1);
    let pos = this.geometry.attributes.position.array;
    let newpos = []
    let r = 1.5;

    for(let i = 0; i < pos.length; i+=3) {
      let x = pos[i];
      let y = pos[i+1];
      let z = pos[i+2];

      // let xz = new THREE.Vector2(x, z).normalize().multiplyScalar(r)


      let xyz = new THREE.Vector3(x, y, z).normalize().multiplyScalar(r)



      newpos.push(xyz.x, xyz.y, xyz.z);
    }

    let spheremesh =  new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshBasicMaterial({wireframe: true, color: 0xff0000, transparent: true, opacity: 0.1})
    )
    this.scene.add(spheremesh)
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(newpos, 3));

    this.plane = new THREE.Mesh(this.geometry, this.planematerial);
    this.groupPlane.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  updateTextures() {
    let index = Math.round(this.position + 10000) % this.textures.length;

    this.planematerial.uniforms.uTexture.value = this.textures[index];

    this.groupCopy.children.forEach((mesh, i) => {
      if(i !== index) {
        mesh.visible = false;
      } else {
        mesh.visible = true;
      }     
  });
}    


  render() {
    if (!this.isPlaying) return;
    this.updateTextures();
    this.time += 0.05;
    this.speed *= 0.9
    this.targetSpeed += (this.speed-this.targetSpeed)*0.1
    this.material.uniforms.uSpeed.value = this.targetSpeed;

    // text group y positioning
    this.group.position.y = -this.position*this.size + .1;
    this.groupCopy.position.y = -this.position*this.size +  .1;


    this.plane.rotation.y = this.position*2*Math.PI;
    this.groupPlane.rotation.z = 0.0*Math.sin(this.position*0.5);
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.sceneCopy, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});