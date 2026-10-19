import { userSearchApi } from "../api/userSearchApi";
import { taskCreateApi } from "../api/taskCreateApi";
import userSearchResultsRender from "../render/userSearchResultsRender";
import tasksListRender from "../render/tasksListRender";
import type { User, UserSearchFilters } from "../types/api";

/** Acessa o Bootstrap Modal a partir do bundle global exposto pelo Vite. */
function getBootstrapModal(el: HTMLElement): { hide(): void } | null {
  // O bootstrap.bundle é importado como side-effect em app.ts e expõe
  // window.bootstrap quando compilado pelo Vite com o bundle ESM.
  const bs = (window as Window & { bootstrap?: { Modal: { getInstance(el: HTMLElement): { hide(): void } | null } } }).bootstrap;
  return bs?.Modal.getInstance(el) ?? null;
}

/** Campos de busca disponíveis no select do modal. */
type SearchField = keyof UserSearchFilters;

/**
 * Registra todos os listeners do modal #assign-task-modal.
 * Deve ser chamado uma única vez, após o DOMContentLoaded.
 */
export default function assignTaskModalListeners(currentUserId: number): void {
  const modal = document.querySelector<HTMLElement>("#assign-task-modal");
  if (!modal) return;

  const taskNameInput = document.querySelector<HTMLInputElement>("#assign-task-name");
  const searchFieldSelect = document.querySelector<HTMLSelectElement>("#assign-search-field");
  const searchValueInput = document.querySelector<HTMLInputElement>("#assign-search-value");
  const searchBtn = document.querySelector<HTMLButtonElement>("#assign-search-btn");
  const resultsContainer = document.querySelector<HTMLElement>("#assign-search-results");
  const selectedUserDisplay = document.querySelector<HTMLElement>("#assign-selected-user");
  const submitBtn = document.querySelector<HTMLButtonElement>("#assign-task-submit");
  const errorDisplay = document.querySelector<HTMLElement>("#assign-modal-error");

  // Estado local do modal
  let selectedUser: User | null = null;

  // ── Helpers ──────────────────────────────────────────────

  function setError(message: string): void {
    if (!errorDisplay) return;
    errorDisplay.textContent = message;
    errorDisplay.classList.remove("d-none");
  }

  function clearError(): void {
    if (!errorDisplay) return;
    errorDisplay.textContent = "";
    errorDisplay.classList.add("d-none");
  }

  function resetModal(): void {
    if (taskNameInput) taskNameInput.value = "";
    if (searchValueInput) searchValueInput.value = "";
    if (resultsContainer) resultsContainer.innerHTML = "";
    if (selectedUserDisplay) {
      selectedUserDisplay.textContent = "";
      selectedUserDisplay.classList.add("d-none");
    }
    selectedUser = null;
    clearError();
  }

  function showSelectedUser(user: User): void {
    if (!selectedUserDisplay) return;
    selectedUserDisplay.textContent = `Atribuir para: ${user.name} (${user.email})`;
    selectedUserDisplay.classList.remove("d-none");
  }

  // ── Busca ─────────────────────────────────────────────────

  async function handleSearch(): Promise<void> {
    if (!searchFieldSelect || !searchValueInput || !resultsContainer) return;

    const field = searchFieldSelect.value as SearchField;
    const value = searchValueInput.value.trim();

    if (!value) {
      if (resultsContainer) {
        resultsContainer.innerHTML =
          '<p class="text-warning small">Digite um valor para buscar.</p>';
      }
      return;
    }

    clearError();

    const filters: UserSearchFilters = { [field]: value };

    try {
      const result = await userSearchApi(filters, 1, 10);
      userSearchResultsRender(resultsContainer, result.data, result.total);
    } catch {
      resultsContainer.innerHTML =
        '<p class="text-danger small">Erro ao buscar usuários. Tente novamente.</p>';
    }
  }

  searchBtn?.addEventListener("click", handleSearch);

  // Permite buscar pressionando Enter no campo de texto
  searchValueInput?.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    handleSearch();
  });

  // ── Escolher usuário (evento disparado pelo render) ───────

  resultsContainer?.addEventListener("user:selected", (e: Event) => {
    const user = (e as CustomEvent<User>).detail;
    selectedUser = user;
    showSelectedUser(user);
  });

  // ── Criar tarefa ──────────────────────────────────────────

  submitBtn?.addEventListener("click", async () => {
    const taskName = taskNameInput?.value.trim() ?? "";

    if (!taskName) {
      setError("Digite o nome da tarefa.");
      return;
    }

    if (!selectedUser) {
      setError("Escolha um usuário para atribuir a tarefa.");
      return;
    }

    clearError();

    try {
      await taskCreateApi(selectedUser.id, { name: taskName });

      // Fecha o modal via API do Bootstrap
      getBootstrapModal(modal)?.hide();

      resetModal();

      const successAlert = document.querySelector<HTMLElement>("#assign-task-success");
      if (successAlert) {
        successAlert.textContent = `Tarefa "${taskName}" criada para ${selectedUser.name}!`;
        successAlert.classList.remove("d-none");
        setTimeout(() => successAlert.classList.add("d-none"), 4000);
      }

      // Se atribuída ao próprio usuário logado, recarrega a lista
      if (selectedUser.id === currentUserId) {
        await tasksListRender(currentUserId);
      }
    } catch {
      setError("Erro ao criar tarefa. Verifique os dados e tente novamente.");
    }
  });

  // Limpa o modal quando for fechado (evento do Bootstrap)
  modal.addEventListener("hidden.bs.modal", resetModal);
}
