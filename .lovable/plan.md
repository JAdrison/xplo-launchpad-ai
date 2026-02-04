

# Correção de ICPs Duplicados - Cliente XPLO SOLAR LTDA

## Diagnóstico

### Problema Identificado

O cliente XPLO SOLAR LTDA possui 8 ICPs duplicados idênticos criados em datas diferentes:

| Data | Quantidade | Nome do ICP |
|------|------------|-------------|
| 31/01 | 1 | homens e mulheres que moram em apartamentos |
| 02/02 | 1 | homens e mulheres que moram em apartamentos |
| 03/02 | 4 | homens e mulheres que moram em apartamentos |
| 04/02 | 2 | homens e mulheres que moram em apartamentos |

### Causa Raiz

O código em `StepICPs.tsx` (linhas 152-165) faz:
1. `DELETE` todos os ICPs do cliente
2. `INSERT` os novos ICPs

**Problema**: Nenhuma das operações verifica se houve erro. Se o `DELETE` falhar silenciosamente, o `INSERT` adiciona novos registros sem remover os antigos.

```typescript
// Código atual - sem verificação de erro
await supabase.from("icps").delete().eq("client_id", clientId);
await supabase.from("icps").insert(icpsToInsert);
```

---

## Solução

### Parte 1: Limpeza dos Dados (SQL)

Remover os 7 ICPs duplicados, mantendo apenas o mais recente:

```sql
DELETE FROM icps 
WHERE client_id = '2fa874bf-ef4f-4504-ab66-60a306b55405'
  AND id != '1db535de-25fd-4135-bd2d-74b836dafd1e';
```

### Parte 2: Correção do Código

Modificar `StepICPs.tsx` para:

1. **Verificar erros** nas operações de banco
2. **Usar estratégia UPSERT** em vez de DELETE + INSERT
3. **Manter IDs existentes** ao atualizar ICPs já salvos

**Nova lógica:**

```typescript
const handleSubmit = async () => {
  // ... validação ...

  setIsSaving(true);

  try {
    // 1. Buscar ICPs existentes para saber quais deletar
    const { data: existingIcps } = await supabase
      .from("icps")
      .select("id")
      .eq("client_id", clientId);

    const existingIds = existingIcps?.map(icp => icp.id) || [];
    const idsToKeep = validIcps.filter(icp => icp.id).map(icp => icp.id!);
    const idsToDelete = existingIds.filter(id => !idsToKeep.includes(id));

    // 2. Deletar apenas os ICPs que foram removidos pelo usuário
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("icps")
        .delete()
        .in("id", idsToDelete);
      
      if (deleteError) throw deleteError;
    }

    // 3. Processar cada ICP (update se tem ID, insert se não tem)
    for (let i = 0; i < validIcps.length; i++) {
      const icp = validIcps[i];
      const icpData = {
        client_id: clientId,
        name: icp.name.trim(),
        profession: icp.profession.trim() || null,
        age: icp.age.trim() || null,
        gender: icp.gender || null,
        reason_needs_solution: icp.reason_needs_solution.trim() || null,
        sort_order: i,
      };

      if (icp.id) {
        // Atualizar existente
        const { error } = await supabase
          .from("icps")
          .update(icpData)
          .eq("id", icp.id);
        if (error) throw error;
      } else {
        // Inserir novo
        const { error } = await supabase
          .from("icps")
          .insert(icpData);
        if (error) throw error;
      }
    }

    toast({ title: "ICPs salvos", ... });
    onNext();
  } catch (error) {
    console.error("Error saving ICPs:", error);
    toast({ title: "Erro ao salvar", variant: "destructive" });
  } finally {
    setIsSaving(false);
  }
};
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `StepICPs.tsx` | Corrigir lógica de persistência com verificação de erros |

---

## Ação Manual Necessária

Executar SQL para limpar os duplicados atuais:

```sql
-- Manter apenas o ICP mais recente (1db535de-25fd-4135-bd2d-74b836dafd1e)
DELETE FROM icps 
WHERE client_id = '2fa874bf-ef4f-4504-ab66-60a306b55405'
  AND id != '1db535de-25fd-4135-bd2d-74b836dafd1e';
```

---

## Resultado Esperado

1. **Dados limpos**: Cliente ficará com apenas 1 ICP (o mais recente)
2. **Prevenção futura**: Código com verificação de erros impede duplicações
3. **Melhor performance**: UPSERT é mais eficiente que DELETE + INSERT

