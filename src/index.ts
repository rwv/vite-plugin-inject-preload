import type { HtmlTagDescriptor, Plugin } from 'vite'
import type { OutputBundle } from 'rollup'
import { lookup as mimeLookup } from 'mime-types'
import { getAsWithMime } from './helper/getAsWithMime'
import { serializeTags } from './helper/serializer'

export interface OptionsFiles {
  /**
   * Regular expression to target build files
   */
  match: RegExp
  /**
   * Attributes added to the preload links
   */
  attributes?: HtmlTagDescriptor['attrs']
}

export interface Options {
  /**
   * An array of file options
   */
  files: OptionsFiles[]
  /**
   * The position where the preload links are injected
   */
  injectTo?: 'head' | 'head-prepend' | 'custom'
}

// From https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/html.ts
const customInject = /([ \t]*)<!--__vite-plugin-inject-preload__-->/i

export default function VitePluginInjectPreload(options: Options): Plugin {
  let basePath: string
  return {
    name: 'vite-plugin-inject-preload',
    apply: 'build',
    configResolved(config) {
      // Base path is sanitized by vite with the final trailing slash
      basePath = config.base
    },
    transformIndexHtml: {
      enforce: 'post',
      transform(html, ctx) {
        const bundle = ctx.bundle
        if (!bundle) return html

        const tags: HtmlTagDescriptor[] = []

        const assets: OutputBundle = Object.keys(bundle)
          .sort()
          .reduce((res, key) => ((res[key] = bundle[key]), res), {})

        for (const asset in assets) {
          for (let index = 0; index < options.files.length; index++) {
            const file = options.files[index]
            if (!file.match.test(asset)) continue

            const attrs = file.attributes || ({} as Record<string, string>)
            const injectTo =
              options.injectTo && options.injectTo !== 'custom'
                ? options.injectTo
                : 'head-prepend'
            let href = attrs.href ? attrs.href : false
            if (href === false || typeof href === 'undefined') {
              href = `${basePath}${asset}`
            }
            const type =
              attrs.type && typeof attrs.type === 'string'
                ? attrs.type
                : mimeLookup(asset) || undefined
            const as = attrs.as ? attrs.as : getAsWithMime(type || '')

            tags.push({
              tag: 'link',
              attrs: Object.assign(
                {
                  rel: 'preload',
                  href,
                  type,
                  as
                },
                attrs
              ),
              injectTo
            })
          }
        }

        if (options.injectTo === 'custom') {
          return html.replace(
            customInject,
            (match, p1) => `\n${serializeTags(tags, p1)}`
          )
        } else {
          return tags
        }
      }
    }
  }
}
