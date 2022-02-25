import { Buffer } from 'buffer'
import * as flat from 'flat-tree'

export type LeafHash <Hash> = (node: { data: Buffer }, roots: any[]) => Hash;
export type ParentHash <Hash> = (a: { hash: Hash }, b: { hash: Hash }) => Hash;

export interface MerkleVerifierOpts <Hash> {
  leaf: LeafHash<Hash>
  parent: ParentHash<Hash>
  proof: any[]
}

export interface Verifier {
  (leaf: { index: number, data: string | Buffer }): boolean
  (leaf: string, idx: number): boolean
}

/**
 * @param {Array} opts.proof      list of nodes including root
 * @param {Function} opts.leaf    leaf hasher function
 * @param {Function} opts.parent  parent hasher function
 */
export function createVerifier <Hash> (opts: MerkleVerifierOpts<Hash>): Verifier {
  var proof = opts.proof
  const root = proof[proof.length - 1]
  const rootIdx = root.index

  const nodeByIndex: { [key: number]: any } = {}
  for (const node of proof) {
    nodeByIndex[node.index] = node
  }

  const { leaf: leafHasher, parent: parentHasher } = opts

  return function verify (leaf: { index: number, data: Buffer | string } | string, idx?: number): boolean {
    let data: Buffer
    if (typeof leaf === 'object') {
      // accept node object
      idx = leaf.index
      data = toBuffer(leaf.data)
    } else {
      if (idx === undefined) {
        throw new Error('can verify either leaf by object or by data and idx')
      }
      data = toBuffer(leaf)
    }

    let cur = leafHasher({ data }, [])
    while (idx !== rootIdx) {
      const siblingIdx = flat.sibling(idx)
      // node could be an only child
      const sibling = nodeByIndex[siblingIdx] || nodeByIndex[idx]
      if (!sibling) return false

      const left = idx < siblingIdx ? cur : sibling
      const right = left === cur ? sibling : cur

      cur = parentHasher(
        wrap(left),
        wrap(right)
      )

      idx = flat.parent(idx) as number
    }

    return equals(cur, root.hash)
  }
}

function wrap <Hash> (hash: { hash: Hash } | Hash): { hash: Hash } {
  return 'hash' in hash ? hash : { hash: hash }
}

function equals (a, b) {
  if (a.length !== b.length) return false

  for (let i = 0, l = a.length; i < l; i++) {
    if (a[i] !== b[i]) return false
  }

  return true
}

function toBuffer (data: string | Buffer): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data)
}
