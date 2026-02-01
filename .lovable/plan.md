
# Adicionar Exclusao de Documentos Completos

## Resumo

Adicionar funcionalidade para excluir documentos completos (Ofertas, Landing Pages e Anuncios) em dois locais principais:
1. Pagina de Detalhes do Cliente (GeneratedAssetsSection)
2. Visualizador de Conteudo no Gerador (GeneratedContentViewer)

---

## 1. Componentes a Adicionar

### Botao de Exclusao em Cada Documento

Cada documento exibido tera um icone de lixeira (Trash2) ao lado do cabecalho, que ao ser clicado abre um AlertDialog de confirmacao.

```text
+----------------------------------------------------------+
| Oferta 1                              [Data] [🗑️ Excluir] |
|----------------------------------------------------------|
| Promessa Principal                                        |
| ...                                                       |
+----------------------------------------------------------+
```

---

## 2. Alteracoes em GeneratedAssetsSection.tsx

**Arquivo:** `src/components/client/GeneratedAssetsSection.tsx`

Adicionar:
- Import do `AlertDialog` e `Trash2` do lucide
- Funcao `handleDeleteOffer(offerId: string)`
- Funcao `handleDeleteLandingPage(lpId: string)`
- Funcao `handleDeleteAd(adId: string)`
- AlertDialog de confirmacao para cada tipo
- Botao de exclusao no cabecalho de cada documento
- Atualizar estado local apos exclusao

**Logica de exclusao:**
```typescript
const handleDeleteOffer = async (offerId: string) => {
  const { error } = await supabase
    .from("offers_hormozi")
    .delete()
    .eq("id", offerId);

  if (error) {
    toast.error("Erro ao excluir oferta");
    return;
  }

  setOffers((prev) => prev.filter((o) => o.id !== offerId));
  toast.success("Oferta excluída com sucesso!");
};
```

---

## 3. Alteracoes em GeneratedContentViewer.tsx

**Arquivo:** `src/components/generator/GeneratedContentViewer.tsx`

Adicionar:
- Mesma estrutura de exclusao do GeneratedAssetsSection
- Import do AlertDialog e Trash2
- Funcoes de delete para cada tipo de documento
- Botao de exclusao no cabecalho de cada item
- Atualizar estado local e notificar usuario

---

## 4. Interface do AlertDialog

Para cada documento, o dialogo de confirmacao:

```text
+------------------------------------------+
| Confirmar exclusao                       |
|------------------------------------------|
| Tem certeza que deseja excluir este      |
| documento? Esta acao nao pode ser        |
| desfeita.                                |
|                                          |
|            [Cancelar] [Excluir]          |
+------------------------------------------+
```

---

## 5. Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/client/GeneratedAssetsSection.tsx` | Adicionar exclusao de ofertas, LPs e anuncios |
| `src/components/generator/GeneratedContentViewer.tsx` | Adicionar exclusao de ofertas, LPs e anuncios |

---

## 6. Detalhes Tecnicos

### Imports necessarios

```typescript
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
```

### Estrutura do botao de exclusao

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
      <Trash2 className="h-4 w-4" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
      <AlertDialogDescription>
        Tem certeza que deseja excluir esta oferta? Esta acao nao pode ser desfeita.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => handleDeleteOffer(offer.id)}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Excluir
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 7. Estados de Loading

Adicionar estado para controlar loading durante exclusao:

```typescript
const [deletingId, setDeletingId] = useState<string | null>(null);
```

E desabilitar botao durante a operacao:

```tsx
<AlertDialogAction
  onClick={() => handleDeleteOffer(offer.id)}
  disabled={deletingId === offer.id}
>
  {deletingId === offer.id ? "Excluindo..." : "Excluir"}
</AlertDialogAction>
```

---

## Fluxo de Usuario

1. Usuario visualiza documentos gerados (ofertas, LPs, anuncios)
2. Clica no icone de lixeira ao lado do documento
3. AlertDialog aparece pedindo confirmacao
4. Usuario confirma clicando em "Excluir"
5. Documento e removido do banco de dados
6. Lista atualiza automaticamente removendo o item
7. Toast de sucesso aparece

---

## Beneficios

- Usuario pode remover documentos que nao deseja mais
- Confirmacao previne exclusoes acidentais
- Feedback visual durante e apos a operacao
- Consistencia de UX em todos os locais de visualizacao
