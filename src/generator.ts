const flat = require('flat-tree')

export interface MiniNode <Hash> {
  index: number,
  hash: Hash
}

export class MerkleProofGenerator <Hash, Node extends MiniNode<Hash>> {
  _indicesInProof: { [key: string]: any } = {}
  _rootIdx: number
  _nodes: Node[]
  _proof: MiniNode<Hash>[]
  _root: Node

  constructor (nodes: Node[]) {
    this._indicesInProof = {}
    this._nodes = new Array(nodes.length)

    // order tree
    for (const node of nodes) {
      this._nodes[node.index] = node
    }

    const height = nearestPowerOf2(nodes.length)
    this._rootIdx = Math.pow(2, height - 1) - 1
    this._root = this._nodes[this._rootIdx]
    this._proof = []
  }

  add (idx: number | Node): MiniNode<Hash>[] {
    // accept node or index as parameter
    if (typeof idx !== 'number') {
      if (this._nodes.indexOf(idx) === -1) throw new Error('expected index or node')

      idx = idx.index
    }

    const added: MiniNode<Hash>[] = []
    const path = getPath(idx, this._nodes, this._rootIdx)
    for (const nodeIdx of path) {
      if (nodeIdx in this._indicesInProof) continue

      this._indicesInProof[nodeIdx] = true
      const node = minify(this._nodes[nodeIdx])
      added.push(node)
      this._proof.push(node)
    }

    return added
  }

  proof (): MiniNode<Hash>[] {
    var proof = this._proof.slice()
    proof.push(minify(this._root))
    return proof
  }
}

function getPath <Hash>(leafIdx: number, nodeByIdx: MiniNode<Hash>[], rootIdx: number): number[] {
  const path: number[] = []
  while (leafIdx !== rootIdx) {
    var sib = flat.sibling(leafIdx)
    path.push(sib in nodeByIdx ? sib : leafIdx)
    leafIdx = flat.parent(leafIdx)
  }

  return path
}

function nearestPowerOf2 (n: number): number {
  return Math.ceil(Math.log(n) / Math.log(2))
}

function minify <Hash> (node: MiniNode<Hash>): MiniNode<Hash> {
  return {
    index: node.index,
    hash: node.hash
  }
}
