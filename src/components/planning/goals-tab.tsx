"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { GoalView } from "@/lib/goal-progress";
import { createGoal, fetchGoals } from "@/lib/planning/api";
import { GoalForm } from "./goal-form";
import { GoalItem } from "./goal-item";
import { ListSkeleton } from "./list-skeleton";

export function GoalsTab() {
  const t = useTranslations("planning");
  const [items, setItems] = useState<GoalView[] | null>(null);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setItems(await fetchGoals());
    } catch {
      setError(true);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addButton = (
    <Button size="sm" onClick={() => setAdding(true)}>
      <Plus className="h-3.5 w-3.5" />
      {t("addGoal")}
    </Button>
  );

  return (
    <div className="space-y-3.5">
      {items !== null && items.length > 0 && !adding && (
        <div className="flex justify-end">{addButton}</div>
      )}
      {adding && (
        <GoalForm
          onSubmit={async (input) => {
            await createGoal(input);
            setAdding(false);
            await load();
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {items === null ? (
        <ListSkeleton rows={2} />
      ) : error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{t("loadError")}</p>
      ) : items.length === 0 ? (
        !adding && (
          <EmptyState
            icon={PiggyBank}
            title={t("goalsEmptyTitle")}
            subtitle={t("goalsEmptySub")}
            action={addButton}
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {items.map((g) => (
            <GoalItem key={g.id} goal={g} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
