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

type Cafe = {
  id: number;
  name: string;
  detail: string;
  mapPoint: [number, number];
};

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
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

function geometryBounds(geometry: MapGeometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const points = polygons.flatMap((polygon) => polygon.flat());
  return {
    south: Math.min(...points.map((point) => point[1])),
    west: Math.min(...points.map((point) => point[0])),
    north: Math.max(...points.map((point) => point[1])),
    east: Math.max(...points.map((point) => point[0])),
  };
}

function isPointInRing(point: [number, number], ring: number[][]) {
  let isInside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentX, currentY] = ring[current];
    const [previousX, previousY] = ring[previous];
    const crossesEdge =
      currentY > point[1] !== previousY > point[1] &&
      point[0] < ((previousX - currentX) * (point[1] - currentY)) / (previousY - currentY) + currentX;
    if (crossesEdge) isInside = !isInside;
  }
  return isInside;
}

function isPointInGeometry(point: [number, number], geometry: MapGeometry) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(
    (polygon) =>
      isPointInRing(point, polygon[0]) &&
      !polygon.slice(1).some((hole) => isPointInRing(point, hole)),
  );
}

function cafeScore(tags: Record<string, string>) {
  return (
    Number(Boolean(tags.website || tags["contact:website"])) * 3 +
    Number(Boolean(tags.instagram || tags["contact:instagram"])) * 2 +
    Number(Boolean(tags.opening_hours)) * 2 +
    Number(Boolean(tags.brand)) +
    Number(Boolean(tags["addr:street"]))
  );
}

