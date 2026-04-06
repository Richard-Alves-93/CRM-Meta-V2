import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Calendar } from 'lucide-react';
import {
  addCustomHoliday,
  deleteCustomHoliday,
  fetchCustomHolidays,
  getRemainingWorkingDays,
  WorkMode,
  CustomHoliday,
  carregarJornada,
  salvarJornada,
  defaultJornada,
  carregarFeriados,
  salvarFeriados,
  defaultFeriados,
} from '@/lib/crm-data';
import { toast } from 'sonner';

export function WorkSettingsSection() {
  const [jornada, setJornada] = useState(carregarJornada());
  const [feriados, setFeriados] = useState<CustomHoliday[]>(carregarFeriados());
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayDesc, setNewHolidayDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remainingDays, setRemainingDays] = useState(0);

  // Load initial data
  useEffect(() => {
    loadSettings();
  }, []);

  // Debug statement and Auto-Persistence as requested by user
  useEffect(() => {
    console.log("Jornada atual:", jornada);
    salvarJornada(jornada);
    
    // Auto-persistency and Debug for Holidays
    console.log("Feriados:", feriados);
    if (!Array.isArray(feriados)) {
      console.warn("Feriados inválidos, resetando...");
      setFeriados(defaultFeriados);
    } else {
      salvarFeriados(feriados);
    }
    
    calculateRemainingDays();
  }, [jornada, feriados]);

  async function loadSettings() {
    try {
      setLoading(true);
      // Feriados agora vêm do hook inicial (localStorage) sincrono. 
      // Se houvesse banco, usaríamos fetchCustomHolidays. Mantemos o loading artificial pra não quebrar a spec.
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  async function calculateRemainingDays() {
    try {
      const days = await getRemainingWorkingDays();
      setRemainingDays(days);
    } catch (error) {
      console.error('Error calculating remaining days:', error);
    }
  }

  function handleSalvar() {
    setSaving(true);
    const sucesso = salvarJornada(jornada);
    if (sucesso) {
      toast.success('Jornada salva com sucesso!');
    } else {
      toast.error('Erro ao salvar jornada');
    }
    setSaving(false);
  }

  function toggleDia(dia: number) {
    setJornada((prev: typeof defaultJornada) => {
      let novosDias;
      if (prev.diasSelecionados.includes(dia)) {
        novosDias = prev.diasSelecionados.filter((d: number) => d !== dia);
      } else {
        novosDias = [...prev.diasSelecionados, dia];
      }

      return {
        ...prev,
        diasSelecionados: novosDias
      };
    });
  }

  async function handleAddHoliday() {
    if (!newHolidayDate) {
      toast.error('Selecione uma data');
      return;
    }

    try {
      const novo: CustomHoliday = {
        id: crypto.randomUUID(),
        user_id: 'local-user', // Mock to satisfy TS interface
        data: newHolidayDate,
        descricao: newHolidayDesc || undefined,
        created_at: new Date().toISOString()
      };
      
      setFeriados(prev => { 
        const lista = Array.isArray(prev) ? prev : []; 
        const atualizada = [...lista, novo];
        return atualizada;
      });

      setNewHolidayDate('');
      setNewHolidayDesc('');
      toast.success('Feriado adicionado!');
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast.error('Erro ao adicionar feriado');
    }
  }

  async function handleDeleteHoliday(holidayId: string) {
    try {
      setFeriados(prev => { 
        const lista = Array.isArray(prev) ? prev : []; 
        const atualizada = lista.filter(h => h.id !== holidayId);
        return atualizada;
      });
      toast.success('Feriado removido!');
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Erro ao remover feriado');
    }
  }

  const dayLabels = [
    { value: 1, label: 'Segunda' },
    { value: 2, label: 'Terça' },
    { value: 3, label: 'Quarta' },
    { value: 4, label: 'Quinta' },
    { value: 5, label: 'Sexta' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' }, // JS Date API day 0 is Sunday
  ];

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return <div className="text-center py-4">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jornada de Trabalho</CardTitle>
        <CardDescription>Configure sua rotina de trabalho para cálculos precisos de metas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Work Mode Selection */}
        <div className="space-y-3">
          <Label>Modo de Trabalho</Label>
          <RadioGroup value={jornada.modo} onValueChange={(value) => setJornada({...jornada, modo: value})}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Segunda-sexta" id="mode-weekdays" />
              <Label htmlFor="mode-weekdays" className="cursor-pointer font-normal">
                Segunda a Sexta
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Segunda-sabado" id="mode-saturday" />
              <Label htmlFor="mode-saturday" className="cursor-pointer font-normal">
                Segunda a Sábado
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Todos os dias" id="mode-daily" />
              <Label htmlFor="mode-daily" className="cursor-pointer font-normal">
                Todos os Dias
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Personalizado" id="mode-custom" />
              <Label htmlFor="mode-custom" className="cursor-pointer font-normal">
                Personalizado
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Custom Schedule */}
        {jornada.modo === 'Personalizado' && (
          <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
            <Label>Selecione os dias que você trabalha</Label>
            <div className="grid grid-cols-2 gap-3">
              {Array.isArray(dayLabels) ? dayLabels.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={Array.isArray(jornada?.diasSelecionados) && jornada.diasSelecionados.includes(day.value)}
                    onCheckedChange={() => toggleDia(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="cursor-pointer font-normal">
                    {day.label}
                  </Label>
                </div>
              )) : null}
            </div>
          </div>
        )}

        {/* Remaining Days Preview */}
        <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg rounded-l-sm p-4 text-primary mb-6">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-semibold">Dias de trabalho restantes este mês: {remainingDays}</span>
          </div>
          <p className="text-xs ml-7 opacity-80">Cálculo automático baseado na sua jornada e feriados</p>
        </div>

        {/* Save Button */}
        <Button onClick={handleSalvar} disabled={saving} className="w-full">
          {saving ? 'Salvando...' : 'Salvar Jornada de Trabalho'}
        </Button>

        {/* Holidays Section */}
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Feriados da Empresa</h3>

          {/* Add Holiday Form */}
          <div className="space-y-3 mb-4 p-4 border rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="holiday-date" className="text-sm">
                  Data do Feriado
                </Label>
                <Input
                  id="holiday-date"
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="holiday-desc" className="text-sm">
                  Descrição (opcional)
                </Label>
                <Input
                  id="holiday-desc"
                  type="text"
                  placeholder="Ex: Tiradentes"
                  value={newHolidayDesc}
                  onChange={(e) => setNewHolidayDesc(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={handleAddHoliday} className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Feriado
            </Button>
          </div>

          {/* Holidays List */}
          {Array.isArray(feriados) && feriados.length > 0 ? (
            <div className="space-y-2">
              {feriados.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div>
                    <p className="font-medium text-sm">
                      {new Intl.DateTimeFormat('pt-BR').format(new Date(holiday.data + 'T12:00:00'))}
                    </p>
                    {holiday.descricao && <p className="text-xs text-gray-600">{holiday.descricao}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteHoliday(holiday.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Nenhum feriado cadastrado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
