'use strict';

module.exports = {
  app: {
    title: 'Nowdue',
    description: 'Nowdue',
    keywords: 'nowdue, mongodb, express, angularjs, node.js, mongoose, passport',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
  },
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  templateEngine: 'swig',
  // Session Cookie settings
  sessionCookie: {
    // session expiration is set by default to 24 hours
    maxAge: 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // secure cookie should be turned to true to provide additional
    // layer of security so that the cookie is set only when working
    // in HTTPS mode.
    secure: false
  },
  // sessionSecret should be changed for security measures and concerns
  sessionSecret: process.env.SESSION_SECRET || 'nowduenowduenowdue',
  // sessionKey is set to the generic sessionId key used by PHP applications
  // for obsecurity reasons
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  // Lusca config
  csrf: {
    csrf: false,
    csp: { /* Content Security Policy object */},
    xframe: 'SAMEORIGIN',
    p3p: 'ABCDEF',
    xssProtection: true
  },
  logo: 'modules/core/client/img/brand/logo.png',
  favicon: 'modules/core/client/img/brand/favicon.ico',
  uploads: {
    profileUpload: {
      dest: './modules/users/client/img/profile/uploads/', // Profile upload destination path
      limits: {
        fileSize: 1 * 1024 * 1024 // Max file size in bytes (1 MB)
      }
    }
  },
  currencies: {
    ALL: 'Lek',
    ARS: '$',
    AWG: 'ƒ',
    AUD: '$',
    BSD: '$',
    BBD: '$',
    BYR: 'p.',
    BZD: 'BZ$',
    BMD: '$',
    BOB: '$b',
    BAM: 'KM',
    BWP: 'P',
    BGN: 'лв',
    BRL: 'R$',
    BND: '$',
    KHR: '៛',
    CAD: '$',
    KYD: '$',
    CLP: '$',
    CNY: '¥',
    COP: '$',
    CRC: '₡',
    HRK: 'kn',
    CUP: '₱',
    CZK: 'Kč',
    DKK: 'kr',
    DOP: 'RD$',
    XCD: '$',
    EGP: '£',
    SVC: '$',
    EUR: '€',
    FKP: '£',
    FJD: '$',
    GHS: '¢',
    GIP: '£',
    GTQ: 'Q',
    GGP: '£',
    GYD: '$',
    HNL: 'L',
    HKD: '$',
    HUF: 'Ft',
    ISK: 'kr',
    IDR: 'Rp',
    IRR: '﷼ ﷼',
    IMP: '£',
    ILS: '₪',
    JMD: 'J$',
    JPY: '¥',
    JEP: '£',
    KZT: 'лв',
    KRW: '₩',
    KGS: 'лв',
    LAK: '₭',
    LBP: '£',
    LRD: '$',
    MKD: 'ден',
    MYR: 'RM',
    MUR: '₨',
    MXN: '$',
    MNT: '₮',
    MZN: 'MT',
    NAD: '$',
    NPR: '₨',
    ANG: 'ƒ',
    NZD: '$',
    NIO: 'C$',
    NGN: '₦',
    NOK: 'kr',
    OMR: '﷼ ﷼',
    PKR: '₨',
    PAB: 'B/.',
    PYG: 'Gs',
    PEN: 'S/.',
    PHP: '₱',
    PLN: 'zł',
    QAR: '﷼ ﷼',
    RON: 'lei',
    RUB: 'руб',
    SHP: '£',
    SAR: '﷼ ﷼',
    RSD: 'Дин.',
    SCR: '₨',
    SGD: '$',
    SBD: '$',
    SOS: 'S',
    ZAR: 'R',
    LKR: '₨',
    SEK: 'kr',
    CHF: 'CHF',
    SRD: '$',
    SYP: '£',
    TWD: 'NT$',
    THB: '฿',
    TTD: 'TT$',
    TVD: '$',
    UAH: '₴',
    GBP: '£',
    USD: '$',
    UYU: '$U',
    UZS: 'лв',
    VEF: 'Bs',
    VND: '₫',
    YER: '﷼ ﷼',
    ZWD: 'Z$'
  }
};
