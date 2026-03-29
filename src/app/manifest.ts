import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Neblir",
    short_name: "Neblir",
    description: "A homebrewed sci-fi TTRPG set in a starless world.",
    start_url: "/",
    display: "standalone",
    background_color: "#421161",
    theme_color: "#421161",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
