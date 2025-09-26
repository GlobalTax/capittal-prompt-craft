import { useState } from "react";
import { useValuations, FinancialData, ValuationResult } from "@/hooks/useValuations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

interface SaveValuationModalProps {
  financialData: FinancialData;
  results: ValuationResult;
}

const SaveValuationModal = ({ financialData, results }: SaveValuationModalProps) => {
  const { saveValuation } = useValuations();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !companyName.trim()) return;

    setSaving(true);
    try {
      await saveValuation(name.trim(), companyName.trim(), financialData, results, notes.trim() || undefined);
      
      // Reset form and close modal
      setName("");
      setCompanyName("");
      setNotes("");
      setOpen(false);
    } catch (error) {
      console.error('Error saving valuation:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Save className="h-4 w-4" />
          Guardar Valoración
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Guardar Valoración</DialogTitle>
          <DialogDescription>
            Guarda esta valoración para consultarla más tarde
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valuation-name">Nombre de la valoración</Label>
            <Input
              id="valuation-name"
              placeholder="Ej: Valoración inicial 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-name">Nombre de la empresa</Label>
            <Input
              id="company-name"
              placeholder="Ej: Consultores & Asociados S.L."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Añade cualquier observación sobre esta valoración..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || !companyName.trim() || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveValuationModal;