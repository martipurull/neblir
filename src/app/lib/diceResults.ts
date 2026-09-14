/** Returns a new array of die faces ordered from highest to lowest. */
export function sortDiceResultsHighToLow(results: readonly number[]): number[] {
  return [...results].sort((a, b) => b - a);
}
