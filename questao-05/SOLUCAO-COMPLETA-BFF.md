# Questão 5 - Backend for Frontend (BFF) para Streaming

##  Cenário

**Empresa de Streaming** com:
- 3 Microsserviços: Catálogo, Usuários, Streaming
- 3 Clientes: Web, Mobile, Smart TV
- Necessidade: Otimizar experiência de cada plataforma

---

##  1. Conceito do BFF

### O que é Backend for Frontend?

**BFF** é um padrão arquitetural onde criamos **APIs específicas para cada tipo de cliente** (Web, Mobile, TV), atuando como uma **camada intermediária** entre os clientes e os microsserviços de backend.

### Analogia Simples
```
Imagine um restaurante com 3 tipos de clientes:
- Salão (Web): Quer menu completo com descrições detalhadas
- Delivery (Mobile): Quer menu resumido e rápido
- Drive-thru (TV): Quer menu simplificado com itens principais

Em vez de dar o mesmo menu gigante para todos, você cria menus 
específicos para cada tipo de cliente. O BFF é esse "menu personalizado".
```

### Papel Principal do BFF

```
┌──────────────┐
│   Cliente    │  "Quero ver recomendações"
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│            BFF                       │  Orquestra tudo:
│  "Vou buscar seus dados, histórico,  │  1. Chama MS Usuários
│   pegar catálogo e montar resposta   │  2. Chama MS Catálogo
│   do jeito que você precisa"         │  3. Agrega os dados
│                                      │  4. Formata para cliente
└──────────┬───────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐   ┌─────────┐
│MS Users│   │MS Catál.│
└────────┘   └─────────┘
```

###  Principais Benefícios

#### 1. **Otimização por Cliente**
```javascript
// Web BFF
{
  "recommendations": [
    {
      "id": 1,
      "title": "Stranger Things",
      "synopsis": "Texto completo de 500 caracteres...",
      "cast": ["Millie Bobby Brown", "Finn Wolfhard", ...],
      "genres": ["Sci-Fi", "Horror", "Drama"],
      "rating": 9.2,
      "episodes": [...],  // Lista completa
      "reviews": [...]    // 10 reviews
    }
  ]
}

// Mobile BFF
{
  "recommendations": [
    {
      "id": 1,
      "title": "Stranger Things",
      "thumbnail": "url-otimizada-mobile.jpg",
      "rating": 9.2,
      "duration": "45min"
    }
  ]
}
```

#### 2. **Redução de Requisições**
```
 SEM BFF (6 requests do cliente):
Mobile → MS Catálogo (lista filmes)
Mobile → MS Usuários (histórico)
Mobile → MS Usuários (preferências)
Mobile → MS Catálogo (detalhes filme 1)
Mobile → MS Catálogo (detalhes filme 2)
Mobile → MS Catálogo (detalhes filme 3)

 COM BFF (1 request):
Mobile → BFF Mobile (/recommendations)
  BFF → MS Catálogo + MS Usuários (paralelo)
  BFF → Agrega e retorna tudo
```

#### 3. **Evolução Independente**
```
Web precisa de novo campo "trailers"?
→ Modifica apenas Web BFF
→ Mobile e TV não são afetados 

Backend adiciona novo MS de "Avaliações"?
→ BFFs são atualizados gradualmente
→ Clientes não precisam mudar 
```

#### 4. **Segurança e Controle**
```javascript
// BFF filtra dados sensíveis
const userData = await usersMS.getUser(userId);

// Remove campos internos antes de enviar ao cliente
return {
  name: userData.name,
  email: userData.email,
  //  Não expõe: password, internalId, paymentData
};
```

#### 5. **Performance**
```
Mobile com conexão lenta:
- BFF retorna JSON 10x menor
- Imagens já otimizadas para mobile
- Dados comprimidos
- Resultado: 3s → 0.5s de carregamento
```

---

##  2. Design da Solução

###  Decisão: **MÚLTIPLOS BFFs** (1 por tipo de cliente)

### Justificativa

#### Por que NÃO usar BFF único?

