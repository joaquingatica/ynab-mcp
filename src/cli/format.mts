export const OutputFormat = {
  json: 'json',
  csv: 'csv',
  markdown: 'markdown',
} as const
export type OutputFormat = (typeof OutputFormat)[keyof typeof OutputFormat]

export const formatCategories = (
  categories: ReadonlyArray<{
    id: string
    name: string
    group: { id: string; name: string }
  }>,
  format: OutputFormat,
): string => {
  switch (format) {
    case 'json':
      return JSON.stringify(categories, null, 2)
    case 'csv': {
      const rows = categories.map(
        ({ group, id, name }) =>
          `${JSON.stringify(id)},${JSON.stringify(name)},${JSON.stringify(group.id)},${JSON.stringify(group.name)}`,
      )
      return ['id,name,group_id,group_name', ...rows].join('\n')
    }
    case 'markdown': {
      const rows = categories.map(
        ({ group, id, name }) => `| ${id} | ${name} | ${group.name} |`,
      )
      return ['| id | name | group |', '| --- | --- | --- |', ...rows].join(
        '\n',
      )
    }
  }
}
