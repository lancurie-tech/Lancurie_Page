import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { cn } from '@/lib/cn';

export type NeuralNoiseProps = {
  color?: [number, number, number];
  opacity?: number;
  speed?: number;
  className?: string;
  style?: CSSProperties;
};

/** Largura máxima (px) para modo “leve”: telemóveis em portrait / viewports estreitos */
const MOBILE_LIGHT_MQ = '(max-width: 767px)';

function buildFragmentSource(loopIterations: 10 | 15): string {
  const loop = String(loopIterations);
  return `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer_position;
      uniform vec3 u_color;
      uniform float u_speed;
      vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
      }
      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.0);
        vec2 res = vec2(0.0);
        float scale = 8.0;
        for (int j = 0; j < ${loop}; j++) {
          uv = rotate(uv, 1.0);
          sine_acc = rotate(sine_acc, 1.0);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 2.4 * p;
          res += (0.5 + 0.5 * cos(layer)) / scale;
          scale *= 1.2;
        }
        return res.x + res.y;
      }
      void main() {
        vec2 uv = 0.5 * vUv;
        uv.x *= u_ratio;
        vec2 pointer = vUv - u_pointer_position;
        pointer.x *= u_ratio;
        float p = clamp(length(pointer), 0.0, 1.0);
        p = 0.5 * pow(1.0 - p, 2.0);
        float t = u_speed * u_time;
        vec3 col = vec3(0.0);
        float noise = neuro_shape(uv, t, p);
        noise = 1.2 * pow(noise, 3.0);
        noise += pow(noise, 10.0);
        noise = max(0.0, noise - 0.5);
        noise *= (1.0 - length(vUv - 0.5));
        col = u_color * noise;
        gl_FragColor = vec4(col, noise);
      }
    `;
}

/**
 * Fundo WebGL “neural noise” (adaptado de 21st.dev).
 * Coloque dentro de um pai `relative` com altura (ex.: `min-h-dvh` na hero); `pointer-events-none` no canvas
 * para não bloquear cliques — o rato segue via `window` (coordenadas projectadas no rect do canvas, com clamp).
 *
 * Em viewports estreitos (&lt;=767px): menos iterações no shader, DPR máx. 1 e ~30fps para aliviar GPU em telemóveis.
 */