export default function Home() {
  const [dongs, setDongs] = useState<SeoulDong[]>([]);
  const [selectedDong, setSelectedDong] = useState<SeoulDong | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCafePopupOpen, setIsCafePopupOpen] = useState(false);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [isCafeLoading, setIsCafeLoading] = useState(false);
  const [cafeError, setCafeError] = useState("");

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

  useEffect(() => {
    if (!selectedDong || !isCafePopupOpen) return;
    const abortController = new AbortController();

    async function loadCafes() {
      setCafes([]);
      setCafeError("");
      setIsCafeLoading(true);

      try {
        const bounds = geometryBounds(selectedDong!.geometry);
        const boundingBox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
        const query = `[out:json][timeout:20];(node["amenity"="cafe"]["name"](${boundingBox});way["amenity"="cafe"]["name"](${boundingBox});relation["amenity"="cafe"]["name"](${boundingBox}););out center tags;`;
        const response = await fetch(
          `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
          { signal: abortController.signal },
        );
        if (!response.ok) throw new Error("Cafe request failed");

        const data = (await response.json()) as { elements: OverpassElement[] };
        const cafeCandidates = data.elements
          .map((element) => {
            const longitude = element.lon ?? element.center?.lon;
            const latitude = element.lat ?? element.center?.lat;
            if (
              longitude === undefined ||
              latitude === undefined ||
              !element.tags?.name ||
              !isPointInGeometry([longitude, latitude], selectedDong!.geometry)
            ) {
              return null;
            }
            return {
              id: element.id,
              name: element.tags.name,
              detail:
                element.tags["addr:street"] ??
                element.tags.cuisine?.replaceAll(";", " · ") ??
                "카페 · 커피",
              mapPoint: projectPoint([longitude, latitude]),
              score: cafeScore(element.tags),
            };
          })
          .filter((cafe): cafe is Cafe & { score: number } => cafe !== null)
          .sort((firstCafe, secondCafe) => secondCafe.score - firstCafe.score)
          .slice(0, 5);

        setCafes(
          cafeCandidates.map((cafe) => ({
            id: cafe.id,
            name: cafe.name,
            detail: cafe.detail,
            mapPoint: cafe.mapPoint,
          })),
        );
        if (cafeCandidates.length === 0) {
          setCafeError("이 동네에는 등록된 카페 정보가 아직 없어요.");
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setCafeError("카페 정보를 불러오지 못했어요.");
        }
      } finally {
        if (!abortController.signal.aborted) setIsCafeLoading(false);
      }
    }

    loadCafes();
    return () => abortController.abort();
  }, [selectedDong, isCafePopupOpen]);

  function chooseRandomDong() {
    if (dongs.length === 0) return;
    let nextDong = dongs[Math.floor(Math.random() * dongs.length)];
    if (dongs.length > 1 && nextDong.properties.emdcd === selectedDong?.properties.emdcd) {
      nextDong = dongs[(dongs.indexOf(nextDong) + 1) % dongs.length];
    }
    setIsCafePopupOpen(false);
    setSelectedDong(nextDong);
  }

  function selectDong(dong: SeoulDong) {
    setIsCafePopupOpen(false);
    setSelectedDong(dong);
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
                    지도 속 동 이름을 누르면 카페를 볼 수 있어요 →
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
          <div className="absolute left-6 top-6 z-10 rounded-full bg-white/80 px-4 py-2 text-[10px] font-bold tracking-[.18em] text-[#2f2927]/45 shadow-sm">
            지도 면을 클릭해 동네를 선택하세요
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-sm font-semibold text-[#2f2927]/45">
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#e35d68]/20 border-t-[#e35d68]" />
              서울 지도를 그리고 있어요
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              className="h-auto w-full max-w-[760px] drop-shadow-[0_12px_25px_rgba(72,57,51,.12)]"
              role="img"
              aria-label="서울 행정동 지도"
            >
              {dongs.map((dong) => {
                const isSelected = dong.properties.emdcd === selectedDong?.properties.emdcd;
                return (
                  <path
                    key={dong.properties.emdcd ?? `${dong.properties.sggnm}-${dong.properties.emdnm}`}
                    d={dong.mapPath}
                    fill={isSelected ? "#e35d68" : "#fffdf9"}
                    stroke={isSelected ? "#c43f4b" : "#d9d0c8"}
                    strokeWidth={isSelected ? 2.4 : 0.8}
                    className={
                      isSelected
                        ? "cursor-pointer animate-pulse"
                        : "cursor-pointer transition-colors hover:fill-[#ffe5e2]"
                    }
                    vectorEffect="non-scaling-stroke"
                    onClick={() => selectDong(dong)}
                  >
                    <title>{`${dong.properties.sggnm} ${dong.properties.emdnm}`}</title>
                  </path>
                );
              })}

              {selectedDong &&
                isCafePopupOpen &&
                cafes.map((cafe, index) => (
                  <g key={cafe.id}>
                    <line
                      x1={selectedDong.center[0]}
                      y1={selectedDong.center[1]}
                      x2={cafe.mapPoint[0]}
                      y2={cafe.mapPoint[1]}
                      stroke="#e35d68"
                      strokeWidth="1.5"
                      strokeDasharray="5 5"
                      opacity=".65"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={cafe.mapPoint[0]}
                      cy={cafe.mapPoint[1]}
                      r="10"
                      fill="#2f2927"
                      stroke="#fff"
                      strokeWidth="3"
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={cafe.mapPoint[0]}
                      y={cafe.mapPoint[1] + 3.5}
                      fill="#fff"
                      fontSize="9"
                      fontWeight="900"
                      textAnchor="middle"
                    >
                      {index + 1}
                    </text>
                  </g>
                ))}

              {selectedDong && (
                <g
                  transform={`translate(${selectedDong.center[0]} ${selectedDong.center[1]})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${selectedDong.properties.emdnm} 카페 보기`}
                  className="cursor-pointer outline-none"
                  onClick={() => setIsCafePopupOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      setIsCafePopupOpen(true);
                    }
                  }}
                >
                  <circle r="24" fill="#e35d68" opacity=".28" className="animate-ping" />
                  <circle r="8" fill="#fff" stroke="#e35d68" strokeWidth="4" />
                  <g transform="translate(15 -35)">
                    <rect x="-8" y="-23" width="144" height="42" rx="21" fill="#2f2927" />
                    <text x="64" y="3" fill="white" fontSize="14" fontWeight="800" textAnchor="middle">
                      {selectedDong.properties.emdnm} ↗
                    </text>
                  </g>
                </g>
              )}
            </svg>
          )}

          {selectedDong && isCafePopupOpen && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#2f2927]/30 p-5 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cafe-popup-title"
              onClick={() => setIsCafePopupOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-[1.75rem] bg-[#fffdf9] p-6 shadow-2xl sm:p-8"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-[10px] font-bold tracking-[.18em] text-[#e35d68]">
                      CAFE PICKS
                    </p>
                    <h2 id="cafe-popup-title" className="text-2xl font-black tracking-[-.05em]">
                      {selectedDong.properties.emdnm} 카페
                    </h2>
                    <p className="mt-1 text-xs text-[#2f2927]/40">
                      지도 등록 정보가 풍부한 순서예요
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCafePopupOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2f2927]/6 text-lg transition hover:bg-[#2f2927] hover:text-white"
                    aria-label="카페 팝업 닫기"
                  >
                    ×
                  </button>
                </div>

                {isCafeLoading ? (
                  <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-xs text-[#2f2927]/40">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#e35d68]/20 border-t-[#e35d68]" />
                    동네 카페를 찾고 있어요
                  </div>
                ) : cafes.length > 0 ? (
                  <ol className="divide-y divide-[#2f2927]/8 border-y border-[#2f2927]/8">
                    {cafes.map((cafe, index) => (
                      <li key={cafe.id}>
                        <a
                          href={`https://map.naver.com/p/search/${encodeURIComponent(`${selectedDong.properties.emdnm} ${cafe.name}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 py-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffe5e2] text-[10px] font-black text-[#e35d68]">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold group-hover:text-[#e35d68]">
                              {cafe.name}
                            </span>
                            <span className="block truncate text-[11px] text-[#2f2927]/38">
                              {cafe.detail}
                            </span>
                          </span>
                          <span className="text-[#2f2927]/25 group-hover:text-[#e35d68]">→</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="flex min-h-44 items-center justify-center text-xs text-[#2f2927]/40">
                    {cafeError}
                  </p>
                )}

                <p className="mt-5 text-center text-[10px] text-[#2f2927]/30">
                  카페 정보 © OpenStreetMap contributors
                </p>
              </div>
            </div>
          )}

          <div className="absolute bottom-6 right-6 text-right text-[10px] leading-4 text-[#2f2927]/35">
            행정동 경계 기준 · 2026.07
          </div>
        </section>
      </div>
    </main>
  );
}
