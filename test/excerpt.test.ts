import { resolve } from 'path'
import type { OutputAsset, RollupOutput } from 'rollup'
import { build, type InlineConfig } from 'vite'
import { describe, expect, it } from 'vitest'
import VitePluginInjectPreload from './../src/index'
import type { Options } from './../src/index'

const configs: Record<string, Options> = {
  injectBottom: {
    files: [
      {
        match: /Roboto-[a-zA-Z]*-[a-z-0-9]*\.woff2$/
      },
      {
        match: /lazy.[a-z-0-9]*.(css|js)$/
      }
    ],
    injectTo: 'head'
  },
  customAttributes: {
    files: [
      {
        match: /Roboto-[a-zA-Z]*-[a-z-0-9]*\.woff2$/,
        attributes: {
          as: 'font',
          crossorigin: 'anonymous',
          'data-font': 'Roboto',
          type: 'font/woff2'
        }
      }
    ]
  },
  auto: {
    files: [
      {
        match: /Roboto-[a-zA-Z]*-[a-z-0-9]*\.woff2$/
      },
      {
        match: /lazy.[a-z-0-9]*.(css|js)$/
      }
    ]
  },
  customPosition: {
    files: [
      {
        match: /Roboto-[a-zA-Z]*-[a-z-0-9]*\.woff2$/,
        attributes: {
          'data-vite-plugin-inject-preload': true
        }
      },
      {
        match: /lazy.[a-z-0-9]*.(css|js)$/
      }
    ],
    injectTo: 'custom'
  },
  wrongAttributes: {
    files: [
      {
        match: /Roboto-[a-zA-Z]*-[a-z-0-9]*\.woff2$/,
        attributes: {
          href: './yolo.woff2'
        }
      }
    ]
  }
}

const buildVite = async (pluginConfig: Options, config: InlineConfig = {}) => {
  const { output } = (await build({
    root: resolve(__dirname, './project'),
    plugins: [VitePluginInjectPreload(pluginConfig)],
    ...config
  })) as RollupOutput

  const { source: indexSource } = output.find(
    item => item.fileName === 'index.html'
  ) as OutputAsset

  return indexSource.toString()
}

describe('excerpt', () => {
  for (const key in configs) {
    if (Object.prototype.hasOwnProperty.call(configs, key)) {
      const config = configs[key] as Options
      it(`test ${key}`, async () => {
        const output = await buildVite(config)
        expect(output).toMatchSnapshot()
      })

      it(`test ${key} with basePath`, async () => {
        const output = await buildVite(config, { base: '/base' })
        expect(output).toMatchSnapshot()
      })
    }
  }
})
