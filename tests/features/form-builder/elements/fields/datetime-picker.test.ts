import { updateDateTimePart } from '@/features/form-builder/elements/fields/datetime-picker'
import { describe, expect, it } from 'vitest'

const dateAt = (hours: number, minutes = 30) =>
  new Date(2026, 0, 15, hours, minutes)

describe('updateDateTimePart', () => {
  it('treats 12 AM as midnight without changing the date', () => {
    const currentDate = dateAt(9)

    const updatedDate = updateDateTimePart(currentDate, 'hour', '12')

    expect(updatedDate).not.toBe(currentDate)
    expect(updatedDate.getDate()).toBe(15)
    expect(updatedDate.getHours()).toBe(0)
    expect(updatedDate.getMinutes()).toBe(30)
    expect(currentDate.getHours()).toBe(9)
  })

  it('treats 12 PM as noon without rolling into the next day', () => {
    const currentDate = dateAt(13)

    const updatedDate = updateDateTimePart(currentDate, 'hour', '12')

    expect(updatedDate.getDate()).toBe(15)
    expect(updatedDate.getHours()).toBe(12)
    expect(updatedDate.getMinutes()).toBe(30)
    expect(currentDate.getHours()).toBe(13)
  })

  it.each([
    { currentHour: 1, expectedHour: 1 },
    { currentHour: 13, expectedHour: 13 },
  ])(
    'preserves the current meridiem for hour 1',
    ({ currentHour, expectedHour }) => {
      const updatedDate = updateDateTimePart(dateAt(currentHour), 'hour', '1')

      expect(updatedDate.getHours()).toBe(expectedHour)
    },
  )

  it('changes only the meridiem when AM or PM is selected', () => {
    expect(updateDateTimePart(dateAt(13), 'ampm', 'AM').getHours()).toBe(1)
    expect(updateDateTimePart(dateAt(1), 'ampm', 'PM').getHours()).toBe(13)
  })

  it('updates minutes without changing the calendar date or hour', () => {
    const updatedDate = updateDateTimePart(dateAt(13), 'minute', '45')

    expect(updatedDate.getDate()).toBe(15)
    expect(updatedDate.getHours()).toBe(13)
    expect(updatedDate.getMinutes()).toBe(45)
  })
})
