"use client";

import { useEffect, useState } from "react";
import type { AdmFeature, EmdProperties } from "admdongkor";

type MapGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

type SeoulDong = AdmFeature<EmdProperties> & {
  mapPath: string;
  center: [number, number];
};

const mapWidth = 760;
const mapHeight = 620;
const longitudeMin = 126.75;
const longitudeMax = 127.21;
const latitudeMin = 37.41;
const latitudeMax = 37.72;

function projectPoint(point: number[]): [number, number] {
  return [
    ((point[0] - longitudeMin) / (longitudeMax - longitudeMin)) * mapWidth,
    ((latitudeMax - point[1]) / (latitudeMax - latitudeMin)) * mapHeight,
  ];
}

function geometryToPath(geometry: MapGeometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons
    .flatMap((polygon) =>
      polygon.map(
        (ring) =>
          ring
            .map((point, index) => {
              const [x, y] = projectPoint(point);
              return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ") + " Z",
      ),
    )
    .join(" ");
}

function geometryCenter(geometry: MapGeometry): [number, number] {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const points = polygons.flatMap((polygon) => polygon[0]);
  return projectPoint([
    points.reduce((sum, point) => sum + point[0], 0) / points.length,
    points.reduce((sum, point) => sum + point[1], 0) / points.length,
  ]);
}

export default function Home() {
  const [dongs, setDongs] = useState<SeoulDong[]>([]);
  const [selectedDong, setSelectedDong] = useState<SeoulDong | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [hoveredDong, setHoveredDong] = useState<SeoulDong | null>(null);
  const [isPhotoPopupOpen, setIsPhotoPopupOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    async function loadDongs() {
      try {
        const { get } = await import("admdongkor");
        const collection = await get("20260701", "emd");
        const seoulDongs = collection.features
          .filter(
            (feature): feature is AdmFeature<EmdProperties> =>
              "emdnm" in feature.properties && feature.properties.sidonm === "서울특별시",
          )
          .map((feature) => ({
            ...feature,
            mapPath: geometryToPath(feature.geometry),
            center: geometryCenter(feature.geometry),
          }));
        setDongs(seoulDongs);
      } catch {
        setErrorMessage("지도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        setIsLoading(false);
      }
    }
    loadDongs();
  }, []);

  function chooseRandomDong() {
    if (dongs.length === 0) return;
    let nextDong = dongs[Math.floor(Math.random() * dongs.length)];
    if (dongs.length > 1 && nextDong.properties.emdcd === selectedDong?.properties.emdcd) {
      nextDong = dongs[(dongs.indexOf(nextDong) + 1) % dongs.length];
    }
    setIsPhotoPopupOpen(false);
    setSelectedDong(nextDong);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff7f3] px-4 py-6 text-[#2f2927] sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#ffd6d2]/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#ffe6aa]/45 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-[#2f2927]/10 bg-white/75 shadow-[0_30px_100px_rgba(103,66,54,.14)] backdrop-blur md:grid-cols-[0.82fr_1.18fr]">
        <section className="flex flex-col justify-between border-b border-[#2f2927]/10 p-7 md:border-b-0 md:border-r md:p-12">
          <div>
            <div className="mb-10 flex items-center gap-2 text-xs font-bold tracking-[.24em] text-[#e35d68]">
              <span>♥</span> RANDOM DATE
            </div>
            <p className="mb-3 text-sm font-semibold text-[#e35d68]">우리, 오늘 어디서 만날까?</p>
            <h1 className="text-5xl font-black leading-[1.05] tracking-[-.08em] sm:text-7xl">
              서울
              <br />
              랜덤 데이트
            </h1>
            <p className="mt-6 max-w-sm break-keep text-sm leading-7 text-[#2f2927]/55">
              늘 가던 곳 말고 새로운 동네에서 만나보세요. 서울의 모든 행정동 중
              오늘의 데이트 장소를 골라드려요.
            </p>
          </div>

          <div className="mt-12">
            <div className="mb-6 min-h-24">
              {selectedDong ? (
                <div aria-live="polite">
                  <p className="mb-1 text-xs font-bold tracking-[.18em] text-[#e35d68]">
                    TODAY&apos;S PICK
                  </p>
                  <p className="text-4xl font-black tracking-[-.06em]">
                    {selectedDong.properties.emdnm}
                  </p>
                  <p className="mt-2 text-sm text-[#2f2927]/50">
                    서울특별시 {selectedDong.properties.sggnm}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-[#e35d68]">
                    지도 속 동 이름을 누르면 동네 사진을 볼 수 있어요
                  </p>
                </div>
              ) : (
                <p className="pt-6 text-sm text-[#2f2927]/40">
                  버튼을 누르면 오늘의 동네가 나타나요.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={chooseRandomDong}
              disabled={isLoading || dongs.length === 0}
              className="group flex w-full items-center justify-between rounded-2xl bg-[#2f2927] px-6 py-5 text-left text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#e35d68] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span>
                {isLoading
                  ? "서울 지도를 준비하는 중..."
                  : selectedDong
                    ? "다른 동네 뽑기"
                    : "데이트 동네 뽑기"}
              </span>
              <span className="text-xl transition-transform group-hover:rotate-12">♥</span>
            </button>
            {!isLoading && !errorMessage && (
              <p className="mt-3 text-center text-[11px] text-[#2f2927]/35">
                서울 행정동 {dongs.length}곳 중 무작위로 선택해요
              </p>
            )}
            {errorMessage && (
              <p className="mt-3 text-center text-xs text-red-500">{errorMessage}</p>
            )}
          </div>
        </section>

        <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden bg-[#f4f0eb] p-4 sm:p-8">
          <div className="absolute left-6 top-6 z-10 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-[#2f2927]/60 shadow-sm">
            {hoveredDong
              ? `${hoveredDong.properties.sggnm} · ${hoveredDong.properties.emdnm}`
              : "지도에 마우스를 올려 동네를 확인하세요"}
          </div>

          <div className="absolute right-6 top-6 z-10 flex overflow-hidden rounded-xl bg-white/90 shadow-sm">
            <button
              type="button"
              onClick={() => setZoomLevel((level) => Math.min(2.5, level + 0.25))}
              disabled={zoomLevel >= 2.5}
              className="flex h-10 w-10 items-center justify-center border-r border-black/8 text-xl font-bold transition hover:bg-[#ffe5e2] disabled:opacity-30"
              aria-label="지도 확대"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((level) => Math.max(1, level - 0.25))}
              disabled={zoomLevel <= 1}
              className="flex h-10 w-10 items-center justify-center text-xl font-bold transition hover:bg-[#ffe5e2] disabled:opacity-30"
              aria-label="지도 축소"
            >
              −
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-sm font-semibold text-[#2f2927]/45">
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#e35d68]/20 border-t-[#e35d68]" />
              서울 지도를 그리고 있어요
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              className="h-auto w-full max-w-[760px] drop-shadow-[0_12px_25px_rgba(72,57,51,.12)] transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
              role="img"
              aria-label="서울 행정동 지도"
            >
              {dongs.map((dong) => {
                const isSelected = dong.properties.emdcd === selectedDong?.properties.emdcd;
                const isHovered = dong.properties.emdcd === hoveredDong?.properties.emdcd;
                return (
                  <path
                    key={dong.properties.emdcd ?? `${dong.properties.sggnm}-${dong.properties.emdnm}`}
                    d={dong.mapPath}
                    fill={isSelected ? "#e35d68" : isHovered ? "#ffe5e2" : "#fffdf9"}
                    stroke={isSelected ? "#c43f4b" : "#d9d0c8"}
                    strokeWidth={isSelected ? 2.4 : 0.8}
                    className={isSelected ? "animate-pulse" : "transition-colors"}
                    vectorEffect="non-scaling-stroke"
                    onMouseEnter={() => setHoveredDong(dong)}
                    onMouseLeave={() => setHoveredDong(null)}
                  />
                );
              })}

              {selectedDong && (
                <g
                  transform={`translate(${selectedDong.center[0]} ${selectedDong.center[1]})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${selectedDong.properties.emdnm} 사진 보기`}
                  className="cursor-pointer outline-none"
                  onClick={() => setIsPhotoPopupOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setIsPhotoPopupOpen(true);
                    }
                  }}
                >
                  <circle r="24" fill="#e35d68" opacity=".28" className="animate-ping" />
                  <circle r="8" fill="#fff" stroke="#e35d68" strokeWidth="4" />
                  <g transform="translate(15 -35)">
                    <rect x="-8" y="-23" width="144" height="42" rx="21" fill="#2f2927" />
                    <text x="64" y="3" fill="white" fontSize="14" fontWeight="800" textAnchor="middle">
                      {selectedDong.properties.emdnm}
                    </text>
                  </g>
                </g>
              )}
            </svg>
          )}

          {selectedDong && isPhotoPopupOpen && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#2f2927]/35 p-5 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="photo-popup-title"
              onClick={() => setIsPhotoPopupOpen(false)}
            >
              <div
                className="w-full max-w-lg overflow-hidden rounded-[1.75rem] bg-[#fffdf9] shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="h-72 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=1200&q=85')",
                  }}
                  role="img"
                  aria-label={`${selectedDong.properties.emdnm} 분위기 사진`}
                />
                <div className="flex items-center justify-between gap-4 p-6">
                  <div>
                    <p className="text-[10px] font-bold tracking-[.18em] text-[#e35d68]">
                      TODAY&apos;S NEIGHBORHOOD
                    </p>
                    <h2 id="photo-popup-title" className="mt-1 text-2xl font-black tracking-[-.05em]">
                      {selectedDong.properties.sggnm} {selectedDong.properties.emdnm}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoPopupOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f2927]/6 text-xl transition hover:bg-[#2f2927] hover:text-white"
                    aria-label="사진 팝업 닫기"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 right-6 text-right text-[10px] leading-4 text-[#2f2927]/35">
            행정동 경계 기준 · 2026.07 · {Math.round(zoomLevel * 100)}%
          </div>
        </section>
      </div>
    </main>
  );
}
