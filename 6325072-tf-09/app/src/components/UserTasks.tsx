import { useState, useRef, useEffect } from "react";
import useAxios from "../hooks/useAxios";
import clientApi from "../api/clientApi";
import type { User, Task, PaginatedResponse } from "../types";

type Props = {
  user: User;
};

export default function UserTasks({ user }: Props) {
  const [filterText, setFilterText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // useRef: foco automático no campo de filtro
  const filterRef = useRef<HTMLInputElement>(null);

  // useRef: contador de respostas recebidas (não renderiza)
  const responseCountRef = useRef(0);

  const url = `/users/${user.id}/tasks?page=1&limit=20`;
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(url);

  // Foco automático ao montar a tela de tarefas
  useEffect(() => {
    filterRef.current?.focus();
  }, []);

  // Incrementa o contador de respostas recebidas (dado de bastidor)
  useEffect(() => {
    if (!data) return;
    responseCountRef.current += 1;
  }, [data]);

  // Sincroniza o título da aba com o usuário e quantidade de tarefas
  useEffect(() => {
    if (!data) {
      document.title = user.name;
      return;
    }
    document.title = `${user.name} · ${data.total} task${data.total !== 1 ? "s" : ""}`;

    return () => {
      document.title = "Usuários e Tarefas";
    };
  }, [user.name, data]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  const handleClear = () => {
    setFilterText("");
    filterRef.current?.focus();
  };

  const handleToggleTask = async (task: Task) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      });
      refetch();
    } catch {
      setSaveError("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowCount = () => {
    console.log(`Respostas recebidas: ${responseCountRef.current}`);
    alert(`Respostas recebidas: ${responseCountRef.current}`);
  };

  const filteredTasks = data
    ? data.data.filter((t) =>
        t.name.toLowerCase().includes(filterText.toLowerCase())
      )
    : [];

  if (isLoading) {
    return (
      <div className="panel panel-tasks">
        <h2>{user.name}</h2>
        <p className="msg">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel panel-tasks">
        <h2>{user.name}</h2>
        <p className="msg msg-error">{error}</p>
        <button className="btn-retry" onClick={refetch}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="panel panel-tasks">
      <h2>
        {user.name}
        {data && (
          <span style={{ fontWeight: 400, color: "#64748b", marginLeft: "0.5rem" }}>
            ({data.total} task{data.total !== 1 ? "s" : ""})
          </span>
        )}
      </h2>

      <div className="filter-row">
        <input
          ref={filterRef}
          type="text"
          value={filterText}
          onChange={handleFilterChange}
          placeholder="Filtrar por nome..."
        />
        <button onClick={handleClear}>Limpar</button>
      </div>

      {isSaving && <span className="saving">Salvando...</span>}
      {saveError && <p className="msg msg-error">{saveError}</p>}

      {data && filteredTasks.length === 0 && (
        <p className="msg">Nenhuma tarefa encontrada.</p>
      )}

      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="task-item"
              onClick={() => handleToggleTask(task)}
            >
              <input
                type="checkbox"
                checked={task.is_done}
                readOnly
                style={{ width: "1rem", height: "1rem" }}
              />
              <span className={`task-name ${task.is_done ? "done" : ""}`}>
                {task.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <button className="debug-btn" onClick={handleShowCount}>
        Mostrar respostas recebidas
      </button>
    </div>
  );
}
