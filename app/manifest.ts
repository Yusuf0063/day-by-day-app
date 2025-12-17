import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Day By Day",
    short_name: "DayByDay",
    description: "Oyunlaştırılmış Alışkanlık Takip Uygulaması",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6B46C1",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}


