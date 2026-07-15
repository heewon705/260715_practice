"use client";

import { Great_Vibes } from "next/font/google";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  function handleSeoulClick() {
    alert("hi");
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/seoul-night.jpg')" }}
    >
      <h1
        className={`${greatVibes.className} cursor-pointer text-7xl tracking-wide text-white drop-shadow-lg sm:text-8xl md:text-9xl`}
        onClick={handleSeoulClick}
      >
        seoul
      </h1>
    </div>
  );
}
