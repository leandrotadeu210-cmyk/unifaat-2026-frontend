import { useState, useEffect } from "react";
import axios from "axios";
import clientApi from "../api/clientApi";

interface UseAxiosResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook genérico que faz GET via clientApi.
 * - url === null: fica parado (sem requisição)
 * - AbortController cancela a requisição anterior na limpeza do efeito
 * - refetch() incrementa `attempt`, fazendo o efeito rodar de novo
 */
export default function useAxios<T>(url: string | null): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (url === null) return;

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const response = await clientApi.get<T>(url as string, {
          signal: controller.signal,
        });
        setData(response.data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        const message =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      controller.abort();
    };
    // dependências primitivas: url (string) e attempt (number)
  }, [url, attempt]);

  const refetch = () => {
    setAttempt((current) => current + 1);
  };

  return { data, error, isLoading, refetch };
}
