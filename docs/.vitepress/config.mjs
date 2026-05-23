import { defineConfig } from 'vitepress';
import { withMermaid } from "vitepress-plugin-mermaid";
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs';

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: "WiiM Now Playing",
    description: "Show what the WiiM device is currently playing.",

    ignoreDeadLinks: true,
    base: '/wiim-now-playing/',
    lastUpdated: true,

    // https://vitepress-plugins.sapphi.red/tabs/
    markdown: {
      config(md) {
        md.use(tabsMarkdownPlugin)
      },
    },

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
        { text: 'What is WNP?', link: '/what-is-wnp/' },
        { text: 'Getting Started', link: '/getting-started/' },
        { text: 'Raspberry Pi', link: '/rpi/' }
      ],

      sidebar: [
        {
          text: 'What is WNP?',
          items: [
            { text: 'Overview', link: '/what-is-wnp/' },
          ]
        },
        {
          text: 'Getting started',
          collapsed: true,
          items: [
            // { text: 'Read me', link: '/readme' },
            { text: 'Overview', link: '/getting-started/' },
            { text: 'General requirements', link: '/getting-started/requirements' },
            { text: 'Docker', link: '/getting-started/docker' },
            { text: 'Updating', link: '/getting-started/updating' },
          ]
        },
        {
          text: 'Raspberry Pi deployment',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/rpi/' },
            { text: 'Short hand guide', link: '/rpi/short-hand-guide' },
            { text: 'Use cases', link: '/rpi/use-cases' },
            { text: 'With a touch screen', link: '/rpi/setup-touchscreen' },
            { text: 'Headless mode', link: '/rpi/setup-headless' },
            { text: 'Preparing the SD card', link: '/rpi/prepare-sd-card' },
            { text: 'Kiosk mode', link: '/rpi/setup-kiosk' },
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
            { text: 'Architecture', link: '/development/architecture' },
          ]
        },
        {
          text: 'Reference',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'Scope', link: '/reference/scope' },
            { text: 'Design', link: '/reference/design' },
            { text: 'Plan', link: '/reference/plan' },
            { text: 'Acknowledgements', link: '/reference/acknowledgements' },
          ]
        },
        {
          text: 'About',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/about/' },
            { text: 'Releases', link: 'https://github.com/cvdlinden/wiim-now-playing/releases' },
            { text: 'Outstanding issues', link: 'https://github.com/cvdlinden/wiim-now-playing/issues' },
            { text: "Outstanding PRs", link: 'https://github.com/cvdlinden/wiim-now-playing/pulls' },
          ]
        },
      ],

      socialLinks: [
        { icon: 'github', link: 'https://github.com/cvdlinden/wiim-now-playing' }
      ]
    }
  })
)
