export const baseCategories = [];
export const categorySets = [];

export function categorySort(a, b) {
  // Sort in order of set length
  const length = a.sets.length - b.sets.length;
  if (length !== 0) {
    return length;
  }
  // And if they're the same length,
  // sort in order of the indexes in the sets
  for (let index = 0; index < a.sets.length; index += 1) {
    return a.sets[index] - b.sets[index];
  }

  return 0;
}

/**
 * Function to take our category stores and turn it into a format usable by D3
 */
export function serializeCategories() {
  const serializedCategories = baseCategories.concat(categorySets);
  serializedCategories.sort(categorySort);

  // Only pass categories with overlaps
  return serializedCategories.filter(({ size: setSize }) => setSize);
}

/**
 * Adds a new category to our list of categories and generates
 * intersections for each of the existing categories
 */
export function addNewCategory(label, size) {
  const newCategoryIndex = baseCategories.length;
  // Add itself to the base categories
  const newCategory = {
    sets: [newCategoryIndex],
    label,
    size,
  };

  const addToSet = (categorySet) => ({
    // Sort the sets in place for ease of the serializer
    sets: categorySet.sets.concat([newCategoryIndex]).sort(),
    size:
      // The size of the sets cannot be larger than either of the categories
      Math.min(size, categorySet.size) *
      // Randomize the size of the overlap
      Math.random() *
      0.6 *
      // TODO: Figure out how often we want overlaps
      // Math.round(Math.random() * X) basically says we get overlaps less than half the time
      Math.round(Math.random() * 0.7),
  });

  // Now duplicate the existing pair sets
  const pairSets = baseCategories.map(addToSet);
  // Now duplicate the existing multi sets
  const multiSets = categorySets.map(addToSet);

  // Finally add the new category to the base categories
  baseCategories.push(newCategory);
  // And the new pari and multi sets
  categorySets.push(...pairSets, ...multiSets);
}
