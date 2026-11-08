export type StageSymptom = {
  id: string;
  title: string;
  aliases: string[];
  stages: string[];
  category: string;
  description: string;
  explanation: string;
  care: string[];
  contact: string[];
  sourceIds: string[];
  warningIds: string[];
  careLevel: string;
};

type SearchableSymptom = Pick<StageSymptom, 'stages' | 'category' | 'title'> &
  Partial<Pick<StageSymptom, 'aliases' | 'description' | 'explanation' | 'care' | 'contact'>>;

export function filterStageSymptoms<T extends SearchableSymptom>(
  symptoms: T[],
  filters: { stage: string; query?: string; category?: string },
): T[] {
  if (!['early', 'middle', 'late'].includes(filters.stage)) return [];
  const query = (filters.query || '').trim().toLocaleLowerCase();
  return symptoms.filter(
    (symptom) =>
      symptom.stages.includes(filters.stage) &&
      (!filters.category || symptom.category === filters.category) &&
      (!query ||
        [
          symptom.title,
          ...(symptom.aliases || []),
          symptom.description,
          symptom.explanation,
          ...(symptom.care || []),
          ...(symptom.contact || []),
        ]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query)),
  );
}
