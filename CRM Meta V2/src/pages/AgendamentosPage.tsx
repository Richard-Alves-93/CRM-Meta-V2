import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Truck, Activity, Scissors } from 'lucide-react';
import AgendaTransportePage from './AgendaTransportePage';

export default function AgendamentosPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Agendamentos</h1>
        <p className="text-muted-foreground text-sm">Gerencie todas as agendas de serviços do seu negócio em um só lugar.</p>
      </div>

      <Tabs defaultValue="transportes" className="flex-1 flex flex-col space-y-4">
        <TabsList className="bg-card border border-border p-1 h-auto self-start sm:self-auto flex flex-wrap sm:flex-nowrap gap-1">
          <TabsTrigger 
            value="transportes" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all"
          >
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Logística (Transportes)</span>
            <span className="sm:hidden">Teles</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="vet" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Veterinária (Em Breve)</span>
            <span className="sm:hidden">Vet</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="estetica" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all"
          >
            <Scissors className="w-4 h-4" />
            <span className="hidden sm:inline">Banho & Tosa (Em Breve)</span>
            <span className="sm:hidden">Estética</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transportes" className="flex-1 mt-0 outline-none data-[state=active]:animate-in data-[state=active]:fade-in-50">
          <AgendaTransportePage />
        </TabsContent>

        <TabsContent value="vet" className="flex-1 mt-0 outline-none">
          <div className="h-full min-h-[500px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-center bg-card/50">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Activity className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Agenda Veterinária</h3>
            <p className="text-muted-foreground max-w-md">
              Estamos preparando uma agenda completa para o seu consultório, com controle de consultas, vacinas e exames.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="estetica" className="flex-1 mt-0 outline-none">
          <div className="h-full min-h-[500px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-8 text-center bg-card/50">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Scissors className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Agenda de Banho & Tosa</h3>
            <p className="text-muted-foreground max-w-md">
              Em breve você poderá gerenciar os horários do seu Pet Shop aqui, com controle de profissionais e serviços realizados.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
