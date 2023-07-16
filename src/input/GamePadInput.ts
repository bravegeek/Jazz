export class GamePadInput {
  LXAxis: number = 0;
  LYAxis: number = 0;
  RXAxis: number = 0;
  RYAxis: number = 0;

  action: boolean = false;
  special: boolean = false;
  jump: boolean = false;
  lb: boolean = false;
  rb: boolean = false;
  lt: boolean = false;
  rt: boolean = false;

  dpUp: boolean = false;
  dpDown: boolean = false;
  dpRight: boolean = false;
  dpLeft: boolean = false;
}

export class InputAction {
  Action: string = '';
  LXAxsis: number = 0;
  LYAxsis: number = 0;
  RXAxis: number = 0;
  RYAxsis: number = 0;
}

export const inputHistory: Array<InputAction> = [];

//const currentInput : GamePadInput;

export function listenForGamePadInput() {
  setInterval(pollInput, 3);
}

export function pollInput() {
  const localPlayer = navigator.getGamepads()[0];
  if (localPlayer && localPlayer.connected) {
    inputHistory.push(transcribeInput(readInput(localPlayer)));
    return inputHistory[inputHistory.length - 1];
  }
}

function readInput(gamePad: Gamepad) {
  const input = new GamePadInput();
  let lx = setDeadzone(gamePad.axes[0]);
  let ly = setDeadzone(gamePad.axes[1]);
  let rx = setDeadzone(gamePad.axes[2]);
  let ry = setDeadzone(gamePad.axes[3]);

  [lx, ly] = clampStick(lx, ly);
  [rx, ry] = clampStick(rx, ry);

  // controls are inverted, flip values.
  if (ly != 0) {
    ly *= -1;
  }

  if (ry != 0) {
    ry *= -1;
  }

  input.LXAxis = lx;
  input.LYAxis = ly;
  input.RXAxis = rx;
  input.RYAxis = ry;

  input.action = gamePad.buttons[0].pressed;
  input.special = gamePad.buttons[2].pressed;
  input.jump = gamePad.buttons[1].pressed || gamePad.buttons[3].pressed;
  input.lb = gamePad.buttons[4].pressed;
  input.rb = gamePad.buttons[5].pressed;
  input.lt = gamePad.buttons[6].pressed;
  input.rt = gamePad.buttons[7].pressed;

  input.dpUp = gamePad.buttons[12].pressed;
  input.dpDown = gamePad.buttons[13].pressed;
  input.dpLeft = gamePad.buttons[14].pressed;
  input.dpRight = gamePad.buttons[15].pressed;

  return input;
}

function transcribeInput(input: GamePadInput) {
  // Button priority is as follows: special > attack > right stick > grab > guard > jump
  const LXAxis = input.LXAxis;
  const LYAxis = input.LYAxis;
  const RXAxis = input.RXAxis;
  const RYAxis = input.RYAxis;
  const inputAction = new InputAction();

  inputAction.LXAxsis = LXAxis;
  inputAction.LYAxsis = LYAxis;
  inputAction.RXAxis = RXAxis;
  inputAction.RYAxsis = RYAxis;

  // special was pressed
  if (input.special) {
    // Is it a special on the y axis?
    if (Math.abs(LYAxis) > Math.abs(LXAxis)) {
      if (LYAxis > 0) {
        inputAction.Action = Actions.upSpecial;
        return inputAction;
      }
      inputAction.Action = Actions.downSpecial;
      return inputAction;
    }
    // Is it a special on the x axis?
    if (LXAxis != 0) {
      inputAction.Action = Actions.sideSpecial;
      return inputAction;
    }

    // It is a nuetral special
    inputAction.Action = Actions.special;
    return inputAction;
  }

  // Action was pressed
  if (input.action) {
    // Y axis?
    if (Math.abs(LYAxis) > Math.abs(LXAxis)) {
      if (LYAxis > 0) {
        inputAction.Action = Actions.upAttack;
        return inputAction;
      }
      inputAction.Action = Actions.downAttack;
      return inputAction;
    }

    if (LXAxis != 0) {
      inputAction.Action = Actions.sideAttcak;
      return inputAction;
    }
    inputAction.Action = Actions.attack;
    return inputAction;
  }

  // Right stick was used
  // Right stick more horizontal than vertical
  if (Math.abs(RXAxis) > Math.abs(RYAxis)) {
    inputAction.Action = Actions.sideAttcak;
    return inputAction;
  }

  // Right stick was used
  // Right stick more vertical than horrizontal
  if (Math.abs(RYAxis) > Math.abs(RXAxis)) {
    if (RYAxis > 0) {
      inputAction.Action = Actions.upAttack;
      return inputAction;
    }
    inputAction.Action = Actions.downAttack;
    return inputAction;
  }

  // Grab was pressed
  if (input.rb) {
    inputAction.Action = Actions.grab;
    return inputAction;
  }

  // Guard was pressed
  if (input.rt || input.lt) {
    inputAction.Action = Actions.guard;
    return inputAction;
  }

  // Jump was pressed
  if (input.jump) {
    inputAction.Action = Actions.jump;
    return inputAction;
  }

  if (Math.abs(input.LXAxis) > 0) {
    inputAction.Action = Actions.dash;
    return inputAction;
  }

  // Nothing was pressed
  inputAction.Action = Actions.idle;
  return inputAction;
}

function setDeadzone(v: number) {
  const DEADZONE = 0.3;

  if (Math.abs(v) < DEADZONE) {
    v = 0;
  } else {
    v = v - Math.sign(v) * DEADZONE;

    v /= 1.0 - DEADZONE;
  }

  return v;
}

function clampStick(x: number, y: number) {
  let m = Math.sqrt(x * x + y * y);

  if (m > 1) {
    x /= m;
    y /= m;
  }

  return [x, y];
}

interface IActions {
  upSpecial: string;
  downSpecial: string;
  sideSpecial: string;
  special: string;
  upAttack: string;
  downAttack: string;
  sideAttcak: string;
  attack: string;
  idle: string;
  dash: string;
  jump: string;
  grab: string;
  guard: string;
}

const Actions: IActions = {
  upSpecial: 'up_special',
  downSpecial: 'down_special',
  sideSpecial: 'side_special',
  special: 'special',
  upAttack: 'up_attack',
  downAttack: 'down_attack',
  sideAttcak: 'side_attack',
  attack: 'attack',
  idle: 'idle',
  dash: 'dash;',
  jump: 'jump',
  grab: 'grab',
  guard: 'guard',
};
