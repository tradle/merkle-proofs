const crypto = require('crypto')
const MerkleStream = require('@tradle/merkle-tree-stream')
const { MerkleProofGenerator, createVerifier } = require('./')

const stream = new MerkleStream({
  leaf: hashLeaf,
  parent: hashParents
})

stream.write('hello')
stream.write('hashed')
stream.write('world')
stream.end()

const nodes = []
stream.on('data', function (data) {
  nodes.push(data)
})

stream.on('end', function () {
  // indices are based on merkle-tree-stream's use of flat-tree, so to find the index of hello
  // find the node in `proof` or `nodes` with node.data === new Buffer('hello')
  nodes.sort((a, b) => a.index - b.index)

  const prover = new MerkleProofGenerator(nodes)
  prover.add(nodes[0]) // 'hello'
  prover.add(nodes[2]) // 'world'
  const proof = prover.proof() // proof path nodes, plus merkle root

  const verify = createVerifier({
    proof: proof,
    leaf: hashLeaf,
    parent: hashParents
  })

  console.log(verify('hello', 0))  // true
  console.log(verify('hashed', 2)) // true
  console.log(verify('world', 4))  // false
})

function hashLeaf (leaf, roots) {
  // this function should hash incoming data
  // roots in the current partial roots of the merkle tree
  return crypto.createHash('sha256').update(leaf.data).digest()
}

function hashParents (a, b) {
  // hash two merkle tree node hashes into a new parent hash
  return crypto.createHash('sha256').update(a.hash).update(b.hash).digest()
}
