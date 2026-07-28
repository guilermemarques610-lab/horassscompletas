import { createFileRoute } from "@tanstack/react-router";
import tiktokLogo from "@/assets/tiktok-logo-clean.png.asset.json";

export const Route = createFileRoute("/obrigado2")({
  head: () => ({
    meta: [
      { title: "Paso Final | TikTok Pay" },
      {
        name: "description",
        content: "Información adicional sobre tu retiro.",
      },
      { property: "og:title", content: "Paso Final" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Obrigado1,
});

function Obrigado1() {
  return (
    <main className="min-h-screen w-full bg-[#f8f9fa] flex flex-col items-center px-6 py-12 text-center">
      <img
        src={tiktokLogo.url}
        alt="TikTok"
        className="h-10 w-auto mb-10"
      />
      
      <div className="w-full max-w-[500px] rounded-[24px] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-neutral-100">
        <h1 className="text-2xl font-black text-[#161823] mb-4">Información Adicional</h1>
        <p className="text-neutral-500 text-sm">Esta es la página de destino después de la primera confirmación.</p>
      </div>
    </main>
  );
}
