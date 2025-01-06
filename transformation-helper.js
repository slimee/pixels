export default class TransformationHelper {
  constructor(state) {
    this.state = state;
  }

  wrapX = x => {
    const { width } = this.state;
    return ((x % width) + width) % width;
  }

  wrapY = y => {
    const { height } = this.state;
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
    const wx = this.wrapX(x);
    const wy = this.wrapY(y);
    const index = (wy * width + wx) * 4 + this.channelOffset(channel);
    return layerData[index];
  }

  setPixelChannel = (layerData, width, height, x, y, channel, value) => {
    const wx = this.wrapX(x);
    const wy = this.wrapY(y);
    const index = (wy * width + wx) * 4 + this.channelOffset(channel);
    layerData[index] = value;
  }
}