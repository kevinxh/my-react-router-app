module.exports = {
  "ssrParameters": {
    "ssrFunctionNodeVersion": "22.x",
    "proxyConfigs": [
      {
        "host": "kv7kzm78.api.commercecloud.salesforce.com",
        "path": "api"
      },
      {
        "host": "zzrf-001.dx.commercecloud.salesforce.com",
        "path": "ocapi"
      }
    ]
  },
  "ssrOnly": [
    "**/*.js",
    "**/*.cjs",
    "**/*.json",
    "loader.js",
    "ssr.js",
    "assets/**/*",
    "!static/**/*"
  ],
  "ssrShared": [
    "static/**/*",
    "**/*.css",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.gif",
    "**/*.svg",
    "**/*.ico",
    "**/*.woff",
    "**/*.woff2",
    "**/*.ttf",
    "**/*.eot"
  ]
};