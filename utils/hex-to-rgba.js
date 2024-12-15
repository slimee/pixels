export default function hexToRGBA(hex) {
  let c = hex.slice(1);
  if (c.length === 6) c += 'FF';
  const num = parseInt(c, 16);
  return {
    r: (num >> 24) & 255,
    g: (num >> 16) & 255,
    b: (num >> 8) & 255,
    a: num & 255
  };
}