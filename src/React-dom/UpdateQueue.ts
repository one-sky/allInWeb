export type UpdateQueue<State> = {
  baseState: State;

  firstUpdate: Update<State> | null;
  lastUpdate: Update<State> | null;

  firstCapturedUpdate: Update<State> | null;
  lastCapturedUpdate: Update<State> | null;

  firstEffect: Update<State> | null;
  lastEffect: Update<State> | null;

  firstCapturedEffect: Update<State> | null;
  lastCapturedEffect: Update<State> | null;
};
