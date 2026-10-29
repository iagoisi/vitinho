import { expect, test } from 'vitest'
import { tiltOffset } from './heroMotion'

test('limits photo movement to the available image crop', () => {
  expect([tiltOffset(-90), tiltOffset(0), tiltOffset(10), tiltOffset(90)]).toEqual([-14, 0, 4, 14])
})
