import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Euro, Plus, Trash2, AlertTriangle, Percent } from "lucide-react";

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

  const updateRowLabel = React.useCallback((sectionId: string, rowId: string, newLabel: string) => {
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
  }, [sections, onDataChange]);

  const updateRowValue = React.useCallback((sectionId: string, rowId: string, year: string, value: string) => {
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
  }, [sections, onDataChange]);

  const updateSectionTitle = React.useCallback((sectionId: string, newTitle: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    );
    onDataChange(updatedSections);
  }, [sections, onDataChange]);

  const addRow = React.useCallback((sectionId: string, position: 'top' | 'bottom' = 'bottom') => {
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
  }, [years, sections, onDataChange]);

  const removeRow = React.useCallback((sectionId: string, rowId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, rows: section.rows.filter(row => row.id !== rowId) }
        : section
    );
    onDataChange(updatedSections);
  }, [sections, onDataChange]);

  const addSection = React.useCallback(() => {
    const newSection: TableSection = {
      id: crypto.randomUUID(),
      title: 'Nueva Sección',
      editable: true,
      rows: []
    };
    onDataChange([...sections, newSection]);
  }, [sections, onDataChange]);

  const removeSection = React.useCallback((sectionId: string) => {
    onDataChange(sections.filter(section => section.id !== sectionId));
  }, [sections, onDataChange]);

  // Helper to get computed value for any row type
  const getRowComputedValue = React.useCallback((row: RowData, year: string, visitedIds: Set<string> = new Set()): number => {
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
        const baseValue = getRowComputedValue(baseRow, year, visitedIds);
        const percentage = row.values[year] || 0;
        return (baseValue * percentage) / 100;
      }
      return 0;
    }
    
    if (row.type === 'calculated' && row.formula) {
      const yearData: { [key: string]: number } = {};
      sections.forEach(section => {
        section.rows.forEach(r => {
          // Skip the current row to avoid recursion and create a new visitedIds for each dependency
          if (r.id !== row.id) {
            const formulaVisitedIds = new Set(visitedIds);
            yearData[r.id] = getRowComputedValue(r, year, formulaVisitedIds);
          }
        });
      });
      return row.formula(yearData);
    }
    
    return row.values[year] || 0;
  }, [sections]);

  // Memoize computed values for performance
  const computedValues = React.useMemo(() => {
    const cache: { [key: string]: number } = {};
    sections.forEach(section => {
      section.rows.forEach(row => {
        years.forEach(year => {
          const cacheKey = `${row.id}-${year}`;
          cache[cacheKey] = getRowComputedValue(row, year);
        });
      });
    });
    return cache;
  }, [sections, years, getRowComputedValue]);

  const getCachedValue = React.useCallback((rowId: string, year: string) => 
    computedValues[`${rowId}-${year}`] || 0,
  [computedValues]);

  const calculateRowValue = React.useCallback((row: RowData, year: string): number => {
    return getCachedValue(row.id, year);
  }, [getCachedValue]);

  const calculatePercentageValue = React.useCallback((row: RowData, year: string): number => {
    if (row.type === 'percentage' && row.percentageOf) {
      const baseRow = sections
        .flatMap(s => s.rows)
        .find(r => r.id === row.percentageOf);
      if (baseRow) {
        const baseValue = getCachedValue(baseRow.id, year);
        const percentage = row.values[year] || 0;
        return (baseValue * percentage) / 100;
      }
    }
    return 0;
  }, [sections, getCachedValue]);

  // Validate percentage rows sum
  const validatePercentageRows = React.useCallback((baseRowId: string, year: string) => {
    const percentageRows = sections
      .flatMap(s => s.rows)
      .filter(r => r.type === 'percentage' && r.percentageOf === baseRowId);
    
    const sum = percentageRows.reduce((acc, row) => acc + (row.values[year] || 0), 0);
    
    return {
      sum,
      isValid: sum >= 95 && sum <= 105,
      percentageRows
    };
  }, [sections]);

  // Normalize percentage rows to sum exactly 100%
  const normalizePercentageRows = React.useCallback((sectionId: string, baseRowId: string) => {
    const percentageRows = sections
      .flatMap(s => s.rows)
      .filter(r => r.type === 'percentage' && r.percentageOf === baseRowId);
    
    if (percentageRows.length === 0) return;

    // Calculate normalization for all years
    years.forEach(year => {
      const sum = percentageRows.reduce((acc, row) => acc + (row.values[year] || 0), 0);
      
      if (sum === 0) return;
      
      const factor = 100 / sum;
      
      // Update all percentage rows proportionally
      const updatedSections = sections.map(section => ({
        ...section,
        rows: section.rows.map(row => {
          const isPercentageRow = row.type === 'percentage' && row.percentageOf === baseRowId;
          if (!isPercentageRow) return row;
          
          const currentValue = row.values[year] || 0;
          const normalizedValue = currentValue * factor;
          
          return {
            ...row,
            values: {
              ...row.values,
              [year]: Math.round(normalizedValue * 100) / 100
            }
          };
        })
      }));
      
      onDataChange(updatedSections);
    });
  }, [sections, years, onDataChange]);

  // Get validation info for INGRESOS section
  const ingresosValidation = React.useMemo(() => {
    const ingresosSection = sections.find(s => s.title === 'INGRESOS');
    if (!ingresosSection) return null;

    const facturacionRow = ingresosSection.rows.find(r => r.label === 'Facturación Total');
    if (!facturacionRow) return null;

    const validations = years.map(year => validatePercentageRows(facturacionRow.id, year));
    
    return {
      sectionId: ingresosSection.id,
      baseRowId: facturacionRow.id,
      validations,
      hasIssues: validations.some(v => !v.isValid)
    };
  }, [sections, years, validatePercentageRows]);

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
                          className="h-7 w-7 p-0"
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
                          className="font-bold text-sm bg-transparent border-b border-dotted border-muted-foreground/50 focus:border-primary rounded-none p-1 h-auto w-fit max-w-md"
                        />
                      ) : (
                        <span className="font-bold text-sm px-1">{section.title}</span>
                      )}
                      <div className="flex gap-1">
                        {ingresosValidation?.sectionId === section.id && ingresosValidation.hasIssues && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => normalizePercentageRows(ingresosValidation.sectionId, ingresosValidation.baseRowId)}
                            className="h-7 gap-1.5"
                            title="Normalizar porcentajes al 100%"
                          >
                            <Percent className="h-3.5 w-3.5" />
                            Normalizar al 100%
                          </Button>
                        )}
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

                {/* Validation Alert for INGRESOS */}
                {ingresosValidation?.sectionId === section.id && ingresosValidation.hasIssues && (
                  <tr>
                    <td colSpan={years.length + 2} className="px-3 pt-2 pb-3">
                      <Alert variant="destructive" className="py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs flex items-center gap-2">
                          <span>Los porcentajes de ingresos no suman 100%:</span>
                          {ingresosValidation.validations.map((v, idx) => (
                            <Badge key={years[idx]} variant={v.isValid ? "success" : "destructive"} className="text-xs">
                              {years[idx]}: {v.sum.toFixed(1)}%
                            </Badge>
                          ))}
                          <span className="text-muted-foreground">→ Usa el botón "Normalizar al 100%"</span>
                        </AlertDescription>
                      </Alert>
                    </td>
                  </tr>
                )}

                {/* Section Rows */}
                {section.rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-transparent">
                    {/* Row Label */}
                    <td className={`p-3 text-sm border-r min-w-[300px] w-[300px] sticky left-0 bg-card z-10 ${row.indented ? 'pl-8' : 'pl-3'}`}>
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

                    {/* Year Values */}
                    {years.map((year) => (
                      <td key={year} className="p-3 text-right border-r w-[250px]">
                        {row.type === 'input' ? (
                          <Input
                            type="text"
                            value={formatNumber(row.values[year] || 0)}
                            onChange={(e) => updateRowValue(section.id, row.id, year, e.target.value)}
                            className="font-mono h-9 w-full text-right border-muted-foreground/30 focus:border-primary bg-muted/20"
                          />
                        ) : row.type === 'percentage' ? (
                          <div className="flex items-center gap-1 justify-end w-full">
                            <Input
                              type="text"
                              value={formatNumber(row.values[year] || 0)}
                              onChange={(e) => updateRowValue(section.id, row.id, year, e.target.value)}
                              className="font-mono h-9 w-24 text-right border-muted-foreground/30 focus:border-primary bg-muted/20"
                            />
                            <span className="text-xs">%</span>
                            <span className="font-mono text-sm ml-2 w-20 text-right">
                              {formatNumber(getCachedValue(row.id, year))}
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
                          const currentValue = getCachedValue(row.id, lastYear);
                          const prevValue = getCachedValue(row.id, prevYear);
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
