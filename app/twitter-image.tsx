import { ImageResponse } from "next/og";
import { DEFAULT_SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_CONTENT_TYPE, TWITTER_IMAGE } from "@/lib/seo/social-images";

export const runtime = "edge";

export const alt = DEFAULT_SOCIAL_IMAGE_ALT;
export const size = {
  width: TWITTER_IMAGE.width,
  height: TWITTER_IMAGE.height,
};
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0fdf4",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #d1fae5 2%, transparent 0%), radial-gradient(circle at 75px 75px, #d1fae5 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        }}>
        {/* Logo container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 30,
          }}>
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 14,
              backgroundColor: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="16" y1="14" x2="16" y2="18" />
              <line x1="8" y1="10" x2="8" y2="10" />
              <line x1="12" y1="10" x2="12" y2="10" />
              <line x1="16" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="8" y2="14" />
              <line x1="12" y1="14" x2="12" y2="14" />
              <line x1="8" y1="18" x2="8" y2="18" />
              <line x1="12" y1="18" x2="12" y2="18" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
            }}>
            Calculaderia
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: "#374151",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.3,
          }}>
          Calculadora financeira online grátis
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 30,
            marginTop: 30,
          }}>
          {["Financiamento", "Juros Compostos", "Renda Fixa"].map((item) => (
            <div
              key={item}
              style={{
                backgroundColor: "white",
                padding: "10px 20px",
                borderRadius: 40,
                fontSize: 18,
                fontWeight: 500,
                color: "#059669",
                border: "2px solid #a7f3d0",
              }}>
              {item}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 16,
            color: "#6b7280",
          }}>
          <span>100% gratuito</span>
          <span>•</span>
          <span>Sem cadastro</span>
          <span>•</span>
          <span>Código aberto</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
