const subwayLines = [
  { number: "1", color: "#0052a4", path: "M70 190 H230 L300 260 H430 L510 340 H730 L820 430 H1015" },
  { number: "2", color: "#00a84d", path: "M260 230 C175 280 170 500 270 555 C390 620 690 605 805 525 C900 455 870 275 760 230 C640 180 385 180 260 230 Z" },
  { number: "3", color: "#ef7c1c", path: "M270 80 L340 180 L390 300 L520 430 L650 565 L725 650" },
  { number: "4", color: "#00a5de", path: "M450 55 L465 180 L500 285 L540 400 L620 485 L700 575" },
  { number: "5", color: "#996cac", path: "M60 360 H225 L350 330 H510 L640 365 H830 L1020 330" },
  { number: "6", color: "#cd7c2f", path: "M190 130 L290 205 L385 275 L470 350 L610 390 L760 360 L910 270" },
  { number: "7", color: "#747f00", path: "M170 45 L215 170 L250 300 L315 425 L430 530 L610 610 L880 635" },
  { number: "8", color: "#e6186c", path: "M635 180 L650 275 L680 360 L745 430 L850 515 L990 555" },
  { number: "9", color: "#bdb092", path: "M75 480 L220 455 L360 475 L520 500 L700 470 L850 390 L1015 380" },
];

const stations = [
  { name: "서울역", x: 430, y: 340, lines: ["1", "4"] },
  { name: "시청", x: 390, y: 300, lines: ["1", "2"] },
  { name: "종로3가", x: 510, y: 330, lines: ["1", "3", "5"] },
  { name: "동대문", x: 540, y: 400, lines: ["1", "4"] },
  { name: "신도림", x: 220, y: 455, lines: ["1", "2"] },
  { name: "홍대입구", x: 270, y: 300, lines: ["2"] },
  { name: "을지로3가", x: 500, y: 285, lines: ["2", "3"] },
  { name: "왕십리", x: 640, y: 365, lines: ["2", "5"] },
  { name: "잠실", x: 805, y: 525, lines: ["2", "8"] },
  { name: "강남", x: 620, y: 565, lines: ["2"] },
  { name: "교대", x: 520, y: 530, lines: ["2", "3"] },
  { name: "고속터미널", x: 430, y: 530, lines: ["3", "7", "9"] },
  { name: "충무로", x: 520, y: 350, lines: ["3", "4"] },
  { name: "삼각지", x: 470, y: 430, lines: ["4", "6"] },
  { name: "여의도", x: 315, y: 425, lines: ["5", "9"] },
  { name: "공덕", x: 350, y: 330, lines: ["5", "6"] },
  { name: "청구", x: 610, y: 390, lines: ["5", "6"] },
  { name: "태릉입구", x: 760, y: 230, lines: ["6", "7"] },
  { name: "건대입구", x: 760, y: 360, lines: ["2", "7"] },
  { name: "가락시장", x: 850, y: 515, lines: ["3", "8"] },
  { name: "석촌", x: 850, y: 390, lines: ["8", "9"] },
  { name: "김포공항", x: 75, y: 480, lines: ["5", "9"] },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e8e4da] px-4 py-5 text-[#20201e] sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(62,61,56,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(62,61,56,.08)_1px,transparent_1px)] [background-size:28px_28px]" />

      <section className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1500px] flex-col rounded-[2rem] border border-black/10 bg-[#f7f4ec]/95 p-5 shadow-[0_25px_80px_rgba(55,51,43,.16)] sm:min-h-[calc(100vh-3.5rem)] sm:p-8">
        <header className="flex flex-col gap-5 border-b border-black/15 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[.28em] text-black/45">
              <span className="h-2 w-2 rounded-full bg-[#00a84d]" />
              METROPOLITAN TRANSIT
            </div>
            <h1 className="text-4xl font-black tracking-[-.07em] sm:text-6xl">
              서울 지하철
              <span className="ml-3 align-top text-sm font-medium tracking-normal text-black/40">
                노선도
              </span>
            </h1>
          </div>
          <p className="max-w-xs text-xs leading-5 text-black/50">
            서울을 가로지르는 아홉 개의 길.
            <br />
            주요 환승역을 중심으로 단순화한 안내도입니다.
          </p>
        </header>

        <div className="relative flex flex-1 items-center">
          <div className="w-full overflow-x-auto py-5">
            <svg
              viewBox="0 0 1080 700"
              className="mx-auto min-w-[850px] max-w-[1250px]"
              aria-label="서울 지하철 노선도"
              role="img"
            >
              <defs>
                <filter id="mapShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity=".16" />
                </filter>
              </defs>

              <path
                d="M-40 405 C130 350 250 390 370 420 C505 455 600 445 735 410 C870 375 940 410 1120 350"
                fill="none"
                stroke="#c9e6ed"
                strokeWidth="42"
                opacity=".8"
              />
              <text x="900" y="440" fill="#82b6c3" fontSize="13" fontWeight="700" letterSpacing="4">
                한 강 · HAN RIVER
              </text>

              {subwayLines.map((line) => (
                <g key={line.number}>
                  <path
                    d={line.path}
                    fill="none"
                    stroke="#f7f4ec"
                    strokeWidth="17"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={line.path}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#mapShadow)"
                  />
                </g>
              ))}

              {stations.map((station) => (
                <g key={station.name} transform={`translate(${station.x} ${station.y})`}>
                  <circle r={station.lines.length > 1 ? 8 : 6} fill="#f7f4ec" stroke="#272724" strokeWidth="3" />
                  <text
                    x="13"
                    y="-10"
                    fill="#272724"
                    fontSize="13"
                    fontWeight={station.lines.length > 1 ? "800" : "600"}
                    paintOrder="stroke"
                    stroke="#f7f4ec"
                    strokeWidth="5"
                    strokeLinejoin="round"
                  >
                    {station.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-black/15 pt-5">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {subwayLines.map((line) => (
              <div key={line.number} className="flex items-center gap-1.5 text-[11px] font-bold text-black/55">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white"
                  style={{ backgroundColor: line.color }}
                >
                  {line.number}
                </span>
                호선
              </div>
            ))}
          </div>
          <div className="text-right text-[10px] font-semibold tracking-[.2em] text-black/35">
            KOREA
          </div>
        </footer>
      </section>
    </main>
  );
}
