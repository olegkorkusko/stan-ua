import * as migration_20260918_184300_initial from './20260918_184300_initial';
import * as migration_20260922_095804_landing_globals from './20260922_095804_landing_globals';
import * as migration_20260922_100314_seo_settings from './20260922_100314_seo_settings';
import * as migration_20260922_103230_home_page from './20260922_103230_home_page';
import * as migration_20260922_112235_newsletter_tracking from './20260922_112235_newsletter_tracking';
import * as migration_20260922_112953_suggest_in_cart from './20260922_112953_suggest_in_cart';
import * as migration_20260924_161746_order_notify_email from './20260924_161746_order_notify_email';
import * as migration_20260924_163123_notify_pending from './20260924_163123_notify_pending';
import * as migration_20260925_114051_drop_prepayment from './20260925_114051_drop_prepayment';

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
    name: '20260922_100314_seo_settings',
  },
  {
    up: migration_20260922_103230_home_page.up,
    down: migration_20260922_103230_home_page.down,
    name: '20260922_103230_home_page',
  },
  {
    up: migration_20260922_112235_newsletter_tracking.up,
    down: migration_20260922_112235_newsletter_tracking.down,
    name: '20260922_112235_newsletter_tracking',
  },
  {
    up: migration_20260922_112953_suggest_in_cart.up,
    down: migration_20260922_112953_suggest_in_cart.down,
    name: '20260922_112953_suggest_in_cart',
  },
  {
    up: migration_20260924_161746_order_notify_email.up,
    down: migration_20260924_161746_order_notify_email.down,
    name: '20260924_161746_order_notify_email',
  },
  {
    up: migration_20260924_163123_notify_pending.up,
    down: migration_20260924_163123_notify_pending.down,
    name: '20260924_163123_notify_pending',
  },
  {
    up: migration_20260925_114051_drop_prepayment.up,
    down: migration_20260925_114051_drop_prepayment.down,
    name: '20260925_114051_drop_prepayment'
  },
];
