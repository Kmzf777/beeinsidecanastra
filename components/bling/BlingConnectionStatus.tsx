"use client";

import { useEffect, useState } from "react";

type Props = {
  account: 1 | 2;
};

type StatusResponse = {
  connected: boolean;
  lastUpdated: string | null;
};

export function BlingConnectionStatus({ account }: Props) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/auth/bling/status?account=${account}`)
      .then((res) => res.json())
      .then((data: StatusResponse) => setStatus(data))
      .catch(() => setStatus({ connected: false, lastUpdated: null }))
      .finally(() => setLoading(false));
  }, [account]);

  if (loading) {
    return (
      <span className="text-sm text-zinc-400">Verificando conexão...</span>
    );
  }

  if (!status?.connected) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
        <span className="h-2 w-2 rounded-full bg-zinc-300" />
        Não conectado
      </span>
    );
  }

  const lastUpdatedText = status.lastUpdated
    ? new Date(status.lastUpdated).toLocaleString("pt-BR")
    : null;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" />
      Conectado ✓
      {lastUpdatedText && (
        <span className="text-zinc-400">· renovado {lastUpdatedText}</span>
      )}
    </span>
  );
}
