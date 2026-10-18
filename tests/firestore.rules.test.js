import { readFile } from 'node:fs/promises'
import { after, before, beforeEach, test } from 'node:test'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

const projectId = 'demo-vin-grad'
let testEnvironment

before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8')
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  })
})

beforeEach(async () => {
  await testEnvironment.clearFirestore()
})

after(async () => {
  await testEnvironment.cleanup()
})

test('any visitor can read wishes', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  await assertSucceeds(getDocs(collection(db, 'wishes')))
})

test('visitor can create a well-formed wish with server timestamp', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  const batch = writeBatch(db)
  batch.set(doc(db, 'wishes', 'valid'), {
    name: 'Minh Anh',
    message: 'Chúc Vinh luôn thành công!',
    createdAt: serverTimestamp(),
  })
  batch.set(doc(db, 'wishNames', 'Minh Anh'), { name: 'Minh Anh', wishId: 'valid' })
  await assertSucceeds(batch.commit())
})

test('rules reject empty, oversized, or extra fields', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  const batch = writeBatch(db)
  batch.set(doc(db, 'wishes', 'empty'), {
    name: ' ',
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
  })
  batch.set(doc(db, 'wishNames', ' '), { name: ' ', wishId: 'empty' })
  await assertFails(batch.commit())

  const longName = writeBatch(db)
  longName.set(doc(db, 'wishes', 'long-name'), {
    name: 'N'.repeat(17),
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
  })
  longName.set(doc(db, 'wishNames', 'N'.repeat(17)), { name: 'N'.repeat(17), wishId: 'long-name' })
  await assertFails(longName.commit())

  const longMessage = writeBatch(db)
  longMessage.set(doc(db, 'wishes', 'long-message'), {
    name: 'Minh Anh',
    message: 'M'.repeat(81),
    createdAt: serverTimestamp(),
  })
  longMessage.set(doc(db, 'wishNames', 'Minh Anh'), { name: 'Minh Anh', wishId: 'long-message' })
  await assertFails(longMessage.commit())

  const extraField = writeBatch(db)
  extraField.set(doc(db, 'wishes', 'extra-field'), {
    name: 'Minh Anh',
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
    isAdmin: true,
  })
  extraField.set(doc(db, 'wishNames', 'Minh Anh'), { name: 'Minh Anh', wishId: 'extra-field' })
  await assertFails(extraField.commit())
})

test('a sender name can only be reserved once', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  const firstWish = writeBatch(db)
  firstWish.set(doc(db, 'wishes', 'first'), {
    name: 'Minh Anh',
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
  })
  firstWish.set(doc(db, 'wishNames', 'Minh Anh'), { name: 'Minh Anh', wishId: 'first' })
  await assertSucceeds(firstWish.commit())

  const duplicateWish = writeBatch(db)
  duplicateWish.set(doc(db, 'wishes', 'second'), {
    name: 'Minh Anh',
    message: 'Một lời chúc khác!',
    createdAt: serverTimestamp(),
  })
  duplicateWish.set(doc(db, 'wishNames', 'Minh Anh'), { name: 'Minh Anh', wishId: 'second' })
  await assertFails(duplicateWish.commit())
})

test('an existing wish name can be reserved but not reused', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'wishes', 'legacy'), {
      name: 'Legacy Name',
      message: 'Lời chúc cũ',
      createdAt: new Date(),
    })
  })

  const db = testEnvironment.unauthenticatedContext().firestore()
  await assertSucceeds(setDoc(doc(db, 'wishNames', 'Legacy Name'), {
    name: 'Legacy Name',
    wishId: 'legacy',
  }))

  const duplicateWish = writeBatch(db)
  duplicateWish.set(doc(db, 'wishes', 'second-legacy'), {
    name: 'Legacy Name',
    message: 'Lời chúc khác',
    createdAt: serverTimestamp(),
  })
  duplicateWish.set(doc(db, 'wishNames', 'Legacy Name'), {
    name: 'Legacy Name',
    wishId: 'second-legacy',
  })
  await assertFails(duplicateWish.commit())
})

test('rules reject client timestamps and all updates or deletes', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  const wishRef = doc(db, 'wishes', 'immutable')
  const nameRef = doc(db, 'wishNames', 'Minh Anh')

  const invalidTimestamp = writeBatch(db)
  invalidTimestamp.set(wishRef, {
    name: 'Minh Anh',
    message: 'Xin chúc mừng!',
    createdAt: new Date(),
  })
  invalidTimestamp.set(nameRef, { name: 'Minh Anh', wishId: 'immutable' })
  await assertFails(invalidTimestamp.commit())

  const validWish = writeBatch(db)
  validWish.set(wishRef, {
    name: 'Minh Anh',
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
  })
  validWish.set(nameRef, { name: 'Minh Anh', wishId: 'immutable' })
  await assertSucceeds(validWish.commit())
  await assertFails(updateDoc(wishRef, { message: 'Đã bị sửa' }))
  await assertFails(deleteDoc(wishRef))
  await assertFails(updateDoc(nameRef, { name: 'Tên mới' }))
  await assertFails(deleteDoc(nameRef))
})
