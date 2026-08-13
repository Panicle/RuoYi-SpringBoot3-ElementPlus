/**
 * 课题预算细分：分组展示归类（仅展示用，不落库）。
 * 科目名不在此硬编码，统一由字典 budget_category 渲染（值大写 LABOR/EQUIPMENT/.../TAX）。
 */
export const BUDGET_GROUPS = [
  { title: "直接费", categories: ["LABOR", "EQUIPMENT", "MATERIAL", "TESTING", "FUEL", "TRAVEL", "PUBLICATION"] },
  { title: "间接费", categories: ["INDIRECT"] },
  { title: "委外支出费", categories: ["OUTSOURCING"] },
  { title: "税金", categories: ["TAX"] }
]

/** 10 个叶子科目（保持表顺序） */
export const BUDGET_CATEGORIES = BUDGET_GROUPS.flatMap(g => g.categories)

/** 按字典渲染科目名 */
export function buildBudgetCategoryMap(dictList) {
  const map = {}
  ;(dictList || []).forEach(d => { if (d && d.value) map[d.value] = d.label })
  return map
}
