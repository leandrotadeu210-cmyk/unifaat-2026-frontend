# Regras da Camada Silver — Pipeline de Vendas

Este documento descreve os problemas encontrados no dado bruto (raw/bronze)
e a regra aplicada em cada um durante a transformação para a camada silver.

---

## Problema 1 — Tipagem incorreta (tudo chega como string no CSV)

**Observação no raw:** todas as colunas chegam como `string` no CSV, incluindo
campos numéricos (`quantidade`, `preco_unitario`, `desconto`) e a data
(`data_pedido`).

**Regra aplicada:** cast explícito com schema declarado:
- `id_pedido` → `IntegerType`
- `id_cliente` → `IntegerType`
- `quantidade` → `IntegerType`
- `preco_unitario` → `DoubleType`
- `desconto` → `DoubleType`
- `data_pedido` → `DateType` (formato `yyyy-MM-dd`)

Linhas onde o cast falha (retorna `null`) são encaminhadas para a quarentena
com o motivo correspondente.

---

## Problema 2 — id_pedido nulo ou inválido

**Observação no raw:** linhas onde `id_pedido` não é numérico ou está vazio
tornam o campo `null` após o cast.

**Regra aplicada:** linhas com `id_pedido IS NULL` após o cast são enviadas
para a quarentena com motivo `"id_pedido nulo ou não numérico"`. Não são
descartadas silenciosamente — ficam disponíveis para auditoria.

---

## Problema 3 — Quantidade negativa ou zero

**Observação no raw:** linha 32 (`id_pedido=32`) possui `quantidade = -1`,
o que é fisicamente impossível para um pedido de venda.

**Regra aplicada:** linhas com `quantidade <= 0` são enviadas para a
quarentena com motivo `"quantidade <= 0"`. O pipeline não descarta nem
corrige automaticamente — a decisão de negócio (estorno? erro de digitação?)
cabe à equipe de dados.

---

## Problema 4 — Preço outlier (valor acima de R$ 50.000)

**Observação no raw:** linha 36 (`id_pedido=36`) tem `preco_unitario =
99999.00` para um "Notebook Dell", valor incompatível com o catálogo de
produtos (outros notebooks custam entre R$ 2.800 e R$ 3.500).

**Regra aplicada:** linhas com `preco_unitario > 50000` são enviadas para
a quarentena com motivo `"preco_unitario outlier (> 50000)"`. O limiar
de R$ 50.000 foi definido com base na faixa de preços observada no dataset.

---

## Problema 5 — Data inválida ou ausente

**Observação no raw:** se `data_pedido` não seguir o padrão `yyyy-MM-dd`,
o `to_date` retorna `null`.

**Regra aplicada:** linhas com `data_pedido IS NULL` após o parse são
enviadas para a quarentena com motivo `"data_pedido inválida"`. Uma data
confiável é pré-requisito para particionamento e análises temporais.

---

## Problema 6 — Registros duplicados

**Observação no raw:**
- Linha 4 (`id_pedido=4`) é duplicata exata da linha 1 (`id_pedido=1`):
  mesmo cliente, produto, data e valor.
- Linha 12 (`id_pedido=12`) é duplicata da linha 2 (`id_pedido=2`).

**Regra aplicada:** `dropDuplicates(["id_pedido"])` mantém a primeira
ocorrência e remove as demais. A deduplicação é feita **após** a
quarentena, garantindo que apenas linhas válidas sejam deduplicadas.

---

## Problema 7 — Categoria inconsistente (case e espaços)

**Observação no raw:** o campo `categoria` aparece em variações:
`"Eletronicos"`, `"eletronicos"`, `"ELETRONICOS"`. Isso cria múltiplos
grupos em agregações.

**Regra aplicada:** `initcap(trim(lower(categoria)))` normaliza para
`"Eletronicos"`, `"Eletrodomesticos"`, `"Moveis"` etc.

---

## Problema 8 — Status inconsistente (case)

**Observação no raw:** o campo `status` aparece como `"concluido"`,
`"CONCLUIDO"`, `"cancelado"`, `"pendente"`.

**Regra aplicada:** `lower(trim(status))` normaliza para letras minúsculas
sem espaços extras.

---

## Problema 9 — Desconto nulo (campo vazio no CSV)

**Observação no raw:** linha 7 (`id_pedido=7`) tem o campo `desconto` vazio,
que resulta em `null` após o cast para `DoubleType`.

**Regra aplicada:** `coalesce(desconto, 0.0)` substitui `null` por `0.0`.
Ausência de desconto explícito é semanticamente equivalente a desconto zero.

---

## Problema 10 — Dados pessoais (e-mail do cliente)

**Observação no raw:** o campo `email_cliente` contém endereços de e-mail
nominais (ex.: `ana.silva@email.com`), que são dados pessoais conforme a
LGPD.

**Regra aplicada:** o e-mail completo **não é armazenado** na camada silver.
Apenas o domínio é extraído via `regexp_extract(email_cliente, "@(.+)", 1)`
e salvo como `email_dominio` (ex.: `"email.com"`). Clientes sem e-mail
recebem `"desconhecido"`. O dado bruto completo permanece apenas na camada
bronze, acessível somente para fins de auditoria com controle de acesso.

---

## Área de Quarentena

Linhas rejeitadas são gravadas em:

```
s3://<bucket>/quarantine/
```

Cada linha contém todos os campos originais do CSV mais duas colunas extras:
- `_motivo_rejeicao`: descrição textual da regra que rejeitou a linha
- `_ts_rejeicao`: timestamp UTC da execução do job

Isso permite rastreabilidade completa e reprocessamento futuro sem perda de
dados.
