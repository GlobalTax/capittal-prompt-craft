import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Euro, Plus, Trash2 } from "lucide-react";

export interface RowData {
  id: string;
  label: string;
  type: 'input' | 'percentage' | 'calculated';
  category: 'revenue' | 'cost' | 'result' | 'custom';
  indented: boolean;
  values: { [year: string]: number };
  percentageOf?: string;
  formula?: (yearData: { [key: string]: number }) => number;
}

export interface TableSection {
  id: string;
  title: string;
  editable: boolean;
  rows: RowData[];
}

interface DynamicPLTableProps {
  years: string[];
  yearStatuses: ('closed' | 'projected')[];
  sections: TableSection[];
  onDataChange: (sections: TableSection[]) => void;
  onYearAdd: (type: 'past' | 'future') => void;
  onYearRemove: (yearIndex: number) => void;
  onYearStatusToggle: (yearIndex: number) => void;
}

export const DynamicPLTable = React.memo(function DynamicPLTable({ years, yearStatuses, sections, onDataChange, onYearAdd, onYearRemove, onYearStatusToggle }: DynamicPLTableProps) {
  const formatNumber = (value: number): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    const rounded = Math.round(value * 100) / 100;
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
    onDataChange(updatedSections);
  };

  const updateRowValue = (sectionId: string, rowId: string, year: string, value: string) => {
    const numericValue = parseNumber(value);
    
    // Find current value to avoid unnecessary updates
    const currentSection = sections.find(s => s.id === sectionId);
    const currentRow = currentSection?.rows.find(r => r.id === rowId);
    const currentValue = currentRow?.values[year];
    
    // Only update if value actually changed
    if (currentValue === numericValue) return;
    
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            rows: section.rows.map(row =>
              row.id === rowId
                ? { ...row, values: { ...row.values, [year]: numericValue } }
                : row
            )
          }
        : section
    );
    onDataChange(updatedSections);
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    );
    onDataChange(updatedSections);
  };

  const addRow = (sectionId: string, position: 'top' | 'bottom' = 'bottom') => {
    const newRow: RowData = {
      id: crypto.randomUUID(),
      label: 'Nueva fila',
      type: 'input',
      category: 'custom',
      indented: true,
      values: years.reduce((acc, year) => ({ ...acc, [year]: 0 }), {})
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
    onDataChange(updatedSections);
  };

  const removeRow = (sectionId: string, rowId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, rows: section.rows.filter(row => row.id !== rowId) }
        : section
    );
    onDataChange(updatedSections);
  };

  const addSection = () => {
    const newSection: TableSection = {
      id: crypto.randomUUID(),
      title: 'Nueva Sección',
      editable: true,
      rows: []
    };
    onDataChange([...sections, newSection]);
  };

  const removeSection = (sectionId: string) => {
    onDataChange(sections.filter(section => section.id !== sectionId));
  };

  // Helper to get computed value for any row type
  const getRowComputedValue = (row: RowData, year: string, visitedIds: Set<string> = new Set()): number => {
    // Prevent circular dependencies
    if (visitedIds.has(row.id)) {
      return 0;
    }
    visitedIds.add(row.id);

    if (row.type === 'input') {
      return row.values[year] || 0;
    }
    
    if (row.type === 'percentage' && row.percentageOf) {
      const baseRow = sections.flatMap(s => s.rows).find(r => r.id === row.percentageOf);
      if (baseRow) {
        const baseValue = getRowComputedValue(baseRow, year, new Set(visitedIds));
        const percentage = row.values[year] || 0;
        return (baseValue * percentage) / 100;
      }
      return 0;
    }
    
    if (row.type === 'calculated' && row.formula) {
      const yearData: { [key: string]: number } = {};
      sections.forEach(section => {
        section.rows.forEach(r => {
          yearData[r.id] = getRowComputedValue(r, year, new Set(visitedIds));
        });
      });
      return row.formula(yearData);
    }
    
    return row.values[year] || 0;
  };

  const calculateRowValue = (row: RowData, year: string): number => {
    return getRowComputedValue(row, year);
  };

  const calculatePercentageValue = (row: RowData, year: string): number => {
    if (row.type === 'percentage' && row.percentageOf) {
      const baseRow = sections
        .flatMap(s => s.rows)
        .find(r => r.id === row.percentageOf);
      if (baseRow) {
        const baseValue = getRowComputedValue(baseRow, year);
        const percentage = row.values[year] || 0;
        return (baseValue * percentage) / 100;
      }
    }
    return 0;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header flotante con título y botones */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Euro className="h-5 w-5" />
            P&L Comparativo Multi-año
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis comparativo de ingresos, costes y márgenes por año (editable)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onYearAdd('past')} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Año Anterior
          </Button>
          <Button onClick={() => onYearAdd('future')} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Año Posterior
          </Button>
        </div>
      </div>

      {/* Tabla sin Card */}
      <div className="overflow-x-auto border rounded-lg shadow-sm bg-card">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col style={{ width: '300px' }} />
            {years.map((y) => (
              <col key={`col-${y}`} style={{ width: '250px' }} />
            ))}
            {years.length > 1 && <col style={{ width: '120px' }} />}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr className="bg-muted border-b-2">
              <th className="text-left p-3 font-medium text-sm border-r min-w-[300px] w-[300px] sticky left-0 bg-muted z-20">Concepto</th>
              {years.map((year, index) => (
              <th key={year} className="text-right p-3 font-medium text-sm border-r w-[250px]">
                <div className="flex flex-col items-end justify-end gap-1.5">
                  <div className="flex items-center justify-end gap-2">
                    {years.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onYearRemove(index)}
                        className="h-7 w-7 p-0 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <span>{year}</span>
                  </div>
                  <Badge 
                    variant={yearStatuses[index] === 'closed' ? 'default' : 'secondary'}
                    className="cursor-pointer text-xs"
                    onClick={() => onYearStatusToggle(index)}
                    title="Click para cambiar entre Cerrado/Proyectado"
                  >
                    {yearStatuses[index] === 'closed' ? 'Cerrado' : 'Proyectado'}
                  </Badge>
                </div>
              </th>
              ))}
              {years.length > 1 && (
                <th className="text-right p-3 font-medium text-sm w-[120px]">Var %</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                {/* Section Header */}
                <tr className="bg-muted/50 border-b-2 border-muted">
                  <td colSpan={years.length + 2} className="p-3">
                    <div className="flex items-center justify-between">
                      {section.editable ? (
                        <Input
                          value={section.title}
                          onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                          className="font-bold text-sm bg-transparent border-b border-dotted border-muted-foreground/50 hover:border-muted-foreground focus:border-primary rounded-none p-1 h-auto w-fit max-w-md"
                        />
                      ) : (
                        <span className="font-bold text-sm px-1">{section.title}</span>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addRow(section.id, 'bottom')}
                          className="h-7 w-7 p-0 hover:bg-primary/10"
                          title="Añadir fila"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {section.editable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(section.id)}
                            className="h-7 w-7 p-0 hover:bg-destructive/10"
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
                  <tr key={row.id} className="border-t hover:bg-muted/20 transition-colors">
                    {/* Row Label */}
                    <td className={`p-3 text-sm border-r min-w-[300px] w-[300px] sticky left-0 bg-card z-10 ${row.indented ? 'pl-8' : 'pl-3'}`}>
                      <div className="flex items-center gap-2">
                        <Input
                          value={row.label}
                          onChange={(e) => updateRowLabel(section.id, row.id, e.target.value)}
                          className="bg-transparent border-b border-dotted border-muted-foreground/30 hover:border-muted-foreground/60 focus:border-primary rounded-none p-1 h-auto text-sm flex-1 min-w-0"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(section.id, row.id)}
                          className="h-6 w-6 p-0 opacity-0 hover:opacity-100 flex-shrink-0 hover:bg-destructive/10"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                    {/* Year Values */}
                    {years.map((year) => (
                      <td key={year} className="p-3 text-right border-r w-[250px]">
                        {row.type === 'input' ? (
                          <Input
                            type="text"
                            value={formatNumber(row.values[year] || 0)}
                            onChange={(e) => updateRowValue(section.id, row.id, year, e.target.value)}
                            className="font-mono h-9 w-full text-right border-muted-foreground/30 hover:border-muted-foreground focus:border-primary bg-muted/20"
                          />
                        ) : row.type === 'percentage' ? (
                          <div className="flex items-center gap-1 justify-end w-full">
                            <Input
                              type="text"
                              value={row.values[year] || ''}
                              onChange={(e) => updateRowValue(section.id, row.id, year, e.target.value)}
                              className="font-mono h-9 w-24 text-right border-muted-foreground/30 hover:border-muted-foreground focus:border-primary bg-muted/20"
                            />
                            <span className="text-xs">%</span>
                            <span className="font-mono text-sm ml-2 w-20 text-right">
                              {formatNumber(calculatePercentageValue(row, year))}
                            </span>
                          </div>
                        ) : row.type === 'calculated' ? (
                          <span className="font-mono text-sm font-semibold">
                            {formatNumber(calculateRowValue(row, year))}
                          </span>
                        ) : (
                          <span className="font-mono text-sm">
                            {formatNumber(calculateRowValue(row, year))}
                          </span>
                        )}
                      </td>
                    ))}

                    {/* Variation Column */}
                    {years.length > 1 && (
                      <td className="p-3 text-right font-mono text-sm w-[120px]">
                        {(() => {
                          const lastYear = years[years.length - 1];
                          const prevYear = years[years.length - 2];
                          const currentValue = getRowComputedValue(row, lastYear);
                          const prevValue = getRowComputedValue(row, prevYear);
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
              <td colSpan={years.length + 2} className="p-3 text-center border-t">
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
});
