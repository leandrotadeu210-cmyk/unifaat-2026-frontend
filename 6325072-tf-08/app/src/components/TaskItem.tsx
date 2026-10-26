import type { Task } from "../types";

type Props = {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  const handleToggle = () => {
    onToggle(task.id);
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "#fff",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <input
        type="checkbox"
        checked={task.isDone}
        onChange={handleToggle}
        style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
      />
      <span
        style={{
          flex: 1,
          fontSize: "1rem",
          color: task.isDone ? "#94a3b8" : "#1e293b",
          textDecoration: task.isDone ? "line-through" : "none",
        }}
      >
        {task.name}
      </span>
      <button
        onClick={handleDelete}
        style={{
          padding: "0.3rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid #fca5a5",
          background: "#fff",
          color: "#ef4444",
          fontWeight: 600,
          fontSize: "0.85rem",
        }}
      >
        Excluir
      </button>
    </li>
  );
}
