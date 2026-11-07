import { useCallback, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Trophy, Trash2, RotateCw } from "lucide-react";
import { RaffleWheel, type RaffleWheelHandle } from "@/components/RaffleWheel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MAX_ENTRIES, parseEntries, removeEntryAt } from "@/lib/raffle";

const SAMPLE = ["Amara", "Tunde", "Chioma", "Ibrahim", "Ngozi", "Seyi", "Fatima", "Emeka"].join("\n");

type Win = { id: number; name: string; at: string };

export default function App() {
  const [text, setText] = useState(SAMPLE);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<{ index: number; name: string } | null>(null);
  const [history, setHistory] = useState<Win[]>([]);
  const wheel = useRef<RaffleWheelHandle>(null);

  const entries = useMemo(() => parseEntries(text), [text]);
  const canSpin = entries.length >= 2 && !spinning;

  const onResult = useCallback(
    (index: number) => {
      const name = entries[index];
      setSpinning(false);
      setWinner({ index, name });
      setHistory((h) => [{ id: Date.now(), name, at: new Date().toLocaleTimeString() }, ...h]);
      const fire = (origin: number) =>
        confetti({ particleCount: 90, spread: 80, startVelocity: 45, origin: { x: origin, y: 0.7 } });
      fire(0.25);
      fire(0.75);
    },
    [entries],
  );

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_380px]">
      <section>
        <h1 className="mb-2 text-center font-display text-5xl tracking-wide text-accent drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] sm:text-6xl">
          Raffle Wheel
        </h1>
        <RaffleWheel
          ref={wheel}
          entries={entries}
          disabled={!canSpin && !spinning}
          onSpinStart={() => setSpinning(true)}
          onResult={onResult}
        />
      </section>

      <aside className="space-y-5 rounded-xl bg-card p-5 text-card-foreground shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="entries">Entries (one per line)</Label>
            <Badge>
              {entries.length} / {MAX_ENTRIES}
            </Badge>
          </div>
          <Textarea
            id="entries"
            rows={9}
            value={text}
            disabled={spinning}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Type or paste names.\nOne entry per line."}
          />
          {entries.length < 2 && (
            <p className="text-sm text-destructive">Add at least 2 entries to spin.</p>
          )}
        </div>

        <Button size="lg" className="w-full" disabled={!canSpin} onClick={() => wheel.current?.spin()}>
          <RotateCw className={spinning ? "animate-spin" : ""} />
          {spinning ? "Spinning…" : "Spin the wheel"}
        </Button>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Winners</Label>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                <Trash2 /> Clear
              </Button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No winners yet. Spin to draw the first one.</p>
          ) : (
            <ol className="max-h-48 space-y-1 overflow-auto pr-1">
              {history.map((w, i) => (
                <li key={w.id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 font-bold">
                    <Trophy className="size-4 text-primary" />
                    {w.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {history.length - i} · {w.at}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>

      <Dialog open={!!winner} onOpenChange={(o) => !o && setWinner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>We have a winner</DialogTitle>
            <DialogDescription>The wheel has stopped on:</DialogDescription>
          </DialogHeader>
          <p className="break-words py-4 text-center font-display text-5xl text-primary">{winner?.name}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWinner(null)}>
              Keep on wheel
            </Button>
            <Button
              onClick={() => {
                if (winner) setText((t) => removeEntryAt(t, winner.index));
                setWinner(null);
              }}
            >
              Remove from wheel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
