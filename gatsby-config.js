module.exports = {
  siteMetadata: {
    title: "BonziBuddy",
    description: "Your very own desktop personal digital assistant",
    author: "@7coil",
  },
  plugins: [
    {
      resolve: "gatsby-plugin-sass",
      options: {
        // Dart Sass is used by default in gatsby-plugin-sass v6+
        sassOptions: {
          silenceDeprecations: ['legacy-js-api'],
        },
      },
    },
    "gatsby-plugin-react-helmet",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: `${__dirname}/src/images`,
      },
    },
    "gatsby-transformer-sharp",
    "gatsby-plugin-sharp",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "BonziBuddy",
        short_name: "Bonzi",
        start_url: "/",
        background_color: "#663399",
        theme_color: "#663399",
        display: "minimal-ui",
        include_favicon: false,
        icon: "src/images/bonzi.png",
      },
    },
  ],
}
