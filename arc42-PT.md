#

**Sobre o arc42**

arc42, o template para documentação de software e arquitetura de
sistemas.

Versão do template 8.2 PT. (baseado na versão AsciiDoc), Setembro de
2024

Criado, mantido e © pelo Dr. Peter Hruschka, Dr. Gernot Starke e
colaboradores. Veja <https://arc42.org>.

# 1. Introdução e Objetivos {#section-introduction-and-goals}

## Visão Geral dos Requisitos {#\_vis_o_geral_dos_requisitos}

O **QuaLeiDer** é uma plataforma web para gestão de produtores de leite e suas associações, desenvolvida pelo Instituto Federal de Pernambuco.

### Requisitos Funcionais Principais

1. **Gestão de Usuários e Associações**

   - Cadastro e autenticação de produtores e associações
   - Autenticação via JWT (JSON Web Token)
   - Reset de senha via email
   - Separação de responsabilidades: Usuários (produtores) e Associações (gestores)

2. **Gestão de Animais**

   - Cadastro de animais por produtor
   - Rastreamento de características (tipo, raça, idade)
   - Controle de status (ativo/inativo)
   - Associação de animais a produtores
   - Análise de dados para prevenção de doenças

3. **Coletas Diárias de Leite**

   - Registro de coletas diárias
   - Informações sobre quantidade, número de ordenhas
   - Dados técnicos (ração, assistência técnica, local de ordenha)
   - Histórico de coletas por produtor

4. **Sistema de Convites**

   - Associações podem convidar produtores
   - Convites via email com token único
   - Aceitação/recusa de convites
   - Expiração automática (7 dias)
   - Limpeza automática via CRON job diário

5. **Notificações**

   - Sistema de notificações por email
   - Templates personalizados (Handlebars)
   - Eventos de convites, reset de senha, etc.

6. **Gestão Administrativa**

   - Acesso a logs detalhados do sistema (autenticação, erros, jobs)
   - Monitoramento de processos em segundo plano (CRON jobs, envio de emails)
   - Visualização de estatísticas globais (total de produtores, associações, coletas)
   - Gestão de configurações do sistema (parâmetros de email, timeouts)
   - Alertas automáticos para falhas críticas (jobs, serviços externos)

7. **Módulo de Relatórios e Análises**
   - **Dados Agregados para Associações:**
     - Total de leite coletado por período (dia/semana/mês)
     - Número de produtores ativos por associação
     - Média de produção por produtor
     - Ranking de produtores por volume
   - **Análise de Animais:**
     - Distribuição de animais por tipo e raça
     - Alertas de saúde: notificação quando um animal recebe medicação repetida (3x mesmo tipo em 30 dias)
     - Histórico de vacinação e tratamentos por animal
     - Taxa de produtividade por animal (litros/dia)

## Objetivos de Qualidade {#\_objetivos_de_qualidade}

| Prioridade | Objetivo de Qualidade | Cenário Mensurável                                                                                                                              |
| ---------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1          | **Segurança**         | Tokens JWT expiram em 24h; senhas com hash bcrypt (10 rounds); reset de senha expira em 15 min; proteção contra SQL injection via Prisma ORM    |
| 2          | **Manutenibilidade**  | Clean Architecture com 4 camadas (Domain, Application, Infrastructure, Presentation);                     |
| 3          | **Escalabilidade**    | Sistema suporta 50 associações e 2.000 produtores simultâneos; API responde <300ms com 500 req/min; preparado para crescimento horizontal       |
| 4          | **Confiabilidade**    | Jobs CRON alertam admin em caso de falha; emails com 3 tentativas de reenvio (5, 15, 30 min); 99% de uptime para operações críticas             |
| 5          | **Usabilidade**       | Produtor registra coleta em <45s via smartphone; taxa de sucesso de 95% na aceitação de convites sem ajuda; API RESTful documentada com Swagger |
| 6          | **Testabilidade**     | Dependency Injection em 100% dos serviços; ports/adapters pattern; cobertura de testes >80% em camadas críticas (Application, Domain)           |

### Detalhamento dos Objetivos

**Segurança:**

- Autenticação stateless com JWT
- Hash de senhas com bcrypt (10 rounds)
- Validação rigorosa de DTOs com decorators
- Proteção contra SQL injection via Prisma ORM
- Tokens de reset de senha com expiração de 15 minutos

**Manutenibilidade:**

- Path aliases (`@/application`, `@/domain`, etc.)
- Logger padronizado em todos os serviços
- Código DRY com filtros globais de exceção
- Tipagem forte com TypeScript
- Padrões consistentes (SRP, DIP)
- Novos requisitos de negócio devem ser implementados tocando em no máximo 1 arquivo por camada.

**Escalabilidade:**

