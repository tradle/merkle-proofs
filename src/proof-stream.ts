import { Transform } from 'streamx'
import { MerkleProofGenerator, MiniNode } from './generator'

export class MerkleProofStream <Hash, Node extends MiniNode<Hash>> extends Transform<MiniNode<Hash>, number | Node> {
  _generator: MerkleProofGenerator<Hash, Node>
  constructor (opts: { highWaterMark?: number, nodes: Node[] }) {
    if (!opts || !opts.nodes) throw new Error('expected merkle tree nodes')
    super({ highWaterMark: opts?.highWaterMark ?? 16 })
    this._generator = new MerkleProofGenerator(opts.nodes)
  }
  _transform (idx, cb) {
    const nodes = this._generator.add(idx)
    for (const node of nodes) this.push(node)
    cb()
  }
  _final (cb) {
    this.push(this._generator._root)
    this.push(null)
    cb()
  }
}
