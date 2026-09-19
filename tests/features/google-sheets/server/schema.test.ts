import { describe, expect, it } from 'vitest'
import {
  createGoogleSheetsHeaders,
  createGoogleSheetsRow,
  reconcileGoogleSheetsHeaders,
} from '@/features/google-sheets/server/schema'
import type { FormStructure } from '@/features/form-builder/form-structure'

const structure = {
  pages: [
    {
      id: 'page-1',
      sections: [
        {
          id: 'section-1',
          fields: [
            { id: 'name', label: 'Name', uniqueIdentifier: 'text-input' },
            { id: 'topics', label: 'Topics', uniqueIdentifier: 'multi-select' },
            { id: 'updates', label: 'Updates', uniqueIdentifier: 'switch-field' },
          ],
        },
      ],
    },
  ],
} as unknown as FormStructure

describe('Google Sheets response schema', () => {
  it('creates stable fixed and field columns', () => {
    expect(createGoogleSheetsHeaders(structure)).toEqual([
      { key: '__response_id', label: 'Submission ID' },
      { key: '__submitted_at', label: 'Submitted At' },
      { key: 'name', label: 'Name' },
      { key: 'topics', label: 'Topics' },
      { key: 'updates', label: 'Updates' },
    ])
  })

  it('creates a response-time row without changing field order', () => {
    const headers = createGoogleSheetsHeaders(structure)

    expect(
      createGoogleSheetsRow(
        headers,
        'response-1',
        new Date('2026-09-18T00:00:00.000Z'),
        { name: 'Aditya', topics: ['Forms', 'Sheets'], updates: false },
      ),
    ).toEqual([
      'response-1',
      '2026-09-18T00:00:00.000Z',
      'Aditya',
      'Forms, Sheets',
      'No',
    ])
  })

  it('only appends newly added fields during schema reconciliation', () => {
    const current = createGoogleSheetsHeaders(structure)
    const next = {
      ...structure,
      pages: structure.pages.map((page) => ({
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          fields: [
            ...section.fields,
            { id: 'company', label: 'Name', uniqueIdentifier: 'text-input' },
          ],
        })),
      })),
    } as unknown as FormStructure

    expect(reconcileGoogleSheetsHeaders(current, next)).toEqual([
      ...current,
      { key: 'company', label: 'Name' },
    ])
  })

  it('preserves duplicate field labels exactly as the form author wrote them', () => {
    const duplicateLabels = {
      ...structure,
      pages: structure.pages.map((page) => ({
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          fields: [
            ...section.fields,
            { id: 'name-again', label: 'Name', uniqueIdentifier: 'text-input' },
          ],
        })),
      })),
    } as unknown as FormStructure

    expect(createGoogleSheetsHeaders(duplicateLabels)).toEqual([
      ...createGoogleSheetsHeaders(structure),
      { key: 'name-again', label: 'Name' },
    ])
  })

  it('restores a current field label without changing its column position', () => {
    const historicalHeaders = [
      ...createGoogleSheetsHeaders(structure),
      { key: 'retired-field', label: 'Retired field' },
    ]
    historicalHeaders[2] = { key: 'name', label: 'Name (2)' }

    expect(reconcileGoogleSheetsHeaders(historicalHeaders, structure)).toEqual([
      { key: '__response_id', label: 'Submission ID' },
      { key: '__submitted_at', label: 'Submitted At' },
      { key: 'name', label: 'Name' },
      { key: 'topics', label: 'Topics' },
      { key: 'updates', label: 'Updates' },
      { key: 'retired-field', label: 'Retired field' },
    ])
  })

  it('keeps historical column order through field deletion and reordering', () => {
    const current = createGoogleSheetsHeaders(structure)
    const next = {
      pages: [
        {
          id: 'page-1',
          sections: [
            {
              id: 'section-1',
              fields: [
                {
                  id: 'updates',
                  label: 'Product updates',
                  uniqueIdentifier: 'switch-field',
                },
                { id: 'name', label: 'Full name', uniqueIdentifier: 'text-input' },
                { id: 'company', label: 'Company', uniqueIdentifier: 'text-input' },
              ],
            },
          ],
        },
      ],
    } as unknown as FormStructure

    expect(reconcileGoogleSheetsHeaders(current, next)).toEqual([
      { key: '__response_id', label: 'Submission ID' },
      { key: '__submitted_at', label: 'Submitted At' },
      { key: 'name', label: 'Full name' },
      { key: 'topics', label: 'Topics' },
      { key: 'updates', label: 'Product updates' },
      { key: 'company', label: 'Company' },
    ])
  })

  it('keeps existing value serialization rules', () => {
    expect(
      createGoogleSheetsRow(
        [
          { key: 'empty', label: 'Empty' },
          { key: 'choices', label: 'Choices' },
          { key: 'enabled', label: 'Enabled' },
          { key: 'metadata', label: 'Metadata' },
        ],
        'response-1',
        new Date('2026-09-18T00:00:00.000Z'),
        {
          empty: null,
          choices: ['Forms', '', 'Sheets'],
          enabled: true,
          metadata: { source: 'builder' },
        },
      ),
    ).toEqual(['', 'Forms, Sheets', 'Yes', '{"source":"builder"}'])
  })
})
