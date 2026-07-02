/**
 * Heuristic for the whole-food share of the Food Quality Score. Deliberately
 * simple and transparent: unbranded foods whose names match common whole-food
 * terms count; ultra-processed keywords veto.
 */

const WHOLE_FOOD_TERMS = [
  "apple", "banana", "orange", "berr", "grape", "melon", "peach", "pear",
  "mango", "pineapple", "kiwi", "avocado", "tomato", "broccoli", "spinach",
  "kale", "lettuce", "carrot", "pepper", "onion", "garlic", "potato",
  "sweet potato", "cucumber", "zucchini", "mushroom", "cauliflower",
  "cabbage", "beet", "squash", "asparagus", "green bean", "pea", "corn",
  "chicken breast", "chicken thigh", "turkey", "beef", "steak", "pork",
  "lamb", "salmon", "tuna", "cod", "shrimp", "sardine", "trout", "tilapia",
  "egg", "milk", "yogurt", "yoghurt", "cottage cheese", "kefir",
  "oat", "rice", "quinoa", "barley", "buckwheat", "lentil", "chickpea",
  "bean", "tofu", "tempeh", "edamame",
  "almond", "walnut", "cashew", "peanut", "pistachio", "pecan", "seed",
  "raw", "fresh", "plain", "whole",
];

const PROCESSED_TERMS = [
  "candy", "soda", "cola", "chip", "crisps", "cookie", "biscuit", "cake",
  "pastry", "donut", "doughnut", "frosting", "syrup", "energy drink",
  "instant noodle", "hot dog", "nugget", "fried", "pizza", "ice cream",
  "chocolate bar", "sweetened", "snack mix", "cereal bar", "toaster",
];

export function isLikelyWholeFood(name: string, brand: string | null): boolean {
  const n = name.toLowerCase();
  if (PROCESSED_TERMS.some((t) => n.includes(t))) return false;
  const matchesWhole = WHOLE_FOOD_TERMS.some((t) => n.includes(t));
  // Branded items need a whole-food term to qualify; generic ones get the
  // benefit of the doubt only when a term matches too.
  if (brand) return matchesWhole && !n.includes("flavored") && !n.includes("flavour");
  return matchesWhole;
}
