var Transform = require('readable-stream').Transform
var MerkleProofGenerator = require('./generator')

module.exports = class MerkleTreeProof extends Transform {
  constructor (opts) {
    if (!opts || !opts.nodes) throw new Error('expected merkle tree nodes')
    super({ objectMode: true, highWaterMark: hwm })
    this._generator = new MerkleProofGenerator(opts.nodes)
    this.destroyed = false
    var hwm = opts.highWaterMark || 16
  }
  destroy (err) {
    if (this.destroyed) return
    this.destroyed = true
    if (err) this.emit('error', err)
    this.emit('close')
  }
  _transform (idx, enc, cb) {
    var nodes = this._generator.add(idx)
    for (var i = 0; i < nodes.length; i++) this.push(nodes[i])
    cb()
  }

  end () {
    this.push(this._generator._root)
    return super.end.apply(this, arguments)
  }
}
