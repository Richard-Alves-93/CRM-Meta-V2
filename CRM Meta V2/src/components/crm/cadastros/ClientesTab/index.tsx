import { useState } from "react";
import { Customer } from "@/lib/crm-data";
import { Plus } from "lucide-react";
import ClienteModal from "../../ClienteModal";
import { ClientesTable } from "./ClientesTable";

interface ClientesTabProps {
  customers: Customer[];
  loading: boolean;
  onWizardOpen: () => void;
  onSaveCliente: (customer: Omit<Customer, 'id'>, id?: string) => Promise<void>;
  onDeleteCliente: (id: string) => Promise<void>;
}

/**
 * ETAPA 5b: ClientesTab - Tab Container for Clientes
 * Manages modal state and coordinates between table and modal
 * Light wrapper around ClientesTable with modal management
 */

export function ClientesTab({
  customers,
  loading,
  onWizardOpen,
  onSaveCliente,
  onDeleteCliente
}: ClientesTabProps) {
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Customer | null>(null);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCliente(customer);
    } else {
      setEditingCliente(null);
    }
    setClienteModalOpen(true);
  };

  const handleCloseModal = () => {
    setClienteModalOpen(false);
    setEditingCliente(null);
  };

  const handleSave = async (customer: Omit<Customer, 'id'>) => {
    await onSaveCliente(customer, editingCliente?.id);
    handleCloseModal();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-foreground">Lista de Tutores</h2>
        <button
          onClick={onWizardOpen}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Novo Cadastro Completo
        </button>
      </div>

      <ClientesTable
        customers={customers}
        loading={loading}
        onEdit={handleOpenModal}
        onDelete={onDeleteCliente}
      />

      <ClienteModal
        open={clienteModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingCustomer={editingCliente}
      />
    </>
  );
}
