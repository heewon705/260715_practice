import { Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/seoul-night.jpg')" }}
    >
      <h1
        className={`${greatVibes.className} text-7xl tracking-wide text-white drop-shadow-lg sm:text-8xl md:text-9xl`}
      >
        seoul
      </h1>
    </div>
  );
}
