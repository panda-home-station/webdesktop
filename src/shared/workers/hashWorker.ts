const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
])

function rotr(x: number, n: number) {
  return (x >>> n) | (x << (32 - n))
}
function ch(x: number, y: number, z: number) {
  return (x & y) ^ (~x & z)
}
function maj(x: number, y: number, z: number) {
  return (x & y) ^ (x & z) ^ (y & z)
}
function bigSigma0(x: number) {
  return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)
}
function bigSigma1(x: number) {
  return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)
}
function smallSigma0(x: number) {
  return rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)
}
function smallSigma1(x: number) {
  return rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10)
}

class SHA256 {
  h0 = 0x6a09e667
  h1 = 0xbb67ae85
  h2 = 0x3c6ef372
  h3 = 0xa54ff53a
  h4 = 0x510e527f
  h5 = 0x9b05688c
  h6 = 0x1f83d9ab
  h7 = 0x5be0cd19
  lengthHi = 0
  lengthLo = 0
  buffer = new Uint8Array(64)
  bufferLength = 0
  w = new Uint32Array(64)

  update(data: Uint8Array) {
    let pos = 0
    const len = data.length
    this.addLength(len)
    while (pos < len) {
      const take = Math.min(64 - this.bufferLength, len - pos)
      this.buffer.set(data.subarray(pos, pos + take), this.bufferLength)
      this.bufferLength += take
      pos += take
      if (this.bufferLength === 64) {
        this.processBlock(this.buffer)
        this.bufferLength = 0
      }
    }
  }

  addLength(len: number) {
    const lo = (this.lengthLo + (len >>> 0)) >>> 0
    const carry = lo < this.lengthLo ? 1 : 0
    this.lengthLo = lo
    this.lengthHi = (this.lengthHi + ((len / 0x100000000) >>> 0) + carry) >>> 0
  }

  processBlock(chunk: Uint8Array) {
    for (let i = 0; i < 16; i++) {
      const j = i * 4
      this.w[i] = ((chunk[j] << 24) | (chunk[j + 1] << 16) | (chunk[j + 2] << 8) | (chunk[j + 3])) >>> 0
    }
    for (let i = 16; i < 64; i++) {
      const s0 = smallSigma0(this.w[i - 15])
      const s1 = smallSigma1(this.w[i - 2])
      this.w[i] = (this.w[i - 16] + s0 + this.w[i - 7] + s1) >>> 0
    }
    let a = this.h0
    let b = this.h1
    let c = this.h2
    let d = this.h3
    let e = this.h4
    let f = this.h5
    let g = this.h6
    let h = this.h7
    for (let i = 0; i < 64; i++) {
      const t1 = (h + bigSigma1(e) + ch(e, f, g) + K[i] + this.w[i]) >>> 0
      const t2 = (bigSigma0(a) + maj(a, b, c)) >>> 0
      h = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }
    this.h0 = (this.h0 + a) >>> 0
    this.h1 = (this.h1 + b) >>> 0
    this.h2 = (this.h2 + c) >>> 0
    this.h3 = (this.h3 + d) >>> 0
    this.h4 = (this.h4 + e) >>> 0
    this.h5 = (this.h5 + f) >>> 0
    this.h6 = (this.h6 + g) >>> 0
    this.h7 = (this.h7 + h) >>> 0
  }

  digest(): string {
    const padLen = this.bufferLength
    this.buffer[padLen] = 0x80
    this.bufferLength++
    if (this.bufferLength > 56) {
      for (let i = this.bufferLength; i < 64; i++) this.buffer[i] = 0
      this.processBlock(this.buffer)
      this.bufferLength = 0
    }
    for (let i = this.bufferLength; i < 56; i++) this.buffer[i] = 0
    const hi = this.lengthHi
    const lo = this.lengthLo * 8 >>> 0
    const carry = (this.lengthLo >>> 29) >>> 0
    const hiBits = ((hi << 3) | carry) >>> 0
    this.buffer[56] = (hiBits >>> 24) & 0xff
    this.buffer[57] = (hiBits >>> 16) & 0xff
    this.buffer[58] = (hiBits >>> 8) & 0xff
    this.buffer[59] = hiBits & 0xff
    this.buffer[60] = (lo >>> 24) & 0xff
    this.buffer[61] = (lo >>> 16) & 0xff
    this.buffer[62] = (lo >>> 8) & 0xff
    this.buffer[63] = lo & 0xff
    this.processBlock(this.buffer)
    const out = new Uint32Array([this.h0, this.h1, this.h2, this.h3, this.h4, this.h5, this.h6, this.h7])
    let hex = ''
    for (let i = 0; i < out.length; i++) {
      const v = out[i]
      hex += ((v >>> 24) & 0xff).toString(16).padStart(2, '0')
      hex += ((v >>> 16) & 0xff).toString(16).padStart(2, '0')
      hex += ((v >>> 8) & 0xff).toString(16).padStart(2, '0')
      hex += (v & 0xff).toString(16).padStart(2, '0')
    }
    return hex
  }
}

type Req = { type: 'sha256'; file: File; chunkSize?: number }

function toUint8(a: ArrayBuffer) {
  return new Uint8Array(a)
}

function compute(req: Req) {
  const file = req.file
  const total = file.size
  const chunkSize = Math.max(256 * 1024, Math.min(8 * 1024 * 1024, req.chunkSize || 4 * 1024 * 1024))
  const reader = new (self as any).FileReaderSync()
  const hasher = new SHA256()
  let offset = 0
  while (offset < total) {
    const end = Math.min(offset + chunkSize, total)
    const part = file.slice(offset, end)
    const buf = reader.readAsArrayBuffer(part)
    hasher.update(toUint8(buf))
    offset = end
    ;(self as any).postMessage({ type: 'progress', loaded: offset, total })
  }
  const hex = hasher.digest()
  ;(self as any).postMessage({ type: 'result', ok: true, hex })
}

(self as any).onmessage = (e: MessageEvent) => {
  const req = e.data as Req
  if (!req || req.type !== 'sha256' || !(req.file instanceof File)) {
    (self as any).postMessage({ type: 'result', ok: false })
    return
  }
  try {
    compute(req)
  } catch {
    (self as any).postMessage({ type: 'result', ok: false })
  }
}
