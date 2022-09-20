import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
// import GUI from 'lil-gui';
// import gsap from "gsap";
import VirtualScroll from 'virtual-scroll'

// Fonts
import { MSDFTextGeometry, MSDFTextMaterial, uniforms } from "three-msdf-text";
import fnt from '../font/zookahs-msdf.json';
import atlasURL from '../font/zookahs.png';


const TEXT = [
  'ZooKaH',
  'fayze',
  'MATTAKAICEMAN',
  'The Treemiester',
  'DAFFODILRAT',
  'Reddshinobi',
  'QUBX',
  'STLfromHell67',


].reverse();

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1); 
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.position = 0;
    this.speed = 0;
    this.scroller = new VirtualScroll()
    this.scroller.on(event => {
	  // wrapper.style.transform = `translateY(${event.y}px)`
    this.position = event.y/4000
    this.speed = event.deltaY/2000
    })

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      100
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 2);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.dracoloader = new DRACOLoader();
    this.dracoloader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/dracos/')
    this.gltf = new GLTFLoader();
    this.gltf.setDRACOLoader(this.dracoloader);

    this.isPlaying = true;
    
    // this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.addTexts();
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
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.imageAspect = 853/1280;

    this.camera.updateProjectionMatrix();
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
  
          void main() {
              #include <three_msdf_vertex>
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

              gl_FragColor = vec4(1.,0.,0.,1.);
          }
      `,
  });


    Promise.all([
      loadFontAtlas(atlasURL),
  ]).then(([atlas]) => {

      this.size = 0.2
      this.material.uniforms.uMap.value = atlas;
      // Create new geometry for text array
      TEXT.forEach((text, i) => {
        const geometry = new MSDFTextGeometry({
          text: text.toLocaleUpperCase(),
          font: fnt
      });

      const mesh = new THREE.Mesh(geometry, this.material);
      let s = 0.005;
      mesh.scale.set(s,-s,s)
      mesh.position.x = -0.8;
      mesh.position.y = this.size*i;

      this.group.add(mesh)
      })
  });
  
  function loadFontAtlas(path) {
      const promise = new Promise((resolve, reject) => {
          const loader = new THREE.TextureLoader();
          loader.load(path, resolve);
      });
  
      return promise;
    }
  }

  // addObjects() {
  //   let that = this;
  //   this.material = new THREE.ShaderMaterial({
  //     extensions: {
  //       derivatives: "#extension GL_OES_standard_derivatives : enable"
  //     },
  //     side: THREE.DoubleSide,
  //     uniforms: {
  //       time: { type: "f", value: 0 },
  //       resolution: { type: "v4", value: new THREE.Vector4() },
  //       uvRate1: {
  //         value: new THREE.Vector2(1, 1)
  //       }
  //     },
  //     // wireframe: true,
  //     // transparent: true,
  //     vertexShader: vertex,
  //     fragmentShader: fragment
  //   });

  //   this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

  //   this.plane = new THREE.Mesh(this.geometry, this.material);
  //   this.scene.add(this.plane);
  // }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    // this.material.uniforms.time.value = this.time;
    this.speed *=0.9
    this.group.position.y = -this.position;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});