- Arquitetura modular com NestJS preparada para crescimento horizontal
- Suporte para 50 associações e 2.000 produtores registrando coletas simultaneamente (pico: 07:00-09:00)
- Tempo de resposta da API de registro de coleta <300ms mesmo com 500 requisições/minuto
- Database Prisma com connection pooling para otimização de queries
- Preparado para deploy em múltiplas instâncias (load balancing)

**Confiabilidade:**

- Transações Prisma para operações críticas (criação de usuário + associação)
- Retry automático de emails via sistema de eventos:
  - 1ª tentativa: imediata
  - 2ª tentativa: após 5 minutos
  - 3ª tentativa: após 15 minutos
  - 4ª tentativa: após 30 minutos
  - Falha permanente registrada em log após 4 tentativas
- CRON job de limpeza de convites:
  - Execução diária às 02:00
  - Alerta enviado ao Administrador se falhar por 3 dias consecutivos
- Validações em camadas (DTO, Service, Database)
- Tratamento de erros específico por tipo de falha (P2002, P2025, P2003)
- Monitoramento de processos em segundo plano com logs estruturados

**Usabilidade:**

- **Para Produtores:**
  - Interface responsiva otimizada para smartphones (tela mínima: 360px)
  - Fluxo de registro de coleta diária em <45 segundos
  - Formulários com validação em tempo real e mensagens de erro claras
  - Aceitação de convite com taxa de sucesso de 95% sem necessidade de ajuda
- **Para Desenvolvedores:**
  - API RESTful documentada com Swagger/OpenAPI
  - Exemplos de requisição/resposta para todos os endpoints
  - Mensagens de erro padronizadas com códigos HTTP apropriados

## Partes Interessadas {#\_partes_interessadas}

| Função/Nome                         | Contato                               | Expectativas                                                                                                    |
| ----------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Produtores de Leite**             | Usuários finais do sistema            | Sistema simples para registro de coletas diárias, gestão de animais, recebimento de convites de associações     |
| **Associações**                     | Organizações que gerenciam produtores | Ferramenta para convidar e gerenciar produtores, visualizar dados agregados, enviar notificações                |
| **Instituto Federal de Pernambuco** | Cliente/Patrocinador                  | Sistema funcional que apoie a gestão de produtores de leite na região, código de qualidade para fins acadêmicos |
| **Equipe de Desenvolvimento**       | Desenvolvedores do projeto            | Arquitetura limpa e bem documentada, facilidade de manutenção e extensão, uso de boas práticas                  |
| **Administradores do Sistema**      | Suporte técnico                       | Acesso administrativo, logs detalhados, facilidade de deployment e monitoramento                                |

# Restrições Arquiteturais {#section-architecture-constraints}

# Contexto e Escopo {#section-context-and-scope}

## Contexto Negocial {#\_contexto_negocial}

**\<Diagrama ou Tabela>**

**\<opcionalmente: Explicação das interfaces de domínio externo>**

## Contexto Técnico {#\_contexto_t_cnico}

**\<Diagrama ou Tabela>**

**\<opcionalmente: Explicação das interfaces técnicas>**

**\<Mapeamento de entrada/saída para canais>**

# Estratégia de Solução {#section-solution-strategy}

# Visão de Blocos de Construção {#section-building-block-view}

## Visão Sistêmica Geral de Caixa Branca {#\_vis_o_sist_mica_geral_de_caixa_branca}

**_\<Diagrama de Visão Geral>_**

Motivação

: _\<explicação textual>_

Blocos de Construção Contidos

: _\<Descrição dos blocos de construção contidos (caixas pretas)>_

Interfaces Importantes

: _\<Descrição de interfaces importantes>_

### \<Nome Caixa Preta 1> {#\_\_nome_caixa_preta_1}

_\<Propósito/Responsabilidade>_

_\<Interface(s)>_

_\<(Opcional) Características de Qualidade/Desempenho>_

_\<(Opcional) Local do Diretório/Arquivo>_

_\<(Opcional) Requisitos Cumpridos>_

_\<(opcional) Problemas/Riscos Abertos>_

### \<Nome Caixa Preta 2> {#\_\_nome_caixa_preta_2}

_\<modelo de caixa preta>_

### \<Nome Caixa Preta n> {#\_\_nome_caixa_preta_n}

_\<modelo de caixa preta>_

### \<Nome Interface 1> {#\_\_nome_interface_1}

...

### \<Nome Interface m> {#\_\_nome_interface_m}

## Nível 2 {#\_n_vel_2}

### Caixa Branca _\<Bloco de Construção 1>_ {#\_caixa_branca_emphasis_bloco_de_constru_o_1_emphasis}

_\<modelo de caixa branca>_

