import { expect, test } from 'vitest'
import { tiltOffset } from './heroMotion'

test('makes small tilts visible while keeping the photo within its crop', () => {
  expect([tiltOffset(-90), tiltOffset(0), tiltOffset(10), tiltOffset(90)]).toEqual([-30, 0, 12, 30])
})
