# Referência da API Bling v3

> **Base URL:** `https://api.bling.com.br/Api/v3`  
> **Versão:** API v3 (OAuth 2.0)  
> **Fonte:** [developer.bling.com.br](https://developer.bling.com.br)

---

## Sumário

1. [Introdução](#introdução)
2. [Autenticação](#autenticação)
3. [Estrutura das Requisições](#estrutura-das-requisições)
4. [Paginação](#paginação)
5. [Erros e Exceções](#erros-e-exceções)
6. [Webhooks](#webhooks)
7. [Referência de Endpoints](#referência-de-endpoints)
   - [Borderos](#borderos)
   - [Campos Customizados](#campos-customizados)
   - [Canais de Venda](#canais-de-venda)
   - [Categorias - Lojas](#categorias---lojas)
   - [Categorias - Produtos](#categorias---produtos)
   - [Categorias - Receitas e Despesas](#categorias---receitas-e-despesas)
   - [Contas a Pagar](#contas-a-pagar)
   - [Contas a Receber](#contas-a-receber)
   - [Contas Contábeis](#contas-contábeis)
   - [Contatos](#contatos)
   - [Contatos - Tipos](#contatos---tipos)
   - [Contratos](#contratos)
   - [Depósitos](#depósitos)
   - [Empresas](#empresas)
   - [Estoques](#estoques)
   - [Formas de Pagamento](#formas-de-pagamento)
   - [Grupos de Produtos](#grupos-de-produtos)
   - [Logísticas](#logísticas)
   - [Logísticas - Etiquetas](#logísticas---etiquetas)
   - [Logísticas - Objetos](#logísticas---objetos)
   - [Logísticas - Remessas](#logísticas---remessas)
   - [Logísticas - Serviços](#logísticas---serviços)
   - [Naturezas de Operações](#naturezas-de-operações)
   - [Notas Fiscais de Consumidor Eletrônicas (NFC-e)](#notas-fiscais-de-consumidor-eletrônicas-nfc-e)
   - [Notas Fiscais de Serviço Eletrônicas (NFS-e)](#notas-fiscais-de-serviço-eletrônicas-nfs-e)
   - [Notas Fiscais Eletrônicas (NF-e)](#notas-fiscais-eletrônicas-nf-e)
   - [Notificações](#notificações)
   - [Ordens de Produção](#ordens-de-produção)
   - [Pedidos - Compras](#pedidos---compras)
   - [Pedidos - Vendas](#pedidos---vendas)
   - [Produtos](#produtos)
   - [Produtos - Estruturas](#produtos---estruturas)
   - [Produtos - Fornecedores](#produtos---fornecedores)
   - [Produtos - Lojas](#produtos---lojas)
   - [Produtos - Variações](#produtos---variações)
   - [Propostas Comerciais](#propostas-comerciais)
   - [Situações](#situações)
   - [Situações - Módulos](#situações---módulos)
   - [Situações - Transições](#situações---transições)
   - [Usuários](#usuários)
   - [Vendedores](#vendedores)
   - [Homologação](#homologação)
8. [Boas Práticas](#boas-práticas)

---

## Introdução

O Bling é um ERP que facilita a emissão de notas fiscais e boletos, além de realizar integrações nativas com plataformas de e-commerce, marketplaces e logísticas.

A API Bling é estruturada no padrão **REST** e utiliza os métodos `GET`, `POST`, `PUT`, `PATCH` e `DELETE`, com autenticação via **OAuth 2.0**. Todas as respostas são entregues em formato **JSON**.

**Exemplo básico de requisição:**

```bash
GET https://api.bling.com.br/Api/v3/produtos
Authorization: Bearer {access_token}
```

---

## Autenticação

### Fluxo OAuth 2.0 (Authorization Code)

**1. Redirecionar o usuário para autorização:**

```
GET https://www.bling.com.br/Api/v3/oauth/authorize
  ?response_type=code
  &client_id={client_id}
  &state={state_unico}
```

**2. Trocar o `authorization_code` pelo `access_token`:**

```bash
POST https://www.bling.com.br/Api/v3/oauth/token
Authorization: Basic {base64(client_id:client_secret)}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code={authorization_code}
```

**Resposta:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 21600,
  "refresh_token": "def50200...",
  "scope": "produtos contatos pedidos"
}
```

**3. Renovar token com `refresh_token`:**

```bash
POST https://www.bling.com.br/Api/v3/oauth/token
Authorization: Basic {base64(client_id:client_secret)}
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={refresh_token}
```

> O `access_token` expira em **6 horas**. O `refresh_token` expira em **30 dias**.

**4. Revogar um token:**

```bash
POST https://www.bling.com.br/Api/v3/oauth/revoke
Authorization: Basic {base64(client_id:client_secret)}
Content-Type: application/x-www-form-urlencoded

token={access_token_ou_refresh_token}
```

### Usando o token nas requisições

Insira o `access_token` no cabeçalho `Authorization` com o esquema `Bearer`:

```bash
curl -X GET "https://api.bling.com.br/Api/v3/contatos" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json"
```

---

## Estrutura das Requisições

| Elemento | Descrição |
|----------|-----------|
| **Método HTTP** | Define a ação: `GET` (obter), `POST` (criar), `PUT` (atualizar tudo), `PATCH` (atualizar parcialmente), `DELETE` (remover) |
| **Header** | Cabeçalho da requisição. Ex: `Authorization: Bearer {token}`, `Content-Type: application/json` |
| **URI** | Caminho do endpoint. Ex: `/Api/v3/produtos` |
| **Body** | Corpo da requisição em JSON (nos métodos `POST`, `PUT`, `PATCH`) |

---

## Paginação

A paginação é utilizada em requisições `GET`. Utilize os parâmetros:

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `pagina` | Número da página | 1 |
| `limite` | Quantidade de registros por página | 100 (máx. 100) |

**Exemplo:**

```bash
GET https://api.bling.com.br/Api/v3/produtos?pagina=2&limite=50
Authorization: Bearer {access_token}
```

---

## Erros e Exceções

### Códigos HTTP de erro

| Código | Tipo | Descrição |
|--------|------|-----------|
| `400` | `VALIDATION_ERROR` | Erros na validação dos campos enviados |
| `400` | `MISSING_REQUIRED_FIELD_ERROR` | Campos obrigatórios não foram enviados |
| `400` | `UNKNOWN_ERROR` | Operação não pôde ser concluída |
| `401` | `UNAUTHORIZED` | Chave de acesso inválida ou ausente |
| `403` | `FORBIDDEN` | Token sem permissão para o escopo requisitado |
| `404` | `RESOURCE_NOT_FOUND` | URN/URI inexistente ou recurso não encontrado |
| `429` | `TOO_MANY_REQUESTS` | Limite de requisições atingido |
| `500` | `SERVER_ERROR` | Falha interna no servidor |

**Estrutura do erro retornado:**

```json
{
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "Erro de validação",
    "description": "O campo 'nome' é obrigatório."
  }
}
```

---

## Webhooks

Webhooks permitem receber notificações em tempo real quando eventos ocorrem no Bling (criação, atualização, exclusão de recursos).

**Configuração:**
1. Acesse as configurações do aplicativo na Central de Extensões
2. Navegue até a aba **Webhooks**
3. Configure os servidores que receberão os eventos
4. Configure os recursos para os quais deseja notificações

> O sistema realiza retentativas por até **3 dias** em caso de falha na entrega. Após esse período, a configuração do webhook para o recurso em questão será desabilitada automaticamente.

**Exemplo de payload recebido:**

```json
{
  "data": {
    "id": 12345,
    "evento": "produto:atualizado",
    "timestamp": "2025-08-01T12:00:00Z",
    "dados": {
      "id": 12345,
      "descricao": "Produto Exemplo"
    }
  }
}
```

> **Atenção:** Não há garantia de entrega dos eventos na ordem em que foram gerados. Recomenda-se gerenciar webhooks de forma assíncrona (ex.: utilizando filas).

---

## Referência de Endpoints

> **Convenção:**
> - `{id}` = ID numérico do recurso
> - Todos os endpoints são prefixados por `https://api.bling.com.br/Api/v3`
> - Todas as requisições requerem `Authorization: Bearer {access_token}`

---

### Borderos

Gerenciamento de borderos financeiros.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/borderos` | Lista todos os borderos |
| `GET` | `/borderos/{id}` | Retorna um bordero específico |
| `POST` | `/borderos` | Cria um novo bordero |
| `DELETE` | `/borderos/{id}` | Remove um bordero |

**Exemplo – Listar borderos:**

```bash
curl -X GET "https://api.bling.com.br/Api/v3/borderos?pagina=1&limite=100" \
  -H "Authorization: Bearer {access_token}"
```

---

### Campos Customizados

Gerenciamento de campos personalizados do sistema.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/camposcustomizados` | Lista campos customizados |
| `GET` | `/camposcustomizados/{id}` | Retorna um campo customizado |
| `POST` | `/camposcustomizados` | Cria um campo customizado |
| `PUT` | `/camposcustomizados/{id}` | Atualiza um campo customizado |
| `DELETE` | `/camposcustomizados/{id}` | Remove um campo customizado |

---

### Canais de Venda

Gerenciamento dos canais de venda integrados.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/canaisdevenda` | Lista os canais de venda |
| `GET` | `/canaisdevenda/{id}` | Retorna um canal de venda |

**Exemplo – Listar canais de venda:**

```bash
curl -X GET "https://api.bling.com.br/Api/v3/canaisdevenda" \
  -H "Authorization: Bearer {access_token}"
```

---

### Categorias - Lojas

Gerenciamento de categorias para lojas virtuais.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/categorias/lojas` | Lista as categorias de loja |
| `GET` | `/categorias/lojas/{id}` | Retorna uma categoria de loja |
| `POST` | `/categorias/lojas` | Cria uma categoria de loja |
| `PUT` | `/categorias/lojas/{id}` | Atualiza uma categoria de loja |
| `DELETE` | `/categorias/lojas/{id}` | Remove uma categoria de loja |

---

### Categorias - Produtos

Gerenciamento de categorias de produtos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/categorias/produtos` | Lista as categorias de produtos |
| `GET` | `/categorias/produtos/{id}` | Retorna uma categoria de produto |
| `POST` | `/categorias/produtos` | Cria uma categoria de produto |
| `PUT` | `/categorias/produtos/{id}` | Atualiza uma categoria de produto |
| `DELETE` | `/categorias/produtos/{id}` | Remove uma categoria de produto |

**Exemplo – Criar categoria de produto:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/categorias/produtos" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Eletrônicos",
    "idCategoriaPai": null
  }'
```

---

### Categorias - Receitas e Despesas

Gerenciamento de categorias financeiras.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/categorias/receitasdespesas` | Lista as categorias financeiras |
| `GET` | `/categorias/receitasdespesas/{id}` | Retorna uma categoria financeira |
| `POST` | `/categorias/receitasdespesas` | Cria uma categoria financeira |
| `PUT` | `/categorias/receitasdespesas/{id}` | Atualiza uma categoria financeira |
| `DELETE` | `/categorias/receitasdespesas/{id}` | Remove uma categoria financeira |

---

### Contas a Pagar

Gerenciamento de contas a pagar.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/contas/pagar` | Lista as contas a pagar |
| `GET` | `/contas/pagar/{id}` | Retorna uma conta a pagar |
| `POST` | `/contas/pagar` | Cria uma conta a pagar |
| `PUT` | `/contas/pagar/{id}` | Atualiza uma conta a pagar |
| `PATCH` | `/contas/pagar/{id}/baixar` | Realiza baixa de uma conta a pagar |
| `DELETE` | `/contas/pagar/{id}` | Remove uma conta a pagar |

**Exemplo – Criar conta a pagar:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/contas/pagar" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "vencimento": "2025-09-01",
    "valor": 150.00,
    "historico": "Pagamento fornecedor XYZ",
    "idFormaPagamento": 1
  }'
```

---

### Contas a Receber

Gerenciamento de contas a receber.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/contas/receber` | Lista as contas a receber |
| `GET` | `/contas/receber/{id}` | Retorna uma conta a receber |
| `POST` | `/contas/receber` | Cria uma conta a receber |
| `PUT` | `/contas/receber/{id}` | Atualiza uma conta a receber |
| `PATCH` | `/contas/receber/{id}/baixar` | Realiza baixa de uma conta a receber |
| `DELETE` | `/contas/receber/{id}` | Remove uma conta a receber |

---

### Contas Contábeis

Gerenciamento do plano de contas contábeis.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/contascontabeis` | Lista as contas contábeis |
| `GET` | `/contascontabeis/{id}` | Retorna uma conta contábil |
| `POST` | `/contascontabeis` | Cria uma conta contábil |
| `PUT` | `/contascontabeis/{id}` | Atualiza uma conta contábil |
| `DELETE` | `/contascontabeis/{id}` | Remove uma conta contábil |

---

### Contatos

Gerenciamento de clientes, fornecedores e contatos em geral.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/contatos` | Lista os contatos |
| `GET` | `/contatos/{id}` | Retorna um contato específico |
| `POST` | `/contatos` | Cria um novo contato |
| `PUT` | `/contatos/{id}` | Atualiza todos os dados de um contato |
| `PATCH` | `/contatos/{id}/situacoes` | Atualiza a situação de um contato |
| `DELETE` | `/contatos/{id}` | Remove um contato |

**Exemplo – Listar contatos:**

```bash
curl -X GET "https://api.bling.com.br/Api/v3/contatos?pagina=1&limite=100" \
  -H "Authorization: Bearer {access_token}"
```

**Exemplo – Criar contato (Pessoa Física):**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/contatos" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João da Silva",
    "tipo": "F",
    "cpf": "000.000.000-00",
    "email": "joao@email.com",
    "telefone": "(11) 99999-9999",
    "situacao": "A"
  }'
```

**Exemplo – Criar contato (Pessoa Jurídica):**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/contatos" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa LTDA",
    "tipo": "J",
    "cnpj": "00.000.000/0001-00",
    "email": "contato@empresa.com.br",
    "situacao": "A"
  }'
```

---

### Contatos - Tipos

Gerenciamento de tipos de contatos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/contatos/tipos` | Lista os tipos de contato |
| `GET` | `/contatos/tipos/{id}` | Retorna um tipo de contato |
| `POST` | `/contatos/tipos` | Cria um tipo de contato |
| `PUT` | `/contatos/tipos/{id}` | Atualiza um tipo de contato |
| `DELETE` | `/contatos/tipos/{id}` | Remove um tipo de contato |

---

### Contratos

Gerenciamento de contratos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/contratos` | Lista os contratos |
| `GET` | `/contratos/{id}` | Retorna um contrato |
| `POST` | `/contratos` | Cria um contrato |
| `PUT` | `/contratos/{id}` | Atualiza um contrato |
| `DELETE` | `/contratos/{id}` | Remove um contrato |

---

### Depósitos

Gerenciamento de depósitos/almoxarifados de estoque.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/depositos` | Lista os depósitos |
| `GET` | `/depositos/{id}` | Retorna um depósito |
| `POST` | `/depositos` | Cria um depósito |
| `PUT` | `/depositos/{id}` | Atualiza um depósito |
| `DELETE` | `/depositos/{id}` | Remove um depósito |

**Exemplo – Criar depósito:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/depositos" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Depósito Central",
    "situacao": "A"
  }'
```

---

### Empresas

Gerenciamento de dados da empresa.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/empresas` | Retorna os dados da empresa |
| `PUT` | `/empresas/{id}` | Atualiza os dados da empresa |

---

### Estoques

Gerenciamento de saldos de estoque por produto e depósito.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/estoques` | Lista os saldos de estoque |
| `GET` | `/estoques/{id}` | Retorna o estoque de um produto |
| `POST` | `/estoques` | Lança movimentação de estoque |

**Exemplo – Consultar estoque de um produto:**

```bash
curl -X GET "https://api.bling.com.br/Api/v3/estoques/{idProduto}" \
  -H "Authorization: Bearer {access_token}"
```

**Exemplo – Lançar movimentação de estoque:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/estoques" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "produto": { "id": 123456 },
    "deposito": { "id": 1 },
    "operacao": "E",
    "quantidade": 10,
    "preco": 25.50,
    "observacoes": "Entrada de estoque - NF 001"
  }'
```

---

### Formas de Pagamento

Gerenciamento das formas de pagamento.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/formaspagamento` | Lista as formas de pagamento |
| `GET` | `/formaspagamento/{id}` | Retorna uma forma de pagamento |
| `POST` | `/formaspagamento` | Cria uma forma de pagamento |
| `PUT` | `/formaspagamento/{id}` | Atualiza uma forma de pagamento |
| `DELETE` | `/formaspagamento/{id}` | Remove uma forma de pagamento |

---

### Grupos de Produtos

Gerenciamento de grupos para categorização de produtos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/gruposprodutos` | Lista os grupos de produtos |
| `GET` | `/gruposprodutos/{id}` | Retorna um grupo de produto |
| `POST` | `/gruposprodutos` | Cria um grupo de produto |
| `PUT` | `/gruposprodutos/{id}` | Atualiza um grupo de produto |
| `DELETE` | `/gruposprodutos/{id}` | Remove um grupo de produto |

---

### Logísticas

Gerenciamento de transportadoras e serviços logísticos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/logisticas` | Lista as logísticas |
| `GET` | `/logisticas/{id}` | Retorna uma logística |
| `POST` | `/logisticas` | Cria uma logística |
| `PUT` | `/logisticas/{id}` | Atualiza uma logística |
| `DELETE` | `/logisticas/{id}` | Remove uma logística |

---

### Logísticas - Etiquetas

Gerenciamento de etiquetas de envio.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/logisticas/etiquetas` | Lista as etiquetas |
| `GET` | `/logisticas/etiquetas/{id}` | Retorna uma etiqueta |
| `POST` | `/logisticas/etiquetas` | Gera uma etiqueta |

---

### Logísticas - Objetos

Gerenciamento de objetos/pacotes de envio.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/logisticas/objetos` | Lista os objetos |
| `GET` | `/logisticas/objetos/{id}` | Retorna um objeto |
| `POST` | `/logisticas/objetos` | Cria um objeto |
| `PATCH` | `/logisticas/objetos/{id}` | Atualiza parcialmente um objeto |
| `DELETE` | `/logisticas/objetos/{id}` | Remove um objeto |

---

### Logísticas - Remessas

Gerenciamento de remessas de envio.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/logisticas/remessas` | Lista as remessas |
| `GET` | `/logisticas/remessas/{id}` | Retorna uma remessa |
| `POST` | `/logisticas/remessas` | Cria uma remessa |
| `DELETE` | `/logisticas/remessas/{id}` | Remove uma remessa |

---

### Logísticas - Serviços

Gerenciamento de serviços logísticos disponíveis.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/logisticas/servicos` | Lista os serviços logísticos |
| `GET` | `/logisticas/servicos/{id}` | Retorna um serviço logístico |

---

### Naturezas de Operações

Gerenciamento das naturezas de operações fiscais (CFOP).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/naturezasdeoperacoes` | Lista as naturezas de operações |
| `GET` | `/naturezasdeoperacoes/{id}` | Retorna uma natureza de operação |
| `POST` | `/naturezasdeoperacoes` | Cria uma natureza de operação |
| `PUT` | `/naturezasdeoperacoes/{id}` | Atualiza uma natureza de operação |
| `DELETE` | `/naturezasdeoperacoes/{id}` | Remove uma natureza de operação |

---

### Notas Fiscais de Consumidor Eletrônicas (NFC-e)

Gerenciamento de NFC-e (Nota Fiscal de Consumidor Eletrônica).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/nfce` | Lista as NFC-e |
| `GET` | `/nfce/{id}` | Retorna uma NFC-e |
| `POST` | `/nfce` | Cria e envia uma NFC-e |
| `DELETE` | `/nfce/{id}` | Cancela/remove uma NFC-e |
| `POST` | `/nfce/{id}/enviar` | Envia a NFC-e para a SEFAZ |

**Exemplo – Emitir NFC-e:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/nfce" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "contato": { "id": 12345 },
    "itens": [
      {
        "produto": { "id": 67890 },
        "quantidade": 1,
        "valor": 99.90
      }
    ],
    "parcelas": [
      {
        "formaPagamento": { "id": 1 },
        "valor": 99.90
      }
    ]
  }'
```

---

### Notas Fiscais de Serviço Eletrônicas (NFS-e)

Gerenciamento de NFS-e (Nota Fiscal de Serviço Eletrônica).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/nfse` | Lista as NFS-e |
| `GET` | `/nfse/{id}` | Retorna uma NFS-e |
| `POST` | `/nfse` | Cria uma NFS-e |
| `DELETE` | `/nfse/{id}` | Cancela/remove uma NFS-e |
| `POST` | `/nfse/{id}/enviar` | Envia a NFS-e |

---

### Notas Fiscais Eletrônicas (NF-e)

Gerenciamento de NF-e (Nota Fiscal Eletrônica).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/nfe` | Lista as NF-e |
| `GET` | `/nfe/{id}` | Retorna uma NF-e |
| `POST` | `/nfe` | Cria uma NF-e |
| `DELETE` | `/nfe/{id}` | Cancela/remove uma NF-e |
| `POST` | `/nfe/{id}/enviar` | Envia a NF-e para a SEFAZ |
| `GET` | `/nfe/{id}/xml` | Obtém o XML da NF-e |
| `GET` | `/nfe/{id}/danfe` | Obtém o DANFE (PDF) da NF-e |

**Exemplo – Emitir NF-e:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/nfe" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": 1,
    "finalidade": 1,
    "contato": { "id": 12345 },
    "itens": [
      {
        "produto": { "id": 67890 },
        "quantidade": 2,
        "valor": 50.00,
        "aliquotaIPI": 0,
        "aliquotaICMS": 12
      }
    ],
    "parcelas": [
      {
        "formaPagamento": { "id": 1 },
        "valor": 100.00,
        "vencimento": "2025-09-01"
      }
    ],
    "transporte": {
      "modalidadeFrete": 0
    }
  }'
```

---

### Notificações

Gerenciamento de notificações do sistema.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/notificacoes` | Lista as notificações |
| `GET` | `/notificacoes/{id}` | Retorna uma notificação |
| `PATCH` | `/notificacoes/{id}/marcar-lida` | Marca notificação como lida |

---

### Ordens de Produção

Gerenciamento de ordens de produção.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/ordesproducao` | Lista as ordens de produção |
| `GET` | `/ordesproducao/{id}` | Retorna uma ordem de produção |
| `POST` | `/ordesproducao` | Cria uma ordem de produção |
| `PUT` | `/ordesproducao/{id}` | Atualiza uma ordem de produção |
| `PATCH` | `/ordesproducao/{id}/situacoes` | Atualiza a situação |
| `DELETE` | `/ordesproducao/{id}` | Remove uma ordem de produção |

---

### Pedidos - Compras

Gerenciamento de pedidos de compra.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/pedidos/compras` | Lista os pedidos de compra |
| `GET` | `/pedidos/compras/{id}` | Retorna um pedido de compra |
| `POST` | `/pedidos/compras` | Cria um pedido de compra |
| `PUT` | `/pedidos/compras/{id}` | Atualiza um pedido de compra |
| `PATCH` | `/pedidos/compras/{id}/situacoes` | Atualiza a situação do pedido |
| `DELETE` | `/pedidos/compras/{id}` | Remove um pedido de compra |

**Exemplo – Criar pedido de compra:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/pedidos/compras" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "fornecedor": { "id": 11111 },
    "data": "2025-08-01",
    "itens": [
      {
        "produto": { "id": 67890 },
        "quantidade": 100,
        "valor": 10.00
      }
    ]
  }'
```

---

### Pedidos - Vendas

Gerenciamento de pedidos de venda.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/pedidos/vendas` | Lista os pedidos de venda |
| `GET` | `/pedidos/vendas/{id}` | Retorna um pedido de venda |
| `POST` | `/pedidos/vendas` | Cria um pedido de venda |
| `PUT` | `/pedidos/vendas/{id}` | Atualiza um pedido de venda |
| `PATCH` | `/pedidos/vendas/{id}/situacoes` | Atualiza a situação do pedido |
| `DELETE` | `/pedidos/vendas/{id}` | Remove um pedido de venda |

**Exemplo – Criar pedido de venda:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/pedidos/vendas" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": { "id": 12345 },
    "data": "2025-08-01",
    "vendedor": { "id": 1 },
    "itens": [
      {
        "produto": { "id": 67890 },
        "quantidade": 2,
        "valor": 99.90,
        "desconto": 0
      }
    ],
    "parcelas": [
      {
        "formaPagamento": { "id": 1 },
        "valor": 199.80,
        "vencimento": "2025-09-01"
      }
    ]
  }'
```

---

### Produtos

Gerenciamento completo do catálogo de produtos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/produtos` | Lista os produtos |
| `GET` | `/produtos/{id}` | Retorna um produto específico |
| `POST` | `/produtos` | Cria um produto |
| `PUT` | `/produtos/{id}` | Atualiza todos os dados de um produto |
| `PATCH` | `/produtos/{id}/situacoes` | Atualiza a situação do produto |
| `DELETE` | `/produtos/{id}` | Remove um produto |

**Parâmetros de filtro (GET /produtos):**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `pagina` | `int` | Número da página |
| `limite` | `int` | Registros por página (máx. 100) |
| `criterio` | `int` | 1=Ativo, 2=Inativo, 3=Todos |
| `tipo` | `string` | P=Produto, S=Serviço, L=Lote |
| `idCategoria` | `int` | Filtrar por categoria |
| `dataInclusaoInicial` | `date` | Data de inclusão inicial |
| `dataInclusaoFinal` | `date` | Data de inclusão final |
| `dataAlteracaoInicial` | `date` | Data de alteração inicial |
| `dataAlteracaoFinal` | `date` | Data de alteração final |

**Exemplo – Listar produtos ativos:**

```bash
curl -X GET "https://api.bling.com.br/Api/v3/produtos?criterio=1&pagina=1&limite=100" \
  -H "Authorization: Bearer {access_token}"
```

**Exemplo – Criar produto:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/produtos" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Camiseta Branca M",
    "codigo": "CAM-001",
    "preco": 49.90,
    "tipo": "P",
    "situacao": "A",
    "unidade": "UN",
    "peso": {
      "bruto": 0.3,
      "liquido": 0.25
    },
    "categoria": { "id": 1 }
  }'
```

**Exemplo – Atualizar situação do produto:**

```bash
curl -X PATCH "https://api.bling.com.br/Api/v3/produtos/67890/situacoes" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{ "situacao": "I" }'
```

---

### Produtos - Estruturas

Gerenciamento de produtos compostos (fichas técnicas).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/produtos/{idProdutoPai}/estruturas` | Lista a estrutura de um produto |
| `POST` | `/produtos/{idProdutoPai}/estruturas` | Cria a estrutura de um produto |
| `PUT` | `/produtos/{idProdutoPai}/estruturas` | Atualiza a estrutura de um produto |
| `DELETE` | `/produtos/{idProdutoPai}/estruturas` | Remove a estrutura de um produto |

---

### Produtos - Fornecedores

Vínculo entre produtos e seus fornecedores.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/produtos/{idProduto}/fornecedores` | Lista fornecedores de um produto |
| `POST` | `/produtos/{idProduto}/fornecedores` | Adiciona um fornecedor ao produto |
| `PUT` | `/produtos/{idProduto}/fornecedores/{id}` | Atualiza vínculo produto-fornecedor |
| `DELETE` | `/produtos/{idProduto}/fornecedores/{id}` | Remove vínculo produto-fornecedor |

---

### Produtos - Lojas

Gerenciamento de produtos em lojas virtuais.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/produtos/{idProduto}/lojas` | Lista os dados do produto nas lojas |
| `POST` | `/produtos/{idProduto}/lojas` | Vincula produto a uma loja |
| `PUT` | `/produtos/{idProduto}/lojas/{id}` | Atualiza produto na loja |
| `DELETE` | `/produtos/{idProduto}/lojas/{id}` | Remove produto da loja |

---

### Produtos - Variações

Gerenciamento de variações de produtos (cor, tamanho, etc.).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/produtos/{idProdutoPai}/variacoes` | Lista as variações de um produto |
| `POST` | `/produtos/{idProdutoPai}/variacoes` | Cria uma variação |
| `PUT` | `/produtos/{idProdutoPai}/variacoes/{id}` | Atualiza uma variação |
| `DELETE` | `/produtos/{idProdutoPai}/variacoes/{id}` | Remove uma variação |

**Exemplo – Criar variação:**

```bash
curl -X POST "https://api.bling.com.br/Api/v3/produtos/67890/variacoes" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Camiseta Branca G",
    "codigo": "CAM-001-G",
    "preco": 49.90,
    "variacao": {
      "nome": "Tamanho:G"
    }
  }'
```

---

### Propostas Comerciais

Gerenciamento de propostas comerciais/orçamentos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/propostascomerciais` | Lista as propostas comerciais |
| `GET` | `/propostascomerciais/{id}` | Retorna uma proposta comercial |
| `POST` | `/propostascomerciais` | Cria uma proposta comercial |
| `PUT` | `/propostascomerciais/{id}` | Atualiza uma proposta comercial |
| `DELETE` | `/propostascomerciais/{id}` | Remove uma proposta comercial |

---

### Situações

Gerenciamento das situações (status) dos módulos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/situacoes` | Lista as situações disponíveis |
| `GET` | `/situacoes/{id}` | Retorna uma situação |
| `POST` | `/situacoes` | Cria uma situação |
| `PUT` | `/situacoes/{id}` | Atualiza uma situação |
| `DELETE` | `/situacoes/{id}` | Remove uma situação |

---

### Situações - Módulos

Gerenciamento dos módulos que possuem situações.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/situacoes/modulos` | Lista os módulos com situações |
| `GET` | `/situacoes/modulos/{id}` | Retorna um módulo |

---

### Situações - Transições

Gerenciamento das transições permitidas entre situações.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/situacoes/{idSituacao}/transicoes` | Lista as transições de uma situação |
| `POST` | `/situacoes/{idSituacao}/transicoes` | Cria uma transição |
| `DELETE` | `/situacoes/{idSituacao}/transicoes/{id}` | Remove uma transição |

---

### Usuários

Gerenciamento de usuários do sistema.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/usuarios` | Lista os usuários |
| `GET` | `/usuarios/{id}` | Retorna um usuário |
| `PUT` | `/usuarios/{id}` | Atualiza um usuário |

---

### Vendedores

Gerenciamento de vendedores.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/vendedores` | Lista os vendedores |
| `GET` | `/vendedores/{id}` | Retorna um vendedor |
| `POST` | `/vendedores` | Cria um vendedor |
| `PUT` | `/vendedores/{id}` | Atualiza um vendedor |
| `DELETE` | `/vendedores/{id}` | Remove um vendedor |

---

### Homologação

Endpoints de ambiente sandbox para testes e homologação de aplicativos.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/homologacao/produtos` | Lista produtos de teste |
| `POST` | `/homologacao/produtos` | Cria produto de teste |
| `PUT` | `/homologacao/produtos/{id}` | Atualiza produto de teste |
| `PATCH` | `/homologacao/produtos/{id}/situacoes` | Atualiza situação (teste) |
| `DELETE` | `/homologacao/produtos/{id}` | Remove produto de teste |

**Fluxo de homologação:**

```bash
# 1. Obter dados de teste
GET https://api.bling.com.br/Api/v3/homologacao/produtos

# 2. Criar produto com os dados retornados
POST https://api.bling.com.br/Api/v3/homologacao/produtos

# 3. Atualizar o produto (campo descricao para "Copo")
PUT https://api.bling.com.br/Api/v3/homologacao/produtos/16842381880

# 4. Atualizar a situação via PATCH
PATCH https://api.bling.com.br/Api/v3/homologacao/produtos/16842381880/situacoes

# 5. Remover o produto de teste
DELETE https://api.bling.com.br/Api/v3/homologacao/produtos/16842381880
```

---

## Boas Práticas

### Recomendações gerais

- Leia com atenção a documentação específica do endpoint antes de implementar
- Sempre valide os dados de entrada antes de enviá-los à API
- Construa tratamentos de erro eficientes para respostas não `2xx`
- Armazene os tokens de forma segura — nunca exponha `client_secret`, `access_token` ou `refresh_token`

### Segurança

- Gere um `state` único em cada requisição de autorização para prevenir CSRF
- Faça as requisições de token **server-to-server** (nunca no cliente/frontend)
- Utilize sempre o protocolo **HTTPS**
- Renove o `access_token` utilizando o `refresh_token` antes de ele expirar

### Rate Limiting

- A API possui limites de requisições por minuto/hora
- Quando receber `HTTP 429 (TOO_MANY_REQUESTS)`, aguarde antes de tentar novamente
- Implemente **retry com backoff exponencial** para lidar com limites temporários

### Paginação eficiente

```bash
# Iterar todas as páginas de produtos
pagina=1
while true; do
  response=$(curl -s "https://api.bling.com.br/Api/v3/produtos?pagina=$pagina&limite=100" \
    -H "Authorization: Bearer {access_token}")
  
  # Se retornar array vazio, parar
  count=$(echo $response | jq '.data | length')
  if [ "$count" -eq "0" ]; then break; fi
  
  # Processar dados...
  pagina=$((pagina + 1))
done
```

### Filtros por data

Sempre que possível, use filtros de data para reduzir o volume de dados:

```bash
GET /Api/v3/produtos?dataAlteracaoInicial=2025-08-01&dataAlteracaoFinal=2025-08-31
```

---

*Documentação gerada com base em [developer.bling.com.br](https://developer.bling.com.br) — API v3 Bling ERP*