### Caixa Branca _\<Bloco de Construção 2>_ {#\_caixa_branca_emphasis_bloco_de_constru_o_2_emphasis}

_\<modelo de caixa branca>_

...

### Caixa Branca _\<Bloco de Construção m>_ {#\_caixa_branca_emphasis_bloco_de_constru_o_m_emphasis}

_\<modelo de caixa branca>_

## Nível 3 {#\_n_vel_3}

### Caixa Branca \<\_Bloco de Construção x.1\_\> {#\_caixa_branca_bloco_de_constru_o_x_1}

_\<modelo de caixa branca>_

### Caixa Branca \<\_Bloco de Construção x.2\_\> {#\_caixa_branca_bloco_de_constru_o_x_2}

_\<modelo de caixa branca>_

### Caixa Branca \<\_Bloco de Construção y.1\_\> {#\_caixa_branca_bloco_de_constru_o_y_1}

_\<modelo de caixa branca>_

# Visão de Tempo de Execução {#section-runtime-view}

## \<Cenário de Tempo de Execução 1> {#\_\_cen_rio_de_tempo_de_execu_o_1}

- _\<inserir diagrama de tempo de execução ou descrição textual do
  cenário>_

- _\<inserir descrição dos aspectos notáveis ​​das interações entre as
  instâncias do bloco de construção descritas neste diagrama.\>_

## \<Cenário de Tempo de Execução 2> {#\_\_cen_rio_de_tempo_de_execu_o_2}

## ... {#\_}

## \<Cenário de Tempo de Execução n> {#\_\_cen_rio_de_tempo_de_execu_o_n}

# Visão de Implantação {#section-deployment-view}

## Nível de Infraestrutura 1 {#\_n_vel_de_infraestrutura_1}

**_\<Diagrama de Visão Geral>_**

Motivação

: _\<explicação em forma de texto>_

Características de Qualidade e/ou Desempenho

: _\<explicação em forma de texto>_

Mapeamento de Blocos de Construção para Infraestrutura

: _\<descrição do mapeamento>_

## Nível de Infraestrutura 2 {#\_n_vel_de_infraestrutura_2}

### _\<Elemento de Infraestrutura 1>_ {#\_\_emphasis_elemento_de_infraestrutura_1_emphasis}

_\<diagrama + explicação>_

### _\<Elemento de Infraestrutura 2>_ {#\_\_emphasis_elemento_de_infraestrutura_2_emphasis}

_\<diagrama + explicação>_

...

### _\<Elemento de Infraestrutura n>_ {#\_\_emphasis_elemento_de_infraestrutura_n_emphasis}

_\<diagrama + explicação>_

# Conceitos Transversais {#section-concepts}

## _\<Conceito 1>_ {#\_\_emphasis_conceito_1_emphasis}

_\<explicação>_

## _\<Conceito 2>_ {#\_\_emphasis_conceito_2_emphasis}

_\<explicação>_

...

## _\<Conceito n>_ {#\_\_emphasis_conceito_n_emphasis}

_\<explicação>_

# Decisões Arquiteturais {#section-design-decisions}

# Requisitos de qualidade {#section-quality-scenarios}

## Árvore de qualidade {#\_\_rvore_de_qualidade}

```
QuaLeiDer - Qualidade
├── Segurança (P1)
│   ├── Autenticação
│   ├── Autorização
│   └── Proteção de Dados
├── Manutenibilidade (P2)
│   ├── Modularidade
│   ├── Testabilidade
│   └── Documentação
├── Escalabilidade (P3)
│   ├── Capacidade
│   ├── Performance
│   └── Elasticidade
├── Confiabilidade (P4)
│   ├── Disponibilidade
│   ├── Recuperação de Falhas
│   └── Monitoramento
└── Usabilidade (P5)
    ├── Eficiência do Usuário Final
    ├── Experiência do Desenvolvedor
    └── Acessibilidade
```

## Cenários de Qualidade {#\_cen_rios_de_qualidade}

### Cenário 1: Registro Rápido de Coleta (Usabilidade)

- **Fonte:** Produtor de leite com baixa experiência técnica
- **Estímulo:** Necessita registrar a coleta diária de leite pelo smartphone
- **Artefato:** Interface web responsiva de registro de coletas
- **Ambiente:** Hora do pico (07:00-09:00), rede 3G/4G instável
- **Resposta:** Sistema apresenta formulário pré-preenchido com dados do último registro
- **Medida:** Produtor completa o registro em <45 segundos, com taxa de sucesso de 95%

### Cenário 2: Aceitação de Convite sem Ajuda (Usabilidade)

