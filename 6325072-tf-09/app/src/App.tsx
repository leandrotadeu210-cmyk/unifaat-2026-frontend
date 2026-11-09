import { useState, useEffect } from "react";
import type { User } from "./types";
import UserList from "./components/UserList";
import UserTasks from "./components/UserTasks";

export default function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Restaura o título padrão quando nenhum usuário está selecionado
  useEffect(() => {
    if (selectedUser !== null) return;
    document.title = "Usuários e Tarefas";
  }, [selectedUser]);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <div className="app">
      <UserList selectedUser={selectedUser} onSelectUser={handleSelectUser} />

      {selectedUser === null && (
        <div className="panel panel-tasks">
          <div className="placeholder">← Escolha um usuário para ver as tarefas</div>
        </div>
      )}

      {selectedUser !== null && (
        // key={selectedUser.id} garante que o componente é desmontado/remontado
        // ao trocar de usuário, evitando mostrar dados do usuário anterior
        <UserTasks key={selectedUser.id} user={selectedUser} />
      )}
    </div>
  );
}
