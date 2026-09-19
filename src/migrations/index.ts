import * as migration_20260918_184300_initial from './20260918_184300_initial';

export const migrations = [
  {
    up: migration_20260918_184300_initial.up,
    down: migration_20260918_184300_initial.down,
    name: '20260918_184300_initial'
  },
];
