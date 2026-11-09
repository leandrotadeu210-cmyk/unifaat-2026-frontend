import { useState } from "react";
import useAxios from "../hooks/useAxios";
import type { User, PaginatedResponse } from "../types";

type Props = {
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
};

export default function UserList({ selectedUser, onSelectUser }: Props) {
  const [page, setPage] = useState(1);

  const url = `/users?page=${page}&limit=5`;
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(url);

  const handlePrev = () => {
    setPage((current) => current - 1);
  };

  const handleNext = () => {
    setPage((current) => current + 1);
  };

  const handleChoose = (user: User) => {
    onSelectUser(user);
  };

  if (isLoading) {
    return (
      <div className="panel panel-users">
        <h2>Usuários</h2>
        <p className="msg">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel panel-users">
        <h2>Usuários</h2>
        <p className="msg msg-error">{error}</p>
        <button className="btn-retry" onClick={refetch}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="panel panel-users">
      <h2>Usuários</h2>

      {data && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {data.data.map((user) => (
              <button
                key={user.id}
                className={`user-item ${selectedUser?.id === user.id ? "active" : ""}`}
                onClick={() => handleChoose(user)}
              >
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                {user.job_title && (
                  <div className="user-email">{user.job_title}</div>
                )}
              </button>
            ))}
          </div>

          <div className="pagination">
            <button onClick={handlePrev} disabled={page === 1}>
              Anterior
            </button>
            <span>Página {page}</span>
            <button onClick={handleNext} disabled={data.next === null}>
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}
