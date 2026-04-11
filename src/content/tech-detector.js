// Tech Stack Detector - Comprehensive technology detection
// Based on Wappalyzer patterns and research

var TechDetector = (function() {
  var detected = {
    frameworks: [],
    cms: [],
    libraries: [],
    cssFrameworks: [],
    analytics: [],
    ecommerce: [],
    builders: [],
    cdn: [],
    hosting: [],
    security: [],
    wordpress: {
      version: null,
      theme: null,
      plugins: []
    },
    backend: [],
    meta: {}
  };

  var technologies = {
    frameworks: [
      {
        name: 'React',
        icon: '⚛️',
        patterns: [
          { type: 'global', path: 'React' },
          { type: 'global', path: 'ReactDOM' },
          { type: 'dom', selector: '[data-reactroot], [data-reactid]' },
          { type: 'regex', pattern: /react\.production\.min\.js|react\.development\.js/i }
        ]
      },
      {
        name: 'Next.js',
        icon: '▲',
        patterns: [
          { type: 'global', path: '__NEXT_DATA__' },
          { type: 'dom', selector: '#__next' },
          { type: 'regex', pattern: /_next\/static/i },
          { type: 'meta', name: 'next-head' }
        ]
      },
      {
        name: 'Vue.js',
        icon: '💚',
        patterns: [
          { type: 'global', path: 'Vue' },
          { type: 'global', path: '__VUE__' },
          { type: 'dom', selector: '[data-v-]' },
          { type: 'dom', selector: '[v-cloak]' },
          { type: 'regex', pattern: /vue\.runtime\.min\.js|vue\.min\.js/i }
        ]
      },
      {
        name: 'Nuxt.js',
        icon: '🏔️',
        patterns: [
          { type: 'global', path: '__NUXT__' },
          { type: 'global', path: '$nuxt' },
          { type: 'dom', selector: '#__nuxt' },
          { type: 'dom', selector: '[data-n-head]' }
        ]
      },
      {
        name: 'Angular',
        icon: '🅰️',
        patterns: [
          { type: 'global', path: 'ng' },
          { type: 'global', path: 'angular' },
          { type: 'dom', selector: '[ng-version]' },
          { type: 'dom', selector: '[ng-app]' },
          { type: 'dom', selector: 'app-root' }
        ]
      },
      {
        name: 'Svelte',
        icon: '🔥',
        patterns: [
          { type: 'global', path: '__svelte' },
          { type: 'dom', selector: '[data-svelte]' },
          { type: 'regex', pattern: /svelte.*\.js/i }
        ]
      },
      {
        name: 'Astro',
        icon: '🚀',
        patterns: [
          { type: 'regex', pattern: /astro\.runtime\.js/i },
          { type: 'meta', name: 'astro-view-transitions' },
          { type: 'dom', selector: '[data-astro-transition]' }
        ]
      },
      {
        name: 'Remix',
        icon: '💿',
        patterns: [
          { type: 'global', path: '__remixContext' },
          { type: 'regex', pattern: /remix\.run/i }
        ]
      },
      {
        name: 'Gatsby',
        icon: '💎',
        patterns: [
          { type: 'global', path: '___gatsby' },
          { type: 'dom', selector: '#___gatsby' },
          { type: 'regex', pattern: /gatsby-link/i }
        ]
      },
      {
        name: 'SolidJS',
        icon: '💎',
        patterns: [
          { type: 'global', path: 'Solid$$' },
          { type: 'regex', pattern: /solid\.js/i }
        ]
      },
      {
        name: 'Qwik',
        icon: '⚡',
        patterns: [
          { type: 'global', path: 'qwik' },
          { type: 'regex', pattern: /qwik\.city/i }
        ]
      },
      {
        name: 'Alpine.js',
        icon: '⛰️',
        patterns: [
          { type: 'global', path: 'Alpine' },
          { type: 'dom', selector: '[x-data]' },
          { type: 'dom', selector: '[x-show]' },
          { type: 'dom', selector: '[x-bind]' }
        ]
      },
      {
        name: 'Livewire',
        icon: '⚡',
        patterns: [
          { type: 'global', path: 'Livewire' },
          { type: 'dom', selector: '[wire\\:id]' },
          { type: 'dom', selector: '[wire\\:model]' },
          { type: 'dom', selector: '[x-data]' },
          { type: 'regex', pattern: /livewire\.js|livewire\.min\.js/i }
        ]
      },
      {
        name: 'HTMX',
        icon: '🔗',
        patterns: [
          { type: 'global', path: 'htmx' },
          { type: 'dom', selector: '[hx-get]' },
          { type: 'dom', selector: '[hx-post]' },
          { type: 'dom', selector: '[data-hx-get]' }
        ]
      },
      {
        name: 'jQuery',
        icon: '📦',
        patterns: [
          { type: 'global', path: 'jQuery' },
          { type: 'global', path: '$' },
          { type: 'regex', pattern: /jquery.*\.js/i }
        ]
      }
    ],

    cms: [
      {
        name: 'WordPress',
        icon: '📝',
        patterns: [
          { type: 'meta', name: 'generator', pattern: /WordPress/i },
          { type: 'regex', pattern: /\/wp-content\//i },
          { type: 'regex', pattern: /\/wp-includes\//i },
          { type: 'dom', selector: 'link[href*="wp-content"]' }
        ],
        versionPattern: /WordPress\s*([\d.]+)/i
      },
      {
        name: 'Drupal',
        icon: '🌿',
        patterns: [
          { type: 'meta', name: 'generator', pattern: /Drupal/i },
          { type: 'regex', pattern: /\/sites\/default\/files/i },
          { type: 'dom', selector: '[data-drupal]' }
        ]
      },
      {
        name: 'Shopify',
        icon: '🛒',
        patterns: [
          { type: 'regex', pattern: /cdn\.shopify\.com/i },
          { type: 'global', path: 'Shopify' },
          { type: 'meta', name: 'shopify-checkout-api-token' }
        ]
      },
      {
        name: 'Wix',
        icon: '🎨',
        patterns: [
          { type: 'regex', pattern: /static\.wixstatic\.com/i },
          { type: 'regex', pattern: /wix\.com/i },
          { type: 'meta', name: 'wix-dynamic-pages' }
        ]
      },
      {
        name: 'Squarespace',
        icon: '⬛',
        patterns: [
          { type: 'regex', pattern: /static\.squarespace\.com/i },
          { type: 'meta', name: 'squarespace-version' }
        ]
      },
      {
        name: 'Webflow',
        icon: '🌐',
        patterns: [
          { type: 'regex', pattern: /assets\.website-files\.com/i },
          { type: 'meta', name: 'webflow-site' }
        ]
      },
      {
        name: 'Ghost',
        icon: '👻',
        patterns: [
          { type: 'meta', name: 'generator', pattern: /Ghost/i }
        ]
      },
      {
        name: 'Joomla',
        icon: '📰',
        patterns: [
          { type: 'meta', name: 'generator', pattern: /Joomla/i },
          { type: 'regex', pattern: /\/media\/jui\//i }
        ]
      },
      {
        name: 'Craft CMS',
        icon: '🎨',
        patterns: [
          { type: 'regex', pattern: /craft\.cms/i }
        ]
      },
      {
        name: 'Strapi',
        icon: '🚀',
        patterns: [
          { type: 'regex', pattern: /strapi/i }
        ]
      },
      {
        name: 'Contentful',
        icon: '📦',
        patterns: [
          { type: 'regex', pattern: /contentful\.com/i }
        ]
      },
      {
        name: 'Sanity',
        icon: '🧠',
        patterns: [
          { type: 'regex', pattern: /cdn\.sanity\.io/i },
          { type: 'regex', pattern: /sanity\.io/i }
        ]
      }
    ],

    cssFrameworks: [
      {
        name: 'Tailwind CSS',
        icon: '🎨',
        patterns: [
          { type: 'regex', pattern: /tailwindcss/i },
          { type: 'classPattern', pattern: /^(flex|grid|p-|m-|text-|bg-|border-|w-|h-|gap-|space-|items-|justify-|rounded-|shadow-|opacity-|hover:|focus:|dark:|sm:|md:|lg:|xl:)/ }
        ]
      },
      {
        name: 'Bootstrap',
        icon: '🅱️',
        patterns: [
          { type: 'regex', pattern: /bootstrap.*\.css/i },
          { type: 'classPattern', pattern: /^(container|row|col-|btn-|card|nav-|modal-|alert-|badge-|carousel)/ }
        ]
      },
      {
        name: 'Foundation',
        icon: '🏛️',
        patterns: [
          { type: 'regex', pattern: /foundation.*\.css/i }
        ]
      },
      {
        name: 'Bulma',
        icon: '💚',
        patterns: [
          { type: 'regex', pattern: /bulma.*\.css/i },
          { type: 'classPattern', pattern: /^(button|notification|modal|card|navbar|hero|section|container|columns|column)/ }
        ]
      },
      {
        name: 'Material UI',
        icon: '🎨',
        patterns: [
          { type: 'regex', pattern: /@mui\/material/i },
          { type: 'classPattern', pattern: /^Mui[A-Z]/ }
        ]
      },
      {
        name: 'Chakra UI',
        icon: '⚡',
        patterns: [
          { type: 'regex', pattern: /@chakra-ui/i },
          { type: 'classPattern', pattern: /^chakra-/ }
        ]
      },
      {
        name: 'shadcn/ui',
        icon: '🎨',
        patterns: [
          { type: 'classPattern', pattern: /^(bg-|text-|border-|rounded-|shadow-|p-|m-|w-|h-|flex|grid|gap-|space-)/ },
          { type: 'dom', selector: '[data-radix-]' }
        ]
      },
      {
        name: 'DaisyUI',
        icon: '🌼',
        patterns: [
          { type: 'classPattern', pattern: /^(btn|card|navbar|modal|dropdown|menu|tab|table|badge|alert|toast)/ }
        ]
      },
      {
        name: 'Styled Components',
        icon: '💅',
        patterns: [
          { type: 'classPattern', pattern: /^sc-/ },
          { type: 'global', path: '__styled-components' }
        ]
      },
      {
        name: 'Emotion',
        icon: '❤️',
        patterns: [
          { type: 'classPattern', pattern: /^css-/ },
          { type: 'classPattern', pattern: /^emotion-/ }
        ]
      }
    ],

    libraries: [
      {
        name: 'Three.js',
        icon: '🎮',
        patterns: [
          { type: 'global', path: 'THREE' }
        ]
      },
      {
        name: 'GSAP',
        icon: '🎬',
        patterns: [
          { type: 'global', path: 'gsap' },
          { type: 'global', path: 'TweenMax' },
          { type: 'global', path: 'TweenLite' }
        ]
      },
      {
        name: 'Lodash',
        icon: '🔧',
        patterns: [
          { type: 'global', path: '_' },
          { type: 'regex', pattern: /lodash.*\.js/i }
        ]
      },
      {
        name: 'Moment.js',
        icon: '⏰',
        patterns: [
          { type: 'global', path: 'moment' }
        ]
      },
      {
        name: 'Axios',
        icon: '📡',
        patterns: [
          { type: 'global', path: 'axios' }
        ]
      },
      {
        name: 'Chart.js',
        icon: '📊',
        patterns: [
          { type: 'global', path: 'Chart' }
        ]
      },
      {
        name: 'D3.js',
        icon: '📈',
        patterns: [
          { type: 'global', path: 'd3' }
        ]
      },
      {
        name: 'Framer Motion',
        icon: '🎬',
        patterns: [
          { type: 'regex', pattern: /framer-motion/i }
        ]
      },
      {
        name: 'React Query',
        icon: '🔄',
        patterns: [
          { type: 'regex', pattern: /react-query|@tanstack\/react-query/i }
        ]
      },
      {
        name: 'Zustand',
        icon: '🐻',
        patterns: [
          { type: 'regex', pattern: /zustand/i }
        ]
      },
      {
        name: 'Redux',
        icon: '🔄',
        patterns: [
          { type: 'global', path: 'Redux' },
          { type: 'global', path: '__REDUX_DEVTOOLS_EXTENSION__' }
        ]
      },
      {
        name: 'Pinia',
        icon: '🍍',
        patterns: [
          { type: 'global', path: 'pinia' }
        ]
      }
    ],

    analytics: [
      {
        name: 'Google Analytics',
        icon: '📊',
        patterns: [
          { type: 'global', path: 'ga' },
          { type: 'global', path: 'gtag' },
          { type: 'global', path: '_gaq' },
          { type: 'regex', pattern: /google-analytics\.com|googletagmanager\.com\/gtag/i }
        ]
      },
      {
        name: 'Google Tag Manager',
        icon: '🏷️',
        patterns: [
          { type: 'global', path: 'google_tag_manager' },
          { type: 'regex', pattern: /googletagmanager\.com\/gtm/i }
        ]
      },
      {
        name: 'Facebook Pixel',
        icon: '📘',
        patterns: [
          { type: 'global', path: 'fbq' },
          { type: 'regex', pattern: /connect\.facebook\.net.*fbevents/i }
        ]
      },
      {
        name: 'Hotjar',
        icon: '🔥',
        patterns: [
          { type: 'global', path: 'hj' },
          { type: 'regex', pattern: /static\.hotjar\.com/i }
        ]
      },
      {
        name: 'Mixpanel',
        icon: '📊',
        patterns: [
          { type: 'global', path: 'mixpanel' }
        ]
      },
      {
        name: 'Segment',
        icon: '🔗',
        patterns: [
          { type: 'global', path: 'analytics' },
          { type: 'regex', pattern: /cdn\.segment\.com/i }
        ]
      },
      {
        name: 'Plausible',
        icon: '📈',
        patterns: [
          { type: 'regex', pattern: /plausible\.io/i }
        ]
      },
      {
        name: 'Amplitude',
        icon: '📊',
        patterns: [
          { type: 'global', path: 'amplitude' }
        ]
      },
      {
        name: 'PostHog',
        icon: '🐭',
        patterns: [
          { type: 'global', path: 'posthog' }
        ]
      },
      {
        name: 'Microsoft Clarity',
        icon: '🔍',
        patterns: [
          { type: 'global', path: 'clarity' },
          { type: 'regex', pattern: /clarity\.ms/i }
        ]
      }
    ],

    ecommerce: [
      {
        name: 'WooCommerce',
        icon: '🛒',
        patterns: [
          { type: 'regex', pattern: /\/wp-content\/plugins\/woocommerce/i },
          { type: 'global', path: 'wc' }
        ]
      },
      {
        name: 'Magento',
        icon: '🛍️',
        patterns: [
          { type: 'regex', pattern: /\/skin\/frontend\/|\/media\/catalog\//i },
          { type: 'global', path: 'Mage' }
        ]
      },
      {
        name: 'BigCommerce',
        icon: '🏪',
        patterns: [
          { type: 'regex', pattern: /bigcommerce\.com/i }
        ]
      },
      {
        name: 'PrestaShop',
        icon: '🛒',
        patterns: [
          { type: 'regex', pattern: /prestashop/i }
        ]
      },
      {
        name: 'Stripe',
        icon: '💳',
        patterns: [
          { type: 'global', path: 'Stripe' },
          { type: 'regex', pattern: /js\.stripe\.com/i }
        ]
      },
      {
        name: 'PayPal',
        icon: '💳',
        patterns: [
          { type: 'global', path: 'paypal' },
          { type: 'regex', pattern: /paypalobjects\.com/i }
        ]
      },
      {
        name: 'Square',
        icon: '⬛',
        patterns: [
          { type: 'global', path: 'Square' },
          { type: 'regex', pattern: /squareup\.com/i }
        ]
      }
    ],

    backend: [
      {
        name: 'Laravel',
        icon: '🔴',
        patterns: [
          { type: 'regex', pattern: /laravel/i },
          { type: 'meta', name: 'csrf-token' },
          { type: 'cookie', name: 'laravel_session' },
          { type: 'cookie', name: 'XSRF-TOKEN' }
        ]
      },
      {
        name: 'Filament',
        icon: '⚡',
        patterns: [
          { type: 'regex', pattern: /filament.*\.css|filament.*\.js/i },
          { type: 'global', path: 'Filament' }
        ]
      },
      {
        name: 'Django',
        icon: '🎸',
        patterns: [
          { type: 'cookie', name: 'csrftoken' },
          { type: 'regex', pattern: /__admin__/i }
        ]
      },
      {
        name: 'Express.js',
        icon: '🚂',
        patterns: [
          { type: 'header', name: 'x-powered-by', pattern: /Express/i }
        ]
      },
      {
        name: 'Next.js SSR',
        icon: '▲',
        patterns: [
          { type: 'header', name: 'x-nextjs-cache' },
          { type: 'header', name: 'x-nextjs-matched-path' }
        ]
      },
      {
        name: 'Ruby on Rails',
        icon: '💎',
        patterns: [
          { type: 'meta', name: 'csrf-param' },
          { type: 'regex', pattern: /rails/i },
          { type: 'cookie', name: '_session' }
        ]
      },
      {
        name: 'ASP.NET',
        icon: '🔷',
        patterns: [
          { type: 'header', name: 'x-aspnet-version' },
          { type: 'cookie', name: 'ASP.NET' }
        ]
      },
      {
        name: 'PHP',
        icon: '🐘',
        patterns: [
          { type: 'header', name: 'x-powered-by', pattern: /PHP/i }
        ]
      },
      {
        name: 'Node.js',
        icon: '💚',
        patterns: [
          { type: 'header', name: 'x-powered-by', pattern: /Node/i }
        ]
      },
      {
        name: 'Spring',
        icon: '🍃',
        patterns: [
          { type: 'regex', pattern: /spring/i }
        ]
      },
      {
        name: 'FastAPI',
        icon: '⚡',
        patterns: [
          { type: 'header', name: 'fastapi' }
        ]
      },
      {
        name: 'Flask',
        icon: '🍶',
        patterns: [
          { type: 'header', name: 'server', pattern: /Werkzeug/i }
        ]
      }
    ],

    cdn: [
      {
        name: 'Cloudflare',
        icon: '☁️',
        patterns: [
          { type: 'header', name: 'cf-ray' },
          { type: 'header', name: 'cf-cache-status' },
          { type: 'regex', pattern: /cdnjs\.cloudflare\.com/i }
        ]
      },
      {
        name: 'CloudFront',
        icon: '☁️',
        patterns: [
          { type: 'header', name: 'x-amz-cf-id' },
          { type: 'regex', pattern: /cloudfront\.net/i }
        ]
      },
      {
        name: 'Fastly',
        icon: '⚡',
        patterns: [
          { type: 'header', name: 'x-served-by' },
          { type: 'header', name: 'x-fastly-request-id' }
        ]
      },
      {
        name: 'Vercel',
        icon: '▲',
        patterns: [
          { type: 'header', name: 'x-vercel-id' },
          { type: 'header', name: 'x-vercel-cache' },
          { type: 'regex', pattern: /vercel\.app|vercel\.com/i }
        ]
      },
      {
        name: 'Netlify',
        icon: '🌐',
        patterns: [
          { type: 'header', name: 'x-nf-request-id' },
          { type: 'regex', pattern: /netlify\.app|netlify\.com/i }
        ]
      },
      {
        name: 'AWS',
        icon: '☁️',
        patterns: [
          { type: 'regex', pattern: /amazonaws\.com/i }
        ]
      },
      {
        name: 'Akamai',
        icon: '🌐',
        patterns: [
          { type: 'header', name: 'x-akamai-transformed' }
        ]
      }
    ],

    builders: [
      {
        name: 'Elementor',
        icon: '🎨',
        patterns: [
          { type: 'regex', pattern: /\/wp-content\/plugins\/elementor/i }
        ]
      },
      {
        name: 'Divi',
        icon: '🎯',
        patterns: [
          { type: 'regex', pattern: /\/wp-content\/themes\/Divi/i }
        ]
      },
      {
        name: 'WPBakery',
        icon: '🔧',
        patterns: [
          { type: 'regex', pattern: /js_composer|wpbakery/i }
        ]
      },
      {
        name: 'Beaver Builder',
        icon: '🦫',
        patterns: [
          { type: 'regex', pattern: /fl-builder/i }
        ]
      },
      {
        name: 'Bricks',
        icon: '🧱',
        patterns: [
          { type: 'regex', pattern: /bricks/i }
        ]
      },
      {
        name: 'Oxygen',
        icon: '💨',
        patterns: [
          { type: 'regex', pattern: /oxygen/i }
        ]
      },
      {
        name: 'Brizy',
        icon: '🎨',
        patterns: [
          { type: 'regex', pattern: /brizy/i }
        ]
      },
      {
        name: 'Framer',
        icon: '🎨',
        patterns: [
          { type: 'regex', pattern: /framer\.com/i }
        ]
      }
    ],

    security: [
      {
        name: 'reCAPTCHA',
        icon: '🤖',
        patterns: [
          { type: 'regex', pattern: /google\.com\/recaptcha/i },
          { type: 'dom', selector: '.g-recaptcha' },
          { type: 'global', path: 'grecaptcha' }
        ]
      },
      {
        name: 'Cloudflare Turnstile',
        icon: '☁️',
        patterns: [
          { type: 'regex', pattern: /challenges\.cloudflare\.com/i }
        ]
      },
      {
        name: 'hCaptcha',
        icon: '🔐',
        patterns: [
          { type: 'regex', pattern: /hcaptcha\.com/i },
          { type: 'global', path: 'hcaptcha' }
        ]
      },
      {
        name: 'Akamai Bot Manager',
        icon: '🤖',
        patterns: [
          { type: 'regex', pattern: /akamai/i },
          { type: 'cookie', name: '_abck' }
        ]
      },
      {
        name: 'Imperva',
        icon: '🛡️',
        patterns: [
          { type: 'regex', pattern: /incapsula/i },
          { type: 'cookie', name: 'incap_ses_' }
        ]
      }
    ]
  };

  var wordpressPlugins = [
    'woocommerce', 'elementor', 'yoast-seo', 'yoast', 'contact-form-7',
    'jetpack', 'wordfence', 'wpforms', 'akismet', 'all-in-one-seo-pack',
    'w3-total-cache', 'wp-super-cache', 'wp-rocket', 'rank-math',
    'sucuri-scanner', 'iwp-client', 'updraftplus', 'duplicator',
    'all-in-one-wp-migration', 'really-simple-ssl', 'wp-mail-smtp',
    'google-site-kit', 'sitepress-multilingual-cms', 'polylang',
    'redirection', 'wp-file-manager', 'smush', 'wp-optimize',
    'autoptimize', 'wpml', 'advanced-custom-fields', 'acf',
    'gravity-forms', 'gravityforms', 'wp-user-avatar', 'memberpress',
    'learnpress', 'lifterlms', 'give', 'woocommerce-subscriptions',
    'dokan', 'yith-woocommerce', 'elementor-pro', 'divi-builder',
    'ninja-forms', 'wp-all-import', 'wp-all-export', 'query-monitor'
  ];

  function checkGlobal(path) {
    try {
      var parts = path.split('.');
      var obj = window;
      for (var i = 0; i < parts.length; i++) {
        if (obj[parts[i]] === undefined) return false;
        obj = obj[parts[i]];
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function checkDom(selector) {
    try {
      return document.querySelector(selector) !== null;
    } catch (e) {
      return false;
    }
  }

  function checkRegex(pattern) {
    try {
      return pattern.test(document.documentElement.outerHTML);
    } catch (e) {
      return false;
    }
  }

  function checkMeta(name, pattern) {
    try {
      var meta = document.querySelector('meta[name="' + name + '"]');
      if (!meta) return false;
      if (!pattern) return true;
      return pattern.test(meta.getAttribute('content') || '');
    } catch (e) {
      return false;
    }
  }

  function checkHeader(name, pattern) {
    return false;
  }

  function checkCookie(name) {
    try {
      return document.cookie.indexOf(name + '=') !== -1;
    } catch (e) {
      return false;
    }
  }

  function checkClassPattern(pattern) {
    try {
      var allElements = document.querySelectorAll('[class]');
      for (var i = 0; i < Math.min(allElements.length, 100); i++) {
        var classes = allElements[i].className;
        if (typeof classes === 'string') {
          var classList = classes.split(/\s+/);
          for (var j = 0; j < classList.length; j++) {
            if (pattern.test(classList[j])) {
              return true;
            }
          }
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function detectTech(techList) {
    var results = [];
    for (var i = 0; i < techList.length; i++) {
      var tech = techList[i];
      var detected_version = null;
      var matched = false;

      for (var j = 0; j < tech.patterns.length; j++) {
        var pattern = tech.patterns[j];

        switch (pattern.type) {
          case 'global':
            matched = checkGlobal(pattern.path);
            break;
          case 'dom':
            matched = checkDom(pattern.selector);
            break;
          case 'regex':
            matched = checkRegex(pattern.pattern);
            break;
          case 'meta':
            matched = checkMeta(pattern.name, pattern.pattern);
            break;
          case 'header':
            matched = checkHeader(pattern.name, pattern.pattern);
            break;
          case 'cookie':
            matched = checkCookie(pattern.name);
            break;
          case 'classPattern':
            matched = checkClassPattern(pattern.pattern);
            break;
        }

        if (matched) {
          if (tech.versionPattern) {
            var match = document.documentElement.outerHTML.match(tech.versionPattern);
            if (match && match[1]) {
              detected_version = match[1];
            }
          }
          break;
        }
      }

      if (matched) {
        results.push({
          name: tech.name,
          icon: tech.icon,
          version: detected_version
        });
      }
    }
    return results;
  }

  function detectWordPress() {
    var wp = {
      version: null,
      theme: null,
      plugins: []
    };

    var generatorMeta = document.querySelector('meta[name="generator"]');
    if (generatorMeta) {
      var content = generatorMeta.getAttribute('content') || '';
      var versionMatch = content.match(/WordPress\s*([\d.]+)/i);
      if (versionMatch) {
        wp.version = versionMatch[1];
      }
    }

    var html = document.documentElement.outerHTML;
    var themePattern = /\/wp-content\/themes\/([^\/"\s]+)/gi;
    var themeMatch = themePattern.exec(html);
    if (themeMatch) {
      wp.theme = themeMatch[1];
    }

    for (var i = 0; i < wordpressPlugins.length; i++) {
      var plugin = wordpressPlugins[i];
      var pluginPattern = new RegExp('/wp-content/plugins/' + plugin + '[^"\']*\\.js', 'i');
      if (pluginPattern.test(html)) {
        wp.plugins.push(plugin.replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }));
      }
    }

    var allPluginPattern = /\/wp-content\/plugins\/([^\/"\s]+)/gi;
    var pluginMatches = html.match(allPluginPattern);
    if (pluginMatches) {
      var uniquePlugins = {};
      for (var j = 0; j < pluginMatches.length; j++) {
        var pluginName = pluginMatches[j].replace('/wp-content/plugins/', '');
        if (!uniquePlugins[pluginName] && wp.plugins.indexOf(pluginName) === -1) {
          uniquePlugins[pluginName] = true;
        }
      }
      var additionalPlugins = Object.keys(uniquePlugins).slice(0, 20);
      for (var k = 0; k < additionalPlugins.length; k++) {
        var formattedPlugin = additionalPlugins[k].replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
        if (wp.plugins.indexOf(formattedPlugin) === -1) {
          wp.plugins.push(formattedPlugin);
        }
      }
    }

    return wp;
  }

function detect() {
		// Reset detected state for fresh detection
		detected = {
			frameworks: [],
			cms: [],
			libraries: [],
			cssFrameworks: [],
			analytics: [],
			ecommerce: [],
			builders: [],
			cdn: [],
			hosting: [],
			security: [],
			wordpress: {
				version: null,
				theme: null,
				plugins: []
			},
			backend: [],
			meta: {}
		};
		
  detected.frameworks = detectTech(technologies.frameworks);
  detected.cms = detectTech(technologies.cms);
  detected.libraries = detectTech(technologies.libraries);
  detected.cssFrameworks = detectTech(technologies.cssFrameworks);
  detected.analytics = detectTech(technologies.analytics);
  detected.ecommerce = detectTech(technologies.ecommerce);
  detected.builders = detectTech(technologies.builders);
  detected.cdn = detectTech(technologies.cdn);
  detected.hosting = detectTech(technologies.cdn);
  detected.security = detectTech(technologies.security);
  detected.backend = detectTech(technologies.backend);

  // Detect vanilla HTML/CSS/JS if no frameworks found
  var hasStylesheets = document.querySelectorAll('link[rel="stylesheet"]').length > 0;
  var hasInlineStyles = document.querySelectorAll('style').length > 0;
  var hasScripts = document.querySelectorAll('script[src]').length > 0;
  var hasInlineScripts = document.querySelectorAll('script:not([src])').length > 0;
  
  // Track basic web technologies
  detected.basicTech = {
    hasStylesheets: hasStylesheets,
    hasInlineStyles: hasInlineStyles,
    hasScripts: hasScripts,
    hasInlineScripts: hasInlineScripts,
    totalStylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
    totalScripts: document.querySelectorAll('script[src]').length
  };

  var isWordPress = detected.cms.some(function(cms) { return cms.name === 'WordPress'; });
		if (isWordPress) {
			detected.wordpress = detectWordPress();
		}

		detected.meta = {
			title: document.title || '',
			description: (function() {
				var el = document.querySelector('meta[name="description"]');
				return el ? el.getAttribute('content') : '';
			})(),
			viewport: (function() {
				var el = document.querySelector('meta[name="viewport"]');
				return el ? el.getAttribute('content') : '';
			})()
		};

		return detected;
	}

  return {
    detect: detect,
    getDetected: function() { return detected; }
  };
})();

if (typeof window !== 'undefined') {
  window.TechDetector = TechDetector;
}