export function NeuralNoise({
  color = [0.12, 0.55, 0.62],
  opacity = 0.85,
  speed = 0.0035,
  className,
  style,
}: NeuralNoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /** Posição do ponteiro em pixels relativos ao canvas (como no original 21st.dev). */
  const pointerRef = useRef({ x: 0, y: 0, tX: 0, tY: 0 });

  const [mobileLight, setMobileLight] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_LIGHT_MQ).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_LIGHT_MQ);
    const sync = () => setMobileLight(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (el == null) return;

    const mount = (surface: HTMLCanvasElement) => {
      const vsSource = `
      precision mediump float;
      varying vec2 vUv;
      attribute vec2 a_position;
      void main() {
        vUv = 0.5 * (a_position + 1.0);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
      const fsSource = buildFragmentSource(mobileLight ? 10 : 15);

      const glMaybe =
        (surface.getContext('webgl') as WebGLRenderingContext | null) ??
        (surface.getContext('experimental-webgl') as WebGLRenderingContext | null);
      if (!glMaybe) {
        console.error('WebGL not supported');
        return;
      }
      const gl: WebGLRenderingContext = glMaybe;

      function createShader(source: string, type: number): WebGLShader | null {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }

      function createProgram(vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
        const program = gl.createProgram();
        if (!program) return null;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.error('Program link error:', gl.getProgramInfoLog(program));
          return null;
        }
        return program;
      }

      function getUniforms(program: WebGLProgram): Record<string, WebGLUniformLocation | null> {
        const uniforms: Record<string, WebGLUniformLocation | null> = {};
        const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
        for (let i = 0; i < uniformCount; i++) {
          const info = gl.getActiveUniform(program, i);
          if (!info) continue;
          uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        return uniforms;
      }

      const vertexShader = createShader(vsSource, gl.VERTEX_SHADER);
      const fragmentShader = createShader(fsSource, gl.FRAGMENT_SHADER);
      if (!vertexShader || !fragmentShader) return;

      const programMaybe = createProgram(vertexShader, fragmentShader);
      if (!programMaybe) return;
      const shaderProgram: WebGLProgram = programMaybe;

      const uniforms = getUniforms(shaderProgram);
      gl.useProgram(shaderProgram);

      const uTimeLoc = uniforms.u_time ?? null;
      const uPointerLoc = uniforms.u_pointer_position ?? null;
      const uRatioLoc = uniforms.u_ratio ?? null;

      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const vertexBuffer = gl.createBuffer();
      if (!vertexBuffer) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform3f(uniforms.u_color, color[0], color[1], color[2]);
      gl.uniform1f(uniforms.u_speed, speed);

      const pointer = pointerRef.current;
      let rafId = 0;
      let running = true;

      function pointerToUniform(clientX: number, clientY: number) {
        const rect = surface.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const lx = clientX - rect.left;
        const ly = clientY - rect.top;
        pointer.tX = Math.max(0, Math.min(rect.width, lx));
        pointer.tY = Math.max(0, Math.min(rect.height, ly));
      }

      function centerPointer() {
        const w = surface.clientWidth;
        const h = surface.clientHeight;
        pointer.x = pointer.tX = w / 2;
        pointer.y = pointer.tY = h / 2;
      }

      function resizeCanvas() {
        const maxDpr = mobileLight ? 1 : 2;
        const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
        const w = Math.max(1, Math.floor(surface.clientWidth * dpr));
        const h = Math.max(1, Math.floor(surface.clientHeight * dpr));
        surface.width = w;
        surface.height = h;
        if (uRatioLoc) gl.uniform1f(uRatioLoc, w / h);
        gl.viewport(0, 0, w, h);
      }

      const resizeListener = () => resizeCanvas();
      window.addEventListener('resize', resizeListener);
      const ro = new ResizeObserver(() => resizeCanvas());
      ro.observe(surface);
      resizeCanvas();
      centerPointer();

      const updateMousePosition = (clientX: number, clientY: number) => {
        pointerToUniform(clientX, clientY);
      };

      const pointermove = (e: PointerEvent) => updateMousePosition(e.clientX, e.clientY);
      const touchmove = (e: TouchEvent) => {
        const t = e.targetTouches[0];
        if (t) updateMousePosition(t.clientX, t.clientY);
      };
      const click = (e: MouseEvent) => updateMousePosition(e.clientX, e.clientY);

      if (!mobileLight) {
        window.addEventListener('pointermove', pointermove);
        window.addEventListener('touchmove', touchmove, { passive: true });
        window.addEventListener('click', click);
      }

      function render() {
        if (!running) return;
        if (!mobileLight) {
          const follow = 0.12;
          pointer.x += (pointer.tX - pointer.x) * follow;
          pointer.y += (pointer.tY - pointer.y) * follow;
        }
        if (uTimeLoc) gl.uniform1f(uTimeLoc, performance.now());
        if (uPointerLoc && surface.clientWidth > 0 && surface.clientHeight > 0) {
          gl.uniform2f(
            uPointerLoc,
            mobileLight ? 0.5 : pointer.x / surface.clientWidth,
            mobileLight ? 0.5 : 1 - pointer.y / surface.clientHeight
          );
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        rafId = requestAnimationFrame(render);
      }

      render();

      return () => {
        running = false;
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resizeListener);
        if (!mobileLight) {
          window.removeEventListener('pointermove', pointermove);
          window.removeEventListener('touchmove', touchmove);
          window.removeEventListener('click', click);
        }
        ro.disconnect();
        gl.deleteProgram(shaderProgram);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      };
    };

    return mount(el);
  }, [color, speed, mobileLight]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      style={{ opacity, ...style }}
      aria-hidden
    />
  );
}
