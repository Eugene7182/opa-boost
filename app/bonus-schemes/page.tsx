import type { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BonusGrid } from "./components/BonusGrid";
import { TierGrid } from "./components/TierGrid";
import { RoleGuard } from "@/components/RoleGuard";
import { BackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Бонусная сетка",
  description: "Управление бонусами и коридорами перевыполнения плана",
};

export default function BonusSchemesPage() {
  return (
    <RoleGuard allowedRoles={["admin", "office"]}>
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-16">
              <BackButton />
              <h1 className="text-xl font-semibold ml-4">Бонусная сетка</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="basic">Базовые бонусы</TabsTrigger>
              <TabsTrigger value="tiers">Перевыполнение</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <BonusGrid />
            </TabsContent>

            <TabsContent value="tiers">
              <TierGrid />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </RoleGuard>
  );
}