/**
 * Divisórias curvas: preto #050505 com limite em path SVG.
 * Vértice para FORA da faixa clara — centro “empurra” para o preto (forma em lente / olho).
 * Overlap de 1px evita hairline entre secções.
 * Sem camadas “feather” com branco puro — o fundo off-white fica uniforme na secção.
 */
export function ServicesCurvedDividers() {
  return (
    <>
      <div
        className="pointer-events-none absolute -top-px inset-x-0 z-1 isolate w-full"
        aria-hidden
      >
        <svg
          viewBox="0 0 1200 220"
          preserveAspectRatio="none"
          className="block h-[min(28vw,280px)] w-full"
          role="presentation"
        >
          <path fill="#050505" d="M 0 0 H 800 V 0 Q 200 12 0 156 Z" />
        </svg>
      </div>

      <div
        className="pointer-events-none absolute -bottom-px inset-x-0 z-1 isolate w-full"
        aria-hidden
      >
        <svg
          viewBox="0 0 1200 220"
          preserveAspectRatio="none"
          className="block h-[min(26vw,260px)] w-full"
          role="presentation"
        >
          <path fill="#050505" d="M 0 220 Q 800 238 1200 32 L 1200 220 L 0 220 Z" />
        </svg>
      </div>
    </>
  );
}
