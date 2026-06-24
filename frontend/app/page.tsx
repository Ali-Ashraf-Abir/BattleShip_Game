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
            <h1 className="text-lg font-semibold tracking-tight text-slate-100">
              Battleship API Console
            </h1>
          </div>

        </header>


        <SharedDatalists />

        <UserPanel />
 

      
      </div>
    </main>
  );
}
