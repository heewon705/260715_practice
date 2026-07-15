export default function HeewonPage() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center bg-cover bg-center bg-no-repeat px-6 font-sans"
      style={{ backgroundImage: "url('/forest.jpg')" }}
    >
      <main className="flex flex-col items-center gap-4 rounded-lg bg-black/40 px-8 py-6 text-center backdrop-blur-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Heewon
        </h1>
        <p className="text-lg text-white/90">
          app/heewon 아래에 만든 간단한 페이지입니다.
        </p>
      </main>
    </div>
  );
}