| Problema | Impacto |
|----------|---------|
| **Código compartilhado** | Mudança para Web afeta Mobile e TV |
| **Complexidade crescente** | `if (client === 'web') { ... } else if (client === 'mobile') { ... }` |
| **Deploy acoplado** | Bug no Web BFF derruba Mobile e TV |
| **Times não independentes** | Time Web precisa coordenar com time Mobile |
| **Performance** | Otimizações para um afetam outros |

#### Por que usar Múltiplos BFFs?

| Benefício | Exemplo |
|-----------|---------|
| **Independência** | Time Web faz deploy sem afetar Mobile |
| **Otimização específica** | Web BFF usa cache de 5min, Mobile de 1min |
| **Tecnologias diferentes** | Web BFF em Node.js, Mobile BFF em Go (performance) |
| **Escalabilidade** | Mobile BFF escala 10x (mais usuários), Web BFF 3x |
| **Clareza** | Código focado, sem condicionais complexas |

###  Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐         ┌────▼─────┐
    │   Web   │          │ Mobile  │         │Smart TV  │
    │ Browser │          │iOS/Andr.│         │          │
    └────┬────┘          └────┬────┘         └────┬─────┘
         │                    │                    │
         │ HTTPS              │ HTTPS              │ HTTPS
         │                    │                    │
┌────────▼──────────────────────────────────────────────────┐
│                    API GATEWAY                            │
│         (Autenticação, Rate Limiting, Logging)            │
└────────┬──────────────────────────────────────────────────┘
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐         ┌────▼─────┐
    │Web BFF  │          │Mobile   │         │  TV BFF  │
    │         │          │  BFF    │         │          │
    │Node.js  │          │  Go     │         │ Node.js  │
    └────┬────┘          └────┬────┘         └────┬─────┘
         │                    │                    │
         └────────┬───────────┴─────────┬──────────┘
                  │                     │
         ┌────────▼────────┐   ┌────────▼────────┐
         │                 │   │                 │
    ┌────▼─────┐     ┌─────▼──┐     ┌───▼──────┐
    │   MS     │     │   MS   │     │    MS    │
    │ Catálogo │     │Usuários│     │Streaming │
    └──────────┘     └────────┘     └──────────┘
         │                │               │
    ┌────▼────────────────▼───────────────▼────┐
    │         Banco de Dados / Cache           │
    └──────────────────────────────────────────┘
```

###  Características de Cada BFF

####  Web BFF
```javascript
// Características:
- Linguagem: Node.js + Express
- Resposta: JSON rico com muitos detalhes
- Cache: 5 minutos (usuários toleram)
- Paginação: 50 itens por página
- Imagens: Alta resolução

// Exemplo de endpoint:
GET /api/web/recommendations
→ Retorna 50 filmes com: título, sinopse completa,
  elenco completo, trailers, reviews, episódios...
```

####  Mobile BFF
```javascript
// Características:
- Linguagem: Go (performance, menor uso de memória)
- Resposta: JSON minimalista
- Cache: 1 minuto (dados mais frescos)
- Paginação: 10 itens por página (scroll infinito)
- Imagens: Thumbnail otimizado
- Compressão: Gzip/Brotli agressiva

// Exemplo de endpoint:
GET /api/mobile/recommendations
→ Retorna 10 filmes com: título, thumb, rating, duração
```

####  TV BFF
```javascript
// Características:
- Linguagem: Node.js + Express
- Resposta: JSON simplificado, foco em navegação
- Cache: 10 minutos (TV raramente atualiza)
- Paginação: 20 itens (navegação por controle remoto)
- Imagens: Backdrop grandes (16:9)
- Pré-cache: Próximas telas já carregadas

// Exemplo de endpoint:
GET /api/tv/recommendations
→ Retorna 20 filmes com: título, backdrop grande,
  qualidade de vídeo disponível, info essencial
```

---

##  3. Fluxo de Comunicação

### Exemplo: Usuário abre app Mobile

```
1. Cliente Mobile
   ↓
   GET /api/mobile/home
   Headers: Authorization: Bearer token123

2. API Gateway
   ↓
   - Valida token JWT
   - Rate limiting (100 req/min)
   - Roteia para Mobile BFF

3. Mobile BFF
   ↓
   - Extrai userId do token
   - Faz requisições PARALELAS:
     ┌─→ MS Usuários: GET /users/{id}/preferences
     ├─→ MS Usuários: GET /users/{id}/history
     └─→ MS Catálogo: GET /catalog/trending

