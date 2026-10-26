import { useState } from "react";

type Props = {
  onAdd: (name: string) => void;
};

export default function TaskForm({ onAdd }: Props) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    handleAdd();
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nova task..."
        style={{
          flex: 1,
          padding: "0.5rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid #cbd5e1",
          fontSize: "1rem",
        }}
      />
      <button
        onClick={handleAdd}
        style={{
          padding: "0.5rem 1.25rem",
          borderRadius: "6px",
          border: "none",
          background: "#3b82f6",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1rem",
        }}
      >
        Adicionar
      </button>
    </div>
  );
}
