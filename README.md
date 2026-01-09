<div align="center">

# 🚀 Desafio Técnico Shipay
### Front-End Engineer Challenge

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" />

---

### 💳 Simplificando pagamentos, complexificando soluções técnicas

*Respostas ao desafio técnico para a posição de Front-End Engineer na Shipay*

</div>

---

## 📋 Sobre o Desafio

Este repositório contém as soluções para o desafio técnico da **Shipay**, empresa líder em soluções de pagamento digital no Brasil. O desafio avalia competências essenciais para um engenheiro front-end moderno: desde a implementação de interfaces reativas até arquitetura de sistemas escaláveis.

## 🎯 Estrutura do Projeto

```
📦 entrega/
├── 📁 questao-01/          # Aplicação React - Busca de Produtos
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   └── hooks/          # Custom Hooks (useDebounce)
│   └── package.json
│
├── 📁 questao-02/          # Refatoração de Código
│   ├── codigo-original/    # Código com problemas
│   └── codigo-corrigido/   # Solução otimizada
│
├── 📁 questao-03/          # Debugging e Correção
│   ├── codigo-com-bug/     # Código com bug identificado
│   └── solução/            # Bug corrigido + explicação
│
├── 📁 questao-04/          # Testes Unitários
│   ├── __tests__/          # Suíte de testes Jest
│   └── services/           # Serviços testados
│
└── 📁 questao-05/          # Arquitetura BFF
    ├── diagramas/          # Diagramas Mermaid
    ├── exemplos/           # Código de exemplo
    └── SOLUCAO-COMPLETA-BFF.md
```

---

## 🎉 Questões Resolvidas

### 🎨 **Questão 01** - Aplicação React com Busca de Produtos

**Desafio:** Criar uma interface de busca de produtos com performance otimizada.

**Tecnologias:**
- ⚛️ React 18
- 🎣 Custom Hooks (useDebounce)
- 🧪 Jest + React Testing Library
- 💅 CSS Modules

**Destaques:**
- ✅ Busca com debounce de 300ms para otimizar performance
- ✅ Componentização seguindo Single Responsibility
- ✅ Cobertura de testes unitários
- ✅ UI responsiva e acessível

**Como executar:**
```bash
cd questao-01
npm install
npm start          # Roda em http://localhost:3000
npm test          # Executa os testes
```

---

### 🔧 **Questão 02** - Refatoração de Código

**Desafio:** Identificar e corrigir problemas em código React legado.

**Problemas Identificados:**
- 🔴 Renderizações desnecessárias
- 🔴 Falta de memoização
- 🔴 Props drilling
- 🔴 Lógica de negócio no componente de UI

**Soluções Aplicadas:**
- ✅ `useMemo` e `useCallback` para otimização
- ✅ Separação de responsabilidades
- ✅ Custom hooks para lógica reutilizável
- ✅ Context API para gerenciamento de estado

📄 **Arquivos:**
- [`UserManagement-ORIGINAL.js`](questao-02/codigo-original/UserManagement-ORIGINAL.js) - Código original
- [`UserManagement-CORRIGIDO.js`](questao-02/codigo-corrigido/UserManagement-CORRIGIDO.js) - Solução otimizada

---

### 🐛 **Questão 03** - Debugging e Correção de Bug

**Desafio:** Identificar e corrigir bug em componente React.

**Bug Identificado:**
- ⚠️ Renderização condicional incorreta
- ⚠️ Estado assíncrono não tratado
- ⚠️ Memory leak em requisições

**Correções Implementadas:**
- ✅ Controle adequado de loading states
- ✅ Cleanup de efeitos colaterais
- ✅ Tratamento de erros robusto
- ✅ AbortController para cancelamento de requisições

📄 **Arquivos:**
- [`ProductDisplay-BUG.js`](questao-03/codigo-com-bug/ProductDisplay-BUG.js) - Código com bug
- [`ProductDisplay.js`](questao-03/solução/ProductDisplay.js) - Bug corrigido

---

### 🧪 **Questão 04** - Testes Unitários

**Desafio:** Criar suite de testes para serviços críticos.

**Cobertura de Testes:**
- ✅ Testes de serviço de API
- ✅ Testes de serviço de autenticação
- ✅ Mocks de requisições HTTP
- ✅ Testes de edge cases

**Ferramentas:**
- Jest
- Jest Mock Functions
- Async/Await testing patterns

**Como executar:**
```bash
cd questao-04
npm install
npm test                    # Roda todos os testes
npm test -- --coverage     # Gera relatório de cobertura
```

---

### 🏗️ **Questão 05** - Arquitetura BFF (Backend for Frontend)

**Desafio:** Propor arquitetura BFF para plataforma de streaming multi-device.

**Solução Proposta:**
- 🌐 **Web BFF** - Node.js com cache de 5min e payloads ricos
- 📱 **Mobile BFF** - Go com cache de 1min e payloads otimizados
- 📺 **TV BFF** - Node.js com cache de 10min e interface simplificada

**Destaques:**
- ✅ Diagramas Mermaid detalhados
- ✅ Exemplos de código para cada BFF
- ✅ Otimizações específicas por plataforma
- ✅ Estratégias de cache adaptativas
- ✅ Decisões de qualidade de stream baseadas em rede

**Diagramas Inclusos:**
- 📊 Arquitetura geral do sistema
- 🔄 Fluxo de requisições com cache
- 📦 Comparação de payloads
- 🎯 Decisão de qualidade de streaming
- 🎭 Distribuição de responsabilidades

📄 **Documentação:**
- [`SOLUCAO-COMPLETA-BFF.md`](questao-05/SOLUCAO-COMPLETA-BFF.md) - Solução detalhada
- [`DIAGRAMAS.md`](questao-05/diagramas/DIAGRAMAS.md) - Diagramas visuais

---

##  Como Rodar o Projeto

### Pré-requisitos
```bash
Node.js >= 16.x
npm >= 8.x
```

### Instalação

Cada questão possui suas próprias dependências. Navegue até a pasta desejada e execute:

```bash
npm install
npm start  # ou npm test
```

---

## ✨ Autor

**Sophya Damiazo**

Desenvolvido com dedicação e atenção aos detalhes para o processo seletivo da **Shipay**.

---

<div align="center">

*"Este desafio representa meu compromisso com código de qualidade e experiência do usuário excepcional."*

**Made with ❤️ and lots of ☕**

</div>


