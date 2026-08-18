# Guia de Contribuicão

Obrigado por contribuir com o QuaLeiDer!

## Fluxo de Trabalho

1. Crie uma branch a partir da `main`: `git checkout -b feature/minha-feature`
2. Faça seus commits usando **Conventional Commits**:
   - `feat: adiciona cadastro de ovelhas`
   - `fix: corrige erro no calculo de gordura`
   - `style: formatação de código`
   - `docs: atualização de documentação`
   - `refactor: melhoria de código sem alteração de funcionalidade`
   - `perf: melhoria de performance`
   - `test: adição de testes`
   - `chore: atualização de configurações`
3. Abra um Pull Request para a branch `main`.

## Padrões

- **Backend**: 
  - Use `npm run lint` antes de commitar para garantir o estilo do código.
  - Certifique-se de que os testes passem com `npm test`.
  - Novos recursos devem ter testes unitários correspondentes.
  
- **Frontend**: 
  - Verifique a responsividade em diferentes tamanhos de tela.
  - Use `npm run lint` para verificar problemas de linting.

## Validação de campos textuais (backend + frontend)

Todo campo textual novo, seja em DTO (backend) ou schema/formulário (frontend),
deve ter um limite explícito de tamanho — não confie só em `@IsString()` /
`z.string()` sem `.max()`. Sem isso, o campo aceita payload arbitrariamente
grande (risco de DoS) e a UX fica inconsistente entre o que o form permite
digitar e o que a API realmente aceita.

**Regra: o limite do frontend deve ser igual ao do backend.** Um formulário
mais permissivo que a API deixa o usuário digitar algo que só falha no
submit; um formulário mais restritivo bloqueia entrada que a API aceitaria.

Tabela de referência por tipo de campo (use estes valores por padrão; só
desvie com justificativa):

| Tipo de campo | Backend (`class-validator`) | Frontend (Zod) |
|---|---|---|
| Nome (pessoa/entidade) | `@Length(3, 255)` | `.min(3).max(255)` |
| Email | `@IsEmail()` + `@MaxLength(254)` (RFC 5321) | `.max(254).email()` |
| Senha | `@MinLength(8)` + `@MaxLength(72)` (bcrypt trunca acima de 72 bytes) | `.min(8).max(72)` |
| Código/token numérico (6 dígitos) | `@Length(6, 6)` | `.length(6)` |
| Estado (UF) | `@Length(2, 2)` | `.length(2)` |
| Cidade | `@MaxLength(100)` | `.max(100)` |
| Nome curto (raça, espécie, animal) | `@MaxLength(100)` | `.max(100)` |
| Descrição / mensagem | `@MaxLength(500)` (ajuste conforme o caso) | `.max(500)` |
| Telefone / documento (CPF, CNPJ, IE) | `@MaxLength(20)` (a menos que tenha `@Length` de formato fixo) | `.max(20)` |
| Endereço (rua, complemento, bairro) | `@MaxLength(255)` ou `@MaxLength(100)` conforme o campo | espelhar o backend |

Ao adicionar um campo que não se encaixa na tabela acima, escolha um limite
generoso mas finito baseado no uso real do campo, e documente o porquê no
DTO se não for óbvio.

## Estrutura do Projeto

- **backend/**: Código fonte da API (NestJS).
- **frontend/**: Código fonte da interface (Next.js).
- **docker-compose.yml**: Configuração para rodar o ambiente completo localmente.
