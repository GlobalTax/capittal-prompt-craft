import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Trash2 } from "lucide-react";

export interface BudgetRowData {
  id: string;
  label: string;
  type: 'input' | 'percentage' | 'calculated';
  category: 'income' | 'expense' | 'result' | 'custom';
  indented: boolean;
  values: { [month: string]: number };
  percentageOf?: string;
  formula?: (monthData: { [key: string]: number }) => number;
}

export interface BudgetTableSection {
  id: string;
  title: string;
  editable: boolean;
  rows: BudgetRowData[];
}

interface DynamicBudgetTableProps {
  months: string[];
  monthStatuses: ('real' | 'presupuestado')[];
  sections: BudgetTableSection[];
  year: number;
  onDataChange: (sections: BudgetTableSection[]) => void;
  onMonthStatusToggle: (monthIndex: number) => void;
}

export function DynamicBudgetTable({ 
  months, 
  monthStatuses, 
  sections, 
  year,
  onDataChange, 
  onMonthStatusToggle 
}: DynamicBudgetTableProps) {
  // Valid months in long format (Spanish)
  const VALID_MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Sanitize sections to ensure only valid month keys exist
  const sanitizeSections = (sections: BudgetTableSection[]): BudgetTableSection[] => {
    return sections.map(section => ({
      ...section,
      rows: section.rows.map(row => ({
        ...row,
        values: Object.fromEntries(
          Object.entries(row.values)
            .filter(([key]) => VALID_MONTHS.includes(key))
        )
      }))
    }));
  };

  const formatNumber = (value: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '';
    const rounded = Math.round(value * 100) / 100;
    if (rounded === 0) return '';
    return rounded.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const calculateVariation = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const updateRowLabel = (sectionId: string, rowId: string, newLabel: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map(row =>
              row.id === rowId ? { ...row, label: newLabel } : row
            )
          }
        : section
    );
    onDataChange(sanitizeSections(updatedSections));
  };

  const updateRowValue = (sectionId: string, rowId: string, month: string, value: string) => {
    // Only update if month is valid
    if (!VALID_MONTHS.includes(month)) {
      console.warn(`Invalid month key: ${month}`);
      return;
    }
    
    const numericValue = parseNumber(value);
    
    // Create deep copies to ensure change detection
    const updatedSections = sections.map(section => {
      if (section.id !== sectionId) return section;
      
      return {
        ...section,
        rows: section.rows.map(row => {
          if (row.id !== rowId) return row;
          
          return {
            ...row,
            values: {
              ...row.values,
              [month]: numericValue
            }
          };
        })
      };
    });
    
    onDataChange(sanitizeSections(updatedSections));
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    );
    onDataChange(sanitizeSections(updatedSections));
  };

  const addRow = (sectionId: string, position: 'top' | 'bottom' = 'bottom') => {
    const newRow: BudgetRowData = {
      id: crypto.randomUUID(),
      label: 'Nueva fila',
      type: 'input',
      category: 'custom',
      indented: true,
      values: months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {})
    };

    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rows: position === 'top'
              ? [newRow, ...section.rows]
              : [...section.rows, newRow]
          }
        : section
    );
    onDataChange(sanitizeSections(updatedSections));
  };

  const removeRow = (sectionId: string, rowId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, rows: section.rows.filter(row => row.id !== rowId) }
        : section
    );
    onDataChange(sanitizeSections(updatedSections));
  };

  const addSection = () => {
    const newSection: BudgetTableSection = {
      id: crypto.randomUUID(),
      title: 'Nueva Sección',
      editable: true,
      rows: []
    };
    onDataChange(sanitizeSections([...sections, newSection]));
  };

  const removeSection = (sectionId: string) => {
    onDataChange(sanitizeSections(sections.filter(section => section.id !== sectionId)));
  };

  // Helper: sum all rows of a given category for a specific month
  const sumByCategory = (category: 'income' | 'expense', month: string, visitedIds: Set<string> = new Set()): number => {
    return sections
      .flatMap(s => s.rows)
      .filter(r => r.category === category)
      .reduce((sum, r) => sum + getRowComputedValue(r, month, visitedIds), 0);
  };

  // Helper: get the computed value for any row
  const getRowComputedValue = (row: BudgetRowData, month: string, visitedIds: Set<string> = new Set()): number => {
    // Detect circular dependency
    if (visitedIds.has(row.id)) {
      console.warn(`Circular dependency detected for row ${row.id}`);
      return 0;
    }
    
    visitedIds.add(row.id);
    
    if (row.type === 'input') {
      return row.values[month] || 0;
    }
    if (row.type === 'percentage') {
      return calculatePercentageValue(row, month, visitedIds);
    }
    if (row.type === 'calculated') {
      return calculateRowValue(row, month, visitedIds);
    }
    return 0;
  };

  const calculateRowValue = (row: BudgetRowData, month: string, visitedIds: Set<string> = new Set()): number => {
    if (row.type === 'percentage') {
      return calculatePercentageValue(row, month, visitedIds);
    }
    
    if (row.type === 'calculated') {
      // Dynamic calculation based on row ID
      if (row.id === 'total-income') {
        return sumByCategory('income', month, visitedIds);
      }
      if (row.id === 'total-expenses') {
        return sumByCategory('expense', month, visitedIds);
      }
      if (row.id === 'net-result') {
        const income = sumByCategory('income', month, visitedIds);
        const expenses = sumByCategory('expense', month, visitedIds);
        return income - expenses;
      }
      
      // Backward compatibility: use formula if exists
      if (row.formula) {
        const monthData: { [key: string]: number } = {};
        sections.forEach(section => {
          section.rows.forEach(r => {
            monthData[r.id] = getRowComputedValue(r, month, visitedIds);
          });
        });
        return row.formula(monthData);
      }
      
      return 0;
    }
    
    return row.values[month] || 0;
  };

  const calculatePercentageValue = (row: BudgetRowData, month: string, visitedIds: Set<string> = new Set()): number => {
    if (row.type === 'percentage' && row.percentageOf) {
      const baseRow = sections
        .flatMap(s => s.rows)
        .find(r => r.id === row.percentageOf);
      if (baseRow) {
        const baseValue = getRowComputedValue(baseRow, month, visitedIds);
        const percentage = row.values[month] || 0;
        return (baseValue * percentage) / 100;
      }
    }
    return 0;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'income': return 'text-success';
      case 'expense': return 'text-destructive';
      case 'result': return 'text-primary';
      default: return '';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Presupuesto Mensual {year}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Control mensual de ingresos y gastos (editable)
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow-sm bg-card">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col style={{ width: '200px' }} />
            {months.map((m) => (
              <col key={`col-${m}`} style={{ width: '140px' }} />
            ))}
            {months.length > 1 && <col style={{ width: '100px' }} />}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="bg-muted border-b-2">
              <th className="text-left p-3 font-medium text-sm border-r min-w-[200px] w-[200px] sticky left-0 bg-muted z-20">Concepto</th>
              {months.map((month, index) => (
              <th key={month} className="text-right p-3 font-medium text-sm border-r w-[140px]">
                <div className="flex flex-col items-end justify-end gap-1.5">
                  <span className="text-xs">{month}</span>
                  <Badge 
                    variant={monthStatuses[index] === 'real' ? 'default' : 'secondary'}
                    className="cursor-pointer text-xs"
                    onClick={() => onMonthStatusToggle(index)}
                    title="Click para cambiar entre Real/Presupuestado"
                  >
                    {monthStatuses[index] === 'real' ? '✓ Real' : '📊 Ppto'}
                  </Badge>
                </div>
              </th>
              ))}
              {months.length > 1 && (
                <th className="text-right p-3 font-medium text-sm w-[100px]">Var %</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                {/* Section Header */}
                <tr className="bg-muted/50 border-b-2 border-muted">
                  <td colSpan={months.length + 2} className="p-3">
                    <div className="flex items-center justify-between">
                      {section.editable ? (
                        <Input
                          value={section.title}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          className="font-bold text-sm bg-transparent border-b border-dotted border-muted-foreground/50 focus:border-primary rounded-none p-1 h-auto w-fit max-w-md"
                        />
                      ) : (
                        <span className="font-bold text-sm px-1">{section.title}</span>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addRow(section.id, 'bottom')}
                          className="h-7 w-7 p-0"
                          title="Añadir fila"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {section.editable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                            className="h-7 w-7 p-0"
                            title="Eliminar sección"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Section Rows */}
                {section.rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-transparent">
                    {/* Row Label */}
                    <td className={`p-3 text-sm border-r min-w-[200px] w-[200px] sticky left-0 bg-card z-10 ${row.indented ? 'pl-8' : 'pl-3'}`}>
                      <div className="flex items-center gap-2">
                        <Input
                          value={row.label}
                          onChange={(e) => updateRowLabel(section.id, row.id, e.target.value)}
                          className="bg-transparent border-b border-dotted border-muted-foreground/30 focus:border-primary rounded-none p-1 h-auto text-sm flex-1 min-w-0"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(section.id, row.id)}
                          className="h-6 w-6 p-0 opacity-60 flex-shrink-0"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                    {/* Month Values */}
                    {months.map((month) => (
                      <td key={month} className="p-3 text-right border-r w-[140px]">
                        {row.type === 'input' ? (
                          <Input
                            type="text"
                            value={formatNumber(row.values[month] || 0)}
                            onChange={(e) => updateRowValue(section.id, row.id, month, e.target.value)}
                            className="font-mono h-9 w-full text-right border-muted-foreground/50 focus:border-primary bg-background"
                          />
                        ) : row.type === 'percentage' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="text"
                              value={formatNumber(row.values[month] || 0)}
                              onChange={(e) => updateRowValue(section.id, row.id, month, e.target.value)}
                              className="font-mono h-9 w-16 text-right border-muted-foreground/50 focus:border-primary bg-background"
                              placeholder="0"
                            />
                            <span className="text-xs text-muted-foreground font-medium">%</span>
                            <span className="font-mono text-sm ml-1 font-semibold">
                              = {formatNumber(calculatePercentageValue(row, month))}
                            </span>
                          </div>
                        ) : row.type === 'calculated' ? (
                          <span className={`font-mono text-sm font-semibold ${getCategoryColor(row.category)}`}>
                            {formatNumber(calculateRowValue(row, month))}
                          </span>
                        ) : (
                          <span className="font-mono text-sm">
                            {formatNumber(calculateRowValue(row, month))}
                          </span>
                        )}
                      </td>
                    ))}

                    {/* Variation Column */}
                    {months.length > 1 && (
                      <td className="p-3 text-right font-mono text-sm w-[100px]">
                        {(() => {
                          const lastMonth = months[months.length - 1];
                          const prevMonth = months[months.length - 2];
                          const currentValue = row.type === 'calculated' 
                            ? calculateRowValue(row, lastMonth)
                            : row.values[lastMonth] || 0;
                          const prevValue = row.type === 'calculated'
                            ? calculateRowValue(row, prevMonth)
                            : row.values[prevMonth] || 0;
                          const variation = calculateVariation(currentValue, prevValue);
                          
                          if (variation === 0) return null;
                          
                          return (
                            <span className={variation >= 0 ? 'text-success' : 'text-destructive'}>
                              {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </td>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))}

            {/* Add Section Button */}
            <tr>
              <td colSpan={months.length + 2} className="p-3 text-center border-t">
                <Button onClick={addSection} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Sección
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
