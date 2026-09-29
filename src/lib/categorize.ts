import { guessCategory } from "./category-rules";
import type { ExpenseCategoryKey } from "./draft";

function buildPrompt(description: string): string {
  return `Categorize this expense. Reply with ONE key only: food, transport, entertainment, shopping, bills, health, education, savings.
food=meals/drinks/groceries; transport=fuel/ride-hailing/parking/transit; entertainment=movies/streaming/games; shopping=clothes/electronics/home goods; bills=utilities/internet/phone/rent/insurance; health=medicine/doctor/gym; education=courses/books/tuition; savings=savings/investments.
Expense: ${JSON.stringify(description)}`;
}

// Keyword rules first — they're free and cover most everyday descriptions —
// and the AI only for what they don't recognize. AI down, rate-limited, or
// unusable reply: shopping.
export async function categorizeExpense(
  description: string,
  ask: (prompt: string) => Promise<string>
): Promise<ExpenseCategoryKey> {
  const rule = guessCategory(description);
  if (rule) return rule;
  try {
    const match = (await ask(buildPrompt(description)))
      .toLowerCase()
      .match(/\b(food|transport|entertainment|shopping|bills|health|education|savings)\b/);
    return match ? (match[1] as ExpenseCategoryKey) : "shopping";
  } catch {
    return "shopping";
  }
}
