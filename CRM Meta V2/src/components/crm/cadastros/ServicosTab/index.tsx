import { useState, useMemo } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Service } from "@/lib/types";
import { ServicosTable } from "./ServicosTable";
import { ServicoModal } from "./ServicoModal";
import { useAuth } from "@/modules/auth/hooks/useAuth";

interface ServicosTabProps {
  services: Service[];
  loading: boolean;
  onSaveService: (service: Omit<Service, 'id' | 'created_at'>, id?: string) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
}

export function ServicosTab({ services, loading, onSaveService, onDeleteService }: ServicosTabProps) {
  const { tenantId } = useAuth();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const filteredServices = useMemo(() => {
    const list = services || [];
    if (!search.trim()) return list;
    const lower = search.toLowerCase();
    return list.filter(s => 
      s.nome.toLowerCase().includes(lower) || 
      (s.categoria?.toLowerCase().includes(lower))
    );
  }, [search, services]);

  const handleOpenModal = (service?: Service) => {
    setEditingService(service || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingService(null);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar serviços ou categorias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-background"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 gap-2 border-dashed border-border hover:bg-secondary"
          >
            <Filter size={16} /> Filtros
          </Button>
          <Button 
            onClick={() => handleOpenModal()} 
            className="h-10 gap-2 bg-primary hover:bg-primary/90 shadow-sm"
          >
            <Plus size={18} /> Novo Serviço
          </Button>
        </div>
      </div>

      <ServicosTable
        services={filteredServices}
        loading={loading}
        onEdit={handleOpenModal}
        onDelete={onDeleteService}
      />

      <ServicoModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={(data) => onSaveService(data, editingService?.id)}
        editingService={editingService}
        tenantId={tenantId}
      />
    </div>
  );
}
