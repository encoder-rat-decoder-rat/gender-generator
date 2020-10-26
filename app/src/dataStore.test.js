import {
  baseCategories,
  categorySets,
  serializeCategories,
  addNewCategory,
} from "./dataStore.js";

beforeEach(() => {
  baseCategories.length = 0;
  categorySets.length = 0;
});

afterEach(() => {
  baseCategories.length = 0;
  categorySets.length = 0;
});

test("adding new categories should create the right amount of intersections", () => {
  addNewCategory("Test 1", 100);

  expect(baseCategories.length).toEqual(1);
  expect(baseCategories[0].sets).toEqual([0]);
  expect(baseCategories[0].label).toEqual("Test 1");
  expect(baseCategories[0].size).toEqual(100);

  expect(categorySets.length).toEqual(0);

  addNewCategory("Test 2", 50);
  expect(baseCategories.length).toEqual(2);
  expect(baseCategories[1].sets).toEqual([1]);
  expect(baseCategories[1].label).toEqual("Test 2");
  expect(baseCategories[1].size).toEqual(50);

  expect(categorySets.length).toEqual(1);
  expect(categorySets[0].sets).toEqual([0, 1]);
  expect(categorySets[0].size).toBeLessThanOrEqual(100);

  addNewCategory("Test 3", 75);
  expect(baseCategories.length).toEqual(3);
  expect(baseCategories[2].sets).toEqual([2]);
  expect(baseCategories[2].label).toEqual("Test 3");
  expect(baseCategories[2].size).toEqual(75);

  expect(categorySets.length).toEqual(4);
  expect(categorySets[1].sets).toEqual([0, 2]);
  expect(categorySets[1].size).toBeLessThanOrEqual(75);

  expect(categorySets[2].sets).toEqual([1, 2]);
  expect(categorySets[2].size).toBeLessThanOrEqual(50);

  expect(categorySets[3].sets).toEqual([0, 1, 2]);
  expect(categorySets[3].size).toBeLessThanOrEqual(50);
});

test("categories should serialize correctly", () => {
  addNewCategory("Test 1", 100);
  addNewCategory("Test 2", 50);
  addNewCategory("Test 3", 75);
  addNewCategory("Test 4", 88);

  const serializedData = serializeCategories();

  expect(serializedData.length).toEqual(15);

  // The first 4 should be our base categories
  expect(serializedData[0]).toEqual({ sets: [0], label: "Test 1", size: 100 });
  expect(serializedData[1]).toEqual({ sets: [1], label: "Test 2", size: 50 });
  expect(serializedData[2]).toEqual({ sets: [2], label: "Test 3", size: 75 });
  expect(serializedData[3]).toEqual({ sets: [3], label: "Test 4", size: 88 });

  // The next 6 should be pairs
  expect(serializedData[4].sets).toEqual([0, 1]);
  expect(serializedData[5].sets).toEqual([0, 2]);
  expect(serializedData[6].sets).toEqual([0, 3]);
  expect(serializedData[7].sets).toEqual([1, 2]);
  expect(serializedData[8].sets).toEqual([1, 3]);
  expect(serializedData[9].sets).toEqual([2, 3]);

  // The next 4 should be triplets
  expect(serializedData[10].sets).toEqual([0, 1, 2]);
  expect(serializedData[11].sets).toEqual([0, 1, 3]);
  expect(serializedData[12].sets).toEqual([0, 2, 3]);
  expect(serializedData[13].sets).toEqual([1, 2, 3]);

  // The last should be the intersection of all of them
  expect(serializedData[14].sets).toEqual([0, 1, 2, 3]);
});
