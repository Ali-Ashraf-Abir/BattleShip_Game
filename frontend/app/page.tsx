import ApiBaseBar from "@/components/ApiBaseBar";
import UserPanel from "@/components/UserPanel";
import GamePanel from "@/components/GamePanel";
import ReadyUpPanel from "@/components/ReadyUpPanel";
import RequestLogPanel from "@/components/RequestLogPanel";
import SharedDatalists from "@/components/SharedDatalists";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚢</span>
            <h1 className="text-lg font-semibold tracking-tight text-slate-100">
              Battleship API Console
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            A test harness for the Battleship backend — create players, stand up
            games, place fleets, and watch every request go out.
          </p>
        </header>

        <ApiBaseBar />
        <SharedDatalists />

        <UserPanel />
        <GamePanel />
        <ReadyUpPanel />
        <RequestLogPanel />

        <footer className="pb-6 text-center text-xs text-slate-600">
          No attack / fire endpoint exists on the backend yet — once one is added,
          a panel for it can be wired in the same way as the others.
        </footer>
      </div>
    </main>
  );
}
