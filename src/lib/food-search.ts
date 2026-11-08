export type FoodRisk = 'avoid' | 'conditional' | 'usually-ok' | 'insufficient-evidence';
export type Food = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  keywords: string[];
  category: string;
  emoji: string;
  summary: string;
  preparations: {
    label: string;
    risk: string;
    conditions: string;
    reason: string;
    sourceIds: string[];
  }[];
  specialNotes: string;
};
export const riskLabels: Record<string, string> = {
  avoid: '建议避免',
  conditional: '限量 / 有条件',
  'usually-ok': '通常可选',
  'insufficient-evidence': '证据不足',
};
// Everyday examples across food groups, selected from the existing source-checked library.
// Selection does not imply that other foods are unsuitable or that these are required.
const suggestedFoodIds = new Set([
  'oats',
  'brown-rice',
  'whole-wheat',
  'sweet-potato',
  'milk',
  'yogurt',
  'eggs',
  'tofu',
  'salmon',
  'cod',
  'beef',
  'chicken',
  'spinach',
  'broccoli',
  'apple',
  'orange',
  'walnut',
  'almond',
]);
export function getRecommendedPreparation(food: Food) {
  if (!suggestedFoodIds.has(food.id)) return undefined;
  return food.preparations.find((preparation) => preparation.risk === 'usually-ok');
}
export function filterFoods(
  foods: Food[],
  filters: { query: string; category?: string; risk?: string; recommendedOnly?: boolean },
) {
  const query = filters.query.trim().toLocaleLowerCase();
  return foods.filter((food) => {
    const recommendation = filters.recommendedOnly ? getRecommendedPreparation(food) : undefined;
    const preparations = filters.recommendedOnly
      ? recommendation
        ? [recommendation]
        : []
      : food.preparations;
    return (
      (!filters.recommendedOnly || !!recommendation) &&
      (!query ||
        [food.name, ...food.aliases, ...food.keywords].some((word) =>
          word.toLocaleLowerCase().includes(query),
        )) &&
      (!filters.category || food.category === filters.category) &&
      (!filters.risk || preparations.some((p) => p.risk === filters.risk))
    );
  });
}
