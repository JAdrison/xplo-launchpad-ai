
# Melhorar o Formato "Caixinha de Perguntas"

## Problema

O prompt atual trata o anuncio "Caixinha de Perguntas" como se fosse para stories do Instagram. Na verdade, e um formato de **anuncio online pago** (Facebook/Meta Ads) onde:

- O **HOOK e uma pergunta que parece ter sido feita por uma pessoa real** -- como se alguem tivesse mandado essa duvida numa caixinha de perguntas
- A pergunta precisa ser **cotidiana, sincera, e comum** -- algo que muita gente se pergunta no dia a dia
- O restante do roteiro responde essa duvida de forma natural, guiando para o produto

## Alteracao

### Arquivo: `supabase/functions/generate-content/index.ts`

Reescrever as instrucoes do system prompt e do prompt especifico para o 6o video (question_box), deixando claro:

**System prompt** -- adicionar contexto sobre o formato:
- "Caixinha de Perguntas" e um formato de anuncio pago onde o HOOK simula uma pergunta enviada por uma pessoa real
- NAO e um story de Instagram, e um anuncio de video para Facebook/Meta Ads
- A pergunta deve parecer que foi escrita por alguem do publico-alvo, com linguagem informal e natural

**Instrucoes detalhadas para o question_box:**
- O HOOK deve ser escrito **em primeira pessoa**, como se fosse uma duvida real enviada por alguem (ex: "Gente, meu cachorro nao para de se cocar, sera que e alergia?", "Alguem mais tem problema com infiltracao no banheiro?", "To pensando em colocar energia solar mas sera que vale a pena mesmo?")
- A pergunta deve ser sobre um **tema cotidiano** que muitas pessoas do publico-alvo realmente tem
- Deve parecer **espontanea e sincera**, nao uma pergunta de marketing
- Usar linguagem coloquial, como se fosse um comentario ou mensagem de WhatsApp
- As secoes seguintes (Problema, Por que e Ruim, Solucao, CTA) devem responder essa duvida de forma natural, como se fosse um especialista respondendo

**Exemplos de boas perguntas:**
- "Minha conta de luz ta vindo absurda, alguem sabe se energia solar realmente compensa?"
- "To com uma dor nas costas ha semanas, sera que e coluna ou musculo?"
- "Meu filho nao quer comer nada, alguem ja passou por isso?"

**Exemplos de perguntas ruins (evitar):**
- "Voce sabia que nosso produto resolve seu problema?" (marketing disfarado)
- "Quer economizar 50% na conta de luz?" (headline de vendas, nao duvida real)

---

## Secao Tecnica

Linhas afetadas: 478-499 do `supabase/functions/generate-content/index.ts`

O system prompt (linha 478-483) sera expandido para incluir as instrucoes detalhadas do formato Caixinha de Perguntas.

O bloco de instrucoes do question_box (linhas 486-490) sera reescrito com os exemplos e regras acima.

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/generate-content/index.ts` | Reescrever prompt do question_box com instrucoes claras de que e um anuncio online (nao story), com exemplos de perguntas boas e ruins |
