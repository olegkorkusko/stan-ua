import * as migration_20260918_184300_initial from './20260918_184300_initial';
import * as migration_20260922_095804_landing_globals from './20260922_095804_landing_globals';
import * as migration_20260922_100314_seo_settings from './20260922_100314_seo_settings';
import * as migration_20260922_103230_home_page from './20260922_103230_home_page';
import * as migration_20260922_112235_newsletter_tracking from './20260922_112235_newsletter_tracking';
import * as migration_20260922_112953_suggest_in_cart from './20260922_112953_suggest_in_cart';
import * as migration_20260924_161746_order_notify_email from './20260924_161746_order_notify_email';
import * as migration_20260924_163123_notify_pending from './20260924_163123_notify_pending';
import * as migration_20260925_114051_drop_prepayment from './20260925_114051_drop_prepayment';
import * as migration_20260925_130728_drop_checkbox from './20260925_130728_drop_checkbox';
import * as migration_20260925_131145_drop_prepaid_amount from './20260925_131145_drop_prepaid_amount';
import * as migration_20260928_165655_telegram_notify from './20260928_165655_telegram_notify';
import * as migration_20261005_092345_banner_media_and_production_time from './20261005_092345_banner_media_and_production_time';
import * as migration_20261005_121759_product_courses from './20261005_121759_product_courses';
import * as migration_20261005_124014_product_card_video from './20261005_124014_product_card_video';
import * as migration_20261005_124954_course_card_video from './20261005_124954_course_card_video';

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
    name: '20260925_114051_drop_prepayment',
  },
  {
    up: migration_20260925_130728_drop_checkbox.up,
    down: migration_20260925_130728_drop_checkbox.down,
    name: '20260925_130728_drop_checkbox',
  },
  {
    up: migration_20260925_131145_drop_prepaid_amount.up,
    down: migration_20260925_131145_drop_prepaid_amount.down,
    name: '20260925_131145_drop_prepaid_amount',
  },
  {
    up: migration_20260928_165655_telegram_notify.up,
    down: migration_20260928_165655_telegram_notify.down,
    name: '20260928_165655_telegram_notify',
  },
  {
    up: migration_20261005_092345_banner_media_and_production_time.up,
    down: migration_20261005_092345_banner_media_and_production_time.down,
    name: '20261005_092345_banner_media_and_production_time',
  },
  {
    up: migration_20261005_121759_product_courses.up,
    down: migration_20261005_121759_product_courses.down,
    name: '20261005_121759_product_courses',
  },
  {
    up: migration_20261005_124014_product_card_video.up,
    down: migration_20261005_124014_product_card_video.down,
    name: '20261005_124014_product_card_video',
  },
  {
    up: migration_20261005_124954_course_card_video.up,
    down: migration_20261005_124954_course_card_video.down,
    name: '20261005_124954_course_card_video'
  },
];
