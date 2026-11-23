import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BRANCHES,
  BRANCH_MAP,
  DEFAULT_BRANCH_ID,
  syncBranchesFromApi,
} from '../src/shared/api-client.ts';

test('syncs API branches and preserves local branches when the API is empty or unavailable', async () => {
  const originalFetch = globalThis.fetch;
  const branchesReference = BRANCHES;
  const branchMapReference = BRANCH_MAP;

  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      data: [
        { id: 'branch-1', code: 'CENTRO', name: 'Bistro Centro' },
        { id: 'branch-2', code: 'JARDIN', name: 'Bistro Jardín' },
      ],
    }), { status: 200 });

    await syncBranchesFromApi();

    assert.strictEqual(BRANCHES, branchesReference);
    assert.strictEqual(BRANCH_MAP, branchMapReference);
    assert.deepEqual(BRANCHES, [
      { key: 'CENTRO', label: 'Centro', id: 'branch-1' },
      { key: 'JARDIN', label: 'Jardín', id: 'branch-2' },
    ]);
    assert.equal(BRANCH_MAP.JARDIN, 'branch-2');
    assert.equal(BRANCH_MAP.Jardín, 'branch-2');
    assert.equal(DEFAULT_BRANCH_ID, 'branch-1');

    const syncedBranches = BRANCHES.slice();
    const syncedBranchMap = { ...BRANCH_MAP };
    const syncedDefaultBranchId = DEFAULT_BRANCH_ID;

    globalThis.fetch = async () => new Response(JSON.stringify([]), { status: 200 });
    await syncBranchesFromApi();
    assert.deepEqual(BRANCHES, syncedBranches);
    assert.deepEqual(BRANCH_MAP, syncedBranchMap);
    assert.equal(DEFAULT_BRANCH_ID, syncedDefaultBranchId);

    globalThis.fetch = async () => {
      throw new Error('API unavailable');
    };
    await syncBranchesFromApi();
    assert.deepEqual(BRANCHES, syncedBranches);
    assert.deepEqual(BRANCH_MAP, syncedBranchMap);
    assert.equal(DEFAULT_BRANCH_ID, syncedDefaultBranchId);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
