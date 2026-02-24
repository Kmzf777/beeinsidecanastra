"use client";

import { useSearchParams } from "next/navigation";

const ERROR_LABELS: Record<string, string> = {
  access_denied: "Autorização negada pelo usuário.",
  token_exchange_failed: "Falha ao trocar o código de autorização por token.",
  invalid_grant: "Token inválido ou expirado. Reconecte a conta.",
  state_mismatch: "Falha de segurança CSRF. Tente novamente.",
  storage_failed: "Erro ao salvar credenciais. Tente novamente.",
  config_error: "Configuração do servidor incompleta. Contate o suporte.",
  invalid_callback: "Retorno de autorização inválido.",
};

export function SettingsErrorMessage() {
  const params = useSearchParams();
  const errorCode = params.get("error");
  const connected = params.get("connected");

  if (connected === "1") {
    return (
      <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 border border-emerald-200">
        Conta Bling conectada com sucesso.
      </div>
    );
  }

  if (!errorCode) return null;

  const message =
    params.get("message") ||
    ERROR_LABELS[errorCode] ||
    "Ocorreu um erro durante a autorização.";

  return (
    <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 border border-red-200">
      {decodeURIComponent(message)}
    </div>
  );
}
