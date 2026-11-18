// Convenção de commits do repositório (Conventional Commits).
// Validada no hook commit-msg (backend/.husky/commit-msg) e nos PRs
// (.github/workflows/commitlint.yml).
//
// Formato: tipo(escopo opcional): descrição
// Exemplo: fix(frontend): corrige máscara do telefone
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Tipos do config-conventional + "security" e "merge", já usados no histórico.
    "type-enum": [
      2,
      "always",
      ["build", "chore", "ci", "docs", "feat", "fix", "merge", "perf", "refactor", "revert", "security", "style", "test"],
    ],
    // Mensagens em português começam com qualquer caixa (ex.: nomes próprios).
    "subject-case": [0],
    "header-max-length": [2, "always", 100],
    // Corpo e rodapé podem ter links e listas longas.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