4. Mobile BFF (Processamento)
   ↓
   - Agrega dados recebidos
   - Aplica algoritmo de recomendação
   - Filtra apenas campos necessários para mobile
   - Otimiza URLs de imagens (CDN mobile)
   - Formata resposta leve

5. Mobile BFF (Resposta)
   ↓
   {
     "recommendations": [...10 itens...],
     "continue_watching": [...5 itens...],
     "trending": [...10 itens...]
   }
   
6. Cliente Mobile
   ↓
   - Renderiza interface
   - Exibe dados
```

---

##  4. Distribuição de Lógicas e Responsabilidades

### a) Renderizar botões e layout da interface

** CLIENTE** (Web, Mobile, TV)

**Justificativa:**
- Cada plataforma tem tecnologia própria (React Web, React Native Mobile, TV SDK)
- Layout depende de tela, gestos, controle remoto
- Performance: renderização local é mais rápida

```javascript
//  Web (React)
<Button variant="primary" size="large">
  Assistir Agora
</Button>

//  Mobile (React Native)
<TouchableOpacity style={styles.button}>
  <Text>Assistir</Text>
</TouchableOpacity>

//  TV (TV SDK)
<FocusableButton onEnterPress={play}>
  Assistir
</FocusableButton>
```

---

### b) Agregar dados para "Recomendações Personalizadas" (Web)

** WEB BFF**

**Justificativa:**
- Precisa chamar múltiplos microsserviços (Catálogo + Usuários)
- Agregação de dados é responsabilidade do BFF
- Web precisa de resposta rica (muitos detalhes)
- Reduz latência (1 request em vez de múltiplos do cliente)

```javascript
//  Web BFF
app.get('/api/web/recommendations', async (req, res) => {
  const userId = req.user.id;

  // Chamadas paralelas
  const [userPrefs, userHistory, catalog] = await Promise.all([
    usersMS.getPreferences(userId),      // MS Usuários
    usersMS.getHistory(userId),          // MS Usuários
    catalogMS.getAll()                   // MS Catálogo
  ]);

  // Algoritmo de recomendação (no BFF)
  const recommendations = catalog
    .filter(movie => matchesPreferences(movie, userPrefs))
    .filter(movie => !wasWatched(movie, userHistory))
    .map(movie => ({
      ...movie,
      matchScore: calculateScore(movie, userPrefs),
      // Adiciona dados agregados
      castDetails: await catalogMS.getCast(movie.id),
      reviews: await catalogMS.getReviews(movie.id, { limit: 10 })
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 50);

  res.json({ recommendations });
});
```

---

### c) Buscar lista simplificada de "Novos Lançamentos" (Mobile)

**MOBILE BFF**

**Justificativa:**
- Mobile precisa de resposta **leve e rápida**
- BFF filtra campos desnecessários
- Otimiza imagens para mobile
- Aplica paginação adequada (10 itens)

```javascript
//  Mobile BFF
app.get('/api/mobile/new-releases', async (req, res) => {
  const page = req.query.page || 1;

  // Busca do MS Catálogo
  const releases = await catalogMS.getNewReleases({
    limit: 10,
    offset: (page - 1) * 10
  });

  // Transforma para formato mobile (apenas campos essenciais)
  const mobileFriendly = releases.map(movie => ({
    id: movie.id,
    title: movie.title,
    thumbnail: optimizeImageForMobile(movie.posterUrl),  // CDN mobile
    duration: movie.durationMinutes,
    rating: movie.averageRating
    //  NÃO envia: synopsis, cast, reviews, episodes...
  }));

  res.json({
    items: mobileFriendly,
    page,
    hasMore: releases.length === 10
  });
});
```

**Não fazer no Cliente:**
```javascript
// ERRADO - Cliente não deve fazer múltiplas requisições
const releases = await fetch('/catalog/all');  // 1000 filmes
const filtered = releases
  .filter(m => m.releaseYear === 2026)
  .map(m => ({ id: m.id, title: m.title }))  // Filtra no cliente
  .slice(0, 10);
```

---

### d) Registrar que usuário assistiu vídeo (atualizar histórico)

**MS USUÁRIOS** (Backend)

**Justificativa:**
- Lógica de negócio **core** da aplicação
- Persiste dados no banco
- Pode ter regras complexas (contabilizar tempo assistido, marcar como "concluído", etc.)
- Deve ser consistente em todas as plataformas

```javascript
//  MS Usuários (microsserviço)
class HistoryService {
  async recordWatch(userId, videoId, watchData) {
    // Validações de negócio
    if (watchData.progress < 0 || watchData.progress > 100) {
      throw new Error('Invalid progress');
    }

    // Lógica de negócio complexa
    const existingRecord = await db.history.findOne({ userId, videoId });
    
    if (existingRecord) {
      // Atualiza progresso
      await db.history.update({
        userId,
        videoId,
        progress: watchData.progress,
        lastWatched: new Date(),
        completed: watchData.progress >= 90  // Regra de negócio
      });
    } else {
      // Cria novo registro
      await db.history.create({
        userId,
        videoId,
        progress: watchData.progress,
        startedAt: new Date()
      });
    }

    // Eventos para outros sistemas
    await eventBus.publish('video.watched', { userId, videoId });
  }
}
```

```javascript
// BFF apenas faz proxy
app.post('/api/mobile/watch', async (req, res) => {
  const { videoId, progress } = req.body;
  
  // Simplesmente repassa para MS Usuários
  await usersMS.recordWatch(req.user.id, videoId, { progress });
  
  res.json({ success: true });
});
```

**Não fazer no BFF:**
```javascript
// ERRADO - BFF não deve ter lógica de negócio core
app.post('/api/mobile/watch', async (req, res) => {
  //  Lógica de negócio no BFF (ERRADO!)
  const progress = calculateProgress(req.body.currentTime, req.body.duration);
  if (progress > 90) {
    await markAsCompleted(userId, videoId);
  }
  // ...
});
```

---

### e) Adaptar qualidade do stream baseado na conexão (Mobile)

**MOBILE BFF** + **MS STREAMING**

**Justificativa:**
- **BFF**: Detecta velocidade da conexão (headers, dados históricos)
- **MS Streaming**: Tem a lógica de transcodificação e URLs de cada qualidade

```javascript
// Mobile BFF (decisão de qualidade)
app.get('/api/mobile/video/:id/stream', async (req, res) => {
  const videoId = req.params.id;
  const userId = req.user.id;

  // Detecta qualidade ideal para mobile
  const connectionSpeed = detectConnectionSpeed(req);
  const deviceType = req.headers['user-agent'];
  const userHistory = await getUserNetworkHistory(userId);

  // Lógica de decisão no BFF
  let quality;
  if (connectionSpeed < 1) {  // < 1 Mbps
    quality = '360p';
  } else if (connectionSpeed < 3) {  // 1-3 Mbps
    quality = '480p';
  } else if (connectionSpeed < 8) {  // 3-8 Mbps
    quality = '720p';
  } else {
    quality = '1080p';
  }

  // Salva histórico para futuras decisões
  await saveNetworkHistory(userId, connectionSpeed);

  // MS Streaming fornece URLs de cada qualidade
  const streamData = await streamingMS.getStream(videoId, {
    quality,
    adaptiveBitrate: true,  // HLS/DASH
    deviceType
  });

  res.json({
    streamUrl: streamData.url,
    quality,
    alternativeQualities: streamData.available,  // Permite troca manual
    manifestUrl: streamData.manifestUrl  // Para adaptive streaming
  });
});
```

```javascript
// MS Streaming (fornece streams)
class StreamingService {
  async getStream(videoId, options) {
    const video = await db.videos.findById(videoId);

    // Retorna URL do stream na qualidade solicitada
    return {
      url: `${CDN_URL}/videos/${videoId}/${options.quality}/playlist.m3u8`,
      available: ['360p', '480p', '720p', '1080p', '4K'],
      manifestUrl: `${CDN_URL}/videos/${videoId}/manifest.mpd`
    };
  }
}
```

---

### f) Validação de formato de e-mail no cadastro (Web)

**CLIENTE (Web)** + **MS USUÁRIOS**

**Justificativa:**
- **Cliente**: Validação **imediata** (UX) - usuário vê erro instantaneamente
- **MS Usuários**: Validação **de segurança** - não confia no cliente

```javascript
//  Cliente Web (validação de UX)
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return 'E-mail é obrigatório';
  }
  
  if (!regex.test(email)) {
    return 'E-mail inválido';  // Feedback imediato
  }
  
  return null;  // Válido
}

