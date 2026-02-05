
# Adicionar Seção de Credenciais Meta Ads na Página de Detalhes do Cliente

## Visao Geral

Adicionar uma nova seção **"Acesso as Redes Sociais (Meta Ads)"** logo abaixo do card de "Informacoes do Cliente", exibindo os logins e senhas do Instagram e Facebook com:
- Senhas mascaradas com asteriscos por padrao
- Botao "olhinho" para alternar visibilidade de cada senha

---

## Dados Disponiveis

Os dados estao armazenados na tabela `client_profile`:

| Campo | Descricao |
|-------|-----------|
| `instagram_link` | Link do perfil do Instagram |
| `instagram_login` | Login da conta do Instagram |
| `instagram_password` | Senha da conta do Instagram |
| `facebook_login` | Login da conta do Facebook |
| `facebook_password` | Senha da conta do Facebook |

---

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/ClientDetails.tsx` | Adicionar busca de client_profile e nova secao de credenciais |

---

## Implementacao

### 1. Adicionar Estado para client_profile

```tsx
const [clientProfile, setClientProfile] = useState<any>(null);
const [showInstagramPassword, setShowInstagramPassword] = useState(false);
const [showFacebookPassword, setShowFacebookPassword] = useState(false);
```

### 2. Buscar Dados de client_profile

No `useEffect` existente, adicionar busca:

```tsx
// Buscar profile do cliente para credenciais Meta Ads
const { data: profileData } = await supabase
  .from("client_profile")
  .select("instagram_link, instagram_login, instagram_password, facebook_login, facebook_password")
  .eq("client_id", id)
  .maybeSingle();

if (profileData) {
  setClientProfile(profileData);
}
```

### 3. Nova Secao Visual (apos card de Informacoes do Cliente)

```tsx
{/* Credenciais Meta Ads */}
{clientProfile && (clientProfile.instagram_login || clientProfile.facebook_login) && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Acesso as Redes Sociais (Meta Ads)
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Instagram */}
      {(clientProfile.instagram_link || clientProfile.instagram_login) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clientProfile.instagram_link && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Link</p>
                <a href={clientProfile.instagram_link} target="_blank" className="text-primary hover:underline">
                  {clientProfile.instagram_link}
                </a>
              </div>
            )}
            {clientProfile.instagram_login && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Login</p>
                <p>{clientProfile.instagram_login}</p>
              </div>
            )}
            {clientProfile.instagram_password && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Senha</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono">
                    {showInstagramPassword ? clientProfile.instagram_password : "••••••••"}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setShowInstagramPassword(!showInstagramPassword)}
                  >
                    {showInstagramPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Facebook - mesma estrutura */}
      {clientProfile.facebook_login && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Facebook
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Login</p>
              <p>{clientProfile.facebook_login}</p>
            </div>
            {clientProfile.facebook_password && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Senha</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono">
                    {showFacebookPassword ? clientProfile.facebook_password : "••••••••"}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => setShowFacebookPassword(!showFacebookPassword)}
                  >
                    {showFacebookPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
)}
```

---

## Resultado Visual

```text
+-------------------------------------------------------+
|  Informacoes do Cliente                               |
|  [dados existentes...]                                |
+-------------------------------------------------------+

+-------------------------------------------------------+
|  [Shield] Acesso as Redes Sociais (Meta Ads)          |
|-------------------------------------------------------|
|  [Instagram] Instagram                                |
|  Link: https://instagram.com/exemplo                  |
|  Login: usuario@exemplo.com                           |
|  Senha: •••••••• [Eye]                                |
|-------------------------------------------------------|
|  [Facebook] Facebook                                  |
|  Login: usuario@exemplo.com                           |
|  Senha: •••••••• [Eye]                                |
+-------------------------------------------------------+
```

---

## Icones Necessarios

Adicionar aos imports de `lucide-react`:
- `Eye`
- `EyeOff`
- `Instagram`
- `Facebook`
- `Shield`

---

## Comportamento

| Estado | Exibicao da Senha |
|--------|-------------------|
| Padrao | `••••••••` |
| Apos clicar no olho | Senha visivel |
| Clicar novamente | Volta para asteriscos |

A secao so aparece se houver pelo menos um login (Instagram ou Facebook) cadastrado.
