export type AnomalyResult =
  | { detected: false }
  | {
      detected: true;
      category: string;
      categoryLabel: string;
      thisWeek: number;
      typical: number;
      percentageChange: number;
      direction: "up" | "down";
      summary: string;
      triggeredTransactions: {
        id: string;
        description: string;
        amount: number;
        isNew: boolean;
      }[];
    };
