# Guia de Segurança e Privacidade — QuaLact

## Escopo e dados

O QuaLact trata contas de usuários, vínculos com associações, identificação de produtores e vaqueiros, cadastro de animais e registros de produção. Senhas são armazenadas somente como hash; tokens, segredos SMTP/OAuth e credenciais de banco nunca devem ser versionados.

## Princípios de privacidade

- coletar apenas dados necessários à gestão leiteira;
- informar finalidade e responsável pelo tratamento no momento do cadastro;
- limitar acesso por função e associação, aplicando o menor privilégio;
- manter dados corretos e permitir correção, exportação ou exclusão quando aplicável;
- registrar a base legal e o prazo de retenção definidos pelo responsável pelo tratamento;
- não reutilizar dados para finalidade incompatível sem nova avaliação.

Solicitações de titulares devem ser autenticadas, registradas e respondidas pelo canal institucional definido pelo operador. Exclusões devem considerar obrigações legais, backups e registros de auditoria; quando a exclusão imediata não for possível, o dado deve ser bloqueado e removido no ciclo de retenção.

## Controles técnicos

- TLS 1.2/1.3 no proxy público, HSTS e redirecionamento permanente de HTTP para HTTPS;
- containers de aplicação e banco sem portas públicas; somente o gateway local recebe tráfego do proxy do host;
- CORS restrito ao domínio de produção, cookies seguros quando usados e tokens com expiração;
- rate limit no Nginx e na API, validação de entrada e autorização no servidor;
- métricas sem e-mail, nome, token ou conteúdo de negócio; logs devem ser estruturados e sanitizados;
- secrets fornecidos por ambiente/secret store, com rotação após incidente ou troca de responsável;
- backups criptografados, restauração testada e acesso auditado.

## Desenvolvimento seguro

Pull requests precisam passar por testes, cobertura, `npm audit` de produção, Trivy, Semgrep/CodeQL e DAST ZAP. Alertas HIGH/CRITICAL impedem a entrega até correção ou aceite de risco documentado, com prazo e responsável. Dependabot verifica npm, Docker e Actions semanalmente.

## Incidentes

1. Conter o acesso e preservar evidências sem copiar dados pessoais além do necessário.
2. Rotacionar credenciais potencialmente expostas e identificar titulares/sistemas afetados.
3. Registrar linha do tempo, impacto, causa e medidas corretivas.
4. O controlador avalia comunicações a titulares e à ANPD conforme risco e legislação aplicável.
5. Executar pós-incidente e validar que a correção entrou nos gates automatizados.

## Operação

Revise acessos trimestralmente, alertas semanalmente e retenção/backups semestralmente. O arquivo `SECURITY.md` define divulgação responsável; este guia define o tratamento interno e não substitui orientação jurídica.