- **Fonte:** Novo produtor recebendo convite de associação pela primeira vez
- **Estímulo:** Clica no link do email de convite
- **Artefato:** Fluxo de aceitação de convite
- **Ambiente:** Dispositivo móvel, primeira interação com o sistema
- **Resposta:** Interface guiada com passos numerados (1/3, 2/3, 3/3) e confirmação visual
- **Medida:** 95% dos usuários completam o fluxo sem pedir ajuda ou abandonar

### Cenário 3: Carga de Produtores Simultâneos (Escalabilidade)

- **Fonte:** 2.000 produtores de 50 associações diferentes
- **Estímulo:** Todos registram coletas simultaneamente no horário de pico (07:00-09:00)
- **Artefato:** API de registro de coletas (`POST /daily-collections`)
- **Ambiente:** Sistema em produção com database PostgreSQL (connection pool: 20)
- **Resposta:** Sistema processa todas as requisições sem perda de dados
- **Medida:** Tempo de resposta <300ms para 95% das requisições; 500 req/min sustentáveis

### Cenário 4: Recuperação de Falha no Envio de Email (Confiabilidade)

- **Fonte:** Serviço de email externo (ex: SendGrid) fora do ar por 30 minutos
- **Estímulo:** Sistema tenta enviar email de reset de senha durante a indisponibilidade
- **Artefato:** Módulo de envio de emails com sistema de eventos
- **Ambiente:** Ambiente de produção, serviço externo com SLA de 99.9%
- **Resposta:** Sistema registra o evento em fila e tenta reenvio automático (5, 15, 30 min)
- **Medida:** 99% dos emails são entregues dentro de 1 hora; falhas permanentes são logadas

### Cenário 5: Falha no CRON Job de Limpeza (Confiabilidade)

- **Fonte:** CRON job de limpeza de convites expirados
- **Estímulo:** Job falha por 3 dias consecutivos (ex: erro de database)
- **Artefato:** Serviço `InvitesCleanupService` com monitoramento
- **Ambiente:** Sistema em produção, database temporariamente indisponível
- **Resposta:** Sistema registra falha em log estruturado e envia alerta ao Administrador
- **Medida:** Alerta enviado em <5 minutos após 3ª falha consecutiva; convites não são deletados incorretamente

### Cenário 6: Ataque de SQL Injection (Segurança)

- **Fonte:** Atacante mal-intencionado
- **Estímulo:** Tenta injetar SQL via campo de email: `admin@test.com' OR '1'='1`
- **Artefato:** Endpoint de login (`POST /auth/login`)
- **Ambiente:** Sistema em produção exposto na internet
- **Resposta:** Prisma ORM sanitiza a entrada; validação do DTO rejeita formato inválido
- **Medida:** Tentativa de injeção é bloqueada; log de segurança registra a tentativa; 0 vulnerabilidades detectadas

### Cenário 7: Token de Reset de Senha Expirado (Segurança)

- **Fonte:** Usuário recebe email de reset de senha
- **Estímulo:** Tenta usar o token após 20 minutos (limite: 15 minutos)
- **Artefato:** Endpoint de reset de senha (`POST /auth/reset-password`)
- **Ambiente:** Sistema em produção
- **Resposta:** Sistema rejeita o token expirado com mensagem clara
- **Medida:** Usuário recebe erro HTTP 400 com mensagem "Token expirado. Solicite um novo reset de senha."; novo token pode ser gerado

### Cenário 8: Visualização de Dados Agregados (Funcionalidade)

- **Fonte:** Associação com 150 produtores ativos
- **Estímulo:** Solicita relatório de produção mensal
- **Artefato:** Endpoint de relatórios (`GET /reports/monthly-production`)
- **Ambiente:** Sistema em produção com 6 meses de histórico
- **Resposta:** Sistema retorna dados agregados (total de leite, média por produtor, ranking)
- **Medida:** Resposta gerada em <2 segundos; dados consistentes com registros individuais; formato exportável (JSON/CSV)

### Cenário 9: Alerta de Medicação Repetida (Funcionalidade)

- **Fonte:** Produtor registra medicação para um animal
- **Estímulo:** É a 3ª vez que o mesmo tipo de medicação é aplicado em 30 dias
- **Artefato:** Módulo de análise de animais (futuro)
- **Ambiente:** Sistema em produção com histórico de tratamentos
- **Resposta:** Sistema gera alerta visual no dashboard e notificação por email
- **Medida:** Alerta gerado em tempo real (<5 segundos); taxa de falsos positivos <5%; produtor pode marcar alerta como "revisado"

# Riscos e Débitos Técnicos {#section-technical-risks}

# Glossário {#section-glossary}

+-----------------------+-----------------------------------------------+
| Termo | Definição |
+=======================+===============================================+
| _\<Termo-1>_ | _\<definição-1>_ |
+-----------------------+-----------------------------------------------+
| _\<Termo-2>_ | _\<definição-2>_ |
+-----------------------+-----------------------------------------------+
