/** Install a test-only pixel reader. Read PNG from the actual destination and
 * decode into a NEW reference canvas for every read. Never ask a WebGPU canvas
 * for a2D context or draw it into2D: Chromium may return a transparent image.
 * Reusing destination getImageData also changes Canvas2D acceleration policy. */
export function installAvatarPNGSnapshots() {
  globalThis.avatarPNGSnapshot = async (canvas) => {
    const png = canvas.toDataURL('image/png');
    const image = new Image();
    image.src = png;
    await image.decode();
    const reference = document.createElement('canvas');
    reference.width = image.width;
    reference.height = image.height;
    const context = reference.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let nontransparent = 0;
    let partialAlpha = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      nontransparent += Number(pixels[i] > 0);
      partialAlpha += Number(pixels[i] > 0 && pixels[i] < 255);
    }
    if (!nontransparent) throw Error('Ready avatar PNG is entirely transparent');
    if (image.width !== canvas.width || image.height !== canvas.height)
      throw Error('PNG dimensions differ from the actual destination');
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', pixels));
    return {
      width: image.width,
      height: image.height,
      nontransparent,
      partialAlpha,
      sha256: [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
    };
  };
  globalThis.avatarPNGSnapshots = (canvases) => Promise.all(canvases.map(avatarPNGSnapshot));
}
