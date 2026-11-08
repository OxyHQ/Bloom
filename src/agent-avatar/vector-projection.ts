/** Rotate caller-owned scratch coordinates without allocating intermediate vectors. */
export function rotateVectorInPlace(point: number[], quaternion: number[]): void {
  const [x = 0, y = 0, z = 0] = point,
    [qx = 0, qy = 0, qz = 0, qw = 1] = quaternion;
  const tx = 2 * (qy * z - qz * y),
    ty = 2 * (qz * x - qx * z),
    tz = 2 * (qx * y - qy * x);
  point[0] = x + qw * tx + qy * tz - qz * ty;
  point[1] = y + qw * ty + qz * tx - qx * tz;
  point[2] = z + qw * tz + qx * ty - qy * tx;
}