// Componente React
const [email, setEmail] = useState('');
const [error, setError] = useState('');

const handleSubmit = async () => {
  // Valida no cliente PRIMEIRO (UX)
  const validationError = validateEmail(email);
  if (validationError) {
    setError(validationError);  // Mostra erro instantaneamente
    return;
  }

  // Envia para backend
  try {
    await fetch('/api/web/users', {
      method: 'POST',
      body: JSON.stringify({ email, ... })
    });
  } catch (err) {
    setError(err.message);
  }
};
```

```javascript
//  MS Usuários (validação de segurança)
class UserService {
  async createUser(userData) {
    // SEMPRE valida no backend (segurança)
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');  // Não confia no cliente
    }

    // Validações adicionais que cliente não faz
    const existingUser = await db.users.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Cria usuário
    return db.users.create(userData);
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

**Regra de Ouro:**
```
Validação de FORMATO → Cliente (UX) + Backend (Segurança)
Validação de NEGÓCIO → Backend (ex: e-mail já existe)
```

---

##  Tabela Resumo de Responsabilidades

| Tarefa | Cliente | BFF | MS Backend | Justificativa |
|--------|---------|-----|------------|---------------|
| **a) Renderizar UI** | ✅ | ❌ | ❌ | Específico de cada plataforma |
| **b) Agregar dados Web** | ❌ | ✅ Web BFF | ❌ | Orquestração de múltiplos MS |
| **c) Lista Mobile simplificada** | ❌ | ✅ Mobile BFF | ❌ | Filtragem e otimização mobile |
| **d) Registrar histórico** | ❌ | ❌ | ✅ MS Usuários | Lógica de negócio core |
| **e) Adaptar qualidade stream** | ❌ | ✅ Decisão | ✅ URLs | BFF decide, MS fornece |
| **f) Validar e-mail** | ✅ UX | ❌ | ✅ Segurança | Dupla validação |

