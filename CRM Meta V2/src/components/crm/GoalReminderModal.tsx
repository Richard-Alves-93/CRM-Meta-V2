interface GoalReminderModalProps {
  open: boolean;
  onKeep: () => void;
  onUpdate: () => void;
}

const GoalReminderModal = ({ open, onKeep, onUpdate }: GoalReminderModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="mb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/20 text-primary flex items-center justify-center rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-card-foreground">Novo Mês Iniciado! 🎉</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            As suas metas são a bússola do seu negócio. Você deseja repetir as <b>mesmas metas do mês passado</b> ou prefere <b>cadastrar novos números</b> para este mês?
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onKeep} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
          >
            ✅ Manter as mesmas metas do último mês
          </button>
          <button 
            onClick={onUpdate} 
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3.5 px-4 rounded-xl transition-colors"
          >
            ✏️ Quero atualizar minhas metas agora
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground opacity-80">
          Você não pode fechar essa tela.<br/> É obrigatório definir um direcionamento de caixa para o mês atual.
        </p>
      </div>
    </div>
  );
};

export default GoalReminderModal;
