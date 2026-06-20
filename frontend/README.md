# Battleship API Console

A Next.js + Tailwind frontend built purely as a **test harness** for the
Battleship .NET backend. It's not a polished game UI — it's a console for
exercising every endpoint, watching exact request/response payloads, and
quickly placing ships on a visual grid instead of hand-writing JSON.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pointing it at your backend

The **Target** field at the top of the page sets the backend base URL
(defaults to `http://localhost:5000`, saved in `localStorage`). Change it any
time without restarting anything.

## ⚠️ CORS

Your ASP.NET backend needs to allow requests from wherever this frontend runs
(e.g. `http://localhost:3000`), or every call will fail with a network error.
In `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ...

app.UseCors("AllowFrontend");
```

## What's wired up

| Endpoint | Panel |
|---|---|
| `POST /api/users` | Create player |
| `POST /api/games` | Host a game |
| `POST /api/games/join` | Join a game |
| `POST /api/ship/ready` | Place ships + ready up |

Every call (success or failure) appears in the **Request log** panel at the
bottom with full request/response bodies, status code, and timing.

### Known gap: no attack endpoint yet

Your backend has an `Attack` model but no `AttackController` / fire-shot
route. There's nothing to wire up yet — once that endpoint exists, add a
`fireShot` method to `lib/api.ts` and a panel following the same pattern as
the others (see `components/ReadyUpPanel.tsx` for the shape to copy).

### Things worth knowing about the current backend, surfaced while building this

- `JoinGameDto` uses lowercase `playerId`/`gameId` property names (rest of the
  codebase uses PascalCase, which System.Text.Json serializes to camelCase on
  the wire anyway) — both happen to line up as camelCase JSON, so no special
  handling was needed, but it's an inconsistency worth knowing about.
- There's a typo'd namespace `bakcend.Enums` (vs `backend.Enums`) used in
  `AddShipDto.cs`, `ShipPlacementDto.cs`, and `Ship.cs`. Doesn't affect the
  frontend, just flagging it.
- Controllers return raw strings via `BadRequest(ex.Message)` rather than a
  structured JSON error — the log panel handles both shapes, but if you
  later standardize on `ProblemDetails` or similar, no frontend changes are
  needed since the log just prints whatever comes back.
- `ShipService.ReadyUpAsync` has a dev-only fallback that creates a
  `GameState` in memory if one isn't found (with a comment marking it for
  removal in production) — useful to know if a game's state behaves
  differently after a backend restart, since in-memory `GameStateManager`
  state doesn't survive one but the DB-persisted `Game`/`Ship` rows do.

## Structure

```
app/page.tsx              Page layout, assembles all panels
components/
  ApiBaseBar.tsx           Backend URL config
  UserPanel.tsx             POST /api/users
  GamePanel.tsx             POST /api/games, POST /api/games/join
  ShipPlacementGrid.tsx     Interactive grid: click-to-place, drag orientation, randomize
  ReadyUpPanel.tsx          POST /api/ship/ready, wraps the grid
  RequestLogPanel.tsx       Live log of every request/response
  SharedDatalists.tsx       <datalist> autocomplete for player/game IDs across panels
  ui.tsx                    Shared primitives (Panel, Field, buttons, copy-id chip)
lib/
  api.ts                    fetch wrapper + typed endpoint calls + request log store
  session.ts                In-browser memory of users/games created this session
types/api.ts                 TS types mirroring the backend DTOs/models/enums
```

## Notes on assumptions made

- `ShipType` enum values: `Carrier=0, Battleship=1, Cruiser=2, Submarine=3, Destroyer=4`
  (confirmed default declaration order).
- `GameStatus` enum: only `WaitingForPlayer`, `PlacingShips`, `InProgress` are
  referenced in the backend code shown; if there's a `Finished`/`Cancelled`
  member, add it to `GAME_STATUS_LABELS` in `types/api.ts` — unrecognized
  values still render fine (they show as `status N`).
