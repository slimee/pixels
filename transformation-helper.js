export default class TransformationHelper {
  wrapX = (x, width) => {
    return ((x % width) + width) % width;
  }

  wrapY = (y, height) => {
    return ((y % height) + height) % height;
  }

  channelOffset = (channel) => {
    switch (channel) {
      case 'r':
        return 0;
      case 'g':
        return 1;
      case 'b':
        return 2;
      case 'a':
        return 3;
    }
    throw new Error('Invalid channel ' + channel);
  }

  getPixelChannel = (layerData, width, height, x, y, channel) => {
    const wx = this.wrapX(x, width);
    const wy = this.wrapY(y, height);
    const index = (wy * width + wx) * 4 + this.channelOffset(channel);
    return layerData[index];
  }

  setPixelChannel = (layerData, width, height, x, y, channel, value) => {
    const wx = this.wrapX(x, width);
    const wy = this.wrapY(y, height);
    const index = (wy * width + wx) * 4 + this.channelOffset(channel);
    layerData[index] = value;
  }
}