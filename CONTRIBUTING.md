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

## Estrutura do Projeto

- **backend/**: Código fonte da API (NestJS).
- **frontend/**: Código fonte da interface (Next.js).
- **docker-compose.yml**: Configuração para rodar o ambiente completo localmente.
