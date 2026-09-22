import * as migration_20260918_184300_initial from './20260918_184300_initial';
import * as migration_20260922_095804_landing_globals from './20260922_095804_landing_globals';
import * as migration_20260922_100314_seo_settings from './20260922_100314_seo_settings';

export const migrations = [
  {
    up: migration_20260918_184300_initial.up,
    down: migration_20260918_184300_initial.down,
    name: '20260918_184300_initial',
  },
  {
    up: migration_20260922_095804_landing_globals.up,
    down: migration_20260922_095804_landing_globals.down,
    name: '20260922_095804_landing_globals',
  },
  {
    up: migration_20260922_100314_seo_settings.up,
    down: migration_20260922_100314_seo_settings.down,
    name: '20260922_100314_seo_settings'
  },
];
