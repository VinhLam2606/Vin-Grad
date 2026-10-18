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
  await assertSucceeds(setDoc(doc(db, 'wishes', 'valid'), {
    name: 'Minh Anh',
    message: 'Chúc Vinh luôn thành công!',
    createdAt: serverTimestamp(),
  }))
})

test('rules reject empty, oversized, or extra fields', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  const wishes = collection(db, 'wishes')

  await assertFails(setDoc(doc(wishes, 'empty'), {
    name: ' ',
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(wishes, 'long-name'), {
    name: 'N'.repeat(41),
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(wishes, 'long-message'), {
    name: 'Minh Anh',
    message: 'M'.repeat(301),
    createdAt: serverTimestamp(),
  }))
  await assertFails(setDoc(doc(wishes, 'extra-field'), {
    name: 'Minh Anh',
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
    isAdmin: true,
  }))
})

test('rules reject client timestamps and all updates or deletes', async () => {
  const db = testEnvironment.unauthenticatedContext().firestore()
  const wishRef = doc(db, 'wishes', 'immutable')

  await assertFails(setDoc(wishRef, {
    name: 'Minh Anh',
    message: 'Xin chúc mừng!',
    createdAt: new Date(),
  }))
  await assertSucceeds(setDoc(wishRef, {
    name: 'Minh Anh',
    message: 'Xin chúc mừng!',
    createdAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(wishRef, { message: 'Đã bị sửa' }))
  await assertFails(deleteDoc(wishRef))
})
