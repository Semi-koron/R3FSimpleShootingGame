import "./App.css";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Plane } from "@react-three/drei";
import { Physics, RigidBody, RapierRigidBody } from "@react-three/rapier";
import {
  createXRStore,
  XR,
  XROrigin,
  useXRInputSourceState,
} from "@react-three/xr";
import { useRef } from "react";
import * as THREE from "three";

const store = createXRStore();

function App() {
  const ref = useRef<THREE.Group>(null);
  const cubeRef = useRef<RapierRigidBody>(null);
  const targetRef = useRef<RapierRigidBody>(null);

  const shoot = (direction: THREE.Quaternion, position: THREE.Vector3) => {
    // キューブを速度0に
    cubeRef.current?.setLinvel(
      {
        x: 0,
        y: 0,
        z: 0,
      },
      true
    );

    // キューブの位置を変更
    cubeRef.current?.setTranslation(
      {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      true
    );

    // キューブの向きを変更
    cubeRef.current?.setRotation(
      {
        x: direction.x,
        y: direction.y,
        z: direction.z,
        w: direction.w,
      },
      true
    );

    // 向きに応じて力を加える
    const force = new THREE.Vector3(0, 0, -0.1);
    force.applyQuaternion(direction);
    cubeRef.current?.applyImpulse(
      {
        x: force.x,
        y: force.y,
        z: force.z,
      },
      true
    );
  };

  const Locomotion = () => {
    const leftController = useXRInputSourceState("controller", "left");
    const rightController = useXRInputSourceState("controller", "right");
    let isGrabbing = false;
    useFrame(() => {
      const leftObject = leftController?.object;
      const rightObject = rightController?.object;
      if (leftController && rightController) {
        const leftSqueezeState = leftController.gamepad["xr-standard-squeeze"];
        const rightSqueezeState =
          rightController.gamepad["xr-standard-squeeze"];
        if (!isGrabbing) {
          if (leftObject && leftSqueezeState?.state == "pressed") {
            // 左コントローラーの処理
            isGrabbing = true;
            const leftPosition = new THREE.Vector3();
            leftObject.getWorldPosition(leftPosition);
            const leftDirection = new THREE.Quaternion();
            leftObject.getWorldQuaternion(leftDirection);
            shoot(leftDirection, leftPosition);
          }
          if (rightObject && rightSqueezeState?.state == "pressed") {
            // 右コントローラーの処理
            isGrabbing = true;
            const rightPosition = new THREE.Vector3();
            rightObject.getWorldPosition(rightPosition);
            const rightDirection = new THREE.Quaternion();
            rightObject.getWorldQuaternion(rightDirection);
            shoot(rightDirection, rightPosition);
          }
        }
        //両手が離された時の処理
        if (
          rightSqueezeState?.state == "default" &&
          leftSqueezeState?.state == "default"
        ) {
          isGrabbing = false;
        }
      }
    });
    return <XROrigin ref={ref} />;
  };
  return (
    <>
      <button
        onClick={() => store.enterVR()}
        style={{
          position: "fixed",
          top: "10px",
          left: "10px",
          zIndex: 1000,
          height: "100px",
          width: "200px",
        }}
      >
        Enter VR
      </button>
      <Canvas
        camera={{
          position: [0, 5, 8],
          fov: 50,
          near: 0.1,
          far: 2000,
        }}
        dpr={window.devicePixelRatio}
        shadows
        style={{ width: "100vw", height: "100vh" }}
      >
        <XR store={store}>
          {/* 背景色 */}
          <color attach="background" args={["#DDDDDD"]} />
          {/* カメラの操作 */}
          <OrbitControls />
          {/* ライトの設定 */}
          <ambientLight intensity={0.1} />
          <directionalLight
            position={[2, 6, 4]}
            intensity={1}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            castShadow
          />
          {/* オブジェクト */}
          <Physics gravity={[0, -9.8, 0]}>
            <RigidBody
              type="dynamic"
              name="bullet"
              ref={cubeRef}
              position={[0, 1, 0]}
              rotation={[0, 0, 0]}
            >
              <mesh castShadow>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color="#f00" />
              </mesh>
            </RigidBody>

            <RigidBody
              type="dynamic"
              ref={targetRef}
              onCollisionEnter={(event) => {
                if (
                  event.colliderObject &&
                  event.colliderObject.name === "bullet"
                ) {
                  targetRef.current?.setTranslation(
                    {
                      x: Math.random() * 5 - 2.5,
                      y: 6,
                      z: Math.random() * 5 - 2.5,
                    },
                    true
                  );
                }
              }}
              position={[0, 6, -2]}
              rotation={[0, 0, 0]}
            >
              <mesh castShadow>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#00f" />
              </mesh>
            </RigidBody>

            <RigidBody type="fixed">
              {/* 床 */}
              <Plane
                rotation={[-Math.PI / 2, 0, 0]}
                args={[10, 10]}
                receiveShadow
              >
                <meshStandardMaterial color="#fff" side={THREE.DoubleSide} />
              </Plane>
            </RigidBody>
          </Physics>
          <Locomotion />
        </XR>
      </Canvas>
    </>
  );
}

export default App;
