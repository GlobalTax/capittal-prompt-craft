import { useState } from "react";
import Header from "@/components/Header";
import ValuationCalculator from "@/components/ValuationCalculator";
import FinancialRatiosGuide from "@/components/FinancialRatiosGuide";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculator">Calculadora de Valoración</TabsTrigger>
            <TabsTrigger value="guide">Guía de Ratios</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <ValuationCalculator />
          </TabsContent>

          <TabsContent value="guide">
            <FinancialRatiosGuide />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
