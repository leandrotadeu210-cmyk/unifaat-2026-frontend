import type { User } from "../types/api";

/**
 * Renderiza a lista de resultados da busca de usuários dentro de
 * #assign-search-results. Cada item tem um botão "Escolher" que
 * dispara o evento personalizado "user:selected" com o User como
 * detalhe, desacoplando o render dos listeners do modal.
 */
export default function userSearchResultsRender(
  container: HTMLElement,
  users: User[],
  total: number
): void {
  container.innerHTML = "";

  const totalEl = document.createElement("p");
  totalEl.classList.add("text-muted", "small", "mb-2");
  totalEl.textContent = `${total} resultado${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;
  container.append(totalEl);

  if (users.length === 0) {
    const empty = document.createElement("p");
    empty.classList.add("text-warning", "small");
    empty.textContent = "Nenhum usuário encontrado para os critérios informados.";
    container.append(empty);
    return;
  }

  const ul = document.createElement("ul");
  ul.classList.add("list-group");

  users.forEach((user) => {
    const li = document.createElement("li");
    li.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
      "gap-2"
    );

    const info = document.createElement("div");
    info.classList.add("flex-grow-1", "small");

    const nameEl = document.createElement("strong");
    nameEl.textContent = user.name;

    const emailEl = document.createElement("span");
    emailEl.classList.add("text-muted", "ms-1");
    emailEl.textContent = `— ${user.email}`;

    const detailEl = document.createElement("div");
    detailEl.classList.add("text-muted");

    const parts: string[] = [];
    if (user.job_title) parts.push(user.job_title);
    if (user.city && user.state) parts.push(`${user.city}/${user.state}`);
    else if (user.city) parts.push(user.city);
    else if (user.state) parts.push(user.state);

    detailEl.textContent = parts.join(" · ");

    info.append(nameEl, emailEl, detailEl);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("btn", "btn-outline-primary", "btn-sm", "flex-shrink-0");
    btn.textContent = "Escolher";
    btn.addEventListener("click", () => {
      container.dispatchEvent(new CustomEvent<User>("user:selected", { detail: user, bubbles: true }));
    });

    li.append(info, btn);
    ul.append(li);
  });

  container.append(ul);
}
