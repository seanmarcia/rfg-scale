import React, { Component } from 'react';
import './App.css';
window.device = null;

class App extends Component {


  constructor(props) {
    super(props);

    this.USB_FILTERS = [{ vendorId: 0x0922, productId: 0x8003 }]

    this.state = {
      connected: false,
      device: null,
      grams: 0
    }

    if (navigator.usb) {
      navigator.usb.getDevices({ filters: this.USB_FILTERS })
        .then((devices) => {
          devices.forEach(device => {
            this.bindDevice(device)
          });
        });

      navigator.usb.addEventListener('connect', e => {
        console.log('device connected', e);
        this.bindDevice(e.device)
      });

      navigator.usb.addEventListener('disconnect', e => {
        console.log('device lost', e);
        this.setState({ connected: false, device: null })
      });

      this.connect = () => {
        navigator.usb.requestDevice({ filters: this.USB_FILTERS })
          .then(device => this.bindDevice(device))
          .catch(error => {
            this.setState({ connected: false, device: null })
          });
      }
    }

    this.getWeight = this.getWeight.bind(this);
    this.bindDevice = this.bindDevice.bind(this);
  }

  getWeight() {
    const { device } = this.state;
    const {endpointNumber, packetSize} = device.configuration.interfaces[0].alternate.endpoints[0]
    let readLoop = () => {
      device.transferIn(endpointNumber, packetSize)
        .then(result => {
          let data = new Uint8Array(result.data.buffer)
          let grams = data[4] + (256 * data[5])
          this.setState({ grams: grams })
          readLoop();
        })
        .catch((err) => {
          console.error('USB Read Error', err)
        })
    }
    readLoop();
  }

  bindDevice(device) {
    device.open()
      .then(() => {
        console.log(`Connected ${device.productName} ${device.manufacturerName}`, device);
        this.setState({ connected: true, device: device })

        if (device.configuration === null) {
          return device.selectConfiguration(1);
        }
      })
      .then(() => device.claimInterface(0))
      .catch((err) => {
        console.error('USB Error', err)
      })
  }

  render() {
    const { connected } = this.state
    return (
      <div>
        <h1>
          Scale {connected ? "Online" : "Offline"}
        </h1>

        {connected &&
          <button onClick={this.getWeight}>Get Scale Weight</button>
        }

        <button onClick={this.connect} >Register Device</button>

        <h2>{this.state.grams}g</h2>
        {!navigator.usb &&
          <p>Please enable chrome://flags/#enable-experimental-web-platform-features</p>
        }
      </div>
    );
  }
}

export default App;
