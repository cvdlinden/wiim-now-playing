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
      { text: 'Read Me', link: '/readme' },
      { text: 'Installation', link: '/RPi-Requirements' }
    ],

    sidebar: [
      {
        text: 'WiiM Now Playing',
        items: [
          { text: 'Read me', link: '/readme' },
        ]
      },
      {
        text: 'Installation on a Raspberry Pi',
        items: [
          { text: 'Requirements', link: '/RPi-Requirements' },
          { text: 'Setup for a touch screen', link: '/RPi-Setup' },
          { text: 'Kiosk mode', link: '/RPi-Kiosk' },
          { text: 'Headless mode', link: '/RPi-Headless' },
        ]
      },
      {
        text: 'Other',
        items: [
          { text: 'Development', link: '/DevelopmentAndDebugging' },
          { text: 'Design', link: '/Design' },
          { text: 'Plan', link: '/Plan' },
          { text: 'Outstanding issues', link: 'https://github.com/cvdlinden/wiim-now-playing/issues' },
          { text: "Outstanding PRs", link: 'https://github.com/cvdlinden/wiim-now-playing/pulls' },
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
