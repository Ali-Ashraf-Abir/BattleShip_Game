"use client";

import { useSessionUsers, useSessionGames } from "@/lib/session";

// Rendered once at the page level so any input across panels can reference
// list="known-users" / list="known-games" for autocomplete of IDs created
// earlier in the session.
export default function SharedDatalists() {
  const { users } = useSessionUsers();
  const { games } = useSessionGames();

  return (
    <>
      <datalist id="known-users">
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.displayName}
          </option>
        ))}
      </datalist>
      <datalist id="known-games">
        {games.map((g) => (
          <option key={g.id} value={g.id} />
        ))}
      </datalist>
    </>
  );
}
