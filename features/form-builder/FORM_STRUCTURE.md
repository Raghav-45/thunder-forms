# Form Structure v1

## Contract

ThunderForms stores every form as one page/section/field tree.

```ts
{
  pages: [
    {
      id: string,
      sections: [
        {
          id: string,
          fields: FieldConfig[],
        },
      ],
    },
  ],
}
```

Pages and sections organise authoring. Public forms render fields in page,
section, then field order until respondent page navigation is introduced.

## Ownership

`features/form-builder/form-structure.ts` owns the shared structure contract:

- `FormStructure`, `FormPage`, and `FormSection`;
- page, section, and form factories;
- structure validation; and
- ordered public-field projection.

`forms.fields` is a Prisma `Json` column. Application validation owns this
tree contract because the database stores JSON without domain-level shape
validation.^1

## Valid structure

`isFormStructure` requires:

1. arrays at every structural level;
2. non-empty page, section, and field IDs;
3. globally unique IDs within one form; and
4. a registered field `uniqueIdentifier`.

Global IDs protect sortable groups, field lookup, and submitted answer keys.
dnd kit documents grouped sortable lists as separately identified groups and
items.^2

## Producers and consumers

| Area | Responsibility |
| --- | --- |
| Builder | Creates and edits the tree. |
| Templates, imports, and AI | Create fields, then place them in a new tree. |
| Create and update APIs | Accept only valid trees. |
| Duplicate API | Copies only a valid tree. |
| View and submit APIs | Read only a valid tree. |
| Public form | Renders ordered fields from a valid tree. |

## Verification

For each change, verify a valid multi-page form preserves page, section, and
field order through save, view, validation, and submission. Verify malformed
stored JSON returns HTTP 422 and never creates a response.

## Sources

1. Prisma. [Working with Json fields](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields). Accessed 11 September 2026.
2. dnd kit. [Sortable concepts](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/concepts/sortable.mdx). Accessed 11 September 2026.
