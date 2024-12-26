import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Box, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";

const Text3D = () => {
  const { nodes } = useGLTF('/TEXT.glb');
  const [isMobile] = useState(window.innerWidth <= 768);
  
  // Adjust text position and scale based on device
  const textPosition = isMobile ? [-4, 0, -2] : [-9, 0, -2];
  const textScale = isMobile ? [1.2, 1.2, 1.2] : [2.5, 2.5, 2.5];

  return (
    <primitive 
      object={nodes.Text} 
      position={textPosition}
      scale={textScale}
      rotation={[1.6,0,0]}
    >
      <meshPhysicalMaterial color="black" />
    </primitive>
  );
};

const FluidSphere = () => {
  const sphereRef = useRef();
  const [time, setTime] = useState(0);

  useFrame((state) => {
    setTime(state.clock.getElapsedTime());
    
    // Create fluid-like motion using sin waves
    if (sphereRef.current) {
      sphereRef.current.rotation.x = Math.sin(time * 0.001) * 0.02;
      sphereRef.current.rotation.y = Math.cos(time * 0.001) * 0.02;
      
      // Distort the sphere geometry to simulate fluid
      const positions = sphereRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        positions.setXYZ(
          i,
          x + Math.sin(time + y) * 0.004,
          y + Math.cos(time + x) * 0.006,
          z + Math.sin(time + x + y) * 0.006
        );
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <>
      <Text3D />
      <Sphere args={[3, 64, 64]} ref={sphereRef} position={[0, 0, 0]}>
        <meshPhysicalMaterial 
          color="#4488ff"
          transmission={0.95}
          thickness={1.5}
          roughness={0.1}
          ior={1.4}
          transparent
          opacity={0.6}
        />
      </Sphere>
    </>
  );
};

const SphereFollower = ({ mouse }) => {
  const sphereRef = useRef();
  const [color, setColor] = useState("#ffa500");
  const [isMobile] = useState(window.innerWidth <= 768);

  useFrame(() => {
    if (sphereRef.current) {
      const { x, y } = mouse.current;

      // Adjust movement speed and range based on device
      const speedX = isMobile ? 0.08 : 0.05;
      const speedY = isMobile ? 0.09 : 0.06;
      const rangeX = isMobile ? 1.5 : 2;

      // Gradual movement toward target position
      sphereRef.current.position.x += (x * rangeX - sphereRef.current.position.x) * speedX;
      sphereRef.current.position.y += (y - sphereRef.current.position.y) * speedY;

      // Reset to center if no input
      if (x === null || y === null) {
        sphereRef.current.position.x += (0 - sphereRef.current.position.x) * speedX;
        sphereRef.current.position.y += (0 - sphereRef.current.position.y) * speedY;
      }

      // Change sphere color gradually from light orange to yellow
      const normalizedX = (x + 5) / 10;
      const colorValue = Math.min(1, Math.max(0, normalizedX));
      setColor(new THREE.Color().lerpColors(new THREE.Color("#ffa500"), new THREE.Color("#ffff00"), colorValue).getStyle());
    }
  });

  // Adjust sphere size based on device
  const sphereSize = isMobile ? 4 : 6;

  return (
    <Sphere args={[sphereSize, 64, 64]} ref={sphereRef} position={[0, 0, -15]}>
      <meshPhysicalMaterial color={color} roughness={0.95} metalness={0.1} clearcoat={0.2} />
    </Sphere>
  );
};

const ThickPlane = ({ position, rotation }) => {
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transmission: 1.3,
    thickness: 1.2,
    roughness: 0.6,
    ior: 1.9,
    specularIntensity: 1,
    clearcoat: 0.7,
    transparent: true,
    opacity: 1.0,
    side: THREE.DoubleSide
  });

  return (
    <Box args={[5, 5, 0.3]} position={position} rotation={rotation}>
      <primitive object={glass} />
    </Box>
  );
};

const PlaneGrid = () => {
  const [isMobile] = useState(window.innerWidth <= 768);
  const gridSize = isMobile ? 5 : 10;
  
  const planes = [];
  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      planes.push(
        <ThickPlane
          key={`plane-${i}-${j}`}
          position={[i * 5.15, j * 5.1, -4]}
          rotation={[-Math.PI / 1, 0, 0]}
        />
      );
    }
  }
  return <>{planes}</>;
};

const App = () => {
  const mouse = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const multiplierX = isMobile ? 15 : 11;
      const multiplierY = isMobile ? 17 : 13;
      const offsetX = isMobile ? -6 : -4;
      const offsetY = isMobile ? 7 : 5;

      mouse.current.x = (event.clientX / window.innerWidth) * multiplierX + offsetX;
      mouse.current.y = -(event.clientY / window.innerHeight) * multiplierY + offsetY;
    };

    const handleTouchMove = (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      const multiplierX = 15;
      const multiplierY = 17;
      const offsetX = -6;
      const offsetY = 7;

      mouse.current.x = (touch.clientX / window.innerWidth) * multiplierX + offsetX;
      mouse.current.y = -(touch.clientY / window.innerHeight) * multiplierY + offsetY;
    };

    const handleInputEnd = () => {
      mouse.current.x = null;
      mouse.current.y = null;
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      handleInputEnd();
    };

    // Mouse events
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleInputEnd);

    // Touch events
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleInputEnd);
    window.addEventListener("touchcancel", handleInputEnd);

    // Handle window resize
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleInputEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleInputEnd);
      window.removeEventListener("touchcancel", handleInputEnd);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);

  // Adjust camera position and FOV based on device
  const cameraPosition = isMobile ? [0, 0, 15] : [0, 0, 10];
  const cameraFOV = isMobile ? 70 : 50;

  return (
    <Canvas 
      camera={{ position: cameraPosition, fov: cameraFOV }} 
      style={{ 
        height: "100vh", 
        width: "100vw", 
        touchAction: "none",
        WebkitTapHighlightColor: "transparent"
      }}
    >
      <color attach="background" args={["#dcdcdc"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* Fluid Sphere with Controls */}
      <FluidSphere />

      {/* Sphere Following Cursor/Touch */}
      <SphereFollower mouse={mouse} />

      {/* Matte Planes Grid */}
      <PlaneGrid />

      {/* Add OrbitControls for mobile pinch-zoom */}
      {isMobile && <OrbitControls enableZoom={true} enablePan={false} enableRotate={false} />}
    </Canvas>
  );
};

export default App;
