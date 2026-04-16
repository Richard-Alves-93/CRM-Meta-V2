import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, PawPrint, PackageSearch, Briefcase } from "lucide-react";
import WizardCadastroModal from "../wizard";
import { useCadastrosData } from "./hooks/useCadastrosData";
import { ClientesTab } from "./ClientesTab";
import { PetsTab } from "./PetsTab";
import { ProdutosTab } from "./ProdutosTab";
import { ServicosTab } from "./ServicosTab";
import { useState } from "react";

/**
 * ETAPA 5: CadastrosPage - Refactored Component
 * Uses useCadastrosData hook for data management
 * Delegates to specialized tab components
 * 69% reduction in component size (477 → 150 lines)
 */

const CadastrosPage = () => {
  const [activeTab, setActiveTab] = useState("clientes");
  const [wizardModalOpen, setWizardModalOpen] = useState(false);

  const {
    customers,
    pets,
    products,
    loading,
    handleSaveCliente,
    handleDeleteCliente,
    handleSavePet,
    handleDeletePet,
    handleSaveProduto,
    handleDeleteProduto,
    services,
    handleSaveService,
    handleDeleteService,
    handleSaveCadastroCompleto
  } = useCadastrosData();

  if (loading && customers.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Carregando cadastros...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Cadastros</h1>
        <p className="text-muted-foreground text-sm">Gerencie tutores, pets e produtos recorrentes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card border border-border p-1 h-auto self-start sm:self-auto flex flex-wrap sm:flex-nowrap gap-1">
          <TabsTrigger 
            value="clientes" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg"
          >
            <Users size={16} />
            <span>Tutores</span>
          </TabsTrigger>
          <TabsTrigger 
            value="pets" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg"
          >
            <PawPrint size={16} />
            <span>Pets</span>
          </TabsTrigger>
          <TabsTrigger 
            value="produtos" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg"
          >
            <PackageSearch size={16} />
            <span>Produtos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="servicos" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg"
          >
            <Briefcase size={16} />
            <span>Serviços</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[500px]">
          {/* TAB: CLIENTES */}
          <TabsContent value="clientes" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <ClientesTab
              customers={customers}
              pets={pets}
              products={products}
              loading={loading}
              onWizardOpen={() => setWizardModalOpen(true)}
              onSaveCliente={handleSaveCliente}
              onDeleteCliente={handleDeleteCliente}
              onSavePet={handleSavePet}
            />
          </TabsContent>

          {/* TAB: PETS */}
          <TabsContent value="pets" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <PetsTab
              pets={pets}
              customers={customers}
              products={products}
              loading={loading}
              onSavePet={handleSavePet}
              onDeletePet={handleDeletePet}
            />
          </TabsContent>

          {/* TAB: PRODUTOS */}
          <TabsContent value="produtos" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <ProdutosTab
              products={products}
              loading={loading}
              onSaveProduto={handleSaveProduto}
              onDeleteProduto={handleDeleteProduto}
            />
          </TabsContent>

          {/* TAB: SERVIÇOS */}
          <TabsContent value="servicos" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            <ServicosTab
              services={services}
              loading={loading}
              onSaveService={handleSaveService}
              onDeleteService={handleDeleteService}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Modals */}
      <WizardCadastroModal
        open={wizardModalOpen}
        onClose={() => setWizardModalOpen(false)}
        products={products}
        onSaveCompleto={handleSaveCadastroCompleto}
      />
    </div>
  );
};

export default CadastrosPage;
