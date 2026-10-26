import { useState } from "react";
import type { Task, Filter } from "./types";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const pendingCount = tasks.filter((t) => !t.isDone).length;

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.isDone;
    if (filter === "done") return t.isDone;
    return true;
  });

  const handleAdd = (name: string) => {
    const newTask: Task = {
      id: Date.now(),
      name,
      isDone: false,
    };
    setTasks((current) => [...current, newTask]);
  };

  const handleToggle = (id: number) => {
    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    );
  };

  const handleDelete = (id: number) => {
    setTasks((current) => current.filter((t) => t.id !== id));
  };

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
  };

  return (
    <div>
      <h1>To-Do List</h1>

      <TaskForm onAdd={handleAdd} />

      <div style={{ margin: "1rem 0", display: "flex", gap: "0.5rem" }}>
        {(["all", "pending", "done"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              border: "1px solid #94a3b8",
              background: filter === f ? "#3b82f6" : "#fff",
              color: filter === f ? "#fff" : "#334155",
              fontWeight: filter === f ? 600 : 400,
            }}
          >
            {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : "Feitas"}
          </button>
        ))}
      </div>

      <p style={{ marginBottom: "0.75rem", color: "#64748b", fontSize: "0.9rem" }}>
        {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
      </p>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}
