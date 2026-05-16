import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "WiiM Now Playing",
  description: "Show what the WiiM device is currently playing.",

  ignoreDeadLinks: true,
  base: '/wiim-now-playing/',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Read Me', link: '/getting-started/' },
      { text: 'Installation', link: '/rpi/' }
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
          { text: 'Overview', link: '/getting-started/' },
          { text: 'Requirements', link: '/getting-started/requirements' },
          { text: 'Read me', link: '/getting-started/readme' },
          { text: 'Docker', link: '/getting-started/docker' },
          { text: 'Updating', link: '/getting-started/updating' },
          { text: 'Releases', link: 'https://github.com/cvdlinden/wiim-now-playing/releases' },
          { text: 'Outstanding issues', link: 'https://github.com/cvdlinden/wiim-now-playing/issues' },
          { text: "Outstanding PRs", link: 'https://github.com/cvdlinden/wiim-now-playing/pulls' },
        ]
      },
      {
        text: 'Raspberry Pi',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/rpi/' },
          { text: 'Hardware Requirements', link: '/rpi/requirements' },
          { text: 'Setup for a touch screen', link: '/rpi/setup-touchscreen' },
          { text: 'Kiosk mode', link: '/rpi/setup-kiosk' },
          { text: 'Headless mode', link: '/rpi/setup-headless' },
        ]
      },
      {
        text: 'Development',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/development/' },
          { text: 'Server', link: '/development/server' },
          { text: 'Client', link: '/development/client' },
          { text: 'Documentation', link: '/development/documentation' },
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
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cvdlinden/wiim-now-playing' }
    ]
  }
})
