
# Correção de Quebra de Página no PDF de Ofertas

## Problema Identificado

Analisando o print enviado, o texto está sendo cortado entre páginas em:
- Funil de Aquisição (seção FUNDO cortada)
- Sinergias entre Canais (cortada no meio)

O `pageBreakInside: "avoid"` está aplicado apenas no container das seções, mas os itens internos (TOPO, MEIO, FUNDO, cada sinergia) não têm essa proteção e podem ser divididos quando a página acaba.

## Solução

Aplicar controle de quebra de página em **cada item individual** dentro das seções problemáticas, garantindo que nenhum bloco de conteúdo seja cortado no meio.

### Alterações no OfferPDFTemplate.tsx

| Seção | Correção |
|-------|----------|
| Container Principal | Aumentar padding de 5mm para 15mm |
| Estratégias Complementares | Cada card recebe pageBreakInside: avoid |
| Funil de Aquisição (TOPO/MEIO/FUNDO) | Cada item recebe pageBreakInside: avoid |
| Sinergias entre Canais | Cada item da lista recebe pageBreakInside: avoid |
| Cronograma | Cada período recebe pageBreakInside: avoid |

### Estilos a Adicionar

Criar um novo estilo para itens internos:

```text
const itemStyle = {
  pageBreakInside: "avoid" as const,
  breakInside: "avoid" as const,
};
```

Aplicar esse estilo em:
1. Cada card de estratégia complementar
2. Cada item do funil (TOPO, MEIO, FUNDO)
3. Cada item de sinergia
4. Cada período do cronograma

### Margens de Segurança

Conforme documentado na memória do projeto, usar margem de segurança de 15mm ao final de cada seção para evitar corte de texto. Atualmente está com 15mm, mas precisa verificar se os itens internos também respeitam isso.

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/export/OfferPDFTemplate.tsx` | Aplicar pageBreakInside em cada item interno das seções |

## Resultado Esperado

1. Nenhum item do Funil de Aquisição será cortado entre páginas
2. Nenhuma sinergia será cortada no meio
3. Cards de estratégias complementares não serão divididos
4. Margens adequadas evitam cortes inesperados
