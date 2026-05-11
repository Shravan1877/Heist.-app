import React, { useEffect, useRef } from 'react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Edge {
  start: number;
  end: number;
}

interface Shape3D {
  vertices: Point3D[];
  edges: Edge[];
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  rotationSpeedX: number;
  rotationSpeedY: number;
  rotationSpeedZ: number;
  scale: number;
  driftSpeedX: number;
  driftSpeedY: number;
}

const GeometricBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Octahedron
  const octahedronVertices: Point3D[] = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
  ];
  const octahedronEdges: Edge[] = [
    { start: 0, end: 2 }, { start: 0, end: 3 }, { start: 0, end: 4 }, { start: 0, end: 5 },
    { start: 1, end: 2 }, { start: 1, end: 3 }, { start: 1, end: 4 }, { start: 1, end: 5 },
    { start: 2, end: 4 }, { start: 4, end: 3 }, { start: 3, end: 5 }, { start: 5, end: 2 }
  ];

  // Tetrahedron
  const tetrahedronVertices: Point3D[] = [
    { x: 1, y: 1, z: 1 }, { x: -1, y: -1, z: 1 },
    { x: -1, y: 1, z: -1 }, { x: 1, y: -1, z: -1 }
  ];
  const tetrahedronEdges: Edge[] = [
    { start: 0, end: 1 }, { start: 0, end: 2 }, { start: 0, end: 3 },
    { start: 1, end: 2 }, { start: 1, end: 3 }, { start: 2, end: 3 }
  ];

  // Icosahedron
  const phi = (1 + Math.sqrt(5)) / 2;
  const icosahedronVertices: Point3D[] = [
    { x: -1, y: phi, z: 0 }, { x: 1, y: phi, z: 0 }, { x: -1, y: -phi, z: 0 }, { x: 1, y: -phi, z: 0 },
    { x: 0, y: -1, z: phi }, { x: 0, y: 1, z: phi }, { x: 0, y: -1, z: -phi }, { x: 0, y: 1, z: -phi },
    { x: phi, y: 0, z: -1 }, { x: phi, y: 0, z: 1 }, { x: -phi, y: 0, z: -1 }, { x: -phi, y: 0, z: 1 }
  ];
  const icosahedronEdges: Edge[] = [
    { start: 0, end: 11 }, { start: 0, end: 5 }, { start: 0, end: 1 }, { start: 0, end: 7 }, { start: 0, end: 10 },
    { start: 1, end: 9 }, { start: 1, end: 5 }, { start: 1, end: 8 }, { start: 1, end: 7 },
    { start: 2, end: 3 }, { start: 2, end: 10 }, { start: 2, end: 11 }, { start: 2, end: 4 }, { start: 2, end: 6 },
    { start: 3, end: 9 }, { start: 3, end: 4 }, { start: 3, end: 8 }, { start: 3, end: 6 },
    { start: 4, end: 9 }, { start: 4, end: 5 }, { start: 4, end: 11 },
    { start: 5, end: 9 }, { start: 5, end: 11 },
    { start: 6, end: 10 }, { start: 6, end: 7 }, { start: 6, end: 8 },
    { start: 7, end: 10 }, { start: 7, end: 8 }, { start: 8, end: 9 }, { start: 10, end: 11 }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    const shapes: Shape3D[] = [];
    const numShapes = 4;

    for (let i = 0; i < numShapes; i++) {
      const rand = Math.random();
      let geometry = { vertices: icosahedronVertices, edges: icosahedronEdges };
      if (rand < 0.33) {
        geometry = { vertices: octahedronVertices, edges: octahedronEdges };
      } else if (rand < 0.66) {
        geometry = { vertices: tetrahedronVertices, edges: tetrahedronEdges };
      }

      shapes.push({
        ...geometry,
        x: Math.random() * width,
        y: Math.random() * height,
        z: 0,
        rotationX: Math.random() * Math.PI * 2,
        rotationY: Math.random() * Math.PI * 2,
        rotationZ: Math.random() * Math.PI * 2,
        rotationSpeedX: (Math.random() - 0.5) * 0.002,
        rotationSpeedY: (Math.random() - 0.5) * 0.002,
        rotationSpeedZ: (Math.random() - 0.5) * 0.002,
        scale: 80 + Math.random() * 120,
        driftSpeedX: (Math.random() - 0.5) * 0.15,
        driftSpeedY: (Math.random() - 0.5) * 0.15,
      });
    }

    const rotateX = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: point.x, y: point.y * cos - point.z * sin, z: point.y * sin + point.z * cos };
    };

    const rotateY = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: point.x * cos + point.z * sin, y: point.y, z: -point.x * sin + point.z * cos };
    };

    const rotateZ = (point: Point3D, angle: number): Point3D => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos, z: point.z };
    };

    const draw = () => {
      const isLightMode = document.documentElement.classList.contains('light');
      const baseColor = isLightMode ? '40, 217, 5' : '204, 255, 0';
      
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 0.5;

      shapes.forEach((shape) => {
        shape.rotationX += shape.rotationSpeedX;
        shape.rotationY += shape.rotationSpeedY;
        shape.rotationZ += shape.rotationSpeedZ;

        shape.x += shape.driftSpeedX;
        shape.y += shape.driftSpeedY;

        if (shape.x < -200) shape.x = width + 200;
        if (shape.x > width + 200) shape.x = -200;
        if (shape.y < -200) shape.y = height + 200;
        if (shape.y > height + 200) shape.y = -200;

        const projectedPoints = shape.vertices.map((v) => {
          let p = rotateX(v, shape.rotationX);
          p = rotateY(p, shape.rotationY);
          p = rotateZ(p, shape.rotationZ);
          return {
            x: shape.x + p.x * shape.scale,
            y: shape.y + p.y * shape.scale,
            z: p.z
          };
        });

        shape.edges.forEach((edge) => {
          const p1 = projectedPoints[edge.start];
          const p2 = projectedPoints[edge.end];
          const opacity = isLightMode ? 0.06 : 0.1;
          ctx.strokeStyle = `rgba(${baseColor}, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        });
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden gpu-accelerated"
      style={{ filter: 'blur(0.5px)' }}
    />
  );
};

export default GeometricBackground;