---

##  Princípios de Distribuição

### 1. **Cliente**
```
✅ Renderização de UI
✅ Validações de UX (feedback imediato)
✅ Estado local (carrinho, preferências temporárias)
✅ Animações e transições
❌ Lógica de negócio
❌ Acesso direto a microsserviços
```

### 2. **BFF**
```
✅ Orquestração de microsserviços
✅ Agregação de dados
✅ Formatação específica por cliente
✅ Cache otimizado por plataforma
✅ Transformação de dados (ex: otimizar imagens)
❌ Lógica de negócio core
❌ Persistência de dados principais
```

### 3. **Microsserviços**
```
✅ Lógica de negócio core
✅ Persistência de dados
✅ Validações críticas de segurança
✅ Eventos de domínio
✅ Integrações com sistemas externos
❌ Conhecimento sobre clientes específicos
❌ Formatação de UI
```

---

## Conclusão

### Decisões Principais

1. **✅ Múltiplos BFFs**: Independência, otimização, escalabilidade
2. **✅ API Gateway**: Segurança, rate limiting, roteamento
3. **✅ Responsabilidades claras**: Cliente (UI), BFF (orquestração), MS (negócio)

### Benefícios da Solução

| Benefício | Impacto |
|-----------|---------|
| **Performance** | Mobile 5x mais rápido (payload menor) |
| **Escalabilidade** | Mobile BFF escala independente do Web BFF |
| **Manutenibilidade** | Mudanças no Web não afetam Mobile |
| **Time-to-Market** | Times trabalham em paralelo |
| **Experiência do Usuário** | Interface otimizada para cada plataforma |

### Métricas de Sucesso

```
Sem BFF:
- Web: 20 requisições ao carregar página
- Mobile: 3s de carregamento inicial
- TV: 15 requisições, navegação lenta

Com BFF:
- Web: 3 requisições (agregadas no BFF)
- Mobile: 0.5s de carregamento inicial
- TV: 2 requisições, navegação fluida
```
