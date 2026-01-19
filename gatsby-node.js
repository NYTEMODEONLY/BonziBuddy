/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */

exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  // Webpack 5 uses resolve.fallback instead of node config for polyfills
  const config = {
    resolve: {
      fallback: {
        fs: false,
        path: false,
        os: false,
        buffer: false,
        stream: false,
        crypto: false
      }
    }
  }

  // Ignore browser-incompatible modules during SSR builds
  if (stage === 'build-html' || stage === 'develop-html') {
    config.module = {
      rules: [
        {
          test: /clippyjs/,
          use: loaders.null()
        },
        {
          test: /encoding/,
          use: loaders.null()
        },
        {
          test: /iconv-lite/,
          use: loaders.null()
        },
        {
          test: /node-fetch/,
          use: loaders.null()
        },
        {
          test: /@anthropic-ai/,
          use: loaders.null()
        },
        {
          test: /electron-store/,
          use: loaders.null()
        }
      ]
    }
  }

  actions.setWebpackConfig(config)
}
