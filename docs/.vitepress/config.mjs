import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "WiiM Now Playing",
  description: "Show what the WiiM device is currently playing.",

  ignoreDeadLinks: false,
  base: '/wiim-now-playing/',
  lastUpdated: true,

  // Default theme configuration: https://vitepress.dev/reference/default-theme-config
  themeConfig: {

    logo: '/logo.png',
    search: {
      provider: 'local'
    },

    // footer: {
    //   message: 'Released under the MIT License.',
    //   copyright: 'Copyright © 2019-present Evan You'
    // },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started/' },
      { text: 'Raspberry Pi', link: '/rpi/' }
    ],

    sidebar: [
      // {
      //   text: 'Examples',
      //   items: [
      //     { text: 'Markdown Examples', link: '/markdown-examples' },
      //     { text: 'Runtime API Examples', link: '/api-examples' }
      //   ]
      // },
      {
        text: 'Getting started',
        items: [
          { text: 'Read me', link: '/getting-started/readme' },
          { text: 'Overview', link: '/getting-started/' },
          { text: 'General requirements', link: '/getting-started/requirements' },
          { text: 'Docker', link: '/getting-started/docker' },
          { text: 'Updating', link: '/getting-started/updating' },
        ]
      },
      {
        text: 'Raspberry Pi',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/rpi/' },
          { text: 'Setup for a touch screen', link: '/rpi/setup-touchscreen' },
          { text: 'Kiosk mode', link: '/rpi/setup-kiosk' },
          { text: 'Headless mode', link: '/rpi/setup-headless' },
          { text: 'Hardware requirements', link: '/rpi/requirements' },
        ]
      },
      {
        text: 'Development',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/development/' },
          { text: 'Server development', link: '/development/server' },
          { text: 'Client development', link: '/development/client' },
          { text: 'Documentation development', link: '/development/documentation' },
          { text: 'Outstanding issues', link: 'https://github.com/cvdlinden/wiim-now-playing/issues' },
          { text: "Outstanding PRs", link: 'https://github.com/cvdlinden/wiim-now-playing/pulls' },
        ]
      },
      {
        text: 'Reference',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/reference/' },
          { text: 'Design', link: '/reference/design' },
          { text: 'Plan', link: '/reference/plan' },
        ]
      },
      {
        text: 'About',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/about/' },
          { text: 'Releases', link: 'https://github.com/cvdlinden/wiim-now-playing/releases' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cvdlinden/wiim-now-playing' }
    ]
  }
})
