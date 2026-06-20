"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiRequestError } from "@/lib/api";
import { useSessionUsers } from "@/lib/session";
import {
  Panel,
  Field,
  inputClass,
  PrimaryButton,
  CopyableId,
  ErrorText,
} from "@/components/ui";

export default function UserPanel() {
  const router = useRouter();
  const { users, addUser, clearUsers } = useSessionUsers();
  const [name, setName] = useState("Admiral");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (userId) {
      router.replace("/lobby");
    }
  }, [router]);
  async function handleCreate() {
    setLoading(true);
    setError(null);

    try {
      const user = await api.createUser({ name });

      addUser(user);

      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.displayName);

      router.push("/lobby");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Unexpected error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel title="Create player" step="01">
      <div className="flex gap-3">
        <div className="flex-1">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={inputClass}
              placeholder="e.g. Nelson"
            />
          </Field>
        </div>
        <div className="flex items-end">
          <PrimaryButton onClick={handleCreate} loading={loading} disabled={!name.trim()}>
            Create
          </PrimaryButton>
        </div>
      </div>

      <ErrorText message={error} />

      {users.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Players this session
            </span>
            <button
              onClick={clearUsers}
              className="text-xs text-slate-500 hover:text-amber-400"
            >
              Clear
            </button>
          </div>
          <ul className="flex flex-col gap-1.5">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between rounded-md bg-slate-950/50 px-3 py-1.5"
              >
                <span className="text-sm text-slate-200">{u.displayName}</span>
                <CopyableId value={u.id} label="id" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
