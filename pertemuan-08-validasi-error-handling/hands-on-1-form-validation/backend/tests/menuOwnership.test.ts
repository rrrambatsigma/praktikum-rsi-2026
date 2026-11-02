import assert from 'node:assert/strict';
import test from 'node:test';
import { canManageStall } from '../src/services/menuOwnership.ts';
import type { AuthUser } from '../src/types/user.ts';

const owner: AuthUser = {
  id: 2,
  name: 'Bu Tini',
  email: 'tini@kantin.test',
  role: 'owner',
};

const otherOwner: AuthUser = {
  id: 3,
  name: 'Pak Slamet',
  email: 'slamet@kantin.test',
  role: 'owner',
};

const admin: AuthUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@kantin.test',
  role: 'admin',
};

test('owner boleh mengelola warung miliknya sendiri', () => {
  assert.equal(canManageStall(2, owner), true);
});

test('owner tidak boleh mengelola warung milik owner lain', () => {
  assert.equal(canManageStall(3, owner), false);
  assert.equal(canManageStall(3, otherOwner), true);
});

test('admin boleh mengelola semua warung', () => {
  assert.equal(canManageStall(2, admin), true);
  assert.equal(canManageStall(3, admin), true);
});
