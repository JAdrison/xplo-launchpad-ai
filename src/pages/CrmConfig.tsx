import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PipelinesConfig } from "@/components/crm/config/PipelinesConfig";
import { TagsConfig } from "@/components/crm/config/TagsConfig";
import { FieldsConfig } from "@/components/crm/config/FieldsConfig";
import { TemplatesConfig } from "@/components/crm/config/TemplatesConfig";

export default function CrmConfig() {
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações do CRM</h1>
        <p className="text-sm text-muted-foreground">Pipelines, tags, campos customizáveis e templates de atividade</p>
      </div>

      <Tabs defaultValue="pipelines">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="fields">Campos customizáveis</TabsTrigger>
          <TabsTrigger value="templates">Templates de atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-4"><PipelinesConfig /></TabsContent>
        <TabsContent value="tags" className="mt-4"><TagsConfig /></TabsContent>
        <TabsContent value="fields" className="mt-4"><FieldsConfig /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesConfig /></TabsContent>
      </Tabs>
    </div>
  );
}
