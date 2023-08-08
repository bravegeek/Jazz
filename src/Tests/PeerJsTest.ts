import { DataConnection, Peer } from 'peerjs';
import { keys } from '../input/SimpleInput';
import { InputStorageManager } from '../input/InputStorageManager';
import { FrameComparisonManager } from '../network/FrameComparisonManager';
import { FrameStorageManager } from '../network/FrameStorageManager';
import { RollBackManager } from '../network/rollBackManager';

let ISM = new InputStorageManager<KeyInput>((g, r) => {
  if (g == undefined || r == undefined) {
    return false;
  }
  if (g.action != r.action) {
    return true;
  }
  return false;
});
let FSM = new FrameStorageManager();
let FCM = new FrameComparisonManager<KeyInput>(ISM, FSM);
let RBM = new RollBackManager<KeyInput>(FCM, FSM);

let con: DataConnection;

const peer = new Peer();

peer.on('open', (id) => {
  document.getElementById('mypeerid')!.innerHTML = `<p>${id}</p>`;
});

document.getElementById('hostgame').addEventListener('click', () => {
  document.getElementById('hostcontrols').style.display = 'block';
  document.getElementById('hostorconnect').style.display = 'none';
  BeginHost(peer);
});

document.getElementById('connectgame').addEventListener('click', () => {
  document.getElementById('connectcontrols').style.display = 'block';
  document.getElementById('hostorconnect').style.display = 'none';
  document.getElementById('connectToPeer').addEventListener('click', () => {
    let connectionId = (document.getElementById('peerid') as HTMLInputElement)
      .value;
    con = ConnectToRemotePeer(connectionId, peer);
    //SetUpDataSendLoop();
  });
});

function BeginHost(localPeer: Peer) {
  localPeer.on('connection', (c) => {
    // console.log(FSM.LocalFrame);
    c.on('open', () => {
      console.log('Remote Connected');
      console.log(FSM.LocalFrame);
    });
    c.on('data', (remoteData) => {
      console.log(remoteData);
      // let rd = remoteData as KeyInput;
      // ISM.StoreRemoteInput(rd, rd.inputFrame);
      // FSM.RemoteFrame = rd.inputFrame;
      // FSM.RemoteFrameAdvantage = rd.frameAdvantage;
    });
    con = c;
    //SetUpDataSendLoop();
  });
}

function ConnectToRemotePeer(
  remotePeerId: string,
  localPeer: Peer
): DataConnection {
  let connection = localPeer.connect(remotePeerId);

  connection.on('open', () => {
    console.log('Connected to host');
    console.log(FSM.LocalFrame);
  });
  connection.on('data', (remoteData) => {
    let rd = remoteData as KeyInput;
    console.log(remoteData);
    // ISM.StoreRemoteInput(rd, rd.inputFrame);
    // FSM.RemoteFrame = rd.inputFrame;
    // FSM.RemoteFrameAdvantage = rd.frameAdvantage;
  });

  return connection;
}

let frame = 0;

export function Run() {
  Init();
}

function Init() {}

export type KeyInput = {
  action: string;
  inputFrame: number;
  frameAdvantage: number;
};

function GetKey(inputFrame: number): KeyInput {
  let localInput = {} as KeyInput;

  if (keys.d.pressed) {
    localInput = {
      action: 'd',
      inputFrame,
      frameAdvantage: FCM.GetLocalFrameAdvantage(),
    };
  } else if (keys.a.pressed) {
    localInput = {
      action: 'a',
      inputFrame,
      frameAdvantage: FCM.GetLocalFrameAdvantage(),
    };
  } else if (keys.w.pressed) {
    localInput = {
      action: 'w',
      inputFrame,
      frameAdvantage: FCM.GetLocalFrameAdvantage(),
    };
  } else if (keys.s.pressed) {
    localInput = {
      action: 's',
      inputFrame,
      frameAdvantage: FCM.GetLocalFrameAdvantage(),
    };
  } else {
    localInput = {
      action: 'n/a',
      inputFrame,
      frameAdvantage: FCM.GetLocalFrameAdvantage(),
    };
  }

  return localInput;
}

// function SendDataToPeer(c: DataConnection, keyInput: any) {
//   c.send(keyInput);
// }

const FPS = 60;
let now = {} as number;
let then = Date.now();
const interval = 1000 / FPS;
let delta = {} as number;
let stall = false;

function SetUpDataSendLoop() {
  window.requestAnimationFrame(() => SetUpDataSendLoop());
  now = Date.now();
  delta = now - then;

  if (delta > interval) {
    FCM.UpdateNextSyncFrame();

    if (FCM.IsWithinFrameAdvatnage()) {
      frame++;
      FSM.LocalFrame = frame;
      let localInput = GetKey(frame);
      ISM.StoreLocalInput(localInput, frame);
      con.send(localInput);
      let remoteInput = GetCurrentRemoteInput(frame);
      console.log(remoteInput);
      then = now - (delta % interval);
    } else {
      console.log('stalling');
    }
  }
}

function GetCurrentRemoteInput(f: number) {
  //debugger;
  let remoteInput = ISM.GetRemoteInputForFrame(f);

  if (remoteInput === undefined || remoteInput === null) {
    remoteInput = ISM.GetLastRemoteInput();
    if (remoteInput !== undefined) {
      ISM.StoreGuessedInput(remoteInput, f);
    } else {
      remoteInput = {} as KeyInput;

      remoteInput.action = 'n/a';
      remoteInput.frameAdvantage = FSM.RemoteFrameAdvantage;
      remoteInput.inputFrame = f;

      ISM.StoreGuessedInput(remoteInput, f);
    }
  }

  return remoteInput;
